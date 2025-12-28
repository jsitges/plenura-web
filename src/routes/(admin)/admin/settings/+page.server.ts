import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	// Fetch platform settings
	const { data: settings } = await (supabase as any)
		.from('platform_settings')
		.select('*')
		.single();

	// Get platform stats
	const { count: usersCount } = await (supabase as any)
		.from('users')
		.select('*', { count: 'exact', head: true });

	const { count: therapistsCount } = await (supabase as any)
		.from('therapists')
		.select('*', { count: 'exact', head: true });

	const { count: practicesCount } = await (supabase as any)
		.from('practices')
		.select('*', { count: 'exact', head: true });

	const { count: bookingsCount } = await (supabase as any)
		.from('bookings')
		.select('*', { count: 'exact', head: true });

	const { data: revenueData } = await (supabase as any)
		.from('bookings')
		.select('price_cents, commission_cents')
		.eq('status', 'completed');

	const totalRevenue = (revenueData ?? []).reduce((sum: number, b: any) => sum + (b.price_cents ?? 0), 0);
	const totalCommission = (revenueData ?? []).reduce((sum: number, b: any) => sum + (b.commission_cents ?? 0), 0);

	return {
		settings: settings ?? {
			platform_commission_rate: 10,
			min_booking_notice_hours: 24,
			max_booking_advance_days: 60,
			cancellation_window_hours: 24,
			maintenance_mode: false
		},
		stats: {
			usersCount: usersCount ?? 0,
			therapistsCount: therapistsCount ?? 0,
			practicesCount: practicesCount ?? 0,
			bookingsCount: bookingsCount ?? 0,
			totalRevenue,
			totalCommission
		}
	};
};

export const actions: Actions = {
	updateCommission: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const rate = parseFloat(formData.get('rate') as string);

		if (isNaN(rate) || rate < 0 || rate > 50) {
			return fail(400, { error: 'La comisión debe estar entre 0% y 50%' });
		}

		const { error } = await (supabase as any)
			.from('platform_settings')
			.upsert({
				id: 1,
				platform_commission_rate: rate,
				updated_at: new Date().toISOString()
			});

		if (error) {
			console.error('Error updating commission:', error);
			return fail(500, { error: 'Error al actualizar la comisión' });
		}

		return { success: true, message: 'Comisión actualizada' };
	},

	updateBookingRules: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const minNotice = parseInt(formData.get('minNotice') as string);
		const maxAdvance = parseInt(formData.get('maxAdvance') as string);
		const cancellationWindow = parseInt(formData.get('cancellationWindow') as string);

		if (isNaN(minNotice) || minNotice < 0) {
			return fail(400, { error: 'Tiempo mínimo de aviso inválido' });
		}

		if (isNaN(maxAdvance) || maxAdvance < 1) {
			return fail(400, { error: 'Días máximos de anticipación inválido' });
		}

		if (isNaN(cancellationWindow) || cancellationWindow < 0) {
			return fail(400, { error: 'Ventana de cancelación inválida' });
		}

		const { error } = await (supabase as any)
			.from('platform_settings')
			.upsert({
				id: 1,
				min_booking_notice_hours: minNotice,
				max_booking_advance_days: maxAdvance,
				cancellation_window_hours: cancellationWindow,
				updated_at: new Date().toISOString()
			});

		if (error) {
			console.error('Error updating booking rules:', error);
			return fail(500, { error: 'Error al actualizar las reglas' });
		}

		return { success: true, message: 'Reglas de reserva actualizadas' };
	},

	toggleMaintenance: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const enabled = formData.get('enabled') === 'true';

		const { error } = await (supabase as any)
			.from('platform_settings')
			.upsert({
				id: 1,
				maintenance_mode: enabled,
				updated_at: new Date().toISOString()
			});

		if (error) {
			console.error('Error toggling maintenance:', error);
			return fail(500, { error: 'Error al cambiar modo de mantenimiento' });
		}

		return { success: true, message: enabled ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado' };
	}
};
