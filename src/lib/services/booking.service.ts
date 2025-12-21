import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '$types/database.types';
import {
	calculateCommission,
	calculateRefundAmount,
	createEscrow,
	releaseEscrow,
	refundEscrow
} from './payment.service';
import {
	sendBookingConfirmationToClient,
	sendNewBookingToTherapist,
	sendBookingCancellation,
	sendReviewRequest,
	type BookingEmailData
} from './email.service';
import {
	sendBookingConfirmationWhatsApp,
	sendNewBookingToTherapistWhatsApp,
	sendBookingCancellationWhatsApp,
	sendReviewRequestWhatsApp
} from './whatsapp.service';

// Subscription tiers that have WhatsApp enabled
const WHATSAPP_ENABLED_TIERS = ['business', 'enterprise'];

interface EmailPreferences {
	booking_reminders: boolean;
	review_requests: boolean;
	tips_received: boolean;
	marketing: boolean;
	weekly_reports: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
	booking_reminders: true,
	review_requests: true,
	tips_received: true,
	marketing: false,
	weekly_reports: true
};

export interface CreateBookingInput {
	therapistId: string;
	therapistServiceId: string;
	scheduledAt: string;
	clientAddress: string;
	clientNotes?: string;
}

export interface BookingWithDetails {
	id: string;
	client_id: string;
	therapist_id: string;
	therapist_service_id: string;
	scheduled_at: string;
	scheduled_end_at: string;
	status: string;
	price_cents: number;
	client_address: string | null;
	notes: string | null;
	created_at: string;
	therapists: {
		id: string;
		users: {
			full_name: string;
			avatar_url: string | null;
		};
	};
	therapist_services: {
		price_cents: number;
		duration_minutes: number;
		services: {
			name: string;
		};
	};
}

export async function createBooking(
	supabase: SupabaseClient<Database>,
	input: CreateBookingInput
): Promise<{ data: Tables<'bookings'> | null; error: string | null }> {
	// Get the service details for duration
	const { data: serviceData, error: serviceError } = await supabase
		.from('therapist_services')
		.select('duration_minutes, price_cents')
		.eq('id', input.therapistServiceId)
		.single();

	if (serviceError || !serviceData) {
		return { data: null, error: 'Servicio no encontrado' };
	}

	const svc = serviceData as { duration_minutes: number; price_cents: number };

	// Get therapist subscription tier for commission calculation
	const { data: therapist } = await supabase
		.from('therapists')
		.select('subscription_tier')
		.eq('id', input.therapistId)
		.single();

	const subscriptionTier = (therapist as { subscription_tier: string } | null)?.subscription_tier ?? 'free';

	// Calculate commission and payout
	const commissionCents = calculateCommission(svc.price_cents, subscriptionTier);
	const payoutCents = svc.price_cents - commissionCents;

	// Calculate end time
	const startTime = new Date(input.scheduledAt);
	const endTime = new Date(startTime.getTime() + svc.duration_minutes * 60000);

	// Check for conflicts
	const { data: conflicts } = await supabase
		.from('bookings')
		.select('id')
		.eq('therapist_id', input.therapistId)
		.in('status', ['pending', 'confirmed'])
		.or(`scheduled_at.lte.${endTime.toISOString()},scheduled_end_at.gte.${startTime.toISOString()}`);

	if (conflicts && conflicts.length > 0) {
		return { data: null, error: 'Este horario ya no está disponible' };
	}

	// Create the booking with commission details
	const { data, error } = await supabase
		.from('bookings')
		.insert({
			therapist_id: input.therapistId,
			therapist_service_id: input.therapistServiceId,
			scheduled_at: input.scheduledAt,
			scheduled_end_at: endTime.toISOString(),
			client_address: input.clientAddress,
			notes: input.clientNotes,
			price_cents: svc.price_cents,
			commission_cents: commissionCents,
			therapist_payout_cents: payoutCents,
			status: 'pending'
		})
		.select()
		.single();

	if (error) {
		console.error('Error creating booking:', error);
		return { data: null, error: 'Error al crear la reserva' };
	}

	// Send email notifications (fire and forget)
	sendBookingEmails(supabase, data.id).catch(console.error);

	return { data: data as Tables<'bookings'>, error: null };
}

/**
 * Send booking notification emails to client and therapist
 * For Business tier therapists, also send WhatsApp notifications
 */
