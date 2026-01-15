/**
 * Plenura Web Leads API - Forward contact requests to Camino CRM
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const CAMINO_API_URL = env.CAMINO_API_URL || 'https://camino.redbroomsoftware.com';
	const CAMINO_API_KEY = env.CAMINO_API_KEY;

	try {
		const body = await request.json();
		const { name, email, phone, subject, message, interest } = body;

		if (!email?.trim()) {
			return json({ error: 'Email es requerido' }, { status: 400 });
		}

		if (!name?.trim()) {
			return json({ error: 'Nombre es requerido' }, { status: 400 });
		}

		if (!CAMINO_API_KEY) {
			console.log('[Leads] Camino not configured, acknowledging lead locally');
			return json({ success: true, message: 'Mensaje recibido' });
		}

		const response = await fetch(`${CAMINO_API_URL}/api/leads`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${CAMINO_API_KEY}`,
				'Content-Type': 'application/json',
				'X-App-Source': 'plenura-web'
			},
			body: JSON.stringify({
				email,
				name,
				phone: phone || undefined,
				source: 'contact_form',
				industry: 'wellness',
				status: 'new',
				utm_source: 'website',
				utm_medium: 'contact_page',
				utm_campaign: interest || 'general_inquiry',
				interested_products: ['plenura'],
				metadata: {
					subject,
					message,
					interest,
					app: 'plenura',
					captured_at: new Date().toISOString()
				}
			})
		});

		if (!response.ok) {
			console.error('[Leads] Camino API error:', await response.text());
			return json({ success: true, message: 'Mensaje recibido' });
		}

		const result = await response.json();
		console.log(`[Leads] Captured lead: ${email} -> ${result.id}`);

		return json({
			success: true,
			leadId: result.id,
			message: 'Mensaje enviado'
		});
	} catch (error) {
		console.error('[Leads] Error capturing lead:', error);
		return json({ error: 'Error al enviar mensaje' }, { status: 500 });
	}
};
