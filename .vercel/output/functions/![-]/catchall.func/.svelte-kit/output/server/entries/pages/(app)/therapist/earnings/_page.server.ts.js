import { redirect } from "@sveltejs/kit";
async function getEarningsSummary(supabase, therapistId) {
  const { data: completedBookings } = await supabase.from("bookings").select("price_cents, commission_cents, therapist_payout_cents, completed_at").eq("therapist_id", therapistId).eq("status", "completed");
  const { data: pendingBookings } = await supabase.from("bookings").select("price_cents, commission_cents, therapist_payout_cents").eq("therapist_id", therapistId).eq("status", "confirmed");
  const { count: totalBookings } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("therapist_id", therapistId).in("status", ["pending", "confirmed", "completed"]);
  const now = /* @__PURE__ */ new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  let totalEarningsCents = 0;
  let thisMonthEarningsCents = 0;
  let lastMonthEarningsCents = 0;
  (completedBookings ?? []).forEach((b) => {
    const booking = b;
    const payout = booking.therapist_payout_cents ?? 0;
    totalEarningsCents += payout;
    if (booking.completed_at) {
      const completedDate = new Date(booking.completed_at);
      if (completedDate >= thisMonthStart) {
        thisMonthEarningsCents += payout;
      } else if (completedDate >= lastMonthStart && completedDate <= lastMonthEnd) {
        lastMonthEarningsCents += payout;
      }
    }
  });
  const pendingPayoutCents = (pendingBookings ?? []).reduce((sum, b) => {
    const booking = b;
    return sum + (booking.therapist_payout_cents ?? 0);
  }, 0);
  return {
    totalEarningsCents,
    pendingPayoutCents,
    availableBalanceCents: 0,
    // Would come from Colectiva wallet
    totalBookings: totalBookings ?? 0,
    completedBookings: (completedBookings ?? []).length,
    thisMonthEarningsCents,
    lastMonthEarningsCents
  };
}
async function getBookingEarnings(supabase, therapistId, limit = 20, offset = 0) {
  const { data } = await supabase.from("bookings").select(
    `
			id,
			scheduled_at,
			status,
			price_cents,
			commission_cents,
			therapist_payout_cents,
			escrow_id,
			completed_at,
			users:client_id (full_name),
			therapist_services!inner (
				services!inner (name)
			)
		`
  ).eq("therapist_id", therapistId).in("status", ["confirmed", "completed"]).order("scheduled_at", { ascending: false }).range(offset, offset + limit - 1);
  return (data ?? []).map((b) => {
    const booking = b;
    return {
      id: booking.id,
      scheduled_at: booking.scheduled_at,
      status: booking.status,
      price_cents: booking.price_cents,
      commission_cents: booking.commission_cents ?? 0,
      therapist_payout_cents: booking.therapist_payout_cents ?? booking.price_cents,
      escrow_id: booking.escrow_id,
      completed_at: booking.completed_at,
      client: booking.users,
      service: booking.therapist_services?.services ?? null
    };
  });
}
const load = async ({ locals }) => {
  const { supabase, user } = locals;
  if (!user) {
    throw redirect(303, "/login");
  }
  const { data: therapist } = await supabase.from("therapists").select("id, subscription_tier, colectiva_wallet_id").eq("user_id", user.id).single();
  if (!therapist) {
    throw redirect(303, "/dashboard");
  }
  const t = therapist;
  const [summary, recentEarnings] = await Promise.all([
    getEarningsSummary(supabase, t.id),
    getBookingEarnings(supabase, t.id, 10)
  ]);
  return {
    summary,
    recentEarnings,
    subscriptionTier: t.subscription_tier,
    hasWallet: !!t.colectiva_wallet_id
  };
};
export {
  load
};
