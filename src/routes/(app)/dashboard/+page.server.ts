import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase, session } = locals;
	const parentData = await parent();
	const isTherapist = parentData.userProfile?.role === 'therapist';
	const userId = session?.user?.id;

	if (!userId) {
		return { stats: null, upcomingBookings: [] };
	}

	if (isTherapist) {
		// Get therapist ID
		const { data: therapist } = await (supabase as any)
			.from('therapists')
			.select('id, rating_avg, rating_count')
			.eq('user_id', userId)
			.single();

		if (!therapist) {
			return { stats: null, upcomingBookings: [] };
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const weekEnd = new Date(today);
		weekEnd.setDate(weekEnd.getDate() + 7);
		const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

		// Get bookings for today
		const { count: todayCount } = await (supabase as any)
			.from('bookings')
			.select('*', { count: 'exact', head: true })
			.eq('therapist_id', therapist.id)
			.gte('scheduled_at', today.toISOString())
			.lt('scheduled_at', tomorrow.toISOString())
			.in('status', ['confirmed', 'pending']);

		// Get bookings for this week
		const { count: weekCount } = await (supabase as any)
			.from('bookings')
			.select('*', { count: 'exact', head: true })
			.eq('therapist_id', therapist.id)
			.gte('scheduled_at', today.toISOString())
			.lt('scheduled_at', weekEnd.toISOString())
			.in('status', ['confirmed', 'pending']);

		// Get monthly earnings
		const { data: monthlyBookings } = await (supabase as any)
			.from('bookings')
			.select('price_cents, commission_cents')
			.eq('therapist_id', therapist.id)
			.gte('scheduled_at', monthStart.toISOString())
			.eq('status', 'completed');

		const monthlyEarnings = (monthlyBookings ?? []).reduce(
			(sum: number, b: any) => sum + ((b.price_cents ?? 0) - (b.commission_cents ?? 0)),
			0
		);

		// Get upcoming bookings
		const { data: upcomingBookings } = await (supabase as any)
			.from('bookings')
			.select(`
				id,
				scheduled_at,
				status,
				users:client_id (full_name, avatar_url),
				therapist_services!inner (
					services!inner (name_es)
				)
			`)
			.eq('therapist_id', therapist.id)
			.gte('scheduled_at', new Date().toISOString())
			.in('status', ['confirmed', 'pending'])
			.order('scheduled_at', { ascending: true })
			.limit(5);

		return {
			stats: {
				todayCount: todayCount ?? 0,
				weekCount: weekCount ?? 0,
				rating: therapist.rating_avg ?? 0,
				ratingCount: therapist.rating_count ?? 0,
				monthlyEarnings
			},
			upcomingBookings: (upcomingBookings ?? []).map((b: any) => ({
				id: b.id,
				scheduledAt: b.scheduled_at,
				status: b.status,
				clientName: b.users?.full_name ?? 'Cliente',
				clientAvatar: b.users?.avatar_url,
				serviceName: b.therapist_services?.services?.name_es ?? 'Servicio'
			}))
		};
	} else {
		// Client stats
		// Get completed bookings count
		const { count: completedCount } = await (supabase as any)
			.from('bookings')
			.select('*', { count: 'exact', head: true })
			.eq('client_id', userId)
			.eq('status', 'completed');

		// Get favorites count
		const { count: favoritesCount } = await (supabase as any)
			.from('favorites')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId);

		// Get next upcoming booking
		const { data: nextBooking } = await (supabase as any)
			.from('bookings')
			.select(`
				id,
				scheduled_at,
				therapists!inner (
					users!inner (full_name)
				)
			`)
			.eq('client_id', userId)
			.gte('scheduled_at', new Date().toISOString())
			.in('status', ['confirmed', 'pending'])
			.order('scheduled_at', { ascending: true })
			.limit(1)
			.single();

		// Get total savings from completed bookings (would need original prices, simplified here)
		const { data: completedBookings } = await (supabase as any)
			.from('bookings')
			.select('discount_cents')
			.eq('client_id', userId)
			.eq('status', 'completed');

		const totalSavings = (completedBookings ?? []).reduce(
			(sum: number, b: any) => sum + (b.discount_cents ?? 0),
			0
		);

		// Get upcoming bookings
		const { data: upcomingBookings } = await (supabase as any)
			.from('bookings')
			.select(`
				id,
				scheduled_at,
				status,
				therapists!inner (
					users!inner (full_name, avatar_url)
				),
				therapist_services!inner (
					services!inner (name_es)
				)
			`)
			.eq('client_id', userId)
			.gte('scheduled_at', new Date().toISOString())
			.in('status', ['confirmed', 'pending'])
			.order('scheduled_at', { ascending: true })
			.limit(5);

		return {
			stats: {
				completedCount: completedCount ?? 0,
				favoritesCount: favoritesCount ?? 0,
				nextBooking: nextBooking
					? {
							date: nextBooking.scheduled_at,
							therapistName: (nextBooking as any).therapists?.users?.full_name
						}
					: null,
				totalSavings
			},
			upcomingBookings: (upcomingBookings ?? []).map((b: any) => ({
				id: b.id,
				scheduledAt: b.scheduled_at,
				status: b.status,
				therapistName: b.therapists?.users?.full_name ?? 'Terapeuta',
				therapistAvatar: b.therapists?.users?.avatar_url,
				serviceName: b.therapist_services?.services?.name_es ?? 'Servicio'
			}))
		};
	}
};
