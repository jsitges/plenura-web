import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const practiceId = parentData.membership.practice_id;

	// Get practice members (therapists)
	const { data: members } = await (supabase as any)
		.from('practice_members')
		.select(`
			therapist_id,
			therapists!inner(
				id,
				rating_avg,
				rating_count,
				users!inner(full_name, avatar_url)
			)
		`)
		.eq('practice_id', practiceId)
		.eq('status', 'active');

	const therapistIds = (members ?? []).map((m: any) => m.therapist_id);

	// Get all bookings for these therapists
	const { data: allBookings } = await (supabase as any)
		.from('bookings')
		.select('id, status, price_cents, commission_cents, practice_commission_cents, therapist_id, scheduled_at, created_at')
		.in('therapist_id', therapistIds);

	const bookings = allBookings ?? [];

	// Calculate date ranges
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - now.getDay());

	// Filter by time periods
	const thisMonthBookings = bookings.filter((b: any) => new Date(b.scheduled_at) >= startOfMonth);
	const lastMonthBookings = bookings.filter((b: any) => {
		const d = new Date(b.scheduled_at);
		return d >= startOfLastMonth && d <= endOfLastMonth;
	});
	const thisWeekBookings = bookings.filter((b: any) => new Date(b.scheduled_at) >= startOfWeek);

	// Calculate metrics
	const completedThisMonth = thisMonthBookings.filter((b: any) => b.status === 'completed');
	const completedLastMonth = lastMonthBookings.filter((b: any) => b.status === 'completed');

	const revenueThisMonth = completedThisMonth.reduce((acc: number, b: any) => acc + (b.price_cents ?? 0), 0);
	const revenueLastMonth = completedLastMonth.reduce((acc: number, b: any) => acc + (b.price_cents ?? 0), 0);
	const commissionThisMonth = completedThisMonth.reduce((acc: number, b: any) => acc + (b.practice_commission_cents ?? 0), 0);

	// Calculate growth
	const revenueGrowth = revenueLastMonth > 0
		? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
		: 0;
	const bookingGrowth = completedLastMonth.length > 0
		? ((completedThisMonth.length - completedLastMonth.length) / completedLastMonth.length) * 100
		: 0;

	// Calculate booking status breakdown
	const statusBreakdown = {
		completed: bookings.filter((b: any) => b.status === 'completed').length,
		confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
		pending: bookings.filter((b: any) => b.status === 'pending').length,
		cancelled: bookings.filter((b: any) => ['cancelled', 'cancelled_by_client', 'cancelled_by_therapist'].includes(b.status)).length
	};

	// Calculate per-therapist stats
	const therapistStats = (members ?? []).map((m: any) => {
		const therapistBookings = bookings.filter((b: any) => b.therapist_id === m.therapist_id);
		const completed = therapistBookings.filter((b: any) => b.status === 'completed');
		const thisMonthCompleted = completed.filter((b: any) => new Date(b.scheduled_at) >= startOfMonth);

		return {
			id: m.therapist_id,
			name: m.therapists.users.full_name,
			avatar_url: m.therapists.users.avatar_url,
			rating_avg: m.therapists.rating_avg,
			rating_count: m.therapists.rating_count,
			totalBookings: therapistBookings.length,
			completedBookings: completed.length,
			thisMonthBookings: thisMonthCompleted.length,
			thisMonthRevenue: thisMonthCompleted.reduce((acc: number, b: any) => acc + (b.price_cents ?? 0), 0),
			cancellationRate: therapistBookings.length > 0
				? (therapistBookings.filter((b: any) => b.status.includes('cancelled')).length / therapistBookings.length) * 100
				: 0
		};
	}).sort((a: any, b: any) => b.thisMonthRevenue - a.thisMonthRevenue);

	// Generate weekly data for chart (last 8 weeks)
	const weeklyData = [];
	for (let i = 7; i >= 0; i--) {
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekStart.getDate() + 6);

		const weekBookings = bookings.filter((b: any) => {
			const d = new Date(b.scheduled_at);
			return d >= weekStart && d <= weekEnd && b.status === 'completed';
		});

		weeklyData.push({
			week: weekStart.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
			bookings: weekBookings.length,
			revenue: weekBookings.reduce((acc: number, b: any) => acc + (b.price_cents ?? 0), 0)
		});
	}

	return {
		summary: {
			totalBookings: bookings.length,
			completedBookings: statusBreakdown.completed,
			thisMonthBookings: thisMonthBookings.length,
			thisWeekBookings: thisWeekBookings.length,
			revenueThisMonth,
			revenueLastMonth,
			commissionThisMonth,
			revenueGrowth,
			bookingGrowth,
			averageBookingValue: statusBreakdown.completed > 0
				? bookings.filter((b: any) => b.status === 'completed').reduce((acc: number, b: any) => acc + (b.price_cents ?? 0), 0) / statusBreakdown.completed
				: 0,
			cancellationRate: bookings.length > 0
				? (statusBreakdown.cancelled / bookings.length) * 100
				: 0
		},
		statusBreakdown,
		therapistStats,
		weeklyData,
		teamSize: members?.length ?? 0
	};
};
