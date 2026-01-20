import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	// Get therapist ID
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', user!.id)
		.single();

	if (!therapist) {
		throw redirect(303, '/therapist');
	}

	// Get therapist's services
	const { data: services } = await supabase
		.from('therapist_services')
		.select('*, services(*)')
		.eq('therapist_id', therapist.id)
		.eq('is_active', true);

	// Get recent clients (users who have booked with this therapist)
	const { data: recentBookings } = await supabase
		.from('bookings')
		.select('client_id, users(id, full_name, email)')
		.eq('therapist_id', therapist.id)
		.order('created_at', { ascending: false })
		.limit(100);

	// Deduplicate clients
	const clientsMap = new Map();
	recentBookings?.forEach((booking: any) => {
		if (booking.users && !clientsMap.has(booking.users.id)) {
			clientsMap.set(booking.users.id, booking.users);
		}
	});

	const clients = Array.from(clientsMap.values());

	return {
		therapistId: therapist.id,
		services: services ?? [],
		clients
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();

		// Get therapist ID
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const clientId = formData.get('client_id') as string;
		const therapistServiceId = formData.get('therapist_service_id') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const serviceModality = formData.get('service_modality') as string;
		const clientAddress = formData.get('client_address') as string;
		const notes = formData.get('notes') as string;

		if (!clientId || !therapistServiceId || !date || !time) {
			return fail(400, { error: 'Todos los campos requeridos deben ser completados' });
		}

		// Get service details for pricing and duration
		const { data: service } = await supabase
			.from('therapist_services')
			.select('price_cents, duration_minutes')
			.eq('id', therapistServiceId)
			.eq('therapist_id', therapist.id)
			.single();

		if (!service) {
			return fail(404, { error: 'Servicio no encontrado' });
		}

		// Combine date and time to create timestamps
		const scheduledAt = new Date(`${date}T${time}`);
		const scheduledEndAt = new Date(scheduledAt.getTime() + service.duration_minutes * 60 * 1000);

		// Calculate commission (15% platform fee)
		const commissionCents = Math.round(service.price_cents * 0.15);
		const therapistPayoutCents = service.price_cents - commissionCents;

		// Create the booking
		const { data: booking, error } = await supabase
			.from('bookings')
			.insert({
				client_id: clientId,
				therapist_id: therapist.id,
				therapist_service_id: therapistServiceId,
				scheduled_at: scheduledAt.toISOString(),
				scheduled_end_at: scheduledEndAt.toISOString(),
				status: 'confirmed', // Manual bookings are pre-confirmed
				price_cents: service.price_cents,
				commission_cents: commissionCents,
				therapist_payout_cents: therapistPayoutCents,
				service_modality: serviceModality,
				client_address: serviceModality === 'home_visit' ? clientAddress : null,
				notes: notes || null,
				source: 'therapist_manual',
				confirmed_at: new Date().toISOString()
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating booking:', error);

			// Check for overlap errors
			if (error.code === '23P01') {
				return fail(400, { error: 'Ya tienes una cita programada en ese horario' });
			}

			return fail(500, { error: 'Error al crear la cita' });
		}

		throw redirect(303, '/therapist/bookings');
	}
};
