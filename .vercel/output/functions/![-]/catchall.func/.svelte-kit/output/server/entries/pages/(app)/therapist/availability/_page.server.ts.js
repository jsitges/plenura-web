import { fail } from "@sveltejs/kit";
const load = async ({ locals }) => {
  const { supabase, user } = locals;
  const { data: therapist } = await supabase.from("therapists").select("id, is_available").eq("user_id", user.id).single();
  if (!therapist) {
    return { availability: [], isAvailable: false };
  }
  const { data: availability } = await supabase.from("availability").select("*").eq("therapist_id", therapist.id).order("day_of_week", { ascending: true });
  return {
    availability: availability ?? [],
    isAvailable: therapist.is_available
  };
};
const actions = {
  save: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const slots = [];
    for (let day = 0; day < 7; day++) {
      const isActive = formData.get(`day_${day}_active`) === "on";
      const startTime = formData.get(`day_${day}_start`);
      const endTime = formData.get(`day_${day}_end`);
      if (isActive && startTime && endTime) {
        slots.push({
          day_of_week: day,
          start_time: startTime,
          end_time: endTime,
          is_active: true
        });
      }
    }
    await supabase.from("availability").delete().eq("therapist_id", therapist.id);
    if (slots.length > 0) {
      const { error } = await supabase.from("availability").insert(slots.map((slot) => ({
        ...slot,
        therapist_id: therapist.id
      })));
      if (error) {
        console.error("Error saving availability:", error);
        return fail(500, { error: "Error al guardar la disponibilidad" });
      }
    }
    return { success: true };
  },
  toggleAvailable: async ({ locals }) => {
    const { supabase, user } = locals;
    const { data: therapist } = await supabase.from("therapists").select("id, is_available").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { error } = await supabase.from("therapists").update({ is_available: !therapist.is_available }).eq("id", therapist.id);
    if (error) {
      return fail(500, { error: "Error al actualizar disponibilidad" });
    }
    return { success: true };
  }
};
export {
  actions,
  load
};
