import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Allow access if either Supabase session OR developer session exists
	if (!locals.session && !locals.developerSession) {
		throw redirect(303, '/login?redirect=' + encodeURIComponent(url.pathname));
	}

	return {
		session: locals.session,
		user: locals.user,
		userProfile: locals.userProfile,
		therapistProfile: locals.therapistProfile,
		developerSession: locals.developerSession
	};
};
