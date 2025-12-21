import { error, json } from "@sveltejs/kit";
import { createHmac } from "crypto";
import { p as private_env } from "../../../../../chunks/private.js";
import { c as createServiceRoleClient } from "../../../../../chunks/server.js";
function verifySignature(payload, signature) {
  const webhookSecret = private_env.COLECTIVA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("COLECTIVA_WEBHOOK_SECRET not set, skipping signature verification");
    return true;
  }
  const expectedSignature = createHmac("sha256", webhookSecret).update(payload).digest("hex");
  return signature === `sha256=${expectedSignature}`;
}
const POST = async ({ request }) => {
  const signature = request.headers.get("x-colectiva-signature") ?? "";
  const payload = await request.text();
  if (!verifySignature(payload, signature)) {
    throw error(401, "Invalid signature");
  }
  let webhookData;
  try {
    webhookData = JSON.parse(payload);
  } catch {
    throw error(400, "Invalid JSON payload");
  }
  const supabase = createServiceRoleClient();
  const { event, data } = webhookData;
  console.log(`Received Colectiva webhook: ${event}`, data);
  try {
    switch (event) {
      case "escrow.created":
        await handleEscrowCreated(supabase, data);
        break;
      case "escrow.funded":
        await handleEscrowFunded(supabase, data);
        break;
      case "escrow.released":
        await handleEscrowReleased(supabase, data);
        break;
      case "escrow.refunded":
        await handleEscrowRefunded(supabase, data);
        break;
      case "escrow.disputed":
        await handleEscrowDisputed(supabase, data);
        break;
      case "wallet.created":
        await handleWalletCreated(supabase, data);
        break;
      case "payout.completed":
        await handlePayoutCompleted(supabase, data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    return json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    throw error(500, "Error processing webhook");
  }
};
async function handleEscrowCreated(supabase, data) {
  const bookingId = data.metadata?.booking_id ?? data.external_id;
  if (!bookingId) return;
  await supabase.from("bookings").update({
    escrow_id: data.id,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", bookingId);
}
async function handleEscrowFunded(supabase, data) {
  const bookingId = data.metadata?.booking_id ?? data.external_id;
  if (!bookingId) return;
  await supabase.from("bookings").update({
    status: "confirmed",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", bookingId).eq("status", "pending");
}
async function handleEscrowReleased(supabase, data) {
  const bookingId = data.metadata?.booking_id ?? data.external_id;
  if (!bookingId) return;
  await supabase.from("bookings").update({
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", bookingId);
}
async function handleEscrowRefunded(supabase, data) {
  const bookingId = data.metadata?.booking_id ?? data.external_id;
  if (!bookingId) return;
  await supabase.from("bookings").update({
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", bookingId);
}
async function handleEscrowDisputed(supabase, data) {
  const bookingId = data.metadata?.booking_id ?? data.external_id;
  if (!bookingId) return;
  console.warn(`Booking ${bookingId} payment disputed - requires admin attention`);
}
async function handleWalletCreated(supabase, data) {
  const therapistId = data.external_id;
  if (!therapistId) return;
  await supabase.from("therapists").update({
    colectiva_wallet_id: data.id,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", therapistId);
}
async function handlePayoutCompleted(supabase, data) {
  console.log(`Payout completed: ${data.id}, amount: ${data.amount_cents}`);
}
export {
  POST
};
