import { redirect } from "@sveltejs/kit";
const REFERRAL_REWARD_CENTS = 1e4;
async function getUserReferralCode(supabase, userId) {
  const { data, error } = await supabase.from("referral_codes").select("*").eq("user_id", userId).eq("is_active", true).single();
  if (error) {
    return null;
  }
  return data;
}
async function createReferralCode(supabase, userId) {
  const code = generateReferralCode();
  const { data, error } = await supabase.from("referral_codes").insert({
    user_id: userId,
    code,
    reward_amount_cents: REFERRAL_REWARD_CENTS,
    is_active: true
  }).select().single();
  if (error) {
    console.error("Error creating referral code:", error);
    return null;
  }
  return data;
}
async function getOrCreateReferralCode(supabase, userId) {
  const existing = await getUserReferralCode(supabase, userId);
  if (existing) {
    return existing;
  }
  return createReferralCode(supabase, userId);
}
async function getReferralStats(supabase, userId) {
  const referralCode = await getUserReferralCode(supabase, userId);
  if (!referralCode) {
    return null;
  }
  const { data: referrals } = await supabase.from("referrals").select("*").eq("referral_code_id", referralCode.id);
  const allReferrals = referrals ?? [];
  const pendingReferrals = allReferrals.filter((r) => r.status === "pending").length;
  const completedReferrals = allReferrals.filter((r) => r.status === "completed").length;
  const totalEarnings = allReferrals.filter((r) => r.status === "completed").reduce((sum, r) => sum + (r.reward_paid_cents || 0), 0);
  return {
    code: referralCode.code,
    totalReferrals: allReferrals.length,
    pendingReferrals,
    completedReferrals,
    totalEarnings
  };
}
function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
const load = async ({ locals }) => {
  const { supabase, user } = locals;
  if (!user) {
    throw redirect(303, "/login");
  }
  const referralCode = await getOrCreateReferralCode(supabase, user.id);
  const stats = await getReferralStats(supabase, user.id);
  let referrals = [];
  if (referralCode) {
    const { data } = await supabase.from("referrals").select(`
				id,
				status,
				reward_paid_cents,
				created_at,
				users!referred_user_id (
					full_name
				)
			`).eq("referral_code_id", referralCode.id).order("created_at", { ascending: false }).limit(20);
    if (data) {
      referrals = data ?? [];
    }
  }
  return {
    referralCode,
    stats,
    referrals
  };
};
export {
  load
};
