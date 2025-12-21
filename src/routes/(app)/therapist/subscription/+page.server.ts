import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const SUBSCRIPTION_TIERS = {
	free: {
		name: 'Free',
		price: 0,
		commission: 10,
		features: ['Hasta 5 citas/mes', 'Perfil básico', 'Soporte por email']
	},
	pro: {
		name: 'Pro',
		price: 299,
		commission: 5,
		features: ['Citas ilimitadas', 'Perfil destacado', 'Estadísticas avanzadas', 'Soporte prioritario']
	},
	business: {
		name: 'Business',
		price: 699,
		commission: 3,
		features: [
			'Todo de Pro',
			'Integración WhatsApp',
			'Multi-ubicación',
			'Recordatorios automáticos',
			'Facturación automática'
		]
	},
	enterprise: {
		name: 'Enterprise',
		price: 1299,
		commission: 0,
		features: [
			'Todo de Business',
			'0% comisión',
			'Account manager dedicado',
			'API access',
			'Personalización de marca',
			'Reportes personalizados'
		]
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: therapist } = await supabase
		.from('therapists')
		.select('id, subscription_tier, subscription_expires_at')
		.eq('user_id', user.id)
		.single();

	if (!therapist) {
		throw redirect(303, '/dashboard');
	}

	const t = therapist as {
		id: string;
		subscription_tier: string;
		subscription_expires_at: string | null;
	};

	return {
		currentTier: t.subscription_tier ?? 'free',
		expiresAt: t.subscription_expires_at,
		tiers: SUBSCRIPTION_TIERS
	};
};

export const actions: Actions = {
	upgrade: async ({ request, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const tier = formData.get('tier') as string;

		if (!tier || !['pro', 'business', 'enterprise'].includes(tier)) {
			return fail(400, { error: 'Plan no válido' });
		}

		// In a real implementation, this would:
		// 1. Create a Stripe/payment checkout session
		// 2. Redirect to payment
		// 3. On webhook success, update the subscription

		// For now, we'll just simulate the upgrade
		const expiresAt = new Date();
		expiresAt.setMonth(expiresAt.getMonth() + 1);

		const { error } = await supabase
			.from('therapists')
			.update({
				subscription_tier: tier,
				subscription_expires_at: expiresAt.toISOString()
			})
			.eq('user_id', user.id);

		if (error) {
			return fail(500, { error: 'Error al actualizar suscripción' });
		}

		return { success: true, message: `¡Bienvenido al plan ${SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS].name}!` };
	},

	cancel: async ({ locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const { error } = await supabase
			.from('therapists')
			.update({
				subscription_tier: 'free',
				subscription_expires_at: null
			})
			.eq('user_id', user.id);

		if (error) {
			return fail(500, { error: 'Error al cancelar suscripción' });
		}

		return { success: true, message: 'Suscripción cancelada. Volverás al plan Free.' };
	}
};
