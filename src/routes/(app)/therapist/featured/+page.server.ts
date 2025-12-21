import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const FEATURED_PACKAGES = [
	{
		id: 'week',
		name: '1 Semana',
		days: 7,
		priceCents: 9900, // $99 MXN
		savings: null
	},
	{
		id: 'month',
		name: '1 Mes',
		days: 30,
		priceCents: 29900, // $299 MXN
		savings: 25 // 25% savings
	},
	{
		id: 'quarter',
		name: '3 Meses',
		days: 90,
		priceCents: 69900, // $699 MXN
		savings: 35 // 35% savings
	}
];

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	// Get therapist profile
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id, is_featured, featured_until')
		.eq('user_id', user!.id)
		.single();

	return {
		therapist,
		packages: FEATURED_PACKAGES
	};
};

export const actions: Actions = {
	purchase: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();
		const packageId = formData.get('packageId') as string;

		const selectedPackage = FEATURED_PACKAGES.find((p) => p.id === packageId);
		if (!selectedPackage) {
			return fail(400, { error: 'Paquete no válido' });
		}

		// Get therapist
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id, featured_until')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(404, { error: 'Perfil de terapeuta no encontrado' });
		}

		// Calculate new featured_until date
		const currentEnd = therapist.featured_until
			? new Date(therapist.featured_until)
			: new Date();
		const newEnd = new Date(
			Math.max(currentEnd.getTime(), Date.now()) + selectedPackage.days * 24 * 60 * 60 * 1000
		);

		// In production, this would integrate with payment gateway
		// For now, we'll simulate the purchase
		const { error } = await supabase
			.from('therapists')
			.update({
				is_featured: true,
				featured_until: newEnd.toISOString()
			})
			.eq('id', therapist.id);

		if (error) {
			return fail(500, { error: 'Error al procesar la compra' });
		}

		return {
			success: true,
			message: `¡Tu perfil será destacado hasta el ${newEnd.toLocaleDateString('es-MX')}!`
		};
	}
};
