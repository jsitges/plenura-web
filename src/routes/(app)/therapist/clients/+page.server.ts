import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

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

	// Get all clients who have booked with this therapist
	const { data: bookings } = await supabase
		.from('bookings')
		.select(`
			client_id,
			scheduled_at,
			status,
			users (
				id,
				full_name,
				email,
				phone,
				avatar_url,
				created_at
			)
		`)
		.eq('therapist_id', therapist.id)
		.order('created_at', { ascending: false });

	// Aggregate client data
	const clientsMap = new Map();

	bookings?.forEach((booking: any) => {
		if (!booking.users) return;

		const clientId = booking.users.id;

		if (!clientsMap.has(clientId)) {
			clientsMap.set(clientId, {
				...booking.users,
				total_bookings: 0,
				completed_bookings: 0,
				last_booking_date: null
			});
		}

		const client = clientsMap.get(clientId);
		client.total_bookings++;

		if (booking.status === 'completed') {
			client.completed_bookings++;
		}

		// Update last booking date
		if (!client.last_booking_date || new Date(booking.scheduled_at) > new Date(client.last_booking_date)) {
			client.last_booking_date = booking.scheduled_at;
		}
	});

	const clients = Array.from(clientsMap.values()).sort((a, b) => {
		// Sort by last booking date (most recent first)
		if (a.last_booking_date && b.last_booking_date) {
			return new Date(b.last_booking_date).getTime() - new Date(a.last_booking_date).getTime();
		}
		if (a.last_booking_date) return -1;
		if (b.last_booking_date) return 1;
		return 0;
	});

	// Get stats
	const totalBookings = bookings?.length ?? 0;
	const completedBookings = bookings?.filter((b: any) => b.status === 'completed').length ?? 0;
	const upcomingBookings = bookings?.filter((b: any) =>
		b.status === 'confirmed' && new Date(b.scheduled_at) > new Date()
	).length ?? 0;

	return {
		clients,
		stats: {
			totalBookings,
			completedBookings,
			upcomingBookings
		}
	};
};
