import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase } = locals;

	// Get filter params
	const search = url.searchParams.get('search') ?? '';
	const role = url.searchParams.get('role') ?? 'all';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	// Build query
	let query = (supabase as any)
		.from('users')
		.select(`
			id,
			email,
			full_name,
			phone,
			avatar_url,
			role,
			created_at,
			last_sign_in_at,
			is_blocked,
			therapists (id),
			practice_members (id)
		`, { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// Apply search filter
	if (search) {
		query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
	}

	// Apply role filter
	if (role !== 'all') {
		query = query.eq('role', role);
	}

	const { data: users, count, error } = await query;

	if (error) {
		console.error('Error fetching users:', error);
	}

	// Get role counts
	const { data: allUsers } = await (supabase as any)
		.from('users')
		.select('role');

	const roleCounts = {
		all: allUsers?.length ?? 0,
		client: allUsers?.filter((u: any) => u.role === 'client').length ?? 0,
		therapist: allUsers?.filter((u: any) => u.role === 'therapist').length ?? 0,
		admin: allUsers?.filter((u: any) => u.role === 'admin').length ?? 0
	};

	return {
		users: (users ?? []).map((u: any) => ({
			id: u.id,
			email: u.email,
			full_name: u.full_name,
			phone: u.phone,
			avatar_url: u.avatar_url,
			role: u.role,
			created_at: u.created_at,
			last_sign_in_at: u.last_sign_in_at,
			is_blocked: u.is_blocked ?? false,
			is_therapist: !!u.therapists?.length,
			is_practice_member: !!u.practice_members?.length
		})),
		totalCount: count ?? 0,
		currentPage: page,
		totalPages: Math.ceil((count ?? 0) / limit),
		roleCounts,
		filters: { search, role }
	};
};

export const actions: Actions = {
	blockUser: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'ID de usuario requerido' });
		}

		const { error } = await (supabase as any)
			.from('users')
			.update({ is_blocked: true })
			.eq('id', userId);

		if (error) {
			return fail(500, { error: 'Error al bloquear usuario' });
		}

		return { success: true, message: 'Usuario bloqueado' };
	},

	unblockUser: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'ID de usuario requerido' });
		}

		const { error } = await (supabase as any)
			.from('users')
			.update({ is_blocked: false })
			.eq('id', userId);

		if (error) {
			return fail(500, { error: 'Error al desbloquear usuario' });
		}

		return { success: true, message: 'Usuario desbloqueado' };
	},

	updateRole: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const newRole = formData.get('role') as string;

		if (!userId || !newRole) {
			return fail(400, { error: 'Datos incompletos' });
		}

		const validRoles = ['client', 'therapist', 'admin'];
		if (!validRoles.includes(newRole)) {
			return fail(400, { error: 'Rol inválido' });
		}

		const { error } = await (supabase as any)
			.from('users')
			.update({ role: newRole })
			.eq('id', userId);

		if (error) {
			return fail(500, { error: 'Error al actualizar rol' });
		}

		return { success: true, message: 'Rol actualizado' };
	}
};
