import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getBookingById, initiateBookingPayment } from '$lib/services/booking.service';
import { getClientWallet, useWalletForBooking } from '$lib/services/wallet.service';

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

	// Get client wallet for payment options
	const wallet = await getClientWallet(supabase, user.id);

	return { booking, wallet };
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
	},

	payWithWallet: async ({ locals, params }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		// Get booking details
		const booking = await getBookingById(supabase, params.id);
		if (!booking) {
			return { success: false, error: 'Reserva no encontrada' };
		}

		// Get wallet
		const wallet = await getClientWallet(supabase, user.id);
		if (!wallet) {
			return { success: false, error: 'No tienes una cartera activa' };
		}

		// Check balance
		if (wallet.balanceCents < booking.price_cents) {
			return {
				success: false,
				error: `Saldo insuficiente. Necesitas $${((booking.price_cents - wallet.balanceCents) / 100).toFixed(2)} más.`
			};
		}

		// Use wallet for payment
		const result = await useWalletForBooking(
			supabase,
			wallet.id,
			params.id,
			booking.price_cents
		);

		if (!result.success) {
			return { success: false, error: result.error ?? 'Error al procesar el pago' };
		}

		// Update booking status to confirmed
		const { error: updateError } = await (supabase as any)
			.from('bookings')
			.update({
				status: 'confirmed',
				escrow_status: 'wallet_paid',
				updated_at: new Date().toISOString()
			})
			.eq('id', params.id);

		if (updateError) {
			return { success: false, error: 'Error al confirmar la reserva' };
		}

		return { success: true, message: 'Pago con cartera procesado exitosamente', paidWithWallet: true };
	}
};