async function sendBookingEmails(
	supabase: SupabaseClient<Database>,
	bookingId: string
): Promise<void> {
	// Fetch full booking details with user info
	const { data: booking } = await supabase
		.from('bookings')
		.select(`
			*,
			users:client_id (full_name, email, phone),
			therapists!inner (
				subscription_tier,
				users!inner (full_name, email, phone)
			),
			therapist_services!inner (
				services!inner (name)
			)
		`)
		.eq('id', bookingId)
		.single();

	if (!booking) return;

	const b = booking as unknown as {
		scheduled_at: string;
		client_address: string;
		price_cents: number;
		users: { full_name: string; email: string; phone: string | null };
		therapists: {
			subscription_tier: string;
			users: { full_name: string; email: string; phone: string | null };
		};
		therapist_services: { services: { name: string } };
	};

	const emailData: BookingEmailData = {
		clientName: b.users.full_name,
		clientEmail: b.users.email,
		therapistName: b.therapists.users.full_name,
		therapistEmail: b.therapists.users.email,
		serviceName: b.therapist_services.services.name,
		scheduledAt: new Date(b.scheduled_at),
		address: b.client_address ?? '',
		priceCents: b.price_cents
	};

	const whatsAppData = {
		clientName: b.users.full_name,
		therapistName: b.therapists.users.full_name,
		serviceName: b.therapist_services.services.name,
		scheduledAt: new Date(b.scheduled_at),
		address: b.client_address ?? '',
		priceCents: b.price_cents
	};

	// Send email notifications in parallel
	const promises: Promise<unknown>[] = [
		sendBookingConfirmationToClient(emailData),
		sendNewBookingToTherapist(emailData)
	];

	// Add WhatsApp notifications for Business tier and above
	const hasWhatsApp = WHATSAPP_ENABLED_TIERS.includes(b.therapists.subscription_tier);
	if (hasWhatsApp) {
		if (b.users.phone) {
			promises.push(sendBookingConfirmationWhatsApp(b.users.phone, whatsAppData));
		}
		if (b.therapists.users.phone) {
			promises.push(sendNewBookingToTherapistWhatsApp(b.therapists.users.phone, whatsAppData));
		}
	}

	await Promise.all(promises);
}

export async function getBookingById(
	supabase: SupabaseClient<Database>,
	id: string
): Promise<BookingWithDetails | null> {
	const { data, error } = await supabase
		.from('bookings')
		.select(`
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
		`)
		.eq('id', id)
		.single();

	if (error) {
		console.error('Error fetching booking:', error);
		return null;
	}

	return data as unknown as BookingWithDetails;
}

export async function getUserBookings(
	supabase: SupabaseClient<Database>,
	userId: string,
	status?: string[]
): Promise<BookingWithDetails[]> {
	let query = supabase
		.from('bookings')
		.select(`
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
		`)
		.eq('client_id', userId)
		.order('scheduled_at', { ascending: false });

	if (status && status.length > 0) {
		query = query.in('status', status);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error fetching bookings:', error);
		return [];
	}

	return (data as unknown as BookingWithDetails[]) ?? [];
}

/**
 * Initiate payment for a booking - creates escrow and returns payment URL
 */
export async function initiateBookingPayment(
	supabase: SupabaseClient<Database>,
	bookingId: string
): Promise<{ paymentUrl?: string; error?: string }> {
	// Get booking details
	const { data: booking, error: fetchError } = await supabase
		.from('bookings')
		.select(`
			*,
			therapists!inner(id, users!inner(full_name)),
			therapist_services!inner(services!inner(name))
		`)
		.eq('id', bookingId)
		.single();

	if (fetchError || !booking) {
		return { error: 'Reserva no encontrada' };
	}

	const b = booking as unknown as {
		id: string;
		client_id: string;
		therapist_id: string;
		price_cents: number;
		therapists: { users: { full_name: string } };
		therapist_services: { services: { name: string } };
	};

	// Create escrow
	const escrowResult = await createEscrow({
		bookingId: b.id,
		amountCents: b.price_cents,
		clientId: b.client_id,
		therapistId: b.therapist_id,
		description: `${b.therapist_services.services.name} con ${b.therapists.users.full_name}`
	});

	if (!escrowResult.success) {
		return { error: escrowResult.error ?? 'Error al crear pago' };
	}

	// Update booking with escrow ID
	if (escrowResult.escrowId) {
		await supabase
			.from('bookings')
			.update({ escrow_id: escrowResult.escrowId } as never)
			.eq('id', bookingId);
	}

	return { paymentUrl: escrowResult.paymentUrl };
}

/**
 * Complete a booking and release funds to therapist
 */
