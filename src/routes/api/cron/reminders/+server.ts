import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerSupabaseClient } from '$lib/supabase/server';
import { sendBookingReminder } from '$lib/services/email.service';

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
 * Cron job to send booking reminders
 * Runs hourly to check for bookings in the next 24h and 1h windows
 * Accepts both GET (Vercel) and POST (Supabase pg_net)
 */
const handleCron: RequestHandler = async (event) => {
	if (!(await verifyCronAuth(event.request))) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = createServerSupabaseClient(event);
	const now = new Date();
	const results = {
		reminders_24h_sent: 0,
		reminders_1h_sent: 0,
		errors: [] as string[]
	};

	try {
		// --- 24 Hour Reminders ---
		// Find bookings scheduled 23-25 hours from now that haven't had 24h reminder sent
		const from24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
		const to24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

		const { data: bookings24h, error: err24h } = await supabase
			.from('bookings')
			.select(
				`
				id,
				scheduled_at,
				address,
				price_cents,
				client:users!bookings_client_id_fkey(id, full_name, email, email_preferences),
				therapist:therapists!bookings_therapist_id_fkey(
					id,
					user:users!therapists_user_id_fkey(full_name, email)
				),
				service:services!bookings_service_id_fkey(name)
			`
			)
			.gte('scheduled_at', from24h.toISOString())
			.lte('scheduled_at', to24h.toISOString())
			.in('status', ['confirmed', 'pending'])
			.is('reminder_24h_sent_at', null);

		if (err24h) {
			results.errors.push(`24h query error: ${err24h.message}`);
		} else if (bookings24h) {
			for (const booking of bookings24h) {
				const client = booking.client as unknown as {
					id: string;
					full_name: string;
					email: string;
					email_preferences: EmailPreferences | null;
				};
				const therapist = booking.therapist as unknown as {
					id: string;
					user: { full_name: string; email: string };
				};
				const service = booking.service as unknown as { name: string };

				// Check if client has reminders enabled
				const prefs = client.email_preferences ?? DEFAULT_PREFERENCES;
				if (!prefs.booking_reminders) {
					continue;
				}

				const emailData = {
					clientName: client.full_name,
					clientEmail: client.email,
					therapistName: therapist.user.full_name,
					therapistEmail: therapist.user.email,
					serviceName: service.name,
					scheduledAt: new Date(booking.scheduled_at),
					address: booking.address,
					priceCents: booking.price_cents
				};

				const sent = await sendBookingReminder(client.email, client.full_name, emailData);

				if (sent) {
					// Mark reminder as sent
					await supabase
						.from('bookings')
						.update({ reminder_24h_sent_at: now.toISOString() })
						.eq('id', booking.id);
					results.reminders_24h_sent++;
				} else {
					results.errors.push(`Failed to send 24h reminder for booking ${booking.id}`);
				}
			}
		}

		// --- 1 Hour Reminders ---
		// Find bookings scheduled 50-70 minutes from now that haven't had 1h reminder sent
		const from1h = new Date(now.getTime() + 50 * 60 * 1000);
		const to1h = new Date(now.getTime() + 70 * 60 * 1000);

		const { data: bookings1h, error: err1h } = await supabase
			.from('bookings')
			.select(
				`
				id,
				scheduled_at,
				address,
				price_cents,
				client:users!bookings_client_id_fkey(id, full_name, email, email_preferences),
				therapist:therapists!bookings_therapist_id_fkey(
					id,
					user:users!therapists_user_id_fkey(full_name, email)
				),
				service:services!bookings_service_id_fkey(name)
			`
			)
			.gte('scheduled_at', from1h.toISOString())
			.lte('scheduled_at', to1h.toISOString())
			.eq('status', 'confirmed')
			.is('reminder_1h_sent_at', null);

		if (err1h) {
			results.errors.push(`1h query error: ${err1h.message}`);
		} else if (bookings1h) {
			for (const booking of bookings1h) {
				const client = booking.client as unknown as {
					id: string;
					full_name: string;
					email: string;
					email_preferences: EmailPreferences | null;
				};
				const therapist = booking.therapist as unknown as {
					id: string;
					user: { full_name: string; email: string };
				};
				const service = booking.service as unknown as { name: string };

				// Check if client has reminders enabled
				const prefs = client.email_preferences ?? DEFAULT_PREFERENCES;
				if (!prefs.booking_reminders) {
					continue;
				}

				const emailData = {
					clientName: client.full_name,
					clientEmail: client.email,
					therapistName: therapist.user.full_name,
					therapistEmail: therapist.user.email,
					serviceName: service.name,
					scheduledAt: new Date(booking.scheduled_at),
					address: booking.address,
					priceCents: booking.price_cents
				};

				// Send 1h reminder (uses same template, could be customized)
				const sent = await sendBookingReminder(client.email, client.full_name, emailData);

				if (sent) {
					await supabase
						.from('bookings')
						.update({ reminder_1h_sent_at: now.toISOString() })
						.eq('id', booking.id);
					results.reminders_1h_sent++;
				} else {
					results.errors.push(`Failed to send 1h reminder for booking ${booking.id}`);
				}
			}
		}

		return json({
			success: true,
			timestamp: now.toISOString(),
			...results
		});
	} catch (error) {
		console.error('Cron job error:', error);
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
