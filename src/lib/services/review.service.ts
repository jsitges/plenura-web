import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '$lib/types/database.types';

export interface ReviewWithDetails extends Tables<'reviews'> {
	users: Pick<Tables<'users'>, 'full_name' | 'avatar_url'>;
	bookings: {
		therapist_services: {
			services: Pick<Tables<'services'>, 'name' | 'name_es'>;
		};
	};
}

export interface CreateReviewInput {
	bookingId: string;
	therapistId: string;
	rating: number;
	comment?: string;
	isPublic?: boolean;
}

export async function createReview(
	supabase: SupabaseClient<Database>,
	clientId: string,
	input: CreateReviewInput
): Promise<{ success: boolean; error?: string }> {
	// Verify the booking exists and belongs to the client
	const { data: booking } = await supabase
		.from('bookings')
		.select('id, status, client_id, therapist_id')
		.eq('id', input.bookingId)
		.single();

	if (!booking) {
		return { success: false, error: 'Reserva no encontrada' };
	}

	if ((booking as { client_id: string }).client_id !== clientId) {
		return { success: false, error: 'No autorizado' };
	}

	if ((booking as { status: string }).status !== 'completed') {
		return { success: false, error: 'Solo puedes dejar reseña en citas completadas' };
	}

	// Check if review already exists
	const { data: existingReview } = await supabase
		.from('reviews')
		.select('id')
		.eq('booking_id', input.bookingId)
		.single();

	if (existingReview) {
		return { success: false, error: 'Ya dejaste una reseña para esta cita' };
	}

	// Create the review
	const { error } = await supabase.from('reviews').insert({
		booking_id: input.bookingId,
		client_id: clientId,
		therapist_id: input.therapistId,
		rating: input.rating,
		comment: input.comment?.trim() || null,
		is_public: input.isPublic ?? true
	});

	if (error) {
		console.error('Error creating review:', error);
		return { success: false, error: 'Error al crear la reseña' };
	}

	// Update therapist rating average
	await updateTherapistRating(supabase, input.therapistId);

	return { success: true };
}

export async function updateTherapistRating(
	supabase: SupabaseClient<Database>,
	therapistId: string
): Promise<void> {
	// Calculate new average
	const { data: reviews } = await supabase
		.from('reviews')
		.select('rating')
		.eq('therapist_id', therapistId)
		.eq('is_public', true);

	if (!reviews || reviews.length === 0) {
		return;
	}

	const totalRating = reviews.reduce((sum, r) => sum + (r as { rating: number }).rating, 0);
	const avgRating = totalRating / reviews.length;

	await supabase
		.from('therapists')
		.update({
			rating_avg: Math.round(avgRating * 10) / 10,
			rating_count: reviews.length
		})
		.eq('id', therapistId);
}

export async function getTherapistReviews(
	supabase: SupabaseClient<Database>,
	therapistId: string,
	limit = 10,
	offset = 0
): Promise<ReviewWithDetails[]> {
	const { data, error } = await supabase
		.from('reviews')
		.select(
			`
			*,
			users!client_id (
				full_name,
				avatar_url
			),
			bookings!inner (
				therapist_services (
					services (
						name,
						name_es
					)
				)
			)
		`
		)
		.eq('therapist_id', therapistId)
		.eq('is_public', true)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error('Error fetching reviews:', error);
		return [];
	}

	return (data as unknown as ReviewWithDetails[]) ?? [];
}

export async function getBookingReview(
	supabase: SupabaseClient<Database>,
	bookingId: string
): Promise<Tables<'reviews'> | null> {
	const { data, error } = await supabase
		.from('reviews')
		.select('*')
		.eq('booking_id', bookingId)
		.single();

	if (error) {
		return null;
	}

	return data as Tables<'reviews'>;
}

export async function getPendingReviews(
	supabase: SupabaseClient<Database>,
	clientId: string
): Promise<
	Array<{
		booking_id: string;
		therapist_id: string;
		therapist_name: string;
		service_name: string;
		scheduled_at: string;
	}>
> {
	// Get completed bookings without reviews
	const { data: completedBookings } = await supabase
		.from('bookings')
		.select(
			`
			id,
			therapist_id,
			scheduled_at,
			therapists (
				users (
					full_name
				)
			),
			therapist_services (
				services (
					name_es
				)
			)
		`
		)
		.eq('client_id', clientId)
		.eq('status', 'completed')
		.order('scheduled_at', { ascending: false })
		.limit(20);

	if (!completedBookings) {
		return [];
	}

	// Filter out bookings that already have reviews
	const { data: existingReviews } = await supabase
		.from('reviews')
		.select('booking_id')
		.eq('client_id', clientId);

	const reviewedBookingIds = new Set((existingReviews ?? []).map((r) => (r as { booking_id: string }).booking_id));

	interface BookingResult {
		id: string;
		therapist_id: string;
		scheduled_at: string;
		therapists: {
			users: {
				full_name: string;
			};
		};
		therapist_services: {
			services: {
				name_es: string;
			};
		};
	}

	return (completedBookings as unknown as BookingResult[])
		.filter((b) => !reviewedBookingIds.has(b.id))
		.map((b) => ({
			booking_id: b.id,
			therapist_id: b.therapist_id,
			therapist_name: b.therapists?.users?.full_name ?? 'Terapeuta',
			service_name: b.therapist_services?.services?.name_es ?? 'Servicio',
			scheduled_at: b.scheduled_at
		}));
}