export async function completeBooking(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	completedBy: 'client' | 'therapist'
): Promise<{ success: boolean; error?: string }> {
	// Get booking with escrow info and client email preferences
	const { data: booking, error: fetchError } = await supabase
		.from('bookings')
		.select(`
			*,
			therapists!inner(subscription_tier, users!inner(full_name)),
			users:client_id(full_name, email, phone, email_preferences),
			therapist_services!inner(services!inner(name))
		`)
		.eq('id', bookingId)
		.single();

	if (fetchError || !booking) {
		return { success: false, error: 'Reserva no encontrada' };
	}

	const b = booking as unknown as {
		id: string;
		status: string;
		escrow_id: string | null;
		price_cents: number;
		commission_cents: number;
		scheduled_at: string;
		client_address: string;
		therapists: {
			subscription_tier: string;
			users: { full_name: string };
		};
		users: {
			full_name: string;
			email: string;
			phone: string | null;
			email_preferences: EmailPreferences | null;
		};
		therapist_services: { services: { name: string } };
	};

	if (b.status !== 'confirmed') {
		return { success: false, error: 'Solo se pueden completar reservas confirmadas' };
	}

	// Update booking status
	const { error: updateError } = await supabase
		.from('bookings')
		.update({
			status: 'completed',
			completed_at: new Date().toISOString(),
			completed_by: completedBy
		} as never)
		.eq('id', bookingId);

	if (updateError) {
		return { success: false, error: 'Error al actualizar reserva' };
	}

	// Release escrow if exists
	if (b.escrow_id) {
		const releaseResult = await releaseEscrow(b.escrow_id, b.commission_cents);
		if (!releaseResult.success) {
			console.error('Error releasing escrow:', releaseResult.error);
			// Don't fail the completion, payment will be retried via webhook
		}
	}

	// Send review request if client has it enabled
	const prefs = b.users.email_preferences ?? DEFAULT_PREFERENCES;
	if (prefs.review_requests) {
		const emailData: BookingEmailData = {
			clientName: b.users.full_name,
			clientEmail: b.users.email,
			therapistName: b.therapists.users.full_name,
			therapistEmail: '', // Not needed for review request
			serviceName: b.therapist_services.services.name,
			scheduledAt: new Date(b.scheduled_at),
			address: b.client_address ?? '',
			priceCents: b.price_cents
		};
		// Fire and forget - email
		sendReviewRequest(b.users.email, b.users.full_name, emailData, bookingId).catch(console.error);

		// Also send WhatsApp for Business tier if client has phone
		if (
			WHATSAPP_ENABLED_TIERS.includes(b.therapists.subscription_tier) &&
			b.users.phone
		) {
			sendReviewRequestWhatsApp(
				b.users.phone,
				b.users.full_name,
				b.therapists.users.full_name,
				bookingId
			).catch(console.error);
		}
	}

	return { success: true };
}

/**
 * Cancel a booking with appropriate refund
 */
export async function cancelBooking(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	cancelledBy: 'client' | 'therapist'
): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
	// Get booking details
	const { data: booking, error: fetchError } = await supabase
		.from('bookings')
		.select('*')
		.eq('id', bookingId)
		.single();

	if (fetchError || !booking) {
		return { success: false, error: 'Reserva no encontrada' };
	}

	const b = booking as unknown as {
		id: string;
		status: string;
		escrow_id: string | null;
		price_cents: number;
		scheduled_at: string;
	};

	if (!['pending', 'confirmed'].includes(b.status)) {
		return { success: false, error: 'Esta reserva no puede ser cancelada' };
	}

	const status = cancelledBy === 'client' ? 'cancelled_by_client' : 'cancelled_by_therapist';

	// Update booking status
	const { error: updateError } = await supabase
		.from('bookings')
		.update({
			status,
			cancelled_at: new Date().toISOString()
		} as never)
		.eq('id', bookingId);

	if (updateError) {
		return { success: false, error: 'Error al cancelar reserva' };
	}

	// Process refund if escrow exists
	let refundAmount = 0;
	if (b.escrow_id) {
		// Therapist cancellation = full refund
		// Client cancellation = refund based on timing policy
		if (cancelledBy === 'therapist') {
			refundAmount = b.price_cents;
		} else {
			refundAmount = calculateRefundAmount(b.price_cents, new Date(b.scheduled_at));
		}

		if (refundAmount > 0) {
			const refundResult = await refundEscrow(b.escrow_id, refundAmount);
			if (!refundResult.success) {
				console.error('Error processing refund:', refundResult.error);
				// Don't fail the cancellation, refund will be retried
			}
		}
	}

	// Send cancellation emails (fire and forget)
	sendCancellationEmails(supabase, bookingId, cancelledBy).catch(console.error);

	return { success: true, refundAmount };
}

/**
 * Send cancellation notification emails
 * For Business tier therapists, also send WhatsApp notifications
 */
