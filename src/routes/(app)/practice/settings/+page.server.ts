import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

// Helper to get practice ID from user session
async function getPracticeId(supabase: any, userId: string): Promise<string | null> {
	const { data: membership } = await supabase
		.from('practice_members')
		.select('practice_id')
		.eq('user_id', userId)
		.in('role', ['owner', 'admin', 'manager'])
		.single();
	return membership?.practice_id ?? null;
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const practiceId = parentData.membership.practice_id;

	// Fetch practice details with all settings
	const { data: practice } = await (supabase as any)
		.from('practices')
		.select(`
			id,
			name,
			description,
			phone,
			email,
			website,
			address,
			city,
			state,
			postal_code,
			logo_url,
			booking_mode,
			payout_routing,
			default_commission_rate,
			verification_status,
			subscription_tier
		`)
		.eq('id', practiceId)
		.single();

	return {
		practice: practice ?? null
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			return fail(401, { error: 'No autenticado' });
		}

		const practiceId = await getPracticeId(supabase, session.user.id);
		if (!practiceId) {
			return fail(403, { error: 'No tienes acceso a esta práctica' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const phone = formData.get('phone') as string;
		const email = formData.get('email') as string;
		const website = formData.get('website') as string;
		const address = formData.get('address') as string;
		const city = formData.get('city') as string;
		const state = formData.get('state') as string;
		const postal_code = formData.get('postal_code') as string;

		if (!name) {
			return fail(400, { error: 'El nombre es requerido' });
		}

		const { error } = await (supabase as any)
			.from('practices')
			.update({
				name,
				description,
				phone,
				email,
				website,
				address,
				city,
				state,
				postal_code,
				updated_at: new Date().toISOString()
			})
			.eq('id', practiceId);

		if (error) {
			return fail(500, { error: 'Error al actualizar el perfil' });
		}

		return { success: true, message: 'Perfil actualizado' };
	},

	updateBookingSettings: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			return fail(401, { error: 'No autenticado' });
		}

		const practiceId = await getPracticeId(supabase, session.user.id);
		if (!practiceId) {
			return fail(403, { error: 'No tienes acceso a esta práctica' });
		}

		const formData = await request.formData();
		const booking_mode = formData.get('booking_mode') as string;
		const payout_routing = formData.get('payout_routing') as string;
		const default_commission_rate = parseFloat(formData.get('default_commission_rate') as string) || 0;

		if (!['therapist_direct', 'practice_assigns', 'hybrid'].includes(booking_mode)) {
			return fail(400, { error: 'Modo de reserva inválido' });
		}

		if (!['therapist_wallet', 'practice_wallet', 'split'].includes(payout_routing)) {
			return fail(400, { error: 'Modo de pago inválido' });
		}

		if (default_commission_rate < 0 || default_commission_rate > 100) {
			return fail(400, { error: 'La comisión debe estar entre 0 y 100%' });
		}

		const { error } = await (supabase as any)
			.from('practices')
			.update({
				booking_mode,
				payout_routing,
				default_commission_rate,
				updated_at: new Date().toISOString()
			})
			.eq('id', practiceId);

		if (error) {
			return fail(500, { error: 'Error al actualizar configuración' });
		}

		return { success: true, message: 'Configuración de reservas actualizada' };
	},

	uploadLogo: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			return fail(401, { error: 'No autenticado' });
		}

		const practiceId = await getPracticeId(supabase, session.user.id);
		if (!practiceId) {
			return fail(403, { error: 'No tienes acceso a esta práctica' });
		}

		const formData = await request.formData();
		const file = formData.get('logo') as File;

		if (!file || file.size === 0) {
			return fail(400, { error: 'No se seleccionó ningún archivo' });
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			return fail(400, { error: 'El archivo es muy grande. Máximo 5MB' });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return fail(400, { error: 'Solo se permiten imágenes JPG, PNG o WebP' });
		}

		const ext = file.name.split('.').pop();
		const filename = `${practiceId}/logo.${ext}`;

		const { error: uploadError } = await supabase.storage
			.from('practice-logos')
			.upload(filename, file, { cacheControl: '3600', upsert: true });

		if (uploadError) {
			console.error('Upload error:', uploadError);
			return fail(500, { error: 'Error al subir el logo' });
		}

		const { data: urlData } = supabase.storage.from('practice-logos').getPublicUrl(filename);

		await (supabase as any)
			.from('practices')
			.update({ logo_url: urlData.publicUrl })
			.eq('id', practiceId);

		return { success: true, message: 'Logo actualizado' };
	}
};
