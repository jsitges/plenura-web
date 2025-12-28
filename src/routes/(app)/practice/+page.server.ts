import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const practiceId = parentData.membership.practice_id;

	// Get practice details
	const { data: practice } = await (supabase as any)
		.from('practices')
		.select('id, name, verification_status, rating_avg, rating_count, total_bookings')
		.eq('id', practiceId)
		.single();

	// Get team stats
	const { count: totalMembers } = await (supabase as any)
		.from('practice_members')
		.select('*', { count: 'exact', head: true })
		.eq('practice_id', practiceId)
		.eq('status', 'active');

	// Get active therapists (members with therapist_id who are available)
	const { data: therapistMembers } = await (supabase as any)
		.from('practice_members')
		.select('therapist_id')
		.eq('practice_id', practiceId)
		.eq('status', 'active')
		.not('therapist_id', 'is', null);

	const therapistIds = (therapistMembers ?? []).map((m: any) => m.therapist_id).filter(Boolean);

	let activeTherapists = 0;
	if (therapistIds.length > 0) {
		const { count } = await (supabase as any)
			.from('therapists')
			.select('*', { count: 'exact', head: true })
			.in('id', therapistIds)
			.eq('is_available', true);
		activeTherapists = count || 0;
	}

	// Get booking stats for this month
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	// Get pending bookings count
	const { count: pendingBookings } = await (supabase as any)
		.from('bookings')
		.select('*', { count: 'exact', head: true })
		.in('therapist_id', therapistIds)
		.eq('status', 'pending');

	// Get completed bookings this month
	const { data: completedBookings } = await (supabase as any)
		.from('bookings')
		.select('id, price_cents')
		.in('therapist_id', therapistIds)
		.eq('status', 'completed')
		.gte('completed_at', startOfMonth.toISOString());

	const completedThisMonth = completedBookings?.length || 0;
	const revenueThisMonth = (completedBookings ?? []).reduce((sum: number, b: any) => sum + (b.price_cents || 0), 0);

	// Get recent bookings
	const { data: recentBookings } = await (supabase as any)
		.from('bookings')
		.select(`
			id,
			scheduled_at,
			status,
			users!bookings_client_id_fkey (full_name),
			therapists!inner (
				users!inner (full_name)
			),
			therapist_services!inner (
				services!inner (name_es)
			)
		`)
		.in('therapist_id', therapistIds)
		.order('scheduled_at', { ascending: false })
		.limit(5);

	return {
		practice: practice || {
			id: practiceId,
			name: 'Mi Práctica',
			verification_status: 'unverified',
			rating_avg: 0,
			rating_count: 0,
			total_bookings: 0
		},
		stats: {
			totalMembers: totalMembers || 0,
			activeTherapists,
			pendingBookings: pendingBookings || 0,
			completedThisMonth,
			revenueThisMonth
		},
		recentBookings: (recentBookings || []).map((b: any) => ({
			id: b.id,
			scheduled_at: b.scheduled_at,
			status: b.status,
			client_name: b.users?.full_name || 'Cliente',
			therapist_name: b.therapists?.users?.full_name || 'Terapeuta',
			service_name: b.therapist_services?.services?.name_es || 'Servicio'
		}))
	};
};
