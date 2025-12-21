// @ts-nocheck
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createReview, getBookingReview } from '$lib/services/review.service';

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

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
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

export const actions = {
	default: async ({ request, params, locals }: import('./$types').RequestEvent) => {
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
	}
};
;null as any as Actions;