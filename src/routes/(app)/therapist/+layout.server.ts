import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { createServiceRoleClient } from '$lib/supabase/server';

interface PracticeMembership {
	id: string;
	role: string;
	practice_id: string;
	practices: {
		id: string;
		name: string;
		slug: string | null;
	};
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { user, userProfile, therapistProfile, supabase } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Check if user is a therapist
	if (userProfile?.role !== 'therapist') {
		throw error(403, 'Solo los terapeutas pueden acceder a esta sección');
	}

	// Check for pending practice creation
	const supabaseAdmin = createServiceRoleClient();
	const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user.id);
	const pendingPractice = authData?.user?.user_metadata?.pending_practice;
	const registrationType = authData?.user?.user_metadata?.registration_type;

	// If user registered as practice and hasn't created it yet, redirect to setup
	if (pendingPractice && registrationType === 'practice' && !url.pathname.includes('/practice-setup')) {
		throw redirect(303, '/therapist/practice-setup');
	}

	// Check if user has a practice membership
	const { data: practiceMembershipData } = await supabase
		.from('practice_members')
		.select(`
			id,
			role,
			practice_id,
			practices (
				id,
				name,
				slug
			)
		`)
		.eq('user_id', user.id)
		.eq('status', 'active')
		.single();

	const practiceMembership = practiceMembershipData as unknown as PracticeMembership | null;

	// If no therapist profile exists, create one
	let currentTherapistProfile = therapistProfile;
	if (!therapistProfile) {
		const isIndependent = !practiceMembership;

		const { data: newProfile, error: createError } = await supabase
			.from('therapists')
			.insert({
				user_id: user.id,
				vetting_status: 'pending',
				is_available: false,
				is_independent: isIndependent,
				primary_practice_id: practiceMembership?.practice_id || null
			} as any)
			.select()
			.single();

		if (createError) {
			console.error('Error creating therapist profile:', createError);
			throw error(500, 'Error al crear el perfil de terapeuta');
		}

		currentTherapistProfile = newProfile;

		// If part of a practice, update practice_members with therapist_id
		if (practiceMembership) {
			await (supabase as any)
				.from('practice_members')
				.update({ therapist_id: newProfile.id })
				.eq('id', practiceMembership.id);
		}
	}

	return {
		therapistProfile: currentTherapistProfile,
		user,
		userProfile,
		practiceMembership: practiceMembership ? {
			id: practiceMembership.id,
			role: practiceMembership.role,
			practice: practiceMembership.practices
		} : null
	};
};
