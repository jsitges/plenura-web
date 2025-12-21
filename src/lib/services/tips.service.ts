import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$types/database.types';
import { sendTipNotification } from './email.service';
import { sendTipNotificationWhatsApp } from './whatsapp.service';

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

// Subscription tiers that have WhatsApp enabled
const WHATSAPP_ENABLED_TIERS = ['business', 'enterprise'];

export interface TipInput {
	bookingId: string;
	amountCents: number;
}

/**
 * Send a tip to the therapist after a completed booking
 * Tips are 100% for the therapist (no platform commission)
 */
export async function sendTip(
	supabase: SupabaseClient<Database>,
	userId: string,
	input: TipInput
): Promise<{ success: boolean; error?: string }> {
	// Verify booking exists and belongs to user
	const { data: booking, error: fetchError } = await supabase
		.from('bookings')
		.select(
			`
			id, therapist_id, client_id, status,
			client:users!bookings_client_id_fkey(full_name),
			therapist:therapists!bookings_therapist_id_fkey(
				subscription_tier,
				user:users!therapists_user_id_fkey(full_name, email, phone, email_preferences)
			),
			service:services!bookings_service_id_fkey(name)
		`
		)
		.eq('id', input.bookingId)
		.single();

	if (fetchError || !booking) {
		return { success: false, error: 'Reserva no encontrada' };
	}

	const b = booking as unknown as {
		id: string;
		therapist_id: string;
		client_id: string;
		status: string;
		client: { full_name: string };
		therapist: {
			subscription_tier: string;
			user: {
				full_name: string;
				email: string;
				phone: string | null;
				email_preferences: EmailPreferences | null;
			};
		};
		service: { name: string };
	};

	if (b.client_id !== userId) {
		return { success: false, error: 'No autorizado' };
	}

	if (b.status !== 'completed') {
		return { success: false, error: 'Solo puedes dar propina en reservas completadas' };
	}

	// Record the tip (100% goes to therapist, no platform fee)
	const { error: insertError } = await supabase.from('tips').insert({
		booking_id: input.bookingId,
		client_id: userId,
		therapist_id: b.therapist_id,
		amount_cents: input.amountCents,
		plenura_fee_cents: 0,
		therapist_amount_cents: input.amountCents
	});

	if (insertError) {
		console.error('Error recording tip:', insertError);
		return { success: false, error: 'Error al procesar la propina' };
	}

	// Send tip notification if therapist has it enabled
	const prefs = b.therapist.user.email_preferences ?? DEFAULT_PREFERENCES;
	if (prefs.tips_received) {
		// Send email
		await sendTipNotification(
			b.therapist.user.email,
			b.therapist.user.full_name,
			b.client.full_name,
			input.amountCents,
			b.service.name
		);

		// Also send WhatsApp for Business tier if therapist has phone
		if (
			WHATSAPP_ENABLED_TIERS.includes(b.therapist.subscription_tier) &&
			b.therapist.user.phone
		) {
			sendTipNotificationWhatsApp(
				b.therapist.user.phone,
				b.therapist.user.full_name,
				b.client.full_name,
				input.amountCents
			).catch(console.error);
		}
	}

	return { success: true };
}

/**
 * Get tips received by a therapist
 */
export async function getTherapistTips(
	supabase: SupabaseClient<Database>,
	therapistId: string,
	limit = 20
): Promise<
	Array<{
		id: string;
		amount_cents: number;
		created_at: string;
		users: { full_name: string };
	}>
> {
	const { data, error } = await supabase
		.from('tips')
		.select(
			`
			id,
			amount_cents,
			created_at,
			users:client_id (full_name)
		`
		)
		.eq('therapist_id', therapistId)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching tips:', error);
		return [];
	}

	return (data as unknown as Array<{
		id: string;
		amount_cents: number;
		created_at: string;
		users: { full_name: string };
	}>) ?? [];
}

/**
 * Get total tips for a therapist
 */
export async function getTotalTips(
	supabase: SupabaseClient<Database>,
	therapistId: string
): Promise<number> {
	const { data, error } = await supabase
		.from('tips')
		.select('amount_cents')
		.eq('therapist_id', therapistId);

	if (error || !data) return 0;

	return data.reduce((acc, t) => acc + ((t as { amount_cents: number }).amount_cents ?? 0), 0);
}
