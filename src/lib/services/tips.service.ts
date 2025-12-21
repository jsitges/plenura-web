import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$types/database.types';

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
		.select('id, therapist_id, client_id, status')
		.eq('id', input.bookingId)
		.single();

	if (fetchError || !booking) {
		return { success: false, error: 'Reserva no encontrada' };
	}

	const b = booking as { id: string; therapist_id: string; client_id: string; status: string };

	if (b.client_id !== userId) {
		return { success: false, error: 'No autorizado' };
	}

	if (b.status !== 'completed') {
		return { success: false, error: 'Solo puedes dar propina en reservas completadas' };
	}

	// Record the tip
	const { error: insertError } = await supabase.from('tips').insert({
		booking_id: input.bookingId,
		client_id: userId,
		therapist_id: b.therapist_id,
		amount_cents: input.amountCents
	});

	if (insertError) {
		console.error('Error recording tip:', insertError);
		return { success: false, error: 'Error al procesar la propina' };
	}

	// In production, this would trigger a payment to the therapist
	// For now, we'll just record it

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
