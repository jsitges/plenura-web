import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHmac } from 'crypto';
import { env } from '$env/dynamic/private';
import { createServiceRoleClient } from '$lib/supabase/server';
import {
	sendNewBookingToTherapist,
	sendPaymentReceivedNotification,
	sendRefundNotification,
	sendKYCDocumentRejected,
	sendKYCVerifiedNotification,
	sendNewDisputeNotificationToAdmin
} from '$lib/services/email.service';

interface ColectivaWebhookPayload {
	event: string;
	data: {
		id: string;
		external_id?: string;
		user_id?: string;
		status: string;
		amount_cents?: number;
		metadata?: {
			booking_id?: string;
		};
		// KYC-specific fields
		verification_status?: 'unverified' | 'pending' | 'identity_verified' | 'credential_verified' | 'fully_verified';
		identity_verified_at?: string;
		credential_verified_at?: string;
		documents?: Array<{
			type: string;
			status: 'pending' | 'approved' | 'rejected';
			rejection_reason?: string;
		}>;
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

			// KYC Events
			case 'kyc.status_changed':
				// User's KYC verification status changed
				await handleKYCStatusChanged(supabase, data);
				break;

			case 'kyc.document_approved':
				// A specific document was approved
				await handleKYCDocumentApproved(supabase, data);
				break;

			case 'kyc.document_rejected':
				// A specific document was rejected
				await handleKYCDocumentRejected(supabase, data);
				break;

			case 'kyc.fully_verified':
				// User completed full verification
				await handleKYCFullyVerified(supabase, data);
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

	// Get booking details for notification
	const { data: booking } = await supabase
		.from('bookings')
		.select(`
			id,
			scheduled_at,
			price_cents,
			address,
			users:client_id (full_name, email),
			therapists!inner (
				user_id,
				users!inner (full_name, email)
			),
			therapist_services!inner (
				services!inner (name_es)
			)
		`)
		.eq('id', bookingId)
		.single();

	if (booking) {
		const b = booking as any;
		const therapistUser = b.therapists?.users;
		const clientUser = b.users;
		const serviceName = b.therapist_services?.services?.name_es || 'Servicio';

		if (therapistUser?.email) {
			await sendNewBookingToTherapist({
				clientName: clientUser?.full_name || 'Cliente',
				clientEmail: clientUser?.email || '',
				therapistName: therapistUser.full_name || 'Terapeuta',
				therapistEmail: therapistUser.email,
				serviceName,
				scheduledAt: new Date(b.scheduled_at),
				address: b.address || '',
				priceCents: b.price_cents || 0
			});
		}
	}
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

	// Get booking details for payment notification
	const { data: booking } = await supabase
		.from('bookings')
		.select(`
			id,
			scheduled_at,
			price_cents,
			users:client_id (full_name),
			therapists!inner (
				users!inner (full_name, email)
			),
			therapist_services!inner (
				services!inner (name_es)
			)
		`)
		.eq('id', bookingId)
		.single();

	if (booking) {
		const b = booking as any;
		const therapistUser = b.therapists?.users;
		const clientUser = b.users;
		const serviceName = b.therapist_services?.services?.name_es || 'Servicio';

		if (therapistUser?.email) {
			await sendPaymentReceivedNotification(
				therapistUser.email,
				therapistUser.full_name || 'Terapeuta',
				{
					clientName: clientUser?.full_name || 'Cliente',
					serviceName,
					amountCents: b.price_cents || 0,
					scheduledAt: new Date(b.scheduled_at)
				}
			);
		}
	}
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

	// Get booking details for refund notification
	const { data: booking } = await supabase
		.from('bookings')
		.select(`
			id,
			price_cents,
			users:client_id (full_name, email),
			therapists!inner (
				users!inner (full_name)
			),
			therapist_services!inner (
				services!inner (name_es)
			)
		`)
		.eq('id', bookingId)
		.single();

	if (booking) {
		const b = booking as any;
		const clientUser = b.users;
		const therapistUser = b.therapists?.users;
		const serviceName = b.therapist_services?.services?.name_es || 'Servicio';

		if (clientUser?.email) {
			await sendRefundNotification(clientUser.email, clientUser.full_name || 'Cliente', {
				serviceName,
				amountCents: b.price_cents || 0,
				therapistName: therapistUser?.full_name || 'Terapeuta'
			});
		}
	}
}

async function handleEscrowDisputed(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const bookingId = data.metadata?.booking_id ?? data.external_id;
	if (!bookingId) return;

	const disputeReason = (data as any).dispute_reason || 'Payment disputed by client';

	// Mark booking as disputed for admin review
	console.warn(`Booking ${bookingId} payment disputed - requires admin attention`);

	// Create dispute record for admin tracking
	const { error: disputeError } = await (supabase as any).from('admin_disputes').insert({
		booking_id: bookingId,
		colectiva_dispute_id: data.id,
		status: 'open',
		reason: disputeReason,
		opened_at: new Date().toISOString()
	});

	if (disputeError) {
		console.error('Error creating dispute record:', disputeError);
	} else {
		console.log(`Dispute record created for booking ${bookingId}`);
	}

	// Get booking details for admin notification
	const { data: booking } = await supabase
		.from('bookings')
		.select(`
			id,
			scheduled_at,
			price_cents,
			users:client_id (full_name),
			therapists!inner (
				users!inner (full_name)
			),
			therapist_services!inner (
				services!inner (name_es)
			)
		`)
		.eq('id', bookingId)
		.single();

	if (booking) {
		const b = booking as any;
		const clientName = b.users?.full_name || 'Cliente';
		const therapistName = b.therapists?.users?.full_name || 'Terapeuta';
		const serviceName = b.therapist_services?.services?.name_es || 'Servicio';

		await sendNewDisputeNotificationToAdmin({
			bookingId,
			clientName,
			therapistName,
			serviceName,
			amountCents: b.price_cents || 0,
			disputeReason,
			scheduledAt: new Date(b.scheduled_at)
		});
	}
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

	const therapistId = data.external_id ?? (data as any).therapist_id;
	if (!therapistId) {
		console.warn('Payout completed but no therapist ID found in webhook data');
		return;
	}

	// Create payout record in database
	const { error: payoutError } = await (supabase as any).from('payouts').insert({
		therapist_id: therapistId,
		colectiva_payout_id: data.id,
		amount_cents: data.amount_cents ?? 0,
		status: 'completed',
		payout_method: (data as any).payout_method ?? 'bank_transfer',
		bank_account_last_four: (data as any).bank_account_last_four,
		processed_at: new Date().toISOString()
	});

	if (payoutError) {
		console.error('Error creating payout record:', payoutError);
	} else {
		console.log(`Payout record created for therapist ${therapistId}: ${data.amount_cents} cents`);
	}
}

// ============================================================================
// KYC Event Handlers (Phase 2 - Colectiva KYC Integration)
// ============================================================================

async function handleKYCStatusChanged(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const userId = data.user_id ?? data.external_id;
	if (!userId || !data.verification_status) return;

	// Find therapist by user_id
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (!therapist) {
		console.warn(`KYC status changed for unknown user: ${userId}`);
		return;
	}

	// Update verification status
	const updateData: Record<string, unknown> = {
		verification_status: data.verification_status,
		updated_at: new Date().toISOString()
	};

	if (data.identity_verified_at) {
		updateData.identity_verified_at = data.identity_verified_at;
	}

	if (data.credential_verified_at) {
		updateData.credential_verified_at = data.credential_verified_at;
	}

	await supabase.from('therapists').update(updateData).eq('id', therapist.id);

	console.log(`KYC status updated for therapist ${therapist.id}: ${data.verification_status}`);
}

async function handleKYCDocumentApproved(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const userId = data.user_id ?? data.external_id;
	if (!userId) return;

	// Find therapist and update document status in verification_documents
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id, verification_documents')
		.eq('user_id', userId)
		.single();

	if (!therapist) return;

	// Update the specific document status if we're tracking locally
	if (data.documents?.length) {
		const existingDocs = (therapist.verification_documents || []) as Array<{
			type: string;
			status: string;
		}>;

		for (const doc of data.documents) {
			const existingDoc = existingDocs.find((d) => d.type === doc.type);
			if (existingDoc) {
				existingDoc.status = doc.status;
			}
		}

		await supabase
			.from('therapists')
			.update({
				verification_documents: existingDocs,
				updated_at: new Date().toISOString()
			})
			.eq('id', therapist.id);
	}

	console.log(`Document approved for therapist ${therapist.id}`);
}

async function handleKYCDocumentRejected(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const userId = data.user_id ?? data.external_id;
	if (!userId) return;

	const { data: therapist } = await supabase
		.from('therapists')
		.select('id, verification_documents')
		.eq('user_id', userId)
		.single();

	if (!therapist) return;

	// Update the specific document status with rejection reason
	if (data.documents?.length) {
		const existingDocs = (therapist.verification_documents || []) as Array<{
			type: string;
			status: string;
			rejectionReason?: string;
		}>;

		for (const doc of data.documents) {
			const existingDoc = existingDocs.find((d) => d.type === doc.type);
			if (existingDoc) {
				existingDoc.status = doc.status;
				existingDoc.rejectionReason = doc.rejection_reason;
			}
		}

		await supabase
			.from('therapists')
			.update({
				verification_documents: existingDocs,
				verification_status: 'pending', // Reset to pending when document rejected
				updated_at: new Date().toISOString()
			})
			.eq('id', therapist.id);
	}

	console.log(`Document rejected for therapist ${therapist.id}`);

	// Get therapist email and send notification
	const { data: therapistUser } = await supabase
		.from('users')
		.select('email, full_name')
		.eq('id', userId)
		.single();

	if (therapistUser && data.documents?.length) {
		const rejectedDoc = data.documents.find((d) => d.status === 'rejected');
		if (rejectedDoc) {
			await sendKYCDocumentRejected(
				(therapistUser as any).email,
				(therapistUser as any).full_name || 'Terapeuta',
				{
					documentType: rejectedDoc.type,
					rejectionReason: rejectedDoc.rejection_reason
				}
			);
		}
	}
}

async function handleKYCFullyVerified(
	supabase: ReturnType<typeof createServiceRoleClient>,
	data: ColectivaWebhookPayload['data']
) {
	const userId = data.user_id ?? data.external_id;
	if (!userId) return;

	const { data: therapist } = await supabase
		.from('therapists')
		.select('id, user_id')
		.eq('user_id', userId)
		.single();

	if (!therapist) return;

	// Mark as fully verified
	await supabase
		.from('therapists')
		.update({
			verification_status: 'fully_verified',
			identity_verified_at: data.identity_verified_at || new Date().toISOString(),
			credential_verified_at: data.credential_verified_at || new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.eq('id', therapist.id);

	console.log(`Therapist ${therapist.id} is now fully verified`);

	// Get therapist email and send congratulations notification
	const { data: therapistUser } = await supabase
		.from('users')
		.select('email, full_name')
		.eq('id', (therapist as any).user_id)
		.single();

	if (therapistUser) {
		await sendKYCVerifiedNotification(
			(therapistUser as any).email,
			(therapistUser as any).full_name || 'Terapeuta'
		);
	}
}
