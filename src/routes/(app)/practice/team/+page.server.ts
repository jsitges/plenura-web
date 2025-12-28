import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const practiceId = parentData.membership.practice_id;
	const userRole = parentData.membership.role;

	// Get team members
	const { data: members } = await (supabase as any)
		.from('practice_members')
		.select(`
			id,
			user_id,
			role,
			title,
			status,
			joined_at,
			users!inner (
				full_name,
				email,
				avatar_url
			),
			therapists (
				id,
				verification_status,
				rating_avg,
				is_available
			)
		`)
		.eq('practice_id', practiceId)
		.eq('status', 'active')
		.order('role', { ascending: true });

	// Get pending invitations
	const { data: pendingInvites } = await (supabase as any)
		.from('practice_invitations')
		.select('id, email, role, title, created_at, expires_at')
		.eq('practice_id', practiceId)
		.eq('status', 'pending')
		.gt('expires_at', new Date().toISOString())
		.order('created_at', { ascending: false });

	return {
		members: (members || []).map((m: any) => ({
			id: m.id,
			user_id: m.user_id,
			role: m.role,
			title: m.title,
			status: m.status,
			joined_at: m.joined_at,
			user: {
				full_name: m.users?.full_name,
				email: m.users?.email,
				avatar_url: m.users?.avatar_url
			},
			therapist: m.therapists ? {
				id: m.therapists.id,
				verification_status: m.therapists.verification_status || 'unverified',
				rating_avg: m.therapists.rating_avg || 0,
				is_available: m.therapists.is_available || false
			} : null
		})),
		pendingInvites: pendingInvites || [],
		userRole
	};
};
