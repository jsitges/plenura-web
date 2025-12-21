import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createTherapistWallet } from '$lib/services/payment.service';

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
	const { data: bookingStats } = await supabase
		.from('bookings')
		.select('id, status, price_cents, commission_cents')
		.eq('therapist_id', params.id);

	const stats = {
		totalBookings: bookingStats?.length ?? 0,
		completedBookings: bookingStats?.filter((b) => b.status === 'completed').length ?? 0,
		cancelledBookings: bookingStats?.filter((b) => b.status === 'cancelled').length ?? 0,
		totalRevenue:
			bookingStats
				?.filter((b) => b.status === 'completed')
				.reduce((acc, b) => acc + (b.price_cents ?? 0), 0) ?? 0,
		totalCommission:
			bookingStats
				?.filter((b) => b.status === 'completed')
				.reduce((acc, b) => acc + (b.commission_cents ?? 0), 0) ?? 0
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

		// Update status to approved
		const { error: updateError } = await supabase
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

		const { error: updateError } = await supabase
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
		const reason = formData.get('reason') as string;

		const { error: updateError } = await supabase
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

		const { error: updateError } = await supabase
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

		const { error: updateError } = await supabase
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

		const { error: updateError } = await supabase
			.from('therapists')
			.update({ subscription_tier: tier })
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Error al actualizar tier' });
		}

		return { success: true, message: `Tier actualizado a ${tier}` };
	}
};
