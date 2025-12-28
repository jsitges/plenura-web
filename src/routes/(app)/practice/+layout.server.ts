import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw redirect(303, '/login');
	}

	// Check if user is a practice owner or admin
	const { data: membership, error: membershipError } = await supabase
		.from('practice_members')
		.select(`
			id,
			role,
			practice_id,
			practices (
				id,
				name,
				slug,
				logo_url,
				verification_status,
				subscription_tier
			)
		`)
		.eq('user_id', session.user.id)
		.in('role', ['owner', 'admin', 'manager'])
		.single();

	if (membershipError || !membership) {
		// No practice membership, redirect to therapist dashboard
		throw redirect(303, '/therapist');
	}

	return {
		membership: membership as {
			id: string;
			role: string;
			practice_id: string;
			practices: {
				id: string;
				name: string;
				slug: string | null;
				logo_url: string | null;
				verification_status: string;
				subscription_tier: string;
			};
		}
	};
};
