import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getTherapistById } from '$lib/services/therapist.service';
import { toggleFavorite } from '$lib/services/favorites.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase } = locals;

	const therapist = await getTherapistById(supabase, params.id);

	if (!therapist) {
		throw error(404, 'Terapeuta no encontrado');
	}

	// Fetch reviews for this therapist
	const { data: reviews } = await supabase
		.from('reviews')
		.select(`
			*,
			users:client_id (
				full_name,
				avatar_url
			)
		`)
		.eq('therapist_id', params.id)
		.eq('is_public', true)
		.order('created_at', { ascending: false })
		.limit(10);

	// Fetch availability
	const { data: availability } = await supabase
		.from('availability')
		.select('*')
		.eq('therapist_id', params.id)
		.order('day_of_week', { ascending: true });

	// Check if user has favorited this therapist
	let isFavorite = false;
	if (locals.user) {
		const { data: favorite } = await supabase
			.from('favorites')
			.select('id')
			.eq('user_id', locals.user.id)
			.eq('therapist_id', params.id)
			.single();

		isFavorite = !!favorite;
	}

	return {
		therapist,
		reviews: reviews ?? [],
		availability: availability ?? [],
		isFavorite
	};
};

export const actions: Actions = {
	toggleFavorite: async ({ locals, params }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			throw redirect(303, '/login');
		}

		const result = await toggleFavorite(locals.supabase, user.id, params.id);

		return result;
	}
};
