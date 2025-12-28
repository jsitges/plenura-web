/**
 * Client-safe referral functions
 * These can be imported in browser/client-side code
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

/**
 * Validate a referral code
 * Returns validation result with code ID and referrer ID if valid
 */
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
