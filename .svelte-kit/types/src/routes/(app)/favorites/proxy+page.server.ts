// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getFavorites, removeFavorite } from '$lib/services/favorites.service';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	const favorites = await getFavorites(locals.supabase, user.id);

	return {
		favorites
	};
};

export const actions = {
	remove: async ({ request, locals }: import('./$types').RequestEvent) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const therapistId = formData.get('therapist_id') as string;

		if (!therapistId) {
			return { success: false, error: 'Terapeuta no especificado' };
		}

		const result = await removeFavorite(locals.supabase, user.id, therapistId);

		return result;
	}
};
;null as any as Actions;