import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { submitSupportTicket, getFAQs, type TicketCategory } from '$lib/services/support.service';

export const load: PageServerLoad = async ({ locals }) => {
	const faqs = getFAQs();

	return {
		faqs,
		user: locals.user,
		userProfile: locals.userProfile
	};
};

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const formData = await request.formData();

		const category = formData.get('category') as TicketCategory;
		const subject = formData.get('subject') as string;
		const description = formData.get('description') as string;
		const email = formData.get('email') as string;
		const name = formData.get('name') as string;
		const bookingId = formData.get('bookingId') as string | null;

		// Validation
		if (!category || !subject || !description || !email || !name) {
			return fail(400, {
				error: 'Todos los campos son requeridos',
				values: { category, subject, description, email, name }
			});
		}

		if (subject.length < 5) {
			return fail(400, {
				error: 'El asunto debe tener al menos 5 caracteres',
				values: { category, subject, description, email, name }
			});
		}

		if (description.length < 20) {
			return fail(400, {
				error: 'La descripción debe tener al menos 20 caracteres',
				values: { category, subject, description, email, name }
			});
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				error: 'Por favor ingresa un correo válido',
				values: { category, subject, description, email, name }
			});
		}

		const result = await submitSupportTicket(locals.supabase, {
			category,
			subject,
			description,
			email,
			name,
			userId: locals.user?.id,
			bookingId: bookingId ?? undefined,
			source: 'plenura'
		});

		if (!result.success) {
			return fail(500, {
				error: result.error ?? 'Error al enviar el ticket',
				values: { category, subject, description, email, name }
			});
		}

		return {
			success: true,
			ticketId: result.ticketId
		};
	}
};
