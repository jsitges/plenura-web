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

	// Fetch earnings summary, recent earnings, and payout history
	const [summary, recentEarnings, payoutsResult] = await Promise.all([
		getEarningsSummary(supabase, t.id),
		getBookingEarnings(supabase, t.id, 10),
		(supabase as any)
			.from('payouts')
			.select('*')
			.eq('therapist_id', t.id)
			.order('processed_at', { ascending: false })
			.limit(10)
	]);

	// Map payouts to a cleaner format
	const payouts = (payoutsResult.data ?? []).map((p: any) => ({
		id: p.id,
		amountCents: p.amount_cents,
		status: p.status,
		payoutMethod: p.payout_method,
		bankAccountLastFour: p.bank_account_last_four,
		processedAt: p.processed_at,
		notes: p.notes
	}));

	// Calculate total payouts
	const totalPayoutsCents = payouts
		.filter((p: any) => p.status === 'completed')
		.reduce((sum: number, p: any) => sum + p.amountCents, 0);

	return {
		summary,
		recentEarnings,
		payouts,
		totalPayoutsCents,
		subscriptionTier: t.subscription_tier,
		hasWallet: !!t.colectiva_wallet_id
	};
};
