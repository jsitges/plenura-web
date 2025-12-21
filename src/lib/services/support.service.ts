import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$types/database.types';
import { env } from '$env/dynamic/private';

export type TicketCategory =
	| 'booking'
	| 'payment'
	| 'account'
	| 'therapist'
	| 'technical'
	| 'feedback'
	| 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
	category: TicketCategory;
	subject: string;
	description: string;
	email: string;
	name: string;
	userId?: string;
	bookingId?: string;
	attachments?: string[];
	priority?: TicketPriority;
	source: 'plenura';
}

export interface TicketResponse {
	success: boolean;
	ticketId?: string;
	error?: string;
}

/**
 * Submit a support ticket to Camino CRM
 */
export async function submitSupportTicket(
	supabase: SupabaseClient<Database>,
	ticket: SupportTicket
): Promise<TicketResponse> {
	try {
		// Store ticket locally first for redundancy
		const { data: localTicket, error: localError } = await supabase
			.from('support_tickets')
			.insert({
				category: ticket.category,
				subject: ticket.subject,
				description: ticket.description,
				email: ticket.email,
				name: ticket.name,
				user_id: ticket.userId,
				booking_id: ticket.bookingId,
				priority: ticket.priority ?? 'medium',
				status: 'open',
				source: 'plenura'
			})
			.select('id')
			.single();

		if (localError) {
			console.error('Error storing local ticket:', localError);
		}

		// Submit to Camino CRM
		const caminoResponse = await submitToCamino(ticket, localTicket?.id);

		if (!caminoResponse.success && localTicket?.id) {
			// Update local ticket with error status
			await supabase
				.from('support_tickets')
				.update({
					camino_sync_status: 'failed',
					camino_error: caminoResponse.error
				})
				.eq('id', localTicket.id);
		} else if (caminoResponse.success && localTicket?.id) {
			// Update local ticket with Camino reference
			await supabase
				.from('support_tickets')
				.update({
					camino_ticket_id: caminoResponse.ticketId,
					camino_sync_status: 'synced'
				})
				.eq('id', localTicket.id);
		}

		return {
			success: true,
			ticketId: localTicket?.id ?? caminoResponse.ticketId
		};
	} catch (error) {
		console.error('Error submitting support ticket:', error);
		return {
			success: false,
			error: 'Error al enviar el ticket. Por favor intenta nuevamente.'
		};
	}
}

/**
 * Submit ticket to Camino CRM API
 */
async function submitToCamino(
	ticket: SupportTicket,
	localTicketId?: string
): Promise<TicketResponse> {
	const CAMINO_API_URL = env.CAMINO_API_URL;
	const CAMINO_API_KEY = env.CAMINO_API_KEY;

	// If Camino API is not configured, just log and return success
	if (!CAMINO_API_URL || !CAMINO_API_KEY) {
		console.log('Camino API not configured, ticket stored locally only');
		return { success: true };
	}

	try {
		const response = await fetch(`${CAMINO_API_URL}/api/tickets`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${CAMINO_API_KEY}`,
				'X-Source': 'plenura'
			},
			body: JSON.stringify({
				...ticket,
				externalId: localTicketId,
				createdAt: new Date().toISOString()
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message ?? `HTTP ${response.status}`);
		}

		const data = await response.json();
		return {
			success: true,
			ticketId: data.ticketId
		};
	} catch (error) {
		console.error('Error submitting to Camino:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error connecting to Camino'
		};
	}
}

/**
 * Get user's support tickets
 */
export async function getUserTickets(
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<Array<{
	id: string;
	category: string;
	subject: string;
	status: string;
	created_at: string;
	updated_at: string;
}>> {
	const { data, error } = await supabase
		.from('support_tickets')
		.select('id, category, subject, status, created_at, updated_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(20);

	if (error) {
		console.error('Error fetching user tickets:', error);
		return [];
	}

	return data ?? [];
}

/**
 * Get FAQ items for support page
 */
export function getFAQs(): Array<{
	question: string;
	answer: string;
	category: TicketCategory;
}> {
	return [
		{
			category: 'booking',
			question: '¿Cómo puedo cancelar una reserva?',
			answer: 'Puedes cancelar tu reserva desde la sección "Mis Citas" en tu dashboard. Recuerda que si cancelas con más de 24 horas de anticipación recibirás un reembolso completo, entre 12-24 horas el 50%, y menos de 12 horas no hay reembolso.'
		},
		{
			category: 'booking',
			question: '¿Puedo reagendar mi cita?',
			answer: 'Sí, puedes reagendar tu cita desde la sección "Mis Citas". Las mismas políticas de cancelación aplican - solo puedes reagendar si hay disponibilidad con el terapeuta.'
		},
		{
			category: 'payment',
			question: '¿Cuándo me cobran por el servicio?',
			answer: 'El cobro se realiza al momento de confirmar la reserva. El monto se mantiene en garantía hasta que el servicio sea completado satisfactoriamente.'
		},
		{
			category: 'payment',
			question: '¿Cómo recibo mi reembolso?',
			answer: 'Los reembolsos se procesan automáticamente al método de pago original. El tiempo de reflejo depende de tu banco (usualmente 3-5 días hábiles).'
		},
		{
			category: 'payment',
			question: '¿Cómo puedo dar propina a mi terapeuta?',
			answer: 'Al finalizar el servicio, recibirás una notificación para calificar y opcionalmente dar propina. El 100% de las propinas van directamente al terapeuta.'
		},
		{
			category: 'therapist',
			question: '¿Cómo me registro como terapeuta?',
			answer: 'Ve a la sección "Soy Terapeuta" en el menú principal y completa el formulario de registro. Necesitarás proporcionar identificación oficial, comprobante de domicilio y credenciales profesionales para el proceso de verificación.'
		},
		{
			category: 'therapist',
			question: '¿Cuánto cobra Plenura de comisión?',
			answer: 'La comisión varía según tu plan: Free (10%), Profesional (5%), Business (3%), Enterprise (0%). Además, las propinas siempre son 100% para ti.'
		},
		{
			category: 'therapist',
			question: '¿Cuándo recibo mis pagos?',
			answer: 'Los pagos se procesan automáticamente después de que el cliente confirma el servicio completado. El depósito llega a tu cuenta en 1-3 días hábiles.'
		},
		{
			category: 'account',
			question: '¿Cómo cambio mi contraseña?',
			answer: 'Ve a Configuración > Seguridad en tu perfil. También puedes usar la opción "Olvidé mi contraseña" en la pantalla de inicio de sesión.'
		},
		{
			category: 'account',
			question: '¿Puedo eliminar mi cuenta?',
			answer: 'Sí, puedes solicitar la eliminación de tu cuenta desde Configuración > Privacidad. Ten en cuenta que esto eliminará permanentemente todos tus datos según nuestra política de privacidad.'
		},
		{
			category: 'technical',
			question: 'La aplicación no carga correctamente',
			answer: 'Intenta cerrar sesión y volver a entrar, o limpia la caché de tu navegador. Si el problema persiste, contáctanos describiendo el error.'
		}
	];
}
