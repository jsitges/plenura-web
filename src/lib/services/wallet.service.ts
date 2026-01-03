/**
 * Client Wallet Service
 *
 * Manages client wallets for:
 * - Referral credits
 * - Promotional balances
 * - Pre-paid session credits
 *
 * Integrates with Colectiva via payment.service.ts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
	getOrCreateUserWallet,
	getWalletBalance,
	creditWallet
} from './payment.service';

export interface ClientWallet {
	id: string;
	userId: string;
	colectivaWalletId: string | null;
	balanceCents: number;
	referralCreditsCents: number;
	promotionalCreditsCents: number;
	lastSyncedAt: string | null;
	createdAt: string;
}

export interface WalletTransaction {
	id: string;
	walletId: string;
	type: 'deposit' | 'payment' | 'referral_credit' | 'promo_credit' | 'refund';
	amountCents: number;
	description: string;
	status: 'pending' | 'completed' | 'failed';
	colectivaTransactionId: string | null;
	createdAt: string;
}

export interface DepositResult {
	success: boolean;
	depositUrl?: string;
	transactionId?: string;
	error?: string;
}

/**
 * Get or create a client wallet
 */
export async function getOrCreateClientWallet(
	supabase: SupabaseClient,
	userId: string,
	email: string,
	fullName: string
): Promise<ClientWallet | null> {
	// Check if wallet exists in local DB
	const { data: existingWallet } = await supabase
		.from('client_wallets')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (existingWallet) {
		return mapWallet(existingWallet);
	}

	// Create Colectiva wallet
	const colectivaResult = await getOrCreateUserWallet(userId, email, fullName, 'client');

	if (!colectivaResult.success) {
		console.error('Failed to create Colectiva wallet:', colectivaResult.error);
		// Continue with local-only wallet
	}

	// Create local wallet record
	const { data: newWallet, error } = await supabase
		.from('client_wallets')
		.insert({
			user_id: userId,
			colectiva_wallet_id: colectivaResult.walletId ?? null,
			balance_cents: 0,
			referral_credits_cents: 0,
			promotional_credits_cents: 0
		})
		.select()
		.single();

	if (error) {
		console.error('Error creating local wallet:', error);
		return null;
	}

	return mapWallet(newWallet);
}

/**
 * Get client wallet with synced balance
 */
