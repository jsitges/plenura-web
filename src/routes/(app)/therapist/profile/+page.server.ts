import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import type { Tables } from '$lib/types/database.types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user, userProfile, therapistProfile } = locals;

	return {
		userProfile: userProfile as Tables<'users'> | null,
		therapistProfile: therapistProfile as Tables<'therapists'> | null
	};
};

export const actions: Actions = {
	updateUser: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();

		const fullName = formData.get('full_name') as string;
		const phone = formData.get('phone') as string;

		if (!fullName?.trim()) {
			return fail(400, { error: 'El nombre es requerido' });
		}

		const { error } = await supabase
			.from('users')
			.update({
				full_name: fullName.trim(),
				phone: phone?.trim() || null
			})
			.eq('id', user!.id);

		if (error) {
			console.error('Error updating user:', error);
			return fail(500, { error: 'Error al actualizar el perfil' });
		}

		return { success: true, message: 'Datos personales actualizados' };
	},

	updateTherapist: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();

		const bio = formData.get('bio') as string;
		const yearsOfExperience = parseInt(formData.get('years_of_experience') as string, 10);
		const serviceRadiusKm = parseInt(formData.get('service_radius_km') as string, 10);

		// Get therapist ID
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const updateData: Record<string, unknown> = {
			bio: bio?.trim() || null
		};

		if (!isNaN(yearsOfExperience) && yearsOfExperience >= 0) {
			updateData.years_of_experience = yearsOfExperience;
		}

		if (!isNaN(serviceRadiusKm) && serviceRadiusKm > 0) {
			updateData.service_radius_km = serviceRadiusKm;
		}

		const { error } = await supabase
			.from('therapists')
			.update(updateData)
			.eq('id', (therapist as { id: string }).id);

		if (error) {
			console.error('Error updating therapist:', error);
			return fail(500, { error: 'Error al actualizar el perfil profesional' });
		}

		return { success: true, message: 'Perfil profesional actualizado' };
	},

	updateCertifications: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();

		const certifications = formData.get('certifications') as string;

		// Get therapist ID
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		// Parse certifications as JSON array
		let certificationDetails = null;
		if (certifications?.trim()) {
			try {
				// Support both JSON array and comma-separated string
				if (certifications.startsWith('[')) {
					certificationDetails = JSON.parse(certifications);
				} else {
					certificationDetails = certifications.split(',').map((c) => c.trim()).filter(Boolean);
				}
			} catch {
				certificationDetails = certifications.split(',').map((c) => c.trim()).filter(Boolean);
			}
		}

		const { error } = await supabase
			.from('therapists')
			.update({ certification_details: certificationDetails })
			.eq('id', (therapist as { id: string }).id);

		if (error) {
			console.error('Error updating certifications:', error);
			return fail(500, { error: 'Error al actualizar las certificaciones' });
		}

		return { success: true, message: 'Certificaciones actualizadas' };
	}
};
