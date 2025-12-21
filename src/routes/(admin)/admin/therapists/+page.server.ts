import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase } = locals;

	const status = url.searchParams.get('status') ?? 'all';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	let query = supabase
		.from('therapists')
		.select(
			`
			id,
			vetting_status,
			subscription_tier,
			rating_avg,
			rating_count,
			is_available,
			created_at,
			users!inner (
				full_name,
				email,
				phone
			)
		`,
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (status !== 'all') {
		query = query.eq('vetting_status', status);
	}

	const { data: therapists, count } = await query;

	return {
		therapists: therapists ?? [],
		totalCount: count ?? 0,
		currentPage: page,
		totalPages: Math.ceil((count ?? 0) / limit),
		status
	};
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const therapistId = formData.get('therapistId') as string;

		const { error } = await supabase
			.from('therapists')
			.update({ vetting_status: 'approved' })
			.eq('id', therapistId);

		if (error) {
			return fail(500, { error: 'Error al aprobar terapeuta' });
		}

		return { success: true };
	},

	reject: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const therapistId = formData.get('therapistId') as string;

		const { error } = await supabase
			.from('therapists')
			.update({ vetting_status: 'rejected' })
			.eq('id', therapistId);

		if (error) {
			return fail(500, { error: 'Error al rechazar terapeuta' });
		}

		return { success: true };
	},

	suspend: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const therapistId = formData.get('therapistId') as string;

		const { error } = await supabase
			.from('therapists')
			.update({ vetting_status: 'suspended' })
			.eq('id', therapistId);

		if (error) {
			return fail(500, { error: 'Error al suspender terapeuta' });
		}

		return { success: true };
	}
};
