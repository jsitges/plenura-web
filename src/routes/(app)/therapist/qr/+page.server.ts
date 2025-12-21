import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_APP_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.therapistProfile) {
		throw redirect(302, '/dashboard');
	}

	const profileUrl = `${PUBLIC_APP_URL}/therapists/${locals.therapistProfile.id}`;

	return {
		profileUrl,
		therapistName: locals.userProfile?.full_name ?? 'Terapeuta',
		therapistId: locals.therapistProfile.id
	};
};
