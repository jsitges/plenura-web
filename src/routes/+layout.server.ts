import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	// Allow this load function to be invalidated when auth state changes
	depends('supabase:auth');

	return {
		session: locals.session,
		user: locals.user,
		userProfile: locals.userProfile,
		developerSession: locals.developerSession
	};
};
