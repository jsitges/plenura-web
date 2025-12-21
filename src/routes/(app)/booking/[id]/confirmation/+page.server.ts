import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getBookingById, initiateBookingPayment } from '$lib/services/booking.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw error(401, 'No autorizado');
	}

	const booking = await getBookingById(supabase, params.id);

	if (!booking) {
		throw error(404, 'Reserva no encontrada');
	}

	// Verify the booking belongs to this user
	if (booking.client_id !== user.id) {
		throw error(403, 'No tienes acceso a esta reserva');
	}

	return { booking };
};

export const actions: Actions = {
	pay: async ({ locals, params }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const result = await initiateBookingPayment(supabase, params.id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		// If we have a payment URL, redirect to it
		if (result.paymentUrl) {
			throw redirect(303, result.paymentUrl);
		}

		// Mock mode - just return success
		return { success: true, message: 'Pago procesado (modo de prueba)' };
	}
};
