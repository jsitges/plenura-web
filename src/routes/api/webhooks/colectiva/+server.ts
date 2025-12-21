import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHmac } from 'crypto';
import { env } from '$env/dynamic/private';
import { createServiceRoleClient } from '$lib/supabase/server';

interface ColectivaWebhookPayload {
	event: string;
	data: {
		id: string;
		external_id?: string;
		status: string;
		amount_cents?: number;
		metadata?: {
			booking_id?: string;
		};
	};
	timestamp: string;
}

/**
 * Verify webhook signature from Colectiva
 */
function verifySignature(payload: string, signature: string): boolean {
	const webhookSecret = env.COLECTIVA_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.warn('COLECTIVA_WEBHOOK_SECRET not set, skipping signature verification');
		return true;
	}

	const expectedSignature = createHmac('sha256', webhookSecret)
		.update(payload)
		.digest('hex');

	return signature === `sha256=${expectedSignature}`;
}

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('x-colectiva-signature') ?? '';
	const payload = await request.text();

	// Verify webhook signature
	if (!verifySignature(payload, signature)) {
		throw error(401, 'Invalid signature');
	}

	let webhookData: ColectivaWebhookPayload;
	try {
		webhookData = JSON.parse(payload);
	} catch {
		throw error(400, 'Invalid JSON payload');
	}

	const supabase = createServiceRoleClient();
	const { event, data } = webhookData;

	console.log(`Received Colectiva webhook: ${event}`, data);

	try {
		switch (event) {
			case 'escrow.created':
				// Payment initiated, escrow created
				await handleEscrowCreated(supabase, data);
				break;

			case 'escrow.funded':
				// Client paid, funds in escrow
				await handleEscrowFunded(supabase, data);
				break;

			case 'escrow.released':
				// Funds released to therapist
				await handleEscrowReleased(supabase, data);
				break;

			case 'escrow.refunded':
				// Funds refunded to client
				await handleEscrowRefunded(supabase, data);
				break;

			case 'escrow.disputed':
				// Payment disputed
				await handleEscrowDisputed(supabase, data);
				break;

			case 'wallet.created':
				// Therapist wallet created
				await handleWalletCreated(supabase, data);
				break;

			case 'payout.completed':
				// Therapist payout completed
				await handlePayoutCompleted(supabase, data);
				break;

			default:
				console.log(`Unhandled webhook event: ${event}`);
		}

		return json({ received: true });
	} catch (err) {
		console.error('Error processing webhook:', err);
		throw error(500, 'Error processing webhook');
	}
};

async function handleEscrowCreated(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const bookingId = data.metadata?.booking_id ?? data.external_id;
	if (!bookingId) return;

	await supabase
		.from('bookings')
		.update({
			escrow_id: data.id,
			updated_at: new Date().toISOString()
		})
		.eq('id', bookingId);
}

async function handleEscrowFunded(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const bookingId = data.metadata?.booking_id ?? data.external_id;
	if (!bookingId) return;

	// Update booking status to confirmed once payment is received
	await supabase
		.from('bookings')
		.update({
			status: 'confirmed',
			updated_at: new Date().toISOString()
		})
		.eq('id', bookingId)
		.eq('status', 'pending');

	// TODO: Send notification to therapist about new confirmed booking
}

async function handleEscrowReleased(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const bookingId = data.metadata?.booking_id ?? data.external_id;
	if (!bookingId) return;

	// Booking is already marked completed, this confirms payment was released
	await supabase
		.from('bookings')
		.update({
			updated_at: new Date().toISOString()
		})
		.eq('id', bookingId);

	// TODO: Send notification to therapist about payment received
}

async function handleEscrowRefunded(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const bookingId = data.metadata?.booking_id ?? data.external_id;
	if (!bookingId) return;

	// Log refund in booking metadata or separate table
	await supabase
		.from('bookings')
		.update({
			updated_at: new Date().toISOString()
		})
		.eq('id', bookingId);

	// TODO: Send notification to client about refund processed
}

async function handleEscrowDisputed(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const bookingId = data.metadata?.booking_id ?? data.external_id;
	if (!bookingId) return;

	// Mark booking as disputed for admin review
	console.warn(`Booking ${bookingId} payment disputed - requires admin attention`);

	// TODO: Create admin notification/task for dispute resolution
}

async function handleWalletCreated(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const therapistId = data.external_id;
	if (!therapistId) return;

	// Update therapist with wallet ID
	await supabase
		.from('therapists')
		.update({
			colectiva_wallet_id: data.id,
			updated_at: new Date().toISOString()
		})
		.eq('id', therapistId);
}

async function handlePayoutCompleted(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	// Log payout for therapist records
	console.log(`Payout completed: ${data.id}, amount: ${data.amount_cents}`);

	// TODO: Create payout record in database for therapist's earnings history
}
