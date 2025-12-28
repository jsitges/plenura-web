import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase } = locals;

	// Get filter params
	const rating = url.searchParams.get('rating') ?? 'all';
	const visibility = url.searchParams.get('visibility') ?? 'all';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	// Build query
	let query = (supabase as any)
		.from('reviews')
		.select(`
			id,
			rating,
			comment,
			is_public,
			is_flagged,
			created_at,
			users:client_id (
				id,
				full_name,
				avatar_url
			),
			therapists!inner (
				id,
				users!inner (full_name)
			),
			bookings!inner (
				id,
				therapist_services!inner (
					services!inner (name_es)
				)
			)
		`, { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// Apply rating filter
	if (rating !== 'all') {
		query = query.eq('rating', parseInt(rating));
	}

	// Apply visibility filter
	if (visibility === 'public') {
		query = query.eq('is_public', true);
	} else if (visibility === 'private') {
		query = query.eq('is_public', false);
	} else if (visibility === 'flagged') {
		query = query.eq('is_flagged', true);
	}

	const { data: reviews, count, error } = await query;

	if (error) {
		console.error('Error fetching reviews:', error);
	}

	// Get stats
	const { data: allReviews } = await (supabase as any)
		.from('reviews')
		.select('rating, is_public, is_flagged');

	const stats = {
		total: allReviews?.length ?? 0,
		averageRating: allReviews?.length
			? (allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length).toFixed(1)
			: 0,
		publicCount: allReviews?.filter((r: any) => r.is_public).length ?? 0,
		flaggedCount: allReviews?.filter((r: any) => r.is_flagged).length ?? 0,
		ratingDistribution: {
			5: allReviews?.filter((r: any) => r.rating === 5).length ?? 0,
			4: allReviews?.filter((r: any) => r.rating === 4).length ?? 0,
			3: allReviews?.filter((r: any) => r.rating === 3).length ?? 0,
			2: allReviews?.filter((r: any) => r.rating === 2).length ?? 0,
			1: allReviews?.filter((r: any) => r.rating === 1).length ?? 0
		}
	};

	return {
		reviews: (reviews ?? []).map((r: any) => ({
			id: r.id,
			rating: r.rating,
			comment: r.comment,
			is_public: r.is_public,
			is_flagged: r.is_flagged,
			created_at: r.created_at,
			client: {
				id: r.users?.id,
				full_name: r.users?.full_name ?? 'Cliente',
				avatar_url: r.users?.avatar_url
			},
			therapist: {
				id: r.therapists?.id,
				full_name: r.therapists?.users?.full_name ?? 'Terapeuta'
			},
			service: r.bookings?.therapist_services?.services?.name_es ?? 'Servicio'
		})),
		totalCount: count ?? 0,
		currentPage: page,
		totalPages: Math.ceil((count ?? 0) / limit),
		stats,
		filters: { rating, visibility }
	};
};

export const actions: Actions = {
	toggleVisibility: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const reviewId = formData.get('reviewId') as string;
		const isPublic = formData.get('isPublic') === 'true';

		if (!reviewId) {
			return fail(400, { error: 'ID de reseña requerido' });
		}

		const { error } = await (supabase as any)
			.from('reviews')
			.update({ is_public: !isPublic })
			.eq('id', reviewId);

		if (error) {
			return fail(500, { error: 'Error al actualizar visibilidad' });
		}

		return { success: true, message: isPublic ? 'Reseña ocultada' : 'Reseña publicada' };
	},

	toggleFlag: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const reviewId = formData.get('reviewId') as string;
		const isFlagged = formData.get('isFlagged') === 'true';

		if (!reviewId) {
			return fail(400, { error: 'ID de reseña requerido' });
		}

		const { error } = await (supabase as any)
			.from('reviews')
			.update({ is_flagged: !isFlagged })
			.eq('id', reviewId);

		if (error) {
			return fail(500, { error: 'Error al actualizar flag' });
		}

		return { success: true, message: isFlagged ? 'Flag removido' : 'Reseña marcada' };
	},

	deleteReview: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const reviewId = formData.get('reviewId') as string;

		if (!reviewId) {
			return fail(400, { error: 'ID de reseña requerido' });
		}

		const { error } = await (supabase as any)
			.from('reviews')
			.delete()
			.eq('id', reviewId);

		if (error) {
			return fail(500, { error: 'Error al eliminar reseña' });
		}

		return { success: true, message: 'Reseña eliminada' };
	}
};
