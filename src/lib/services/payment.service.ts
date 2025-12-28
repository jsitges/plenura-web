/**
 * Colectiva Payment Integration Service
 *
 * This service handles all payment operations through Colectiva's API:
 * - Escrow creation for bookings
 * - Escrow release on service completion
 * - Refunds for cancellations
 * - Wallet management for therapists
 *
 * Configuration required in .env:
 * - COLECTIVA_API_URL
 * - COLECTIVA_API_KEY
 * - COLECTIVA_WEBHOOK_SECRET
 */

// Lazy load env vars to avoid build errors when not configured
let _envVars: { apiUrl: string; apiKey: string } | null = null;

async function getEnvVars() {
	if (_envVars) return _envVars;
	try {
		const { env } = await import('$env/dynamic/private');
		_envVars = {
			apiUrl: env.COLECTIVA_API_URL ?? '',
			apiKey: env.COLECTIVA_API_KEY ?? ''
		};
	} catch {
		_envVars = { apiUrl: '', apiKey: '' };
	}
	return _envVars;
}

export interface EscrowCreateInput {
	bookingId: string;
	amountCents: number;
	clientId: string;
	therapistId: string;
	description: string;
}

export interface EscrowResult {
	success: boolean;
	escrowId?: string;
	paymentUrl?: string;
	error?: string;
}

export interface RefundResult {
	success: boolean;
	refundId?: string;
	amountRefundedCents?: number;
	error?: string;
}

export interface WalletResult {
	success: boolean;
	walletId?: string;
	error?: string;
}

// Commission rates by subscription tier
const COMMISSION_RATES: Record<string, number> = {
	free: 0.10,      // 10%
	pro: 0.05,       // 5%
	business: 0.03,  // 3%
	enterprise: 0    // 0%
};

// Cancellation refund policies (hours before appointment)
const REFUND_POLICIES = [
	{ hoursBeforeMin: 48, refundPercent: 100 },  // 48+ hours: full refund
	{ hoursBeforeMin: 24, refundPercent: 50 },   // 24-48 hours: 50% refund
	{ hoursBeforeMin: 0, refundPercent: 0 }      // < 24 hours: no refund
];

/**
 * Calculate commission based on therapist's subscription tier
 */
export function calculateCommission(amountCents: number, subscriptionTier: string): number {
	const rate = COMMISSION_RATES[subscriptionTier] ?? COMMISSION_RATES.free;
	return Math.round(amountCents * rate);
}

/**
 * Calculate refund amount based on cancellation timing
 */
export function calculateRefundAmount(amountCents: number, scheduledAt: Date): number {
	const now = new Date();
	const hoursUntilAppointment = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

	for (const policy of REFUND_POLICIES) {
		if (hoursUntilAppointment >= policy.hoursBeforeMin) {
			return Math.round(amountCents * (policy.refundPercent / 100));
		}
	}

	return 0;
}

/**
 * Create an escrow for a booking
 * Called when a client confirms a booking
 */
