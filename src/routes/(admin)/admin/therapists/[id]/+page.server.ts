import { error, fail } from '@sveltejs/kit';
import {
	approveDocument,
	rejectDocument,
	bulkApproveDocuments
} from '$lib/server/verification.service';
import type { PageServerLoad, Actions } from './$types';
import { createTherapistWallet } from '$lib/services/payment.service';
import { registerTherapistWithEcosystem } from '$lib/server/ecosystem-bridge.service';
import { createServiceRoleClient } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const { data: therapist, error: fetchError } = await supabase
		.from('therapists')
		.select(
			`
			id,
			user_id,
			bio,
			years_of_experience,
			certification_details,
			service_radius_km,
			rating_avg,
			rating_count,
			vetting_status,
			verification_status,
			verification_documents,
			verification_submitted_at,
			identity_verified_at,
			credential_verified_at,
			is_available,
			timezone,
			colectiva_wallet_id,
			subscription_tier,
			is_featured,
			featured_until,
			monthly_booking_count,
			created_at,
			updated_at,
			users!inner (
				id,
				email,
				full_name,
				phone,
				avatar_url,
				created_at
			),
			therapist_services (
				id,
				price_cents,
				duration_minutes,
				is_active,
				services!inner (
					id,
					name,
					name_es,
					categories!inner (
						name,
						name_es
					)
				)
			)
		`
		)
		.eq('id', params.id)
		.single();

	if (fetchError || !therapist) {
		throw error(404, 'Terapeuta no encontrado');
	}

	// Get booking stats
	const { data: bookingStats } = await (supabase as any)
		.from('bookings')
		.select('id, status, price_cents, commission_cents')
		.eq('therapist_id', params.id);

	type BookingStat = { id: string; status: string; price_cents: number; commission_cents: number };
	const bookings = (bookingStats ?? []) as BookingStat[];

	const stats = {
		totalBookings: bookings.length,
		completedBookings: bookings.filter((b) => b.status === 'completed').length,
		cancelledBookings: bookings.filter((b) => b.status === 'cancelled').length,
		totalRevenue: bookings
			.filter((b) => b.status === 'completed')
			.reduce((acc, b) => acc + (b.price_cents ?? 0), 0),
		totalCommission: bookings
			.filter((b) => b.status === 'completed')
			.reduce((acc, b) => acc + (b.commission_cents ?? 0), 0)
	};

	// Get recent reviews
	const { data: reviews } = await supabase
		.from('reviews')
		.select(
			`
			id,
			rating,
			comment,
			therapist_response,
			created_at,
			users!inner (full_name)
		`
		)
		.eq('therapist_id', params.id)
		.order('created_at', { ascending: false })
		.limit(5);

	return {
		therapist,
		stats,
		reviews: reviews ?? []
	};
};

