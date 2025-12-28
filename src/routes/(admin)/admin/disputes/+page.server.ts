import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { refundEscrow, releaseEscrow, calculateCommission } from '$lib/services/payment.service';
import { sendDisputeResolvedNotification } from '$lib/services/email.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase } = locals;

	const status = url.searchParams.get('status') ?? 'open';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	// Build query
	let query = (supabase as any)
		.from('admin_disputes')
		.select(
			`
			id,
			booking_id,
			colectiva_dispute_id,
			status,
			reason,
			resolution_notes,
			assigned_to,
			opened_at,
			resolved_at,
			bookings!inner (
				id,
				scheduled_at,
				price_cents,
				users:client_id (full_name, email),
				therapists!inner (
					users!inner (full_name, email)
				)
			),
			assigned_user:assigned_to (full_name)
		`,
			{ count: 'exact' }
		)
		.order('opened_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (status !== 'all') {
		query = query.eq('status', status);
	}

	const { data: disputes, count, error } = await query;

	if (error) {
		console.error('Error fetching disputes:', error);
	}

	// Get stats
	const { data: allDisputes } = await (supabase as any)
		.from('admin_disputes')
		.select('status');

	const stats = {
		total: allDisputes?.length ?? 0,
		open: allDisputes?.filter((d: any) => d.status === 'open').length ?? 0,
		investigating: allDisputes?.filter((d: any) => d.status === 'investigating').length ?? 0,
		resolved: allDisputes?.filter((d: any) => d.status.startsWith('resolved')).length ?? 0
	};

	// Get admin users for assignment dropdown
	const { data: adminUsers } = await (supabase as any)
		.from('users')
		.select('id, full_name')
		.eq('role', 'admin');

	return {
		disputes: (disputes ?? []).map((d: any) => ({
			id: d.id,
			bookingId: d.booking_id,
			colectivaDisputeId: d.colectiva_dispute_id,
			status: d.status,
			reason: d.reason,
			resolutionNotes: d.resolution_notes,
			assignedTo: d.assigned_to,
			assignedUserName: d.assigned_user?.full_name,
			openedAt: d.opened_at,
			resolvedAt: d.resolved_at,
			booking: {
				scheduledAt: d.bookings?.scheduled_at,
				priceCents: d.bookings?.price_cents,
				clientName: d.bookings?.users?.full_name,
				clientEmail: d.bookings?.users?.email,
				therapistName: d.bookings?.therapists?.users?.full_name,
				therapistEmail: d.bookings?.therapists?.users?.email
			}
		})),
		totalCount: count ?? 0,
		currentPage: page,
		totalPages: Math.ceil((count ?? 0) / limit),
		stats,
		adminUsers: adminUsers ?? [],
		filters: { status }
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const disputeId = formData.get('disputeId') as string;
		const newStatus = formData.get('status') as string;
		const resolutionNotes = formData.get('resolutionNotes') as string;

		if (!disputeId || !newStatus) {
			return fail(400, { error: 'ID de disputa y estado son requeridos' });
		}

		const validStatuses = ['open', 'investigating', 'resolved_for_client', 'resolved_for_therapist', 'closed'];
		if (!validStatuses.includes(newStatus)) {
			return fail(400, { error: 'Estado no válido' });
		}

		// Get dispute with booking details for payment processing
		const { data: dispute } = await (supabase as any)
			.from('admin_disputes')
			.select(`
				id,
				booking_id,
				status,
				bookings!inner (
					id,
					escrow_id,
					price_cents,
					users:client_id (full_name, email),
					therapists!inner (
						subscription_tier,
						users!inner (full_name, email)
					)
				)
			`)
			.eq('id', disputeId)
			.single();

		if (!dispute) {
			return fail(404, { error: 'Disputa no encontrada' });
		}

		const booking = dispute.bookings;
		let paymentError: string | null = null;

		// Process payment based on resolution
		if (newStatus === 'resolved_for_client' && booking?.escrow_id) {
			// Refund the full amount to the client
			const result = await refundEscrow(booking.escrow_id, booking.price_cents);
			if (!result.success) {
				paymentError = result.error || 'Error al procesar el reembolso';
			}
		} else if (newStatus === 'resolved_for_therapist' && booking?.escrow_id) {
			// Release funds to the therapist (with commission)
			const subscriptionTier = booking.therapists?.subscription_tier || 'free';
			const commissionCents = calculateCommission(booking.price_cents, subscriptionTier);
			const result = await releaseEscrow(booking.escrow_id, commissionCents);
			if (!result.success) {
				paymentError = result.error || 'Error al liberar los fondos';
			}
		}

		const updateData: Record<string, unknown> = {
			status: newStatus,
			updated_at: new Date().toISOString()
		};

		if (resolutionNotes) {
			updateData.resolution_notes = resolutionNotes;
		}

		if (newStatus.startsWith('resolved') || newStatus === 'closed') {
			updateData.resolved_at = new Date().toISOString();
		}

		const { error } = await (supabase as any)
			.from('admin_disputes')
			.update(updateData)
			.eq('id', disputeId);

		if (error) {
			return fail(500, { error: 'Error al actualizar la disputa' });
		}

		// Send notifications on resolution
		if (newStatus.startsWith('resolved') && booking) {
			const clientUser = booking.users;
			const therapistUser = booking.therapists?.users;
			const winner = newStatus === 'resolved_for_client' ? 'client' : 'therapist';

			// Notify client
			if (clientUser?.email) {
				await sendDisputeResolvedNotification(
					clientUser.email,
					clientUser.full_name || 'Cliente',
					{
						winner,
						resolutionNotes: resolutionNotes || undefined,
						amountCents: booking.price_cents,
						therapistName: therapistUser?.full_name || 'Terapeuta'
					}
				);
			}

			// Notify therapist
			if (therapistUser?.email) {
				await sendDisputeResolvedNotification(
					therapistUser.email,
					therapistUser.full_name || 'Terapeuta',
					{
						winner,
						resolutionNotes: resolutionNotes || undefined,
						amountCents: booking.price_cents,
						clientName: clientUser?.full_name || 'Cliente'
					}
				);
			}
		}

		if (paymentError) {
			return { success: true, message: `Disputa actualizada. Nota: ${paymentError}` };
		}

		return { success: true, message: 'Disputa actualizada y pago procesado' };
	},

	assignDispute: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const disputeId = formData.get('disputeId') as string;
		const assignedTo = formData.get('assignedTo') as string;

		if (!disputeId) {
			return fail(400, { error: 'ID de disputa requerido' });
		}

		const { error } = await (supabase as any)
			.from('admin_disputes')
			.update({
				assigned_to: assignedTo || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', disputeId);

		if (error) {
			return fail(500, { error: 'Error al asignar la disputa' });
		}

		return { success: true, message: 'Disputa asignada' };
	}
};
