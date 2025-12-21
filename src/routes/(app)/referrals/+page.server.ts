import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getOrCreateReferralCode, getReferralStats } from '$lib/services/referral.service';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Get or create referral code for this user
	const referralCode = await getOrCreateReferralCode(supabase, user.id);
	const stats = await getReferralStats(supabase, user.id);

	// Get recent referrals
	const { data: recentReferrals } = await supabase
		.from('referrals')
		.select(`
			id,
			status,
			created_at,
			converted_at,
			reward_paid_cents,
			users:referred_user_id (full_name)
		`)
		.eq('referrer_code_id', referralCode?.id ?? '')
		.order('created_at', { ascending: false })
		.limit(10);

	return {
		referralCode,
		stats,
		recentReferrals: recentReferrals ?? []
	};
};
