async function searchTherapists(supabase, filters = {}) {
  let query = supabase.from("therapists").select(`
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
		`).eq("vetting_status", "approved").eq("is_available", true).order("rating_avg", { ascending: false });
  if (filters.categoryId) {
    query = query.eq("therapist_services.services.category_id", filters.categoryId);
  }
  if (filters.serviceId) {
    query = query.eq("therapist_services.service_id", filters.serviceId);
  }
  if (filters.minPrice !== void 0) {
    query = query.gte("therapist_services.price_cents", filters.minPrice * 100);
  }
  if (filters.maxPrice !== void 0) {
    query = query.lte("therapist_services.price_cents", filters.maxPrice * 100);
  }
  if (filters.minRating !== void 0) {
    query = query.gte("rating_avg", filters.minRating);
  }
  if (filters.query) {
    query = query.or(`bio.ilike.%${filters.query}%,users.full_name.ilike.%${filters.query}%`);
  }
  const { data, error } = await query.limit(50);
  if (error) {
    console.error("Error fetching therapists:", error);
    return [];
  }
  return data ?? [];
}
async function getTherapistById(supabase, id) {
  const { data, error } = await supabase.from("therapists").select(`
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
		`).eq("id", id).single();
  if (error) {
    console.error("Error fetching therapist:", error);
    return null;
  }
  return data;
}
async function getCategories(supabase) {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data ?? [];
}
async function getServicesByCategory(supabase, categoryId) {
  let query = supabase.from("services").select("*").eq("is_active", true).order("name", { ascending: true });
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }
  return data ?? [];
}
export {
  getCategories as a,
  getServicesByCategory as b,
  getTherapistById as g,
  searchTherapists as s
};
