import { fail } from "@sveltejs/kit";
const load = async ({ locals }) => {
  const { supabase, user, userProfile, therapistProfile } = locals;
  return {
    userProfile,
    therapistProfile
  };
};
const actions = {
  updateUser: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const fullName = formData.get("full_name");
    const phone = formData.get("phone");
    if (!fullName?.trim()) {
      return fail(400, { error: "El nombre es requerido" });
    }
    const { error } = await supabase.from("users").update({
      full_name: fullName.trim(),
      phone: phone?.trim() || null
    }).eq("id", user.id);
    if (error) {
      console.error("Error updating user:", error);
      return fail(500, { error: "Error al actualizar el perfil" });
    }
    return { success: true, message: "Datos personales actualizados" };
  },
  updateTherapist: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const bio = formData.get("bio");
    const yearsOfExperience = parseInt(formData.get("years_of_experience"), 10);
    const serviceRadiusKm = parseInt(formData.get("service_radius_km"), 10);
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const updateData = {
      bio: bio?.trim() || null
    };
    if (!isNaN(yearsOfExperience) && yearsOfExperience >= 0) {
      updateData.years_of_experience = yearsOfExperience;
    }
    if (!isNaN(serviceRadiusKm) && serviceRadiusKm > 0) {
      updateData.service_radius_km = serviceRadiusKm;
    }
    const { error } = await supabase.from("therapists").update(updateData).eq("id", therapist.id);
    if (error) {
      console.error("Error updating therapist:", error);
      return fail(500, { error: "Error al actualizar el perfil profesional" });
    }
    return { success: true, message: "Perfil profesional actualizado" };
  },
  updateCertifications: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const certifications = formData.get("certifications");
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    let certificationDetails = null;
    if (certifications?.trim()) {
      try {
        if (certifications.startsWith("[")) {
          certificationDetails = JSON.parse(certifications);
        } else {
          certificationDetails = certifications.split(",").map((c) => c.trim()).filter(Boolean);
        }
      } catch {
        certificationDetails = certifications.split(",").map((c) => c.trim()).filter(Boolean);
      }
    }
    const { error } = await supabase.from("therapists").update({ certification_details: certificationDetails }).eq("id", therapist.id);
    if (error) {
      console.error("Error updating certifications:", error);
      return fail(500, { error: "Error al actualizar las certificaciones" });
    }
    return { success: true, message: "Certificaciones actualizadas" };
  }
};
export {
  actions,
  load
};
