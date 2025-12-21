// @ts-nocheck
import type { LayoutServerLoad } from './$types';

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
	return {
		session: locals.session,
		user: locals.user,
		userProfile: locals.userProfile
	};
};
