import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	// Get therapist ID and settings
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id, is_available, smart_schedule_grouping')
		.eq('user_id', user!.id)
		.single();

	if (!therapist) {
		return { availability: [], isAvailable: false, smartScheduleGrouping: false };
	}

	// Get availability slots
	const { data: availability } = await supabase
		.from('availability')
		.select('*')
		.eq('therapist_id', therapist.id)
		.order('day_of_week', { ascending: true });

	return {
		availability: availability ?? [],
		isAvailable: therapist.is_available,
		smartScheduleGrouping: (therapist as { smart_schedule_grouping: boolean }).smart_schedule_grouping ?? false
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
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

		// Parse the availability data - now supporting multiple slots per day
		const slots: Array<{
			day_of_week: number;
			start_time: string;
			end_time: string;
			is_active: boolean;
		}> = [];

		for (let day = 0; day < 7; day++) {
			const isActive = formData.get(`day_${day}_active`) === 'on';
			const slotCount = parseInt(formData.get(`day_${day}_slot_count`) as string) || 0;

			if (isActive && slotCount > 0) {
				// Process each time slot for this day
				for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
					const startTime = formData.get(`day_${day}_slot_${slotIndex}_start`) as string;
					const endTime = formData.get(`day_${day}_slot_${slotIndex}_end`) as string;

					if (startTime && endTime) {
						slots.push({
							day_of_week: day,
							start_time: startTime,
							end_time: endTime,
							is_active: true
						});
					}
				}
			}
		}

		// Delete existing availability
		await supabase
			.from('availability')
			.delete()
			.eq('therapist_id', therapist.id);

		// Insert new availability
		if (slots.length > 0) {
			const { error } = await supabase
				.from('availability')
				.insert(slots.map(slot => ({
					...slot,
					therapist_id: therapist.id
				})));

			if (error) {
				console.error('Error saving availability:', error);
				return fail(500, { error: 'Error al guardar la disponibilidad' });
			}
		}

		return { success: true };
	},

	toggleAvailable: async ({ locals }) => {
		const { supabase, user } = locals;

		// Get therapist
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id, is_available')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const { error } = await supabase
			.from('therapists')
			.update({ is_available: !therapist.is_available })
			.eq('id', therapist.id);

		if (error) {
			return fail(500, { error: 'Error al actualizar disponibilidad' });
		}

		return { success: true };
	},

	toggleSmartGrouping: async ({ locals }) => {
		const { supabase, user } = locals;

		// Get therapist
		const { data: therapist } = await supabase
			.from('therapists')
			.select('id, smart_schedule_grouping')
			.eq('user_id', user!.id)
			.single();

		if (!therapist) {
			return fail(403, { error: 'No autorizado' });
		}

		const currentValue = (therapist as { smart_schedule_grouping: boolean }).smart_schedule_grouping ?? false;

		const { error } = await supabase
			.from('therapists')
			.update({ smart_schedule_grouping: !currentValue } as never)
			.eq('id', therapist.id);

		if (error) {
			return fail(500, { error: 'Error al actualizar configuración' });
		}

		return { success: true };
	}
};
