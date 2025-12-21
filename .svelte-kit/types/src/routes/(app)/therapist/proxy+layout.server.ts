// @ts-nocheck
import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
	const { user, userProfile, therapistProfile, supabase } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Check if user is a therapist
	if (userProfile?.role !== 'therapist') {
		throw error(403, 'Solo los terapeutas pueden acceder a esta sección');
	}

	// If no therapist profile exists, create one
	if (!therapistProfile) {
		const { data: newProfile, error: createError } = await supabase
			.from('therapists')
			.insert({
				user_id: user.id,
				vetting_status: 'pending',
				is_available: false
			})
			.select()
			.single();

		if (createError) {
			console.error('Error creating therapist profile:', createError);
			throw error(500, 'Error al crear el perfil de terapeuta');
		}

		return {
			therapistProfile: newProfile,
			user,
			userProfile
		};
	}

	return {
		therapistProfile,
		user,
		userProfile
	};
};
