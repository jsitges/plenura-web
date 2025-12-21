import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerSupabaseClient } from '$lib/supabase/server';
import { sendWeeklyReport } from '$lib/services/email.service';

interface EmailPreferences {
	booking_reminders: boolean;
	review_requests: boolean;
	tips_received: boolean;
	marketing: boolean;
	weekly_reports: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
	booking_reminders: true,
	review_requests: true,
	tips_received: true,
	marketing: false,
	weekly_reports: true
};

/**
 * Verify cron authorization
 */
async function verifyCronAuth(request: Request): Promise<boolean> {
	const authHeader = request.headers.get('authorization');
	const { env } = await import('$env/dynamic/private');

	// If no secret configured, allow (for local dev)
	if (!env.CRON_SECRET) return true;

	return authHeader === `Bearer ${env.CRON_SECRET}`;
}

/**
 * Cron job to send weekly reports to therapists
 * Runs every Monday at 9 AM
 * Accepts both GET (Vercel) and POST (Supabase pg_net)
 */
const handleCron: RequestHandler = async (event) => {
	if (!(await verifyCronAuth(event.request))) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = createServerSupabaseClient(event);
	const now = new Date();
	const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const results = {
		reports_sent: 0,
		errors: [] as string[]
	};

	try {
		// Get all active therapists
		const { data: therapists, error: therapistError } = await supabase
			.from('therapists')
			.select(
				`
				id,
				user_id,
				user:users!therapists_user_id_fkey(full_name, email, email_preferences)
			`
			)
			.eq('vetting_status', 'approved');

		if (therapistError) {
			results.errors.push(`Therapist query error: ${therapistError.message}`);
			return json({ success: false, ...results }, { status: 500 });
		}

		if (!therapists?.length) {
			return json({ success: true, message: 'No therapists to send reports to', ...results });
		}

		for (const therapist of therapists) {
			const user = therapist.user as unknown as {
				full_name: string;
				email: string;
				email_preferences: EmailPreferences | null;
			};

			// Check if therapist has weekly reports enabled
			const prefs = user.email_preferences ?? DEFAULT_PREFERENCES;
			if (!prefs.weekly_reports) {
				continue;
			}

			// Get bookings completed this week
			const { data: bookings, error: bookingsError } = await supabase
				.from('bookings')
				.select('price_cents')
				.eq('therapist_id', therapist.id)
				.eq('status', 'completed')
				.gte('completed_at', oneWeekAgo.toISOString())
				.lte('completed_at', now.toISOString());

			if (bookingsError) {
				results.errors.push(`Bookings error for ${therapist.id}: ${bookingsError.message}`);
				continue;
			}

			// Get tips received this week
			const { data: tips, error: tipsError } = await supabase
				.from('tips')
				.select('amount_cents')
				.eq('therapist_id', therapist.id)
				.gte('created_at', oneWeekAgo.toISOString())
				.lte('created_at', now.toISOString());

			if (tipsError) {
				results.errors.push(`Tips error for ${therapist.id}: ${tipsError.message}`);
				continue;
			}

			// Get reviews received this week
			const { data: reviews, error: reviewsError } = await supabase
				.from('reviews')
				.select('rating')
				.eq('therapist_id', therapist.id)
				.gte('created_at', oneWeekAgo.toISOString())
				.lte('created_at', now.toISOString());

			if (reviewsError) {
				results.errors.push(`Reviews error for ${therapist.id}: ${reviewsError.message}`);
				continue;
			}

			const bookingsCompleted = bookings?.length ?? 0;
			const totalEarningsCents =
				bookings?.reduce((acc, b) => acc + ((b as { price_cents: number }).price_cents ?? 0), 0) ??
				0;
			const tipsCents =
				tips?.reduce((acc, t) => acc + ((t as { amount_cents: number }).amount_cents ?? 0), 0) ??
				0;
			const newReviews = reviews?.length ?? 0;
			const avgRating =
				newReviews > 0
					? reviews!.reduce((acc, r) => acc + ((r as { rating: number }).rating ?? 0), 0) /
						newReviews
					: 0;

			// Skip if no activity this week
			if (bookingsCompleted === 0 && tipsCents === 0 && newReviews === 0) {
				continue;
			}

			const sent = await sendWeeklyReport(user.email, user.full_name, {
				bookingsCompleted,
				totalEarningsCents,
				tipsCents,
				avgRating,
				newReviews
			});

			if (sent) {
				results.reports_sent++;
			} else {
				results.errors.push(`Failed to send report to ${therapist.id}`);
			}
		}

		return json({
			success: true,
			timestamp: now.toISOString(),
			...results
		});
	} catch (error) {
		console.error('Weekly reports cron error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				...results
			},
			{ status: 500 }
		);
	}
};

// Export both GET and POST handlers (Vercel uses GET, Supabase pg_net uses POST)
export const GET = handleCron;
export const POST = handleCron;
