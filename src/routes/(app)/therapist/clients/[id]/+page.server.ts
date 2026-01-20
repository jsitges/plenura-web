import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase, user } = locals;

	// Get therapist ID
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', user!.id)
		.single();

	if (!therapist) {
		throw error(403, 'No autorizado');
	}

	// Get client info
	const { data: client } = await supabase
		.from('users')
		.select('id, full_name, email, phone, avatar_url, created_at')
		.eq('id', params.id)
		.single();

	if (!client) {
		throw error(404, 'Cliente no encontrado');
	}

	// Get bookings with this client
	const { data: bookings } = await supabase
		.from('bookings')
		.select(`
			*,
			therapist_services (
				price_cents,
				duration_minutes,
				services (
					name
				)
			)
		`)
		.eq('therapist_id', therapist.id)
		.eq('client_id', params.id)
		.order('scheduled_at', { ascending: false });

	// Calculate stats
	const stats = {
		total: bookings?.length ?? 0,
		completed: bookings?.filter(b => b.status === 'completed').length ?? 0,
		upcoming: bookings?.filter(b =>
			b.status === 'confirmed' && new Date(b.scheduled_at) > new Date()
		).length ?? 0
	};

	return {
		client,
		bookings: bookings ?? [],
		stats
	};
};

export const actions: Actions = {
	saveNote: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();

		const bookingId = formData.get('booking_id') as string;
		const therapistNotes = formData.get('therapist_notes') as string;

		if (!bookingId) {
			return fail(400, { error: 'ID de cita requerido' });
		}

		// Get therapist ID
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		// Verify booking belongs to this therapist
		const { data: booking } = await supabase
			.from('bookings')
			.select('id, therapist_id')
			.eq('id', bookingId)
			.single();

		if (!booking || booking.therapist_id !== therapist.id) {
			return fail(403, { error: 'No autorizado para editar esta cita' });
		}

		// Update therapist notes
		const { error: updateError } = await supabase
			.from('bookings')
			.update({ therapist_notes: therapistNotes || null })
			.eq('id', bookingId);

		if (updateError) {
			console.error('Error saving notes:', updateError);
			return fail(500, { error: 'Error al guardar las notas' });
		}

		return { success: true };
	}
};
