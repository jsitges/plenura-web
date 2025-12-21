// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = async ({ locals, url }: Parameters<LayoutServerLoad>[0]) => {
	if (!locals.session) {
		throw redirect(303, '/login?redirect=' + encodeURIComponent(url.pathname));
	}

	return {
		session: locals.session,
		user: locals.user,
		userProfile: locals.userProfile,
		therapistProfile: locals.therapistProfile
	};
};
