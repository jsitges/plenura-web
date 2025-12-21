import { fail } from "@sveltejs/kit";
const load = async ({ locals }) => {
  const { supabase, user } = locals;
  const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
  if (!therapist) {
    return {
      allServices: [],
      myServices: [],
      categories: []
    };
  }
  const { data: allServices } = await supabase.from("services").select(`
			id,
			name,
			name_es,
			description,
			default_duration_minutes,
			default_price_cents,
			category_id,
			categories (
				id,
				name,
				name_es,
				icon
			)
		`).eq("is_active", true).order("name", { ascending: true });
  const { data: myServices } = await supabase.from("therapist_services").select(`
			id,
			service_id,
			price_cents,
			duration_minutes,
			is_active,
			services (
				id,
				name,
				name_es,
				description,
				category_id,
				categories (
					id,
					name,
					name_es,
					icon
				)
			)
		`).eq("therapist_id", therapist.id);
  const { data: categories } = await supabase.from("categories").select("id, name, name_es, icon").order("sort_order", { ascending: true });
  return {
    allServices: allServices ?? [],
    myServices: myServices ?? [],
    categories: categories ?? []
  };
};
const actions = {
  add: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const serviceId = formData.get("service_id");
    const priceCents = parseInt(formData.get("price_cents"), 10);
    const durationMinutes = parseInt(formData.get("duration_minutes"), 10);
    if (!serviceId || isNaN(priceCents) || isNaN(durationMinutes)) {
      return fail(400, { error: "Datos incompletos" });
    }
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { data: existing } = await supabase.from("therapist_services").select("id").eq("therapist_id", therapist.id).eq("service_id", serviceId).single();
    if (existing) {
      return fail(400, { error: "Ya tienes este servicio configurado" });
    }
    const { error } = await supabase.from("therapist_services").insert({
      therapist_id: therapist.id,
      service_id: serviceId,
      price_cents: priceCents,
      duration_minutes: durationMinutes,
      is_active: true
    });
    if (error) {
      console.error("Error adding service:", error);
      return fail(500, { error: "Error al agregar el servicio" });
    }
    return { success: true };
  },
  update: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const therapistServiceId = formData.get("therapist_service_id");
    const priceCents = parseInt(formData.get("price_cents"), 10);
    const durationMinutes = parseInt(formData.get("duration_minutes"), 10);
    if (!therapistServiceId || isNaN(priceCents) || isNaN(durationMinutes)) {
      return fail(400, { error: "Datos incompletos" });
    }
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { error } = await supabase.from("therapist_services").update({
      price_cents: priceCents,
      duration_minutes: durationMinutes
    }).eq("id", therapistServiceId).eq("therapist_id", therapist.id);
    if (error) {
      console.error("Error updating service:", error);
      return fail(500, { error: "Error al actualizar el servicio" });
    }
    return { success: true };
  },
  toggle: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const therapistServiceId = formData.get("therapist_service_id");
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { data: current } = await supabase.from("therapist_services").select("is_active").eq("id", therapistServiceId).eq("therapist_id", therapist.id).single();
    if (!current) {
      return fail(404, { error: "Servicio no encontrado" });
    }
    const { error } = await supabase.from("therapist_services").update({ is_active: !current.is_active }).eq("id", therapistServiceId).eq("therapist_id", therapist.id);
    if (error) {
      console.error("Error toggling service:", error);
      return fail(500, { error: "Error al actualizar el servicio" });
    }
    return { success: true };
  },
  remove: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const therapistServiceId = formData.get("therapist_service_id");
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { error } = await supabase.from("therapist_services").delete().eq("id", therapistServiceId).eq("therapist_id", therapist.id);
    if (error) {
      console.error("Error removing service:", error);
      return fail(500, { error: "Error al eliminar el servicio" });
    }
    return { success: true };
  }
};
export {
  actions,
  load
};
