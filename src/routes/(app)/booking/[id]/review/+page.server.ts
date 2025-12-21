import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createReview, getBookingReview } from '$lib/services/review.service';
import { sendTip } from '$lib/services/tips.service';

interface BookingWithTherapist {
	id: string;
	therapist_id: string;
	status: string;
	client_id: string;
	scheduled_at: string;
	therapists: {
		id: string;
		users: {
			full_name: string;
			avatar_url: string | null;
		};
	};
	therapist_services: {
		services: {
			name: string;
			name_es: string;
		};
	};
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Get booking details
	const { data: booking } = await supabase
		.from('bookings')
		.select(
			`
			id,
			therapist_id,
			status,
			client_id,
			scheduled_at,
			therapists (
				id,
				users (
					full_name,
					avatar_url
				)
			),
			therapist_services (
				services (
					name,
					name_es
				)
			)
		`
		)
		.eq('id', params.id)
		.single();

	if (!booking) {
		throw error(404, 'Reserva no encontrada');
	}

	const typedBooking = booking as unknown as BookingWithTherapist;

	// Verify ownership
	if (typedBooking.client_id !== user.id) {
		throw error(403, 'No autorizado');
	}

	// Check if booking is completed
	if (typedBooking.status !== 'completed') {
		throw error(400, 'Solo puedes dejar reseña en citas completadas');
	}

	// Check if already reviewed
	const existingReview = await getBookingReview(supabase, params.id);

	return {
		booking: typedBooking,
		existingReview
	};
};

export const actions: Actions = {
	review: async ({ request, params, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const rating = parseInt(formData.get('rating') as string, 10);
		const comment = formData.get('comment') as string;
		const isPublic = formData.get('is_public') === 'on';
		const therapistId = formData.get('therapist_id') as string;

		if (isNaN(rating) || rating < 1 || rating > 5) {
			return fail(400, { error: 'Calificación inválida' });
		}

		const result = await createReview(supabase, user.id, {
			bookingId: params.id,
			therapistId,
			rating,
			comment,
			isPublic
		});

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		throw redirect(303, '/bookings?reviewed=true');
	},

	tip: async ({ request, params, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const amountCents = parseInt(formData.get('amount_cents') as string, 10);

		if (isNaN(amountCents) || amountCents < 100) {
			return fail(400, { tipError: 'Monto de propina inválido' });
		}

		const result = await sendTip(supabase, user.id, {
			bookingId: params.id,
			amountCents
		});

		if (!result.success) {
			return fail(400, { tipError: result.error });
		}

		return { tipSuccess: true };
	}
};
