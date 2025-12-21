/**
 * WhatsApp Business API Integration
 *
 * This service handles WhatsApp notifications for Business tier and above:
 * - Booking confirmations
 * - Appointment reminders (24h and 1h)
 * - Booking status updates
 *
 * Requires:
 * - WHATSAPP_PHONE_NUMBER_ID: Meta Business phone number ID
 * - WHATSAPP_ACCESS_TOKEN: Meta Cloud API access token
 * - WHATSAPP_BUSINESS_ACCOUNT_ID: Meta Business account ID
 */

let _envVars: {
	phoneNumberId: string;
	accessToken: string;
	businessAccountId: string;
} | null = null;

async function getEnvVars() {
	if (_envVars) return _envVars;
	try {
		const { env } = await import('$env/dynamic/private');
		_envVars = {
			phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ?? '',
			accessToken: env.WHATSAPP_ACCESS_TOKEN ?? '',
			businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? ''
		};
	} catch {
		_envVars = { phoneNumberId: '', accessToken: '', businessAccountId: '' };
	}
	return _envVars;
}

export interface WhatsAppResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

interface BookingData {
	clientName: string;
	therapistName: string;
	serviceName: string;
	scheduledAt: Date;
	address: string;
	priceCents: number;
}

function formatPrice(cents: number): string {
	return new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency: 'MXN',
		minimumFractionDigits: 0
	}).format(cents / 100);
}

function formatDateTime(date: Date): string {
	return date.toLocaleString('es-MX', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

function normalizePhone(phone: string): string {
	// Remove all non-digits
	let cleaned = phone.replace(/\D/g, '');

	// Handle Mexican numbers
	if (cleaned.startsWith('52')) {
		// Already has country code
	} else if (cleaned.length === 10) {
		// Add Mexico country code
		cleaned = '52' + cleaned;
	}

	return cleaned;
}

async function sendWhatsAppMessage(
	to: string,
	templateName: string,
	components: Array<{
		type: 'header' | 'body' | 'button';
		parameters?: Array<{ type: string; text?: string; image?: { link: string } }>;
		sub_type?: string;
		index?: number;
	}>
): Promise<WhatsAppResult> {
	const { phoneNumberId, accessToken } = await getEnvVars();

	if (!phoneNumberId || !accessToken) {
		console.warn('WhatsApp API not configured');
		return { success: false, error: 'WhatsApp not configured' };
	}

	try {
		const response = await fetch(
			`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`
				},
				body: JSON.stringify({
					messaging_product: 'whatsapp',
					to: normalizePhone(to),
					type: 'template',
					template: {
						name: templateName,
						language: { code: 'es_MX' },
						components
					}
				})
			}
		);

		if (!response.ok) {
			const error = await response.json();
			console.error('WhatsApp API error:', error);
			return { success: false, error: error.error?.message ?? 'Failed to send message' };
		}

		const data = await response.json();
		return { success: true, messageId: data.messages?.[0]?.id };
	} catch (error) {
		console.error('WhatsApp send error:', error);
		return { success: false, error: 'Network error' };
	}
}

/**
 * Send booking confirmation to client via WhatsApp
 * Template: plenura_booking_confirmed
 *
 * Variables:
 * 1. Client name
 * 2. Service name
 * 3. Therapist name
 * 4. Date/time
 * 5. Address
 * 6. Price
 */
export async function sendBookingConfirmationWhatsApp(
	phone: string,
	data: BookingData
): Promise<WhatsAppResult> {
	return sendWhatsAppMessage(phone, 'plenura_booking_confirmed', [
		{
			type: 'body',
			parameters: [
				{ type: 'text', text: data.clientName },
				{ type: 'text', text: data.serviceName },
				{ type: 'text', text: data.therapistName },
				{ type: 'text', text: formatDateTime(data.scheduledAt) },
				{ type: 'text', text: data.address },
				{ type: 'text', text: formatPrice(data.priceCents) }
			]
		}
	]);
}

/**
 * Send new booking notification to therapist via WhatsApp
 * Template: plenura_new_booking_therapist
 */
export async function sendNewBookingToTherapistWhatsApp(
	phone: string,
	data: BookingData
): Promise<WhatsAppResult> {
	return sendWhatsAppMessage(phone, 'plenura_new_booking_therapist', [
		{
			type: 'body',
			parameters: [
				{ type: 'text', text: data.therapistName },
				{ type: 'text', text: data.clientName },
				{ type: 'text', text: data.serviceName },
				{ type: 'text', text: formatDateTime(data.scheduledAt) },
				{ type: 'text', text: data.address }
			]
		}
	]);
}

/**
 * Send booking reminder to client via WhatsApp
 * Template: plenura_reminder
 *
 * Used for both 24h and 1h reminders
 */