export async function getClientWallet(
	supabase: SupabaseClient,
	userId: string
): Promise<ClientWallet | null> {
	const { data: wallet } = await supabase
		.from('client_wallets')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (!wallet) {
		return null;
	}

	// Sync balance from Colectiva if we have a wallet ID
	if (wallet.colectiva_wallet_id) {
		const colectivaBalance = await getWalletBalance(wallet.colectiva_wallet_id);
		if (colectivaBalance) {
			// Update local cache
			await supabase
				.from('client_wallets')
				.update({
					balance_cents: colectivaBalance.balanceCents,
					last_synced_at: new Date().toISOString()
				})
				.eq('id', wallet.id);

			wallet.balance_cents = colectivaBalance.balanceCents;
			wallet.last_synced_at = new Date().toISOString();
		}
	}

	return mapWallet(wallet);
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(
	supabase: SupabaseClient,
	walletId: string,
	limit = 20
): Promise<WalletTransaction[]> {
	const { data: transactions } = await supabase
		.from('wallet_transactions')
		.select('*')
		.eq('wallet_id', walletId)
		.order('created_at', { ascending: false })
		.limit(limit);

	return (transactions ?? []).map(mapTransaction);
}

/**
 * Initiate a deposit to the client wallet
 */
export async function initiateDeposit(
	supabase: SupabaseClient,
	userId: string,
	walletId: string,
	amountCents: number
): Promise<DepositResult> {
	// Create pending transaction record
	const { data: transaction, error: txError } = await supabase
		.from('wallet_transactions')
		.insert({
			wallet_id: walletId,
			type: 'deposit',
			amount_cents: amountCents,
			description: `Depósito de ${formatCurrency(amountCents)}`,
			status: 'pending'
		})
		.select()
		.single();

	if (txError) {
		return { success: false, error: 'Error creating transaction record' };
	}

	// Credit via Colectiva (this would typically redirect to a payment page)
	const creditResult = await creditWallet(
		userId,
		amountCents,
		'wallet_deposit',
		{ transactionId: transaction.id }
	);

	if (!creditResult.success) {
		// Mark transaction as failed
		await supabase
			.from('wallet_transactions')
			.update({ status: 'failed' })
			.eq('id', transaction.id);

		return { success: false, error: creditResult.error };
	}

	// In production, Colectiva would redirect to a payment page
	// For now, we'll simulate success
	await supabase
		.from('wallet_transactions')
		.update({
			status: 'completed',
			colectiva_transaction_id: creditResult.transactionId
		})
		.eq('id', transaction.id);

	// Update wallet balance
	const { data: wallet } = await supabase
		.from('client_wallets')
		.select('balance_cents')
		.eq('id', walletId)
		.single();

	if (wallet) {
		await supabase
			.from('client_wallets')
			.update({
				balance_cents: wallet.balance_cents + amountCents,
				last_synced_at: new Date().toISOString()
			})
			.eq('id', walletId);
	}

	return {
		success: true,
		transactionId: transaction.id
	};
}

/**
 * Credit referral reward to wallet
 */
export async function creditReferralReward(
	supabase: SupabaseClient,
	walletId: string,
	userId: string,
	amountCents: number,
	referralId: string
): Promise<boolean> {
	// Create transaction record
	const { data: transaction, error: txError } = await supabase
		.from('wallet_transactions')
		.insert({
			wallet_id: walletId,
			type: 'referral_credit',
			amount_cents: amountCents,
			description: 'Recompensa por referido',
			status: 'pending',
			metadata: { referral_id: referralId }
		})
		.select()
		.single();

	if (txError) {
		console.error('Error creating referral transaction:', txError);
		return false;
	}

	// Credit to Colectiva
	const creditResult = await creditWallet(
		userId,
		amountCents,
		'referral_reward',
		{ referralId, transactionId: transaction.id }
	);

	if (!creditResult.success) {
		await supabase
			.from('wallet_transactions')
			.update({ status: 'failed' })
			.eq('id', transaction.id);
		return false;
	}

	// Update transaction and wallet
	await supabase
		.from('wallet_transactions')
		.update({
			status: 'completed',
			colectiva_transaction_id: creditResult.transactionId
		})
		.eq('id', transaction.id);

	// Update wallet balance
	const { data: wallet } = await supabase
		.from('client_wallets')
		.select('balance_cents, referral_credits_cents')
		.eq('id', walletId)
		.single();

	if (wallet) {
		await supabase
			.from('client_wallets')
			.update({
				balance_cents: wallet.balance_cents + amountCents,
				referral_credits_cents: wallet.referral_credits_cents + amountCents,
				last_synced_at: new Date().toISOString()
			})
			.eq('id', walletId);
	}

	return true;
}

/**
 * Use wallet balance for booking payment
 */
export async function useWalletForBooking(
	supabase: SupabaseClient,
	walletId: string,
	bookingId: string,
	amountCents: number
): Promise<{ success: boolean; remainingBalance: number; error?: string }> {
	// Get current balance
	const { data: wallet } = await supabase
		.from('client_wallets')
		.select('balance_cents')
		.eq('id', walletId)
		.single();

	if (!wallet) {
		return { success: false, remainingBalance: 0, error: 'Wallet not found' };
	}

	if (wallet.balance_cents < amountCents) {
		return {
			success: false,
			remainingBalance: wallet.balance_cents,
			error: 'Insufficient balance'
		};
	}

	// Create payment transaction
	const { error: txError } = await supabase
		.from('wallet_transactions')
		.insert({
			wallet_id: walletId,
			type: 'payment',
			amount_cents: -amountCents, // Negative for debit
			description: `Pago de reserva #${bookingId.slice(0, 8)}`,
			status: 'completed',
			metadata: { booking_id: bookingId }
		});

	if (txError) {
		return { success: false, remainingBalance: wallet.balance_cents, error: 'Transaction failed' };
	}

	// Update wallet balance
	const newBalance = wallet.balance_cents - amountCents;
	await supabase
		.from('client_wallets')
		.update({
			balance_cents: newBalance,
			last_synced_at: new Date().toISOString()
		})
		.eq('id', walletId);

	return { success: true, remainingBalance: newBalance };
}

// Helper functions
function mapWallet(data: Record<string, unknown>): ClientWallet {
	return {
		id: data.id as string,
		userId: data.user_id as string,
		colectivaWalletId: data.colectiva_wallet_id as string | null,
		balanceCents: data.balance_cents as number,
		referralCreditsCents: data.referral_credits_cents as number,
		promotionalCreditsCents: data.promotional_credits_cents as number,
		lastSyncedAt: data.last_synced_at as string | null,
		createdAt: data.created_at as string
	};
}

function mapTransaction(data: Record<string, unknown>): WalletTransaction {
	return {
		id: data.id as string,
		walletId: data.wallet_id as string,
		type: data.type as WalletTransaction['type'],
		amountCents: data.amount_cents as number,
		description: data.description as string,
		status: data.status as WalletTransaction['status'],
		colectivaTransactionId: data.colectiva_transaction_id as string | null,
		createdAt: data.created_at as string
	};
}

function formatCurrency(cents: number): string {
	return new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency: 'MXN'
	}).format(cents / 100);
}
