import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const SUBSCRIPTION_TIERS = [
	{
		id: 'free',
		name: 'Gratis',
		priceCents: 0,
		commission: 10,
		features: [
			'5 reservas por mes',
			'Perfil básico',
			'Soporte por email'
		],
		limits: {
			monthlyBookings: 5
		}
	},
	{
		id: 'pro',
		name: 'Pro',
		priceCents: 29900, // $299 MXN/month
		commission: 5,
		features: [
			'Reservas ilimitadas',
			'5% de comisión',
			'Perfil destacado',
			'Estadísticas avanzadas',
			'Soporte prioritario'
		],
		limits: {
			monthlyBookings: -1 // unlimited
		},
		popular: true
	},
	{
		id: 'business',
		name: 'Business',
		priceCents: 69900, // $699 MXN/month
		commission: 3,
		features: [
			'Reservas ilimitadas',
			'3% de comisión',
			'Notificaciones WhatsApp',
			'Recordatorios automáticos',
			'Reportes mensuales',
			'Soporte 24/7'
		],
		limits: {
			monthlyBookings: -1
		}
	},
	{
		id: 'enterprise',
		name: 'Enterprise',
		priceCents: 129900, // $1,299 MXN/month
		commission: 0,
		features: [
			'Sin comisión',
			'Facturación incluida',
			'API access',
			'Marca blanca',
			'Gerente de cuenta dedicado',
			'Integraciones personalizadas'
		],
		limits: {
			monthlyBookings: -1
		}
	}
];

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user, therapistProfile } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	if (!therapistProfile) {
		throw redirect(303, '/dashboard');
	}

	// Get subscription history
	const { data: subscriptionHistory } = await supabase
		.from('subscription_history')
		.select('*')
		.eq('therapist_id', therapistProfile.id)
		.order('created_at', { ascending: false })
		.limit(5);

	return {
		currentTier: therapistProfile.subscription_tier ?? 'free',
		monthlyBookingCount: therapistProfile.monthly_booking_count ?? 0,
		tiers: SUBSCRIPTION_TIERS,
		subscriptionHistory: subscriptionHistory ?? []
	};
};

export const actions: Actions = {
	upgrade: async ({ request, locals }) => {
		const { supabase, user, therapistProfile } = locals;

		if (!user || !therapistProfile) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const tierId = formData.get('tierId') as string;

		const selectedTier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
		if (!selectedTier) {
			return fail(400, { error: 'Plan no válido' });
		}

		if (selectedTier.id === 'free') {
			// Downgrade to free
			const { error } = await supabase
				.from('therapists')
				.update({ subscription_tier: 'free' })
				.eq('id', therapistProfile.id);

			if (error) {
				return fail(500, { error: 'Error al cambiar plan' });
			}

			return { success: true, message: 'Plan actualizado a Gratis' };
		}

		// For paid tiers, in production this would redirect to payment
		// For now, we'll simulate the upgrade
		const { error } = await supabase
			.from('therapists')
			.update({ subscription_tier: selectedTier.id })
			.eq('id', therapistProfile.id);

		if (error) {
			return fail(500, { error: 'Error al procesar la suscripción' });
		}

		// Record subscription change
		await supabase.from('subscription_history').insert({
			therapist_id: therapistProfile.id,
			tier: selectedTier.id,
			price_cents: selectedTier.priceCents,
			status: 'active'
		});

		return {
			success: true,
			message: `¡Bienvenido al plan ${selectedTier.name}!`
		};
	}
};
