import { redirect } from "@sveltejs/kit";
import { b as getUserBookings } from "../../../../chunks/booking.service.js";
const load = async ({ locals, url }) => {
  const { supabase, user } = locals;
  if (!user) {
    throw redirect(303, "/login");
  }
  const filter = url.searchParams.get("filter") ?? "upcoming";
  const justReviewed = url.searchParams.get("reviewed") === "true";
  let statusFilter;
  switch (filter) {
    case "upcoming":
      statusFilter = ["pending", "confirmed"];
      break;
    case "past":
      statusFilter = ["completed"];
      break;
    case "cancelled":
      statusFilter = ["cancelled_by_client", "cancelled_by_therapist", "no_show"];
      break;
    default:
      statusFilter = void 0;
  }
  const bookings = await getUserBookings(supabase, user.id, statusFilter);
  const { data: reviews } = await supabase.from("reviews").select("booking_id").eq("client_id", user.id);
  const reviewedBookingIds = new Set(
    (reviews ?? []).map((r) => r.booking_id)
  );
  return {
    bookings,
    filter,
    reviewedBookingIds: Array.from(reviewedBookingIds),
    justReviewed
  };
};
export {
  load
};
