import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createServiceRoleClient } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, userProfile } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	if (userProfile?.role !== 'therapist') {
		throw error(403, 'Solo los terapeutas pueden acceder a esta sección');
	}

	// Get pending practice data from user metadata
	const supabaseAdmin = createServiceRoleClient();
	const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user.id);
	const pendingPractice = authData?.user?.user_metadata?.pending_practice;
	const registrationType = authData?.user?.user_metadata?.registration_type;

	// If no pending practice or not practice registration, redirect to dashboard
	if (!pendingPractice || registrationType !== 'practice') {
		throw redirect(303, '/therapist');
	}

	return {
		pendingPractice: {
			name: pendingPractice.name as string,
			type: pendingPractice.type as string,
			taxId: pendingPractice.tax_id as string | null
		},
		user,
		userProfile
	};
};
