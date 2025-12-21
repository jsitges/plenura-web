import { fail } from "@sveltejs/kit";
import { d as completeBooking, e as cancelBooking } from "../../../../../chunks/booking.service.js";
const load = async ({ locals, url }) => {
  const { supabase, user } = locals;
  const filter = url.searchParams.get("filter") ?? "upcoming";
  const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
  if (!therapist) {
    return { bookings: [], filter };
  }
  let query = supabase.from("bookings").select(`
			*,
			users:client_id (
				full_name,
				avatar_url,
				phone,
				email
			),
			therapist_services (
				price_cents,
				duration_minutes,
				services (
					name
				)
			)
		`).eq("therapist_id", therapist.id).order("scheduled_at", { ascending: filter === "upcoming" });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  switch (filter) {
    case "pending":
      query = query.eq("status", "pending");
      break;
    case "upcoming":
      query = query.gte("scheduled_at", now).in("status", ["pending", "confirmed"]);
      break;
    case "past":
      query = query.in("status", ["completed"]);
      break;
    case "cancelled":
      query = query.in("status", ["cancelled", "no_show"]);
      break;
  }
  const { data: bookings } = await query.limit(50);
  return {
    bookings: bookings ?? [],
    filter
  };
};
const actions = {
  confirm: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const bookingId = formData.get("bookingId");
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId).eq("therapist_id", therapist.id).eq("status", "pending");
    if (error) {
      return fail(500, { error: "Error al confirmar la cita" });
    }
    return { success: true };
  },
  reject: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const bookingId = formData.get("bookingId");
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { data: booking } = await supabase.from("bookings").select("therapist_id").eq("id", bookingId).single();
    if (!booking || booking.therapist_id !== therapist.id) {
      return fail(403, { error: "No autorizado" });
    }
    const result = await cancelBooking(supabase, bookingId);
    if (!result.success) {
      return fail(500, { error: result.error ?? "Error al rechazar la cita" });
    }
    return { success: true };
  },
  complete: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const bookingId = formData.get("bookingId");
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { data: booking } = await supabase.from("bookings").select("therapist_id").eq("id", bookingId).single();
    if (!booking || booking.therapist_id !== therapist.id) {
      return fail(403, { error: "No autorizado" });
    }
    const result = await completeBooking(supabase, bookingId, "therapist");
    if (!result.success) {
      return fail(500, { error: result.error ?? "Error al completar la cita" });
    }
    return { success: true };
  },
  noshow: async ({ request, locals }) => {
    const { supabase, user } = locals;
    const formData = await request.formData();
    const bookingId = formData.get("bookingId");
    const { data: therapist } = await supabase.from("therapists").select("id").eq("user_id", user.id).single();
    if (!therapist) {
      return fail(403, { error: "No autorizado" });
    }
    const { error } = await supabase.from("bookings").update({ status: "no_show" }).eq("id", bookingId).eq("therapist_id", therapist.id).eq("status", "confirmed");
    if (error) {
      return fail(500, { error: "Error al marcar como no asistió" });
    }
    return { success: true };
  }
};
export {
  actions,
  load
};
