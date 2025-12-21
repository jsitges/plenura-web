let _envVars = null;
async function getEnvVars() {
  if (_envVars) return _envVars;
  try {
    const { env } = await import("./private.js").then((n) => n._);
    _envVars = {
      apiUrl: env.COLECTIVA_API_URL ?? "",
      apiKey: env.COLECTIVA_API_KEY ?? ""
    };
  } catch {
    _envVars = { apiUrl: "", apiKey: "" };
  }
  return _envVars;
}
const COMMISSION_RATES = {
  free: 0.1,
  // 10%
  pro: 0.05,
  // 5%
  business: 0.03,
  // 3%
  enterprise: 0
  // 0%
};
function calculateCommission(amountCents, subscriptionTier) {
  const rate = COMMISSION_RATES[subscriptionTier] ?? COMMISSION_RATES.free;
  return Math.round(amountCents * rate);
}
async function createEscrow(input) {
  const { apiUrl, apiKey } = await getEnvVars();
  if (!apiUrl || !apiKey) {
    console.warn("Colectiva API not configured, using mock mode");
    return mockCreateEscrow(input);
  }
  try {
    const response = await fetch(`${apiUrl}/escrows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        external_id: input.bookingId,
        amount_cents: input.amountCents,
        currency: "MXN",
        payer_id: input.clientId,
        payee_id: input.therapistId,
        description: input.description,
        metadata: {
          booking_id: input.bookingId,
          platform: "plenura"
        }
      })
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message ?? "Error creating escrow" };
    }
    const data = await response.json();
    return {
      success: true,
      escrowId: data.id,
      paymentUrl: data.payment_url
    };
  } catch (error) {
    console.error("Error creating escrow:", error);
    return { success: false, error: "Error connecting to payment provider" };
  }
}
async function releaseEscrow(escrowId, commissionCents) {
  const { apiUrl, apiKey } = await getEnvVars();
  if (!apiUrl || !apiKey) {
    console.warn("Colectiva API not configured, using mock mode");
    return mockReleaseEscrow(escrowId);
  }
  try {
    const response = await fetch(`${apiUrl}/escrows/${escrowId}/release`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        platform_fee_cents: commissionCents
      })
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message ?? "Error releasing escrow" };
    }
    const data = await response.json();
    return {
      success: true,
      escrowId: data.id
    };
  } catch (error) {
    console.error("Error releasing escrow:", error);
    return { success: false, error: "Error connecting to payment provider" };
  }
}
async function refundEscrow(escrowId, refundAmountCents) {
  const { apiUrl, apiKey } = await getEnvVars();
  if (!apiUrl || !apiKey) {
    console.warn("Colectiva API not configured, using mock mode");
    return mockRefundEscrow(escrowId, refundAmountCents);
  }
  try {
    const response = await fetch(`${apiUrl}/escrows/${escrowId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        amount_cents: refundAmountCents
      })
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message ?? "Error processing refund" };
    }
    const data = await response.json();
    return {
      success: true,
      refundId: data.refund_id,
      amountRefundedCents: data.amount_cents
    };
  } catch (error) {
    console.error("Error refunding escrow:", error);
    return { success: false, error: "Error connecting to payment provider" };
  }
}
function mockCreateEscrow(input) {
  return {
    success: true,
    escrowId: `mock_escrow_${input.bookingId}`,
    paymentUrl: `/booking/${input.bookingId}/pay-mock`
  };
}
function mockReleaseEscrow(escrowId) {
  return {
    success: true,
    escrowId
  };
}
function mockRefundEscrow(escrowId, amountCents) {
  return {
    success: true,
    refundId: `mock_refund_${Date.now()}`,
    amountRefundedCents: amountCents
  };
}
async function createBooking(supabase, input) {
  const { data: serviceData, error: serviceError } = await supabase.from("therapist_services").select("duration_minutes, price_cents").eq("id", input.therapistServiceId).single();
  if (serviceError || !serviceData) {
    return { data: null, error: "Servicio no encontrado" };
  }
  const svc = serviceData;
  const { data: therapist } = await supabase.from("therapists").select("subscription_tier").eq("id", input.therapistId).single();
  const subscriptionTier = therapist?.subscription_tier ?? "free";
  const commissionCents = calculateCommission(svc.price_cents, subscriptionTier);
  const payoutCents = svc.price_cents - commissionCents;
  const startTime = new Date(input.scheduledAt);
  const endTime = new Date(startTime.getTime() + svc.duration_minutes * 6e4);
  const { data: conflicts } = await supabase.from("bookings").select("id").eq("therapist_id", input.therapistId).in("status", ["pending", "confirmed"]).or(`scheduled_at.lte.${endTime.toISOString()},scheduled_end_at.gte.${startTime.toISOString()}`);
  if (conflicts && conflicts.length > 0) {
    return { data: null, error: "Este horario ya no está disponible" };
  }
  const { data, error } = await supabase.from("bookings").insert({
    therapist_id: input.therapistId,
    therapist_service_id: input.therapistServiceId,
    scheduled_at: input.scheduledAt,
    scheduled_end_at: endTime.toISOString(),
    client_address: input.clientAddress,
    notes: input.clientNotes,
    price_cents: svc.price_cents,
    commission_cents: commissionCents,
    therapist_payout_cents: payoutCents,
    status: "pending"
  }).select().single();
  if (error) {
    console.error("Error creating booking:", error);
    return { data: null, error: "Error al crear la reserva" };
  }
  return { data, error: null };
}
async function getBookingById(supabase, id) {
  const { data, error } = await supabase.from("bookings").select(`
			*,
			therapists!inner (
				id,
				users!inner (
					full_name,
					avatar_url
				)
			),
			therapist_services!inner (
				price_cents,
				duration_minutes,
				services!inner (
					name
				)
			)
		`).eq("id", id).single();
  if (error) {
    console.error("Error fetching booking:", error);
    return null;
  }
  return data;
}
async function getUserBookings(supabase, userId, status) {
  let query = supabase.from("bookings").select(`
			*,
			therapists!inner (
				id,
				users!inner (
					full_name,
					avatar_url
				)
			),
			therapist_services!inner (
				price_cents,
				duration_minutes,
				services!inner (
					name
				)
			)
		`).eq("client_id", userId).order("scheduled_at", { ascending: false });
  if (status && status.length > 0) {
    query = query.in("status", status);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
  return data ?? [];
}
async function initiateBookingPayment(supabase, bookingId) {
  const { data: booking, error: fetchError } = await supabase.from("bookings").select(`
			*,
			therapists!inner(id, users!inner(full_name)),
			therapist_services!inner(services!inner(name))
		`).eq("id", bookingId).single();
  if (fetchError || !booking) {
    return { error: "Reserva no encontrada" };
  }
  const b = booking;
  const escrowResult = await createEscrow({
    bookingId: b.id,
    amountCents: b.price_cents,
    clientId: b.client_id,
    therapistId: b.therapist_id,
    description: `${b.therapist_services.services.name} con ${b.therapists.users.full_name}`
  });
  if (!escrowResult.success) {
    return { error: escrowResult.error ?? "Error al crear pago" };
  }
  if (escrowResult.escrowId) {
    await supabase.from("bookings").update({ escrow_id: escrowResult.escrowId }).eq("id", bookingId);
  }
  return { paymentUrl: escrowResult.paymentUrl };
}
async function completeBooking(supabase, bookingId, completedBy) {
  const { data: booking, error: fetchError } = await supabase.from("bookings").select("*, therapists!inner(subscription_tier)").eq("id", bookingId).single();
  if (fetchError || !booking) {
    return { success: false, error: "Reserva no encontrada" };
  }
  const b = booking;
  if (b.status !== "confirmed") {
    return { success: false, error: "Solo se pueden completar reservas confirmadas" };
  }
  const { error: updateError } = await supabase.from("bookings").update({
    status: "completed",
    completed_at: (/* @__PURE__ */ new Date()).toISOString(),
    completed_by: completedBy
  }).eq("id", bookingId);
  if (updateError) {
    return { success: false, error: "Error al actualizar reserva" };
  }
  if (b.escrow_id) {
    const releaseResult = await releaseEscrow(b.escrow_id, b.commission_cents);
    if (!releaseResult.success) {
      console.error("Error releasing escrow:", releaseResult.error);
    }
  }
  return { success: true };
}
async function cancelBooking(supabase, bookingId, cancelledBy) {
  const { data: booking, error: fetchError } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (fetchError || !booking) {
    return { success: false, error: "Reserva no encontrada" };
  }
  const b = booking;
  if (!["pending", "confirmed"].includes(b.status)) {
    return { success: false, error: "Esta reserva no puede ser cancelada" };
  }
  const status = "cancelled_by_therapist";
  const { error: updateError } = await supabase.from("bookings").update({
    status,
    cancelled_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", bookingId);
  if (updateError) {
    return { success: false, error: "Error al cancelar reserva" };
  }
  let refundAmount = 0;
  if (b.escrow_id) {
    {
      refundAmount = b.price_cents;
    }
    if (refundAmount > 0) {
      const refundResult = await refundEscrow(b.escrow_id, refundAmount);
      if (!refundResult.success) {
        console.error("Error processing refund:", refundResult.error);
      }
    }
  }
  return { success: true, refundAmount };
}
async function getAvailableSlots(supabase, therapistId, date, durationMinutes) {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const { data: availability } = await supabase.from("availability").select("*").eq("therapist_id", therapistId).eq("day_of_week", dayOfWeek).single();
  if (!availability) {
    return [];
  }
  const avail = availability;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const { data: bookings } = await supabase.from("bookings").select("scheduled_at, scheduled_end_at").eq("therapist_id", therapistId).in("status", ["pending", "confirmed"]).gte("scheduled_at", startOfDay.toISOString()).lte("scheduled_at", endOfDay.toISOString());
  const slots = [];
  const startTimeParts = avail.start_time.split(":");
  const endTimeParts = avail.end_time.split(":");
  const startHour = Number(startTimeParts[0]);
  const startMin = Number(startTimeParts[1]);
  const endHour = Number(endTimeParts[0]);
  const endMin = Number(endTimeParts[1]);
  const slotStart = new Date(date);
  slotStart.setHours(startHour, startMin, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMin, 0, 0);
  const now = /* @__PURE__ */ new Date();
  while (slotStart.getTime() + durationMinutes * 6e4 <= dayEnd.getTime()) {
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 6e4);
    if (slotStart > now) {
      const hasConflict = bookings?.some((booking) => {
        const b = booking;
        const bookingStart = new Date(b.scheduled_at);
        const bookingEnd = new Date(b.scheduled_end_at);
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
      if (!hasConflict) {
        slots.push(slotStart.toISOString());
      }
    }
    slotStart.setMinutes(slotStart.getMinutes() + 30);
  }
  return slots;
}
export {
  getAvailableSlots as a,
  getUserBookings as b,
  createBooking as c,
  completeBooking as d,
  cancelBooking as e,
  getBookingById as g,
  initiateBookingPayment as i
};
