import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	// Get therapist ID
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', user!.id)
		.single();

	if (!therapist) {
		return {
			stats: { today: 0, week: 0, month: 0, pending: 0 },
			upcomingBookings: [],
			recentReviews: [],
			earnings: { thisMonth: 0, lastMonth: 0 }
		};
	}

	const therapistId = therapist.id;
	const now = new Date();
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfWeek = new Date(startOfDay);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

	// Get booking stats
	const [todayBookings, weekBookings, monthBookings, pendingBookings] = await Promise.all([
		supabase
			.from('bookings')
			.select('id', { count: 'exact' })
			.eq('therapist_id', therapistId)
			.gte('scheduled_at', startOfDay.toISOString())
			.in('status', ['confirmed', 'completed']),
		supabase
			.from('bookings')
			.select('id', { count: 'exact' })
			.eq('therapist_id', therapistId)
			.gte('scheduled_at', startOfWeek.toISOString())
			.in('status', ['confirmed', 'completed']),
		supabase
			.from('bookings')
			.select('id', { count: 'exact' })
			.eq('therapist_id', therapistId)
			.gte('scheduled_at', startOfMonth.toISOString())
			.in('status', ['confirmed', 'completed']),
		supabase
			.from('bookings')
			.select('id', { count: 'exact' })
			.eq('therapist_id', therapistId)
			.eq('status', 'pending')
	]);

	// Get upcoming bookings
	const { data: upcomingBookings } = await supabase
		.from('bookings')
		.select(`
			*,
			users:client_id (
				full_name,
				avatar_url
			),
			therapist_services (
				services (
					name
				)
			)
		`)
		.eq('therapist_id', therapistId)
		.gte('scheduled_at', now.toISOString())
		.in('status', ['pending', 'confirmed'])
		.order('scheduled_at', { ascending: true })
		.limit(5);

	// Get recent reviews
	const { data: recentReviews } = await supabase
		.from('reviews')
		.select(`
			*,
			users:client_id (
				full_name,
				avatar_url
			)
		`)
		.eq('therapist_id', therapistId)
		.order('created_at', { ascending: false })
		.limit(3);

	// Get earnings
	const { data: thisMonthEarnings } = await supabase
		.from('bookings')
		.select('price_cents')
		.eq('therapist_id', therapistId)
		.eq('status', 'completed')
		.gte('scheduled_at', startOfMonth.toISOString());

	const { data: lastMonthEarnings } = await supabase
		.from('bookings')
		.select('price_cents')
		.eq('therapist_id', therapistId)
		.eq('status', 'completed')
		.gte('scheduled_at', startOfLastMonth.toISOString())
		.lt('scheduled_at', startOfMonth.toISOString());

	const thisMonthTotal = (thisMonthEarnings ?? []).reduce((sum, b) => sum + ((b as { price_cents: number }).price_cents || 0), 0);
	const lastMonthTotal = (lastMonthEarnings ?? []).reduce((sum, b) => sum + ((b as { price_cents: number }).price_cents || 0), 0);

	return {
		stats: {
			today: todayBookings.count ?? 0,
			week: weekBookings.count ?? 0,
			month: monthBookings.count ?? 0,
			pending: pendingBookings.count ?? 0
		},
		upcomingBookings: upcomingBookings ?? [],
		recentReviews: recentReviews ?? [],
		earnings: {
			thisMonth: thisMonthTotal,
			lastMonth: lastMonthTotal
		}
	};
};
