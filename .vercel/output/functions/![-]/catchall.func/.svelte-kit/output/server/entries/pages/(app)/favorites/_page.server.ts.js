import { redirect } from "@sveltejs/kit";
import { g as getFavorites, r as removeFavorite } from "../../../../chunks/favorites.service.js";
const load = async ({ locals }) => {
  const {
    data: { user }
  } = await locals.supabase.auth.getUser();
  if (!user) {
    throw redirect(303, "/login");
  }
  const favorites = await getFavorites(locals.supabase, user.id);
  return {
    favorites
  };
};
const actions = {
  remove: async ({ request, locals }) => {
    const {
      data: { user }
    } = await locals.supabase.auth.getUser();
    if (!user) {
      throw redirect(303, "/login");
    }
    const formData = await request.formData();
    const therapistId = formData.get("therapist_id");
    if (!therapistId) {
      return { success: false, error: "Terapeuta no especificado" };
    }
    const result = await removeFavorite(locals.supabase, user.id, therapistId);
    return result;
  }
};
export {
  actions,
  load
};
