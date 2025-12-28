import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '$lib/types/database.types';

const REFERRAL_REWARD_CENTS = 10000; // $100 MXN

export interface ReferralStats {
	code: string;
	totalReferrals: number;
	pendingReferrals: number;
	completedReferrals: number;
	totalEarnings: number;
}

export async function getUserReferralCode(
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<Tables<'referral_codes'> | null> {
	const { data, error } = await supabase
		.from('referral_codes')
		.select('*')
		.eq('user_id', userId)
		.eq('is_active', true)
		.single();

	if (error) {
		return null;
	}

	return data as Tables<'referral_codes'>;
}

export async function createReferralCode(
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<Tables<'referral_codes'> | null> {
	// Generate a unique code
	const code = generateReferralCode();

	const { data, error } = await supabase
		.from('referral_codes')
		.insert({
			user_id: userId,
			code,
			reward_amount_cents: REFERRAL_REWARD_CENTS,
			is_active: true
		})
		.select()
		.single();

	if (error) {
		console.error('Error creating referral code:', error);
		return null;
	}

	return data as Tables<'referral_codes'>;
}

export async function getOrCreateReferralCode(
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<Tables<'referral_codes'> | null> {
	const existing = await getUserReferralCode(supabase, userId);
	if (existing) {
		return existing;
	}
	return createReferralCode(supabase, userId);
}

export async function getReferralStats(
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<ReferralStats | null> {
	const referralCode = await getUserReferralCode(supabase, userId);
	if (!referralCode) {
		return null;
	}

	// Get all referrals for this code
	const { data: referrals } = await supabase
		.from('referrals')
		.select('*')
		.eq('referral_code_id', referralCode.id);

	const allReferrals = (referrals ?? []) as Array<{
		status: string;
		reward_paid_cents: number;
	}>;

	const pendingReferrals = allReferrals.filter((r) => r.status === 'pending').length;
	const completedReferrals = allReferrals.filter((r) => r.status === 'completed').length;
	const totalEarnings = allReferrals
		.filter((r) => r.status === 'completed')
		.reduce((sum, r) => sum + (r.reward_paid_cents || 0), 0);

	return {
		code: referralCode.code,
		totalReferrals: allReferrals.length,
		pendingReferrals,
		completedReferrals,
		totalEarnings
	};
}

export async function validateReferralCode(
	supabase: SupabaseClient<Database>,
	code: string
): Promise<{ valid: boolean; codeId?: string; referrerId?: string }> {
	const { data, error } = await supabase
		.from('referral_codes')
		.select('id, user_id, is_active, uses_count, max_uses')
		.eq('code', code.toUpperCase())
		.single();

	if (error || !data) {
		return { valid: false };
	}

	const codeData = data as {
		id: string;
		user_id: string;
		is_active: boolean;
		uses_count: number;
		max_uses: number | null;
	};

	// Check if code is active and not maxed out
	if (!codeData.is_active) {
		return { valid: false };
	}

	if (codeData.max_uses !== null && codeData.uses_count >= codeData.max_uses) {
		return { valid: false };
	}

	return {
		valid: true,
		codeId: codeData.id,
		referrerId: codeData.user_id
	};
}

export async function trackReferral(
	supabase: SupabaseClient<Database>,
	referralCodeId: string,
	referredUserId: string
): Promise<boolean> {
	// Create referral record
	const { error: insertError } = await supabase.from('referrals').insert({
		referral_code_id: referralCodeId,
		referred_user_id: referredUserId,
		status: 'pending'
	});

	if (insertError) {
		console.error('Error creating referral:', insertError);
		return false;
	}

	// Increment uses count
	const { error: updateError } = await supabase.rpc('increment_referral_uses', {
		code_id: referralCodeId
	});

	if (updateError) {
		console.error('Error incrementing referral uses:', updateError);
		// Don't fail the whole operation for this
	}

	return true;
}

export async function completeReferral(
	supabase: SupabaseClient<Database>,
	referredUserId: string
): Promise<boolean> {
	// Find the pending referral for this user
	const { data: referral } = await supabase
		.from('referrals')
		.select('id, referral_code_id')
		.eq('referred_user_id', referredUserId)
		.eq('status', 'pending')
		.single();

	if (!referral) {
		return false;
	}

	const typedReferral = referral as { id: string; referral_code_id: string };

	// Get reward amount from code and referrer details
	const { data: code } = await supabase
		.from('referral_codes')
		.select('user_id, reward_amount_cents')
		.eq('id', typedReferral.referral_code_id)
		.single();

	if (!code) {
		return false;
	}

	const typedCode = code as { user_id: string; reward_amount_cents: number };

	// Credit the referrer's wallet with reward amount
	// Use dynamic import since this function is only called server-side
	// and the payment service has server-only imports
	try {
		const { creditWallet } = await import('./payment.service');
		const creditResult = await creditWallet(
			typedCode.user_id,
			typedCode.reward_amount_cents,
			'Referral reward',
			{
				referral_id: typedReferral.id,
				referred_user_id: referredUserId,
				type: 'referral_bonus'
			}
		);

		if (!creditResult.success) {
			console.error('Failed to credit referral reward:', creditResult.error);
			// Continue with marking as completed but log the failure
			// The reward can be manually credited later if needed
		}
	} catch (err) {
		console.error('Error importing payment service:', err);
	}

	// Mark referral as completed
	const { error } = await supabase
		.from('referrals')
		.update({
			status: 'completed',
			reward_paid_cents: typedCode.reward_amount_cents,
			completed_at: new Date().toISOString()
		})
		.eq('id', typedReferral.id);

	if (error) {
		console.error('Error completing referral:', error);
		return false;
	}

	return true;
}

function generateReferralCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}
