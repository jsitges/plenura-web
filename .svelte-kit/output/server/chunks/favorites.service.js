async function isFavorite(supabase, userId, therapistId) {
  const { data } = await supabase.from("favorites").select("id").eq("user_id", userId).eq("therapist_id", therapistId).maybeSingle();
  return !!data;
}
async function addFavorite(supabase, userId, therapistId) {
  const { error } = await supabase.from("favorites").insert({
    user_id: userId,
    therapist_id: therapistId
  });
  if (error) {
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}
async function removeFavorite(supabase, userId, therapistId) {
  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("therapist_id", therapistId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
async function toggleFavorite(supabase, userId, therapistId) {
  const currentlyFavorite = await isFavorite(supabase, userId, therapistId);
  if (currentlyFavorite) {
    const result = await removeFavorite(supabase, userId, therapistId);
    return { isFavorite: false, error: result.error };
  } else {
    const result = await addFavorite(supabase, userId, therapistId);
    return { isFavorite: true, error: result.error };
  }
}
async function getFavorites(supabase, userId) {
  const { data } = await supabase.from("favorites").select(
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
  ).eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}
export {
  getFavorites as g,
  removeFavorite as r,
  toggleFavorite as t
};
