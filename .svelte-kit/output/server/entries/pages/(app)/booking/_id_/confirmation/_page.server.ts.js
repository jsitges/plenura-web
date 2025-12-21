import { error, redirect } from "@sveltejs/kit";
import { g as getBookingById, i as initiateBookingPayment } from "../../../../../../chunks/booking.service.js";
const load = async ({ locals, params }) => {
  const { supabase, user } = locals;
  if (!user) {
    throw error(401, "No autorizado");
  }
  const booking = await getBookingById(supabase, params.id);
  if (!booking) {
    throw error(404, "Reserva no encontrada");
  }
  if (booking.client_id !== user.id) {
    throw error(403, "No tienes acceso a esta reserva");
  }
  return { booking };
};
const actions = {
  pay: async ({ locals, params }) => {
    const { supabase, user } = locals;
    if (!user) {
      throw redirect(303, "/login");
    }
    const result = await initiateBookingPayment(supabase, params.id);
    if (result.error) {
      return { success: false, error: result.error };
    }
    if (result.paymentUrl) {
      throw redirect(303, result.paymentUrl);
    }
    return { success: true, message: "Pago procesado (modo de prueba)" };
  }
};
export {
  actions,
  load
};
