/**
 * Earnings Service
 *
 * Manages therapist earnings, payouts, and financial data
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface EarningsSummary {
	totalEarningsCents: number;
	pendingPayoutCents: number;
	availableBalanceCents: number;
	totalBookings: number;
	completedBookings: number;
	thisMonthEarningsCents: number;
	lastMonthEarningsCents: number;
}

export interface BookingEarning {
	id: string;
	scheduled_at: string;
	status: string;
	price_cents: number;
	commission_cents: number;
	therapist_payout_cents: number;
	escrow_id: string | null;
	completed_at: string | null;
	client: {
		full_name: string | null;
	} | null;
	service: {
		name: string;
	} | null;
}

/**
 * Get earnings summary for a therapist
 */
export async function getEarningsSummary(
	supabase: SupabaseClient,
	therapistId: string
): Promise<EarningsSummary> {
	// Get all completed bookings
	const { data: completedBookings } = await supabase
		.from('bookings')
		.select('price_cents, commission_cents, therapist_payout_cents, completed_at')
		.eq('therapist_id', therapistId)
		.eq('status', 'completed');

	// Get pending (confirmed but not completed) bookings
	const { data: pendingBookings } = await supabase
		.from('bookings')
		.select('price_cents, commission_cents, therapist_payout_cents')
		.eq('therapist_id', therapistId)
		.eq('status', 'confirmed');

	// Get total booking count
	const { count: totalBookings } = await supabase
		.from('bookings')
		.select('id', { count: 'exact', head: true })
		.eq('therapist_id', therapistId)
		.in('status', ['pending', 'confirmed', 'completed']);

	const now = new Date();
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

	// Calculate totals
	let totalEarningsCents = 0;
	let thisMonthEarningsCents = 0;
	let lastMonthEarningsCents = 0;

	(completedBookings ?? []).forEach((b) => {
		const booking = b as {
			therapist_payout_cents: number;
			completed_at: string | null;
		};
		const payout = booking.therapist_payout_cents ?? 0;
		totalEarningsCents += payout;

		if (booking.completed_at) {
			const completedDate = new Date(booking.completed_at);
			if (completedDate >= thisMonthStart) {
				thisMonthEarningsCents += payout;
			} else if (completedDate >= lastMonthStart && completedDate <= lastMonthEnd) {
				lastMonthEarningsCents += payout;
			}
		}
	});

	// Pending payout = confirmed bookings waiting to be completed
	const pendingPayoutCents = (pendingBookings ?? []).reduce((sum, b) => {
		const booking = b as { therapist_payout_cents: number };
		return sum + (booking.therapist_payout_cents ?? 0);
	}, 0);

	return {
		totalEarningsCents,
		pendingPayoutCents,
		availableBalanceCents: 0, // Would come from Colectiva wallet
		totalBookings: totalBookings ?? 0,
		completedBookings: (completedBookings ?? []).length,
		thisMonthEarningsCents,
		lastMonthEarningsCents
	};
}

/**
 * Get booking earnings history for a therapist
 */
export async function getBookingEarnings(
	supabase: SupabaseClient,
	therapistId: string,
	limit = 20,
	offset = 0
): Promise<BookingEarning[]> {
	const { data } = await supabase
		.from('bookings')
		.select(
			`
			id,
			scheduled_at,
			status,
			price_cents,
			commission_cents,
			therapist_payout_cents,
			escrow_id,
			completed_at,
			users:client_id (full_name),
			therapist_services!inner (
				services!inner (name)
			)
		`
		)
		.eq('therapist_id', therapistId)
		.in('status', ['confirmed', 'completed'])
		.order('scheduled_at', { ascending: false })
		.range(offset, offset + limit - 1);

	return (data ?? []).map((b) => {
		const booking = b as unknown as {
			id: string;
			scheduled_at: string;
			status: string;
			price_cents: number;
			commission_cents: number;
			therapist_payout_cents: number;
			escrow_id: string | null;
			completed_at: string | null;
			users: { full_name: string | null } | null;
			therapist_services: { services: { name: string } };
		};

		return {
			id: booking.id,
			scheduled_at: booking.scheduled_at,
			status: booking.status,
			price_cents: booking.price_cents,
			commission_cents: booking.commission_cents ?? 0,
			therapist_payout_cents: booking.therapist_payout_cents ?? booking.price_cents,
			escrow_id: booking.escrow_id,
			completed_at: booking.completed_at,
			client: booking.users,
			service: booking.therapist_services?.services ?? null
		};
	});
}
