/**
 * Favorites Service
 *
 * Manages user's favorite therapists list
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface FavoriteTherapist {
	id: string;
	therapist_id: string;
	created_at: string;
	therapist: {
		id: string;
		bio: string | null;
		rating_avg: number;
		total_reviews: number;
		users: {
			full_name: string | null;
			avatar_url: string | null;
		} | null;
		therapist_services: Array<{
			price_cents: number;
			services: {
				name: string;
			} | null;
		}>;
	} | null;
}

/**
 * Check if a therapist is in user's favorites
 */
export async function isFavorite(
	supabase: SupabaseClient,
	userId: string,
	therapistId: string
): Promise<boolean> {
	const { data } = await supabase
		.from('favorites')
		.select('id')
		.eq('user_id', userId)
		.eq('therapist_id', therapistId)
		.maybeSingle();

	return !!data;
}

/**
 * Add a therapist to favorites
 */
export async function addFavorite(
	supabase: SupabaseClient,
	userId: string,
	therapistId: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await supabase.from('favorites').insert({
		user_id: userId,
		therapist_id: therapistId
	});

	if (error) {
		if (error.code === '23505') {
			// Already exists
			return { success: true };
		}
		return { success: false, error: error.message };
	}

	return { success: true };
}

/**
 * Remove a therapist from favorites
 */
export async function removeFavorite(
	supabase: SupabaseClient,
	userId: string,
	therapistId: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await supabase
		.from('favorites')
		.delete()
		.eq('user_id', userId)
		.eq('therapist_id', therapistId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
	supabase: SupabaseClient,
	userId: string,
	therapistId: string
): Promise<{ isFavorite: boolean; error?: string }> {
	const currentlyFavorite = await isFavorite(supabase, userId, therapistId);

	if (currentlyFavorite) {
		const result = await removeFavorite(supabase, userId, therapistId);
		return { isFavorite: false, error: result.error };
	} else {
		const result = await addFavorite(supabase, userId, therapistId);
		return { isFavorite: true, error: result.error };
	}
}

/**
 * Get all favorites for a user
 */
export async function getFavorites(
	supabase: SupabaseClient,
	userId: string
): Promise<FavoriteTherapist[]> {
	const { data } = await supabase
		.from('favorites')
		.select(
			`
			id,
			therapist_id,
			created_at,
			therapist:therapists!inner(
				id,
				bio,
				rating_avg,
				total_reviews,
				users!inner(
					full_name,
					avatar_url
				),
				therapist_services(
					price_cents,
					services(name)
				)
			)
		`
		)
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	return (data ?? []) as unknown as FavoriteTherapist[];
}

/**
 * Get favorite count for a user
 */
export async function getFavoriteCount(
	supabase: SupabaseClient,
	userId: string
): Promise<number> {
	const { count } = await supabase
		.from('favorites')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId);

	return count ?? 0;
}
