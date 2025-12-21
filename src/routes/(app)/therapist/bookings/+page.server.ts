import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { completeBooking, cancelBooking } from '$lib/services/booking.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase, user } = locals;

	const filter = url.searchParams.get('filter') ?? 'upcoming';

	// Get therapist ID
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', user!.id)
		.single();

	if (!therapist) {
		return { bookings: [], filter };
	}

	let query = supabase
		.from('bookings')
		.select(`
			*,
			users:client_id (
				full_name,
				avatar_url,
				phone,
				email
			),
			therapist_services (
				price_cents,
				duration_minutes,
				services (
					name
				)
			)
		`)
		.eq('therapist_id', therapist.id)
		.order('scheduled_at', { ascending: filter === 'upcoming' });

	const now = new Date().toISOString();

	switch (filter) {
		case 'pending':
			query = query.eq('status', 'pending');
			break;
		case 'upcoming':
			query = query.gte('scheduled_at', now).in('status', ['pending', 'confirmed']);
			break;
		case 'past':
			query = query.in('status', ['completed']);
			break;
		case 'cancelled':
			query = query.in('status', ['cancelled', 'no_show']);
			break;
	}

	const { data: bookings } = await query.limit(50);

	return {
		bookings: bookings ?? [],
		filter
	};
};

export const actions: Actions = {
	confirm: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;

		// Verify ownership
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const { error } = await supabase
			.from('bookings')
			.update({ status: 'confirmed' })
			.eq('id', bookingId)
			.eq('therapist_id', therapist.id)
			.eq('status', 'pending');

		if (error) {
			return fail(500, { error: 'Error al confirmar la cita' });
		}

		return { success: true };
	},

	reject: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;

		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		// Verify booking belongs to therapist
		const { data: booking } = await supabase
			.from('bookings')
			.select('therapist_id')
			.eq('id', bookingId)
			.single();

		if (!booking || (booking as { therapist_id: string }).therapist_id !== therapist.id) {
			return fail(403, { error: 'No autorizado' });
		}

		// Cancel with refund (therapist cancellation = full refund)
		const result = await cancelBooking(supabase, bookingId, 'therapist');

		if (!result.success) {
			return fail(500, { error: result.error ?? 'Error al rechazar la cita' });
		}

		return { success: true };
	},

	complete: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;

		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		// Verify booking belongs to therapist
		const { data: booking } = await supabase
			.from('bookings')
			.select('therapist_id')
			.eq('id', bookingId)
			.single();

		if (!booking || (booking as { therapist_id: string }).therapist_id !== therapist.id) {
			return fail(403, { error: 'No autorizado' });
		}

		// Complete booking and release escrow
		const result = await completeBooking(supabase, bookingId, 'therapist');

		if (!result.success) {
			return fail(500, { error: result.error ?? 'Error al completar la cita' });
		}

		return { success: true };
	},

	noshow: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;

		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const { error } = await supabase
			.from('bookings')
			.update({ status: 'no_show' })
			.eq('id', bookingId)
			.eq('therapist_id', therapist.id)
			.eq('status', 'confirmed');

		if (error) {
			return fail(500, { error: 'Error al marcar como no asistió' });
		}

		return { success: true };
	}
};
