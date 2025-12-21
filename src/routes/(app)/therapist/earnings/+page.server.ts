import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEarningsSummary, getBookingEarnings } from '$lib/services/earnings.service';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Get therapist ID
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id, subscription_tier, colectiva_wallet_id')
		.eq('user_id', user.id)
		.single();

	if (!therapist) {
		throw redirect(303, '/dashboard');
	}

	const t = therapist as {
		id: string;
		subscription_tier: string;
		colectiva_wallet_id: string | null;
	};

	const [summary, recentEarnings] = await Promise.all([
		getEarningsSummary(supabase, t.id),
		getBookingEarnings(supabase, t.id, 10)
	]);

	return {
		summary,
		recentEarnings,
		subscriptionTier: t.subscription_tier,
		hasWallet: !!t.colectiva_wallet_id
	};
};