async function sendCancellationEmails(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	cancelledBy: 'client' | 'therapist'
): Promise<void> {
	const { data: booking } = await supabase
		.from('bookings')
		.select(`
			*,
			users:client_id (full_name, email, phone),
			therapists!inner (
				subscription_tier,
				users!inner (full_name, email, phone)
			),
			therapist_services!inner (
				services!inner (name)
			)
		`)
		.eq('id', bookingId)
		.single();

	if (!booking) return;

	const b = booking as unknown as {
		scheduled_at: string;
		client_address: string;
		price_cents: number;
		users: { full_name: string; email: string; phone: string | null };
		therapists: {
			subscription_tier: string;
			users: { full_name: string; email: string; phone: string | null };
		};
		therapist_services: { services: { name: string } };
	};

	const emailData: BookingEmailData = {
		clientName: b.users.full_name,
		clientEmail: b.users.email,
		therapistName: b.therapists.users.full_name,
		therapistEmail: b.therapists.users.email,
		serviceName: b.therapist_services.services.name,
		scheduledAt: new Date(b.scheduled_at),
		address: b.client_address ?? '',
		priceCents: b.price_cents
	};

	const whatsAppData = {
		clientName: b.users.full_name,
		therapistName: b.therapists.users.full_name,
		serviceName: b.therapist_services.services.name,
		scheduledAt: new Date(b.scheduled_at),
		address: b.client_address ?? '',
		priceCents: b.price_cents
	};

	// Send email notifications to both parties
	const promises: Promise<unknown>[] = [
		sendBookingCancellation(b.users.email, b.users.full_name, emailData, cancelledBy),
		sendBookingCancellation(
			b.therapists.users.email,
			b.therapists.users.full_name,
			emailData,
			cancelledBy
		)
	];

	// Add WhatsApp notifications for Business tier and above
	const hasWhatsApp = WHATSAPP_ENABLED_TIERS.includes(b.therapists.subscription_tier);
	if (hasWhatsApp) {
		if (b.users.phone) {
			promises.push(
				sendBookingCancellationWhatsApp(b.users.phone, b.users.full_name, whatsAppData)
			);
		}
		if (b.therapists.users.phone) {
			promises.push(
				sendBookingCancellationWhatsApp(
					b.therapists.users.phone,
					b.therapists.users.full_name,
					whatsAppData
				)
			);
		}
	}

	await Promise.all(promises);
}

export async function getAvailableSlots(
	supabase: SupabaseClient<Database>,
	therapistId: string,
	date: string,
	durationMinutes: number
): Promise<string[]> {
	// Get day of week (0 = Sunday, 6 = Saturday)
	const dateObj = new Date(date);
	const dayOfWeek = dateObj.getDay();

	// Get therapist availability for this day
	const { data: availability } = await supabase
		.from('availability')
		.select('*')
		.eq('therapist_id', therapistId)
		.eq('day_of_week', dayOfWeek)
		.single();

	if (!availability) {
		return []; // Therapist not available on this day
	}

	const avail = availability as { start_time: string; end_time: string };

	// Get existing bookings for this date
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);

	const { data: bookings } = await supabase
		.from('bookings')
		.select('scheduled_at, scheduled_end_at')
		.eq('therapist_id', therapistId)
		.in('status', ['pending', 'confirmed'])
		.gte('scheduled_at', startOfDay.toISOString())
		.lte('scheduled_at', endOfDay.toISOString());

	// Generate available slots
	const slots: string[] = [];
	const startTimeParts = avail.start_time.split(':');
	const endTimeParts = avail.end_time.split(':');
	const startHour = Number(startTimeParts[0]);
	const startMin = Number(startTimeParts[1]);
	const endHour = Number(endTimeParts[0]);
	const endMin = Number(endTimeParts[1]);

	const slotStart = new Date(date);
	slotStart.setHours(startHour, startMin, 0, 0);

	const dayEnd = new Date(date);
	dayEnd.setHours(endHour, endMin, 0, 0);

	const now = new Date();

	while (slotStart.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
		const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

		// Skip if slot is in the past
		if (slotStart > now) {
			// Check for conflicts
			const hasConflict = bookings?.some(booking => {
				const b = booking as { scheduled_at: string; scheduled_end_at: string };
				const bookingStart = new Date(b.scheduled_at);
				const bookingEnd = new Date(b.scheduled_end_at);
				return slotStart < bookingEnd && slotEnd > bookingStart;
			});

			if (!hasConflict) {
				slots.push(slotStart.toISOString());
			}
		}

		// Move to next slot (30-minute intervals)
		slotStart.setMinutes(slotStart.getMinutes() + 30);
	}

	return slots;
}