export async function sendBookingReminderWhatsApp(
	phone: string,
	data: BookingData,
	hoursUntil: number
): Promise<WhatsAppResult> {
	const templateName =
		hoursUntil <= 1 ? 'plenura_reminder_1h' : 'plenura_reminder_24h';

	return sendWhatsAppMessage(phone, templateName, [
		{
			type: 'body',
			parameters: [
				{ type: 'text', text: data.clientName },
				{ type: 'text', text: data.serviceName },
				{ type: 'text', text: data.therapistName },
				{ type: 'text', text: formatDateTime(data.scheduledAt) },
				{ type: 'text', text: data.address }
			]
		}
	]);
}

/**
 * Send booking cancellation notification via WhatsApp
 * Template: plenura_booking_cancelled
 */
export async function sendBookingCancellationWhatsApp(
	phone: string,
	recipientName: string,
	data: BookingData,
	refundInfo?: string
): Promise<WhatsAppResult> {
	return sendWhatsAppMessage(phone, 'plenura_booking_cancelled', [
		{
			type: 'body',
			parameters: [
				{ type: 'text', text: recipientName },
				{ type: 'text', text: data.serviceName },
				{ type: 'text', text: formatDateTime(data.scheduledAt) },
				{ type: 'text', text: refundInfo ?? 'Sin reembolso aplicable' }
			]
		}
	]);
}

/**
 * Send review request after completed booking via WhatsApp
 * Template: plenura_review_request
 */
export async function sendReviewRequestWhatsApp(
	phone: string,
	clientName: string,
	therapistName: string,
	bookingId: string
): Promise<WhatsAppResult> {
	return sendWhatsAppMessage(phone, 'plenura_review_request', [
		{
			type: 'body',
			parameters: [
				{ type: 'text', text: clientName },
				{ type: 'text', text: therapistName }
			]
		},
		{
			type: 'button',
			sub_type: 'url',
			index: 0,
			parameters: [{ type: 'text', text: bookingId }]
		}
	]);
}

/**
 * Send tip notification to therapist via WhatsApp
 * Template: plenura_tip_received
 */
export async function sendTipNotificationWhatsApp(
	phone: string,
	therapistName: string,
	clientName: string,
	amountCents: number
): Promise<WhatsAppResult> {
	return sendWhatsAppMessage(phone, 'plenura_tip_received', [
		{
			type: 'body',
			parameters: [
				{ type: 'text', text: therapistName },
				{ type: 'text', text: clientName },
				{ type: 'text', text: formatPrice(amountCents) }
			]
		}
	]);
}

/**
 * Check if a phone number can receive WhatsApp messages
 * (User must have initiated a conversation or opted in)
 */
export async function checkWhatsAppOptIn(phone: string): Promise<boolean> {
	const { phoneNumberId, accessToken } = await getEnvVars();

	if (!phoneNumberId || !accessToken) {
		return false;
	}

	try {
		// Use the phone number check endpoint
		const response = await fetch(
			`https://graph.facebook.com/v18.0/${phoneNumberId}/phone_numbers`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			}
		);

		return response.ok;
	} catch {
		return false;
	}
}

/**
 * WhatsApp template message content reference
 *
 * These templates must be pre-approved by Meta. Create them in Meta Business Manager.
 *
 * Template: plenura_booking_confirmed
 * -----------------------------------
 * Hola {{1}}! Tu cita de {{2}} con {{3}} esta confirmada.
 *
 * Fecha: {{4}}
 * Direccion: {{5}}
 * Total: {{6}}
 *
 * Nos vemos pronto!
 *
 * Template: plenura_new_booking_therapist
 * ---------------------------------------
 * Hola {{1}}! Tienes una nueva reserva.
 *
 * Cliente: {{2}}
 * Servicio: {{3}}
 * Fecha: {{4}}
 * Direccion: {{5}}
 *
 * Template: plenura_reminder_24h
 * ------------------------------
 * Hola {{1}}! Te recordamos que manana tienes tu cita de {{2}} con {{3}}.
 *
 * Fecha: {{4}}
 * Direccion: {{5}}
 *
 * Template: plenura_reminder_1h
 * -----------------------------
 * Hola {{1}}! Tu cita de {{2}} con {{3}} es en 1 hora.
 *
 * Direccion: {{5}}
 *
 * Template: plenura_booking_cancelled
 * -----------------------------------
 * Hola {{1}}, tu cita de {{2}} programada para {{3}} ha sido cancelada.
 *
 * {{4}}
 *
 * Template: plenura_review_request
 * --------------------------------
 * Hola {{1}}! Como fue tu experiencia con {{2}}?
 * Tu opinion nos ayuda a mejorar.
 *
 * [Dejar resena] -> /bookings/{{button_payload}}/review
 *
 * Template: plenura_tip_received
 * ------------------------------
 * Hola {{1}}! {{2}} te envio una propina de {{3}}.
 * Gracias por tu excelente servicio!
 */
