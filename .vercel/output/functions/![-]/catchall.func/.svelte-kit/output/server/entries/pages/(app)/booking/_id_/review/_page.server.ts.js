import { redirect, error, fail } from "@sveltejs/kit";
async function createReview(supabase, clientId, input) {
  const { data: booking } = await supabase.from("bookings").select("id, status, client_id, therapist_id").eq("id", input.bookingId).single();
  if (!booking) {
    return { success: false, error: "Reserva no encontrada" };
  }
  if (booking.client_id !== clientId) {
    return { success: false, error: "No autorizado" };
  }
  if (booking.status !== "completed") {
    return { success: false, error: "Solo puedes dejar reseña en citas completadas" };
  }
  const { data: existingReview } = await supabase.from("reviews").select("id").eq("booking_id", input.bookingId).single();
  if (existingReview) {
    return { success: false, error: "Ya dejaste una reseña para esta cita" };
  }
  const { error: error2 } = await supabase.from("reviews").insert({
    booking_id: input.bookingId,
    client_id: clientId,
    therapist_id: input.therapistId,
    rating: input.rating,
    comment: input.comment?.trim() || null,
    is_public: input.isPublic ?? true
  });
  if (error2) {
    console.error("Error creating review:", error2);
    return { success: false, error: "Error al crear la reseña" };
  }
  await updateTherapistRating(supabase, input.therapistId);
  return { success: true };
}
async function updateTherapistRating(supabase, therapistId) {
  const { data: reviews } = await supabase.from("reviews").select("rating").eq("therapist_id", therapistId).eq("is_public", true);
  if (!reviews || reviews.length === 0) {
    return;
  }
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / reviews.length;
  await supabase.from("therapists").update({
    rating_avg: Math.round(avgRating * 10) / 10,
    rating_count: reviews.length
  }).eq("id", therapistId);
}
async function getBookingReview(supabase, bookingId) {
  const { data, error: error2 } = await supabase.from("reviews").select("*").eq("booking_id", bookingId).single();
  if (error2) {
    return null;
  }
  return data;
}
const load = async ({ params, locals }) => {
  const { supabase, user } = locals;
  if (!user) {
    throw redirect(303, "/login");
  }
  const { data: booking } = await supabase.from("bookings").select(
    `
			id,
			therapist_id,
			status,
			client_id,
			scheduled_at,
			therapists (
				id,
				users (
					full_name,
					avatar_url
				)
			),
			therapist_services (
				services (
					name,
					name_es
				)
			)
		`
  ).eq("id", params.id).single();
  if (!booking) {
    throw error(404, "Reserva no encontrada");
  }
  const typedBooking = booking;
  if (typedBooking.client_id !== user.id) {
    throw error(403, "No autorizado");
  }
  if (typedBooking.status !== "completed") {
    throw error(400, "Solo puedes dejar reseña en citas completadas");
  }
  const existingReview = await getBookingReview(supabase, params.id);
  return {
    booking: typedBooking,
    existingReview
  };
};
const actions = {
  default: async ({ request, params, locals }) => {
    const { supabase, user } = locals;
    if (!user) {
      throw redirect(303, "/login");
    }
    const formData = await request.formData();
    const rating = parseInt(formData.get("rating"), 10);
    const comment = formData.get("comment");
    const isPublic = formData.get("is_public") === "on";
    const therapistId = formData.get("therapist_id");
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return fail(400, { error: "Calificación inválida" });
    }
    const result = await createReview(supabase, user.id, {
      bookingId: params.id,
      therapistId,
      rating,
      comment,
      isPublic
    });
    if (!result.success) {
      return fail(400, { error: result.error });
    }
    throw redirect(303, "/bookings?reviewed=true");
  }
};
export {
  actions,
  load
};
