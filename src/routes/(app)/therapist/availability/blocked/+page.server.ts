import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	// Get therapist ID
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', user!.id)
		.single();

	if (!therapist) {
		throw redirect(303, '/therapist');
	}

	// Get blocked periods
	const { data: blockedPeriods } = await supabase
		.from('blocked_periods')
		.select('*')
		.eq('therapist_id', therapist.id)
		.order('start_date', { ascending: false });

	return {
		blockedPeriods: blockedPeriods ?? []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();

		// Get therapist ID
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const startDate = formData.get('start_date') as string;
		const endDate = formData.get('end_date') as string;
		const reason = formData.get('reason') as string;

		if (!startDate || !endDate) {
			return fail(400, { error: 'Las fechas son requeridas' });
		}

		// Validate dates
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (start > end) {
			return fail(400, { error: 'La fecha de inicio debe ser anterior a la fecha de fin' });
		}

		// Create blocked period
		const { error } = await supabase
			.from('blocked_periods')
			.insert({
				therapist_id: therapist.id,
				start_date: startDate,
				end_date: endDate,
				reason: reason || null
			});

		if (error) {
			console.error('Error creating blocked period:', error);
			return fail(500, { error: 'Error al crear el período bloqueado' });
		}

		return { success: true, message: 'Período bloqueado creado correctamente' };
	},

	delete: async ({ request, locals }) => {
		const { supabase, user } = locals;
		const formData = await request.formData();

		// Get therapist ID
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const periodId = formData.get('period_id') as string;

		if (!periodId) {
			return fail(400, { error: 'ID de período requerido' });
		}

		// Delete the blocked period
		const { error } = await supabase
			.from('blocked_periods')
			.delete()
			.eq('id', periodId)
			.eq('therapist_id', therapist.id); // Ensure it belongs to this therapist

		if (error) {
			console.error('Error deleting blocked period:', error);
			return fail(500, { error: 'Error al eliminar el período bloqueado' });
		}

		return { success: true, message: 'Período bloqueado eliminado' };
	}
};
