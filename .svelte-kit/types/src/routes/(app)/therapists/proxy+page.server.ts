// @ts-nocheck
import type { PageServerLoad } from './$types';
import { getCategories, getServicesByCategory, searchTherapists } from '$lib/services/therapist.service';

export const load = async ({ locals, url }: Parameters<PageServerLoad>[0]) => {
	const { supabase } = locals;

	// Get filter params from URL
	const categoryId = url.searchParams.get('category') ?? undefined;
	const serviceId = url.searchParams.get('service') ?? undefined;
	const minPrice = url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined;
	const maxPrice = url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined;
	const minRating = url.searchParams.get('rating') ? Number(url.searchParams.get('rating')) : undefined;
	const query = url.searchParams.get('q') ?? undefined;

	// Fetch data in parallel
	const [categories, services, therapists] = await Promise.all([
		getCategories(supabase),
		getServicesByCategory(supabase, categoryId),
		searchTherapists(supabase, {
			categoryId,
			serviceId,
			minPrice,
			maxPrice,
			minRating,
			query
		})
	]);

	return {
		categories,
		services,
		therapists,
		filters: {
			categoryId,
			serviceId,
			minPrice,
			maxPrice,
			minRating,
			query
		}
	};
};
