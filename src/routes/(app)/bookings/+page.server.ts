import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserBookings } from '$lib/services/booking.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	const filter = url.searchParams.get('filter') ?? 'upcoming';
	const justReviewed = url.searchParams.get('reviewed') === 'true';

	let statusFilter: string[] | undefined;

	switch (filter) {
		case 'upcoming':
			statusFilter = ['pending', 'confirmed'];
			break;
		case 'past':
			statusFilter = ['completed'];
			break;
		case 'cancelled':
			statusFilter = ['cancelled_by_client', 'cancelled_by_therapist', 'no_show'];
			break;
		default:
			statusFilter = undefined;
	}

	const bookings = await getUserBookings(supabase, user.id, statusFilter);

	// Get reviewed booking IDs to know which completed bookings need reviews
	const { data: reviews } = await supabase
		.from('reviews')
		.select('booking_id')
		.eq('client_id', user.id);

	const reviewedBookingIds = new Set(
		(reviews ?? []).map((r) => (r as { booking_id: string }).booking_id)
	);

	return {
		bookings,
		filter,
		reviewedBookingIds: Array.from(reviewedBookingIds),
		justReviewed
	};
};
