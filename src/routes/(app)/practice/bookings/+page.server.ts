import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const practiceId = parentData.membership.practice_id;

	// Get filter params
	const status = url.searchParams.get('status') ?? 'all';
	const therapistId = url.searchParams.get('therapist') ?? 'all';
	const dateFrom = url.searchParams.get('from') ?? '';
	const dateTo = url.searchParams.get('to') ?? '';

	// Get practice members (therapists)
	const { data: members } = await (supabase as any)
		.from('practice_members')
		.select(`
			therapist_id,
			therapists!inner(
				id,
				users!inner(full_name)
			)
		`)
		.eq('practice_id', practiceId)
		.eq('status', 'active');

	const therapists = (members ?? []).map((m: any) => ({
		id: m.therapist_id,
		name: m.therapists.users.full_name
	}));

	const therapistIds = therapists.map((t: { id: string }) => t.id);

	// Build query for bookings
	let query = (supabase as any)
		.from('bookings')
		.select(`
			id,
			status,
			scheduled_at,
			scheduled_end_at,
			price_cents,
			commission_cents,
			practice_commission_cents,
			client_address,
			notes,
			assigned_by,
			assignment_notes,
			created_at,
			therapist_id,
			therapists!inner(
				id,
				users!inner(full_name, avatar_url)
			),
			users:client_id(
				id,
				full_name,
				email,
				phone
			),
			therapist_services!inner(
				services!inner(name, name_es)
			)
		`)
		.in('therapist_id', therapistIds)
		.order('scheduled_at', { ascending: false });

	// Apply filters
	if (status !== 'all') {
		query = query.eq('status', status);
	}

	if (therapistId !== 'all') {
		query = query.eq('therapist_id', therapistId);
	}

	if (dateFrom) {
		query = query.gte('scheduled_at', `${dateFrom}T00:00:00`);
	}

	if (dateTo) {
		query = query.lte('scheduled_at', `${dateTo}T23:59:59`);
	}

	const { data: bookings } = await query.limit(100);

	// Get counts by status
	const { data: allBookings } = await (supabase as any)
		.from('bookings')
		.select('status')
		.in('therapist_id', therapistIds);

	const statusCounts = {
		all: allBookings?.length ?? 0,
		pending: allBookings?.filter((b: any) => b.status === 'pending').length ?? 0,
		confirmed: allBookings?.filter((b: any) => b.status === 'confirmed').length ?? 0,
		completed: allBookings?.filter((b: any) => b.status === 'completed').length ?? 0,
		cancelled: allBookings?.filter((b: any) => ['cancelled', 'cancelled_by_client', 'cancelled_by_therapist'].includes(b.status)).length ?? 0
	};

	return {
		bookings: bookings ?? [],
		therapists,
		statusCounts,
		filters: {
			status,
			therapistId,
			dateFrom,
			dateTo
		}
	};
};

export const actions: Actions = {
	assignTherapist: async ({ request, locals }) => {
		const { supabase, user } = locals;

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;
		const therapistId = formData.get('therapistId') as string;
		const notes = formData.get('notes') as string;

		if (!bookingId || !therapistId) {
			return fail(400, { error: 'Datos incompletos' });
		}

		const { error } = await (supabase as any)
			.from('bookings')
			.update({
				therapist_id: therapistId,
				assigned_by: user?.id,
				assignment_notes: notes || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', bookingId);

		if (error) {
			return fail(500, { error: 'Error al asignar terapeuta' });
		}

		return { success: true, message: 'Terapeuta asignado' };
	},

	updateStatus: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;
		const newStatus = formData.get('status') as string;

		if (!bookingId || !newStatus) {
			return fail(400, { error: 'Datos incompletos' });
		}

		const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
		if (!validStatuses.includes(newStatus)) {
			return fail(400, { error: 'Estado inválido' });
		}

		const updateData: Record<string, unknown> = {
			status: newStatus,
			updated_at: new Date().toISOString()
		};

		if (newStatus === 'completed') {
			updateData.completed_at = new Date().toISOString();
		}

		const { error } = await (supabase as any)
			.from('bookings')
			.update(updateData)
			.eq('id', bookingId);

		if (error) {
			return fail(500, { error: 'Error al actualizar estado' });
		}

		return { success: true, message: 'Estado actualizado' };
	}
};