export async function createEscrow(input: EscrowCreateInput): Promise<EscrowResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockCreateEscrow(input);
	}

	try {
		const response = await fetch(`${apiUrl}/escrows`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				external_id: input.bookingId,
				amount_cents: input.amountCents,
				currency: 'MXN',
				payer_id: input.clientId,
				payee_id: input.therapistId,
				description: input.description,
				metadata: {
					booking_id: input.bookingId,
					platform: 'plenura'
				}
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error creating escrow' };
		}

		const data = await response.json();
		return {
			success: true,
			escrowId: data.id,
			paymentUrl: data.payment_url
		};
	} catch (error) {
		console.error('Error creating escrow:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

/**
 * Release escrow funds to therapist
 * Called when a service is marked as completed
 */
export async function releaseEscrow(
	escrowId: string,
	commissionCents: number
): Promise<EscrowResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockReleaseEscrow(escrowId);
	}

	try {
		const response = await fetch(`${apiUrl}/escrows/${escrowId}/release`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				platform_fee_cents: commissionCents
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error releasing escrow' };
		}

		const data = await response.json();
		return {
			success: true,
			escrowId: data.id
		};
	} catch (error) {
		console.error('Error releasing escrow:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

export interface SplitRecipient {
	walletId: string;
	amountCents: number;
}

/**
 * Release escrow funds to a specific wallet (e.g., practice wallet)
 * Used when the practice handles all payouts internally
 */
export async function releaseEscrowToWallet(
	escrowId: string,
	targetWalletId: string,
	commissionCents: number
): Promise<EscrowResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockReleaseEscrow(escrowId);
	}

	try {
		const response = await fetch(`${apiUrl}/escrows/${escrowId}/release`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				target_wallet_id: targetWalletId,
				platform_fee_cents: commissionCents
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error releasing escrow to wallet' };
		}

		const data = await response.json();
		return {
			success: true,
			escrowId: data.id
		};
	} catch (error) {
		console.error('Error releasing escrow to wallet:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

/**
 * Release escrow with split payment to multiple recipients
 * Used for practice/therapist splits where both parties receive funds
 */
export async function releaseEscrowSplit(
	escrowId: string,
	recipients: SplitRecipient[],
	commissionCents: number
): Promise<EscrowResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockReleaseEscrow(escrowId);
	}

	try {
		const response = await fetch(`${apiUrl}/escrows/${escrowId}/release-split`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				recipients: recipients.map((r) => ({
					wallet_id: r.walletId,
					amount_cents: r.amountCents
				})),
				platform_fee_cents: commissionCents
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error releasing split escrow' };
		}

		const data = await response.json();
		return {
			success: true,
			escrowId: data.id
		};
	} catch (error) {
		console.error('Error releasing split escrow:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

/**
 * Refund escrow to client
 * Called when a booking is cancelled
 */
export async function refundEscrow(
	escrowId: string,
	refundAmountCents: number
): Promise<RefundResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockRefundEscrow(escrowId, refundAmountCents);
	}

	try {
		const response = await fetch(`${apiUrl}/escrows/${escrowId}/refund`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				amount_cents: refundAmountCents
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error processing refund' };
		}

		const data = await response.json();
		return {
			success: true,
			refundId: data.refund_id,
			amountRefundedCents: data.amount_cents
		};
	} catch (error) {
		console.error('Error refunding escrow:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

/**
 * Create a wallet for a new therapist
 * Called during therapist onboarding/verification
 */
export async function createTherapistWallet(
	therapistId: string,
	email: string,
	fullName: string
): Promise<WalletResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockCreateWallet(therapistId);
	}

	try {
		const response = await fetch(`${apiUrl}/wallets`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				external_id: therapistId,
				email,
				name: fullName,
				type: 'therapist',
				metadata: {
					platform: 'plenura'
				}
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error creating wallet' };
		}

		const data = await response.json();
		return {
			success: true,
			walletId: data.id
		};
	} catch (error) {
		console.error('Error creating wallet:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

/**
 * Get wallet balance for a therapist
 */
export async function getWalletBalance(walletId: string): Promise<{ balanceCents: number } | null> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		return { balanceCents: 0 };
	}

	try {
		const response = await fetch(`${apiUrl}/wallets/${walletId}`, {
			headers: {
				'Authorization': `Bearer ${apiKey}`
			}
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return { balanceCents: data.balance_cents ?? 0 };
	} catch {
		return null;
	}
}

export interface WalletCreditResult {
	success: boolean;
	transactionId?: string;
	error?: string;
}

/**
 * Credit funds to a user's wallet
 * Used for referral rewards, promotional credits, etc.
 */
export async function creditWallet(
	userId: string,
	amountCents: number,
	reason: string,
	metadata?: Record<string, unknown>
): Promise<WalletCreditResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockCreditWallet(userId, amountCents);
	}

	try {
		// First, find or create wallet for user
		const response = await fetch(`${apiUrl}/wallets/credit`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				user_id: userId,
				amount_cents: amountCents,
				currency: 'MXN',
				reason,
				metadata: {
					...metadata,
					platform: 'plenura'
				}
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error crediting wallet' };
		}

		const data = await response.json();
		return {
			success: true,
			transactionId: data.transaction_id
		};
	} catch (error) {
		console.error('Error crediting wallet:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

/**
 * Get or create a wallet for a user (client or therapist)
 * Clients can have wallets for referral credits and promotional balances
 */
export async function getOrCreateUserWallet(
	userId: string,
	email: string,
	fullName: string,
	userType: 'client' | 'therapist' = 'client'
): Promise<WalletResult> {
	const { apiUrl, apiKey } = await getEnvVars();

	if (!apiUrl || !apiKey) {
		console.warn('Colectiva API not configured, using mock mode');
		return mockCreateWallet(`${userType}_${userId}`);
	}

	try {
		const response = await fetch(`${apiUrl}/wallets/get-or-create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				external_id: userId,
				email,
				name: fullName,
				type: userType,
				metadata: {
					platform: 'plenura'
				}
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.message ?? 'Error getting/creating wallet' };
		}

		const data = await response.json();
		return {
			success: true,
			walletId: data.id
		};
	} catch (error) {
		console.error('Error getting/creating wallet:', error);
		return { success: false, error: 'Error connecting to payment provider' };
	}
}

// Mock functions for development without Colectiva credentials
function mockCreateEscrow(input: EscrowCreateInput): EscrowResult {
	return {
		success: true,
		escrowId: `mock_escrow_${input.bookingId}`,
		paymentUrl: `/booking/${input.bookingId}/pay-mock`
	};
}

function mockReleaseEscrow(escrowId: string): EscrowResult {
	return {
		success: true,
		escrowId
	};
}

function mockRefundEscrow(escrowId: string, amountCents: number): RefundResult {
	return {
		success: true,
		refundId: `mock_refund_${Date.now()}`,
		amountRefundedCents: amountCents
	};
}

function mockCreateWallet(therapistId: string): WalletResult {
	return {
		success: true,
		walletId: `mock_wallet_${therapistId}`
	};
}

function mockCreditWallet(userId: string, amountCents: number): WalletCreditResult {
	console.log(`[MOCK] Credited ${amountCents} cents to user ${userId}`);
	return {
		success: true,
		transactionId: `mock_credit_${Date.now()}`
	};
}
