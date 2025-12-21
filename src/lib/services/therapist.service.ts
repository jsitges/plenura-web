import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '$types/database.types';

export interface TherapistWithServices extends Tables<'therapists'> {
	users: Pick<Tables<'users'>, 'full_name' | 'avatar_url' | 'email'>;
	therapist_services: Array<{
		id: string;
		price_cents: number;
		duration_minutes: number;
		is_active?: boolean;
		services: Pick<Tables<'services'>, 'id' | 'name' | 'description'>;
	}>;
}

export interface SearchFilters {
	categoryId?: string;
	serviceId?: string;
	minPrice?: number;
	maxPrice?: number;
	minRating?: number;
	latitude?: number;
	longitude?: number;
	radiusKm?: number;
	query?: string;
}

export async function searchTherapists(
	supabase: SupabaseClient<Database>,
	filters: SearchFilters = {}
): Promise<TherapistWithServices[]> {
	let query = supabase
		.from('therapists')
		.select(`
			*,
			users!inner (
				full_name,
				avatar_url,
				email
			),
			therapist_services!inner (
				id,
				price_cents,
				duration_minutes,
				services!inner (
					id,
					name,
					description,
					category_id
				)
			)
		`)
		.eq('vetting_status', 'approved')
		.eq('is_available', true)
		// Featured therapists first, then by rating
		.order('is_featured', { ascending: false, nullsFirst: false })
		.order('featured_until', { ascending: false, nullsFirst: true })
		.order('rating_avg', { ascending: false });

	// Filter by category
	if (filters.categoryId) {
		query = query.eq('therapist_services.services.category_id', filters.categoryId);
	}

	// Filter by service
	if (filters.serviceId) {
		query = query.eq('therapist_services.service_id', filters.serviceId);
	}

	// Filter by price range
	if (filters.minPrice !== undefined) {
		query = query.gte('therapist_services.price_cents', filters.minPrice * 100);
	}
	if (filters.maxPrice !== undefined) {
		query = query.lte('therapist_services.price_cents', filters.maxPrice * 100);
	}

	// Filter by rating
	if (filters.minRating !== undefined) {
		query = query.gte('rating_avg', filters.minRating);
	}

	// Text search in user name or bio
	if (filters.query) {
		query = query.or(`bio.ilike.%${filters.query}%,users.full_name.ilike.%${filters.query}%`);
	}

	const { data, error } = await query.limit(50);

	if (error) {
		console.error('Error fetching therapists:', error);
		return [];
	}

	return (data as unknown as TherapistWithServices[]) ?? [];
}

export async function getTherapistById(
	supabase: SupabaseClient<Database>,
	id: string
): Promise<TherapistWithServices | null> {
	const { data, error } = await supabase
		.from('therapists')
		.select(`
			*,
			users!inner (
				full_name,
				avatar_url,
				email
			),
			therapist_services (
				id,
				price_cents,
				duration_minutes,
				is_active,
				services (
					id,
					name,
					description,
					category_id
				)
			)
		`)
		.eq('id', id)
		.single();

	if (error) {
		console.error('Error fetching therapist:', error);
		return null;
	}

	return data as unknown as TherapistWithServices;
}

export async function getCategories(supabase: SupabaseClient<Database>) {
	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order', { ascending: true });

	if (error) {
		console.error('Error fetching categories:', error);
		return [];
	}

	return data ?? [];
}

export async function getServicesByCategory(
	supabase: SupabaseClient<Database>,
	categoryId?: string
) {
	let query = supabase
		.from('services')
		.select('*')
		.eq('is_active', true)
		.order('name', { ascending: true });

	if (categoryId) {
		query = query.eq('category_id', categoryId);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error fetching services:', error);
		return [];
	}

	return data ?? [];
}