export const actions: Actions = {
	approve: async ({ params, locals }) => {
		const { supabase } = locals;

		// Get therapist details for wallet creation
		const { data: therapist } = await supabase
			.from('therapists')
			.select('user_id, users!inner(email, full_name)')
			.eq('id', params.id)
			.single();

		if (!therapist) {
			return fail(404, { error: 'Terapeuta no encontrado' });
		}

		const t = therapist as unknown as {
			user_id: string;
			users: { email: string; full_name: string };
		};

		// Create wallet if not exists
		const walletResult = await createTherapistWallet(params.id, t.users.email, t.users.full_name);

		// Get user's rbsOrgId from auth.users metadata (if they signed up via RBS SSO)
		const supabaseAdmin = createServiceRoleClient();
		const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(t.user_id);
		const rbsOrgId = authUser?.user?.user_metadata?.rbs_org_id as string | null;

		// Register with ecosystem (fire and forget, don't block approval)
		registerTherapistWithEcosystem(params.id, t.users.full_name, t.users.email, rbsOrgId)
			.then((result) => {
				if (result.ecosystemOrgId) {
					// Update therapist with ecosystem_org_id
					(supabase as any)
						.from('therapists')
						.update({ ecosystem_org_id: result.ecosystemOrgId })
						.eq('id', params.id)
						.then(() => {
							console.log(`[Ecosystem] Updated therapist ${params.id} with ecosystem_org_id`);
						});
				}
			})
			.catch((err) => {
				console.error('[Ecosystem] Background registration failed:', err);
			});

		// Update status to approved
		const { error: updateError } = await (supabase as any)
			.from('therapists')
			.update({
				vetting_status: 'approved',
				colectiva_wallet_id: walletResult.walletId ?? null
			})
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Error al aprobar terapeuta' });
		}

		return { success: true, message: 'Terapeuta aprobado exitosamente' };
	},

	reject: async ({ params, locals, request }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const reason = formData.get('reason') as string;

		const { error: updateError } = await (supabase as any)
			.from('therapists')
			.update({
				vetting_status: 'rejected',
				certification_details: { rejection_reason: reason }
			})
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Error al rechazar terapeuta' });
		}

		return { success: true, message: 'Terapeuta rechazado' };
	},

	suspend: async ({ params, locals, request }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const _reason = formData.get('reason') as string;

		const { error: updateError } = await (supabase as any)
			.from('therapists')
			.update({
				vetting_status: 'suspended',
				is_available: false
			})
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Error al suspender terapeuta' });
		}

		return { success: true, message: 'Terapeuta suspendido' };
	},

	reactivate: async ({ params, locals }) => {
		const { supabase } = locals;

		const { error: updateError } = await (supabase as any)
			.from('therapists')
			.update({ vetting_status: 'approved' })
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Error al reactivar terapeuta' });
		}

		return { success: true, message: 'Terapeuta reactivado' };
	},

	toggleFeatured: async ({ params, locals, request }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const isFeatured = formData.get('is_featured') === 'true';
		const daysToFeature = parseInt(formData.get('days') as string) || 30;

		const featuredUntil = isFeatured
			? new Date(Date.now() + daysToFeature * 24 * 60 * 60 * 1000).toISOString()
			: null;

		const { error: updateError } = await (supabase as any)
			.from('therapists')
			.update({
				is_featured: isFeatured,
				featured_until: featuredUntil
			})
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Error al actualizar destacado' });
		}

		return { success: true, message: isFeatured ? 'Terapeuta destacado' : 'Destacado removido' };
	},

	updateTier: async ({ params, locals, request }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const tier = formData.get('tier') as string;

		if (!['free', 'pro', 'business', 'enterprise'].includes(tier)) {
			return fail(400, { error: 'Tier inválido' });
		}

		const { error: updateError } = await (supabase as any)
			.from('therapists')
			.update({ subscription_tier: tier })
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Error al actualizar tier' });
		}

		return { success: true, message: `Tier actualizado a ${tier}` };
	},

	// Verification document actions
	approveDocument: async ({ params, locals, request }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const documentType = formData.get('documentType') as string;

		if (!documentType) {
			return fail(400, { error: 'Tipo de documento requerido' });
		}

		const result = await approveDocument(supabase, params.id, documentType);

		if (!result.success) {
			return fail(500, { error: 'Error al aprobar documento' });
		}

		return { success: true, message: 'Documento aprobado', newStatus: result.newStatus };
	},

	rejectDocument: async ({ params, locals, request }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const documentType = formData.get('documentType') as string;
		const reason = formData.get('reason') as string;

		if (!documentType || !reason) {
			return fail(400, { error: 'Tipo de documento y razón son requeridos' });
		}

		const result = await rejectDocument(supabase, params.id, documentType, reason);

		if (!result.success) {
			return fail(500, { error: 'Error al rechazar documento' });
		}

		return { success: true, message: 'Documento rechazado', newStatus: result.newStatus };
	},

	bulkApproveDocuments: async ({ params, locals }) => {
		const { supabase } = locals;

		const result = await bulkApproveDocuments(supabase, params.id);

		if (!result.success) {
			return fail(500, { error: 'Error al aprobar documentos' });
		}

		return { success: true, message: 'Todos los documentos aprobados', newStatus: result.newStatus };
	}
};
