// @ts-nocheck
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getOrCreateReferralCode, getReferralStats } from '$lib/services/referral.service';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Get or create referral code for this user
	const referralCode = await getOrCreateReferralCode(supabase, user.id);

	// Get referral stats
	const stats = await getReferralStats(supabase, user.id);

	// Get list of referred users with their status
	let referrals: Array<{
		id: string;
		status: string;
		reward_paid_cents: number | null;
		created_at: string;
		referred_user: {
			full_name: string;
		} | null;
	}> = [];

	if (referralCode) {
		const { data } = await supabase
			.from('referrals')
			.select(`
				id,
				status,
				reward_paid_cents,
				created_at,
				users!referred_user_id (
					full_name
				)
			`)
			.eq('referral_code_id', referralCode.id)
			.order('created_at', { ascending: false })
			.limit(20);

		if (data) {
			referrals = (data as unknown as typeof referrals) ?? [];
		}
	}

	return {
		referralCode,
		stats,
		referrals
	};
};
