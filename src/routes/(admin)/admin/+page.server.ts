import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	// Get counts
	const [usersResult, therapistsResult, bookingsResult, pendingResult] = await Promise.all([
		supabase.from('users').select('id', { count: 'exact', head: true }),
		supabase.from('therapists').select('id', { count: 'exact', head: true }),
		supabase.from('bookings').select('id', { count: 'exact', head: true }),
		supabase
			.from('therapists')
			.select('id', { count: 'exact', head: true })
			.eq('vetting_status', 'pending')
	]);

	// Get recent bookings
	const { data: recentBookings } = await supabase
		.from('bookings')
		.select(`
			id,
			status,
			price_cents,
			scheduled_at,
			created_at,
			users:client_id (full_name),
			therapists!inner (
				users!inner (full_name)
			)
		`)
		.order('created_at', { ascending: false })
		.limit(10);

	// Get pending therapist applications
	const { data: pendingTherapists } = await supabase
		.from('therapists')
		.select(`
			id,
			vetting_status,
			created_at,
			users!inner (
				full_name,
				email
			)
		`)
		.eq('vetting_status', 'pending')
		.order('created_at', { ascending: true })
		.limit(5);

	// Get revenue this month
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const { data: monthlyBookings } = await supabase
		.from('bookings')
		.select('price_cents, commission_cents')
		.eq('status', 'completed')
		.gte('created_at', startOfMonth.toISOString());

	const monthlyRevenue = (monthlyBookings ?? []).reduce(
		(acc, b) => acc + ((b as { commission_cents: number }).commission_cents ?? 0),
		0
	);
	const monthlyGMV = (monthlyBookings ?? []).reduce(
		(acc, b) => acc + ((b as { price_cents: number }).price_cents ?? 0),
		0
	);

	return {
		stats: {
			totalUsers: usersResult.count ?? 0,
			totalTherapists: therapistsResult.count ?? 0,
			totalBookings: bookingsResult.count ?? 0,
			pendingApprovals: pendingResult.count ?? 0,
			monthlyRevenue,
			monthlyGMV
		},
		recentBookings: recentBookings ?? [],
		pendingTherapists: pendingTherapists ?? []
	};
};
