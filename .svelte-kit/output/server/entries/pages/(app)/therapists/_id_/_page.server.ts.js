import { error, redirect } from "@sveltejs/kit";
import { g as getTherapistById } from "../../../../../chunks/therapist.service.js";
import { t as toggleFavorite } from "../../../../../chunks/favorites.service.js";
const load = async ({ locals, params }) => {
  const { supabase } = locals;
  const therapist = await getTherapistById(supabase, params.id);
  if (!therapist) {
    throw error(404, "Terapeuta no encontrado");
  }
  const { data: reviews } = await supabase.from("reviews").select(`
			*,
			users:client_id (
				full_name,
				avatar_url
			)
		`).eq("therapist_id", params.id).eq("is_public", true).order("created_at", { ascending: false }).limit(10);
  const { data: availability } = await supabase.from("availability").select("*").eq("therapist_id", params.id).order("day_of_week", { ascending: true });
  let isFavorite = false;
  if (locals.user) {
    const { data: favorite } = await supabase.from("favorites").select("id").eq("user_id", locals.user.id).eq("therapist_id", params.id).single();
    isFavorite = !!favorite;
  }
  return {
    therapist,
    reviews: reviews ?? [],
    availability: availability ?? [],
    isFavorite
  };
};
const actions = {
  toggleFavorite: async ({ locals, params }) => {
    const {
      data: { user }
    } = await locals.supabase.auth.getUser();
    if (!user) {
      throw redirect(303, "/login");
    }
    const result = await toggleFavorite(locals.supabase, user.id, params.id);
    return result;
  }
};
export {
  actions,
  load
};
