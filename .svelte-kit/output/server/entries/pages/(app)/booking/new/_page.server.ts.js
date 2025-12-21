import { error, redirect } from "@sveltejs/kit";
import { g as getTherapistById } from "../../../../../chunks/therapist.service.js";
import { a as getAvailableSlots, c as createBooking } from "../../../../../chunks/booking.service.js";
const load = async ({ locals, url }) => {
  const { supabase } = locals;
  const therapistId = url.searchParams.get("therapist");
  const serviceId = url.searchParams.get("service");
  const dateParam = url.searchParams.get("date");
  if (!therapistId || !serviceId) {
    throw error(400, "Faltan parámetros requeridos");
  }
  const therapist = await getTherapistById(supabase, therapistId);
  if (!therapist) {
    throw error(404, "Terapeuta no encontrado");
  }
  const service = therapist.therapist_services?.find((ts) => ts.id === serviceId);
  if (!service) {
    throw error(404, "Servicio no encontrado");
  }
  const selectedDate = dateParam ?? new Date(Date.now() + 864e5).toISOString().split("T")[0];
  const slots = await getAvailableSlots(
    supabase,
    therapistId,
    selectedDate,
    service.duration_minutes
  );
  return {
    therapist,
    service,
    selectedDate,
    availableSlots: slots
  };
};
const actions = {
  default: async ({ request, locals }) => {
    const { supabase, user } = locals;
    if (!user) {
      throw redirect(303, "/login");
    }
    const formData = await request.formData();
    const therapistId = formData.get("therapistId");
    const serviceId = formData.get("serviceId");
    const scheduledAt = formData.get("scheduledAt");
    const address = formData.get("address");
    const notes = formData.get("notes");
    if (!therapistId || !serviceId || !scheduledAt || !address) {
      return { success: false, error: "Todos los campos son requeridos" };
    }
    const result = await createBooking(supabase, {
      therapistId,
      therapistServiceId: serviceId,
      scheduledAt,
      clientAddress: address,
      clientNotes: notes || void 0
    });
    if (result.error) {
      return { success: false, error: result.error };
    }
    throw redirect(303, `/booking/${result.data?.id}/confirmation`);
  }
};
export {
  actions,
  load
};
