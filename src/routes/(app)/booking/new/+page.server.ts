import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getTherapistById } from '$lib/services/therapist.service';
import { createBooking, getAvailableSlots } from '$lib/services/booking.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase } = locals;

	const therapistId = url.searchParams.get('therapist');
	const serviceId = url.searchParams.get('service');
	const dateParam = url.searchParams.get('date');

	if (!therapistId || !serviceId) {
		throw error(400, 'Faltan parámetros requeridos');
	}

	const therapist = await getTherapistById(supabase, therapistId);

	if (!therapist) {
		throw error(404, 'Terapeuta no encontrado');
	}

	const service = therapist.therapist_services?.find(ts => ts.id === serviceId);

	if (!service) {
		throw error(404, 'Servicio no encontrado');
	}

	// Get available slots for selected date (default to tomorrow)
	const selectedDate = dateParam ?? new Date(Date.now() + 86400000).toISOString().split('T')[0];

	const slots = await getAvailableSlots(
		supabase,
		therapistId,
		selectedDate,
		service.duration_minutes
	);

	return {
		therapist,
		service,
		selectedDate,
		availableSlots: slots
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const therapistId = formData.get('therapistId') as string;
		const serviceId = formData.get('serviceId') as string;
		const scheduledAt = formData.get('scheduledAt') as string;
		const address = formData.get('address') as string;
		const notes = formData.get('notes') as string;

		if (!therapistId || !serviceId || !scheduledAt || !address) {
			return { success: false, error: 'Todos los campos son requeridos' };
		}

		const result = await createBooking(supabase, {
			therapistId,
			therapistServiceId: serviceId,
			scheduledAt,
			clientAddress: address,
			clientNotes: notes || undefined
		});

		if (result.error) {
			return { success: false, error: result.error };
		}

		throw redirect(303, `/booking/${result.data?.id}/confirmation`);
	}
};
