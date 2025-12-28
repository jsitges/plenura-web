import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase, session } = locals;
	const { token } = params;

	// Fetch the invitation
	const { data: invitation, error } = await (supabase as any)
		.from('practice_invitations')
		.select(`
			id,
			email,
			role,
			title,
			status,
			expires_at,
			created_at,
			practices (
				id,
				name,
				logo_url,
				verification_status
			),
			users:invited_by (
				full_name
			)
		`)
		.eq('token', token)
		.single();

	if (error || !invitation) {
		return {
			error: 'Invitación no encontrada',
			invitation: null
		};
	}

	// Check if invitation is still pending
	if (invitation.status !== 'pending') {
		return {
			error: invitation.status === 'accepted'
				? 'Esta invitación ya fue aceptada'
				: 'Esta invitación ya no es válida',
			invitation: null
		};
	}

	// Check if invitation has expired
	if (new Date(invitation.expires_at) < new Date()) {
		return {
			error: 'Esta invitación ha expirado',
			invitation: null
		};
	}

	// Check if logged-in user's email matches the invitation
	const emailMatch = session?.user?.email?.toLowerCase() === invitation.email.toLowerCase();

	return {
		invitation: {
			id: invitation.id,
			email: invitation.email,
			role: invitation.role,
			title: invitation.title,
			expires_at: invitation.expires_at,
			practice: {
				id: invitation.practices.id,
				name: invitation.practices.name,
				logo_url: invitation.practices.logo_url,
				verification_status: invitation.practices.verification_status
			},
			inviter_name: invitation.users?.full_name ?? 'Un administrador'
		},
		isLoggedIn: !!session,
		emailMatch,
		userEmail: session?.user?.email ?? null,
		error: null
	};
};

export const actions: Actions = {
	accept: async ({ params, locals }) => {
		const { supabase, session } = locals;
		const { token } = params;

		if (!session) {
			return fail(401, { error: 'Debes iniciar sesión para aceptar la invitación' });
		}

		// Fetch and validate invitation
		const { data: invitation, error: fetchError } = await (supabase as any)
			.from('practice_invitations')
			.select('id, email, role, title, practice_id, status, expires_at')
			.eq('token', token)
			.single();

		if (fetchError || !invitation) {
			return fail(404, { error: 'Invitación no encontrada' });
		}

		if (invitation.status !== 'pending') {
			return fail(400, { error: 'Esta invitación ya no es válida' });
		}

		if (new Date(invitation.expires_at) < new Date()) {
			return fail(400, { error: 'Esta invitación ha expirado' });
		}

		// Verify email matches
		if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
			return fail(403, {
				error: `Esta invitación es para ${invitation.email}. Inicia sesión con esa cuenta.`
			});
		}

		// Check if already a member
		const { data: existingMember } = await (supabase as any)
			.from('practice_members')
			.select('id')
			.eq('practice_id', invitation.practice_id)
			.eq('user_id', session.user.id)
			.single();

		if (existingMember) {
			// Update invitation status and redirect
			await (supabase as any)
				.from('practice_invitations')
				.update({ status: 'accepted', accepted_at: new Date().toISOString() })
				.eq('id', invitation.id);

			throw redirect(303, '/practice');
		}

		// Check if user is already a therapist
		const { data: therapist } = await (supabase as any)
			.from('therapists')
			.select('id')
			.eq('user_id', session.user.id)
			.single();

		// Create practice member record
		const { error: memberError } = await (supabase as any)
			.from('practice_members')
			.insert({
				practice_id: invitation.practice_id,
				user_id: session.user.id,
				therapist_id: therapist?.id ?? null,
				role: invitation.role,
				title: invitation.title,
				status: 'active',
				joined_at: new Date().toISOString()
			});

		if (memberError) {
			console.error('Error creating practice member:', memberError);
			return fail(500, { error: 'Error al unirse a la práctica' });
		}

		// If user is a therapist and joining as therapist role, update therapist's practice link
		if (therapist && invitation.role === 'therapist') {
			await (supabase as any)
				.from('therapists')
				.update({
					is_independent: false,
					primary_practice_id: invitation.practice_id
				})
				.eq('id', therapist.id);
		}

		// Update invitation status
		await (supabase as any)
			.from('practice_invitations')
			.update({
				status: 'accepted',
				accepted_at: new Date().toISOString()
			})
			.eq('id', invitation.id);

		throw redirect(303, '/practice');
	},

	decline: async ({ params, locals }) => {
		const { supabase, session } = locals;
		const { token } = params;

		if (!session) {
			return fail(401, { error: 'Debes iniciar sesión para rechazar la invitación' });
		}

		// Fetch and validate invitation
		const { data: invitation, error: fetchError } = await (supabase as any)
			.from('practice_invitations')
			.select('id, email, status')
			.eq('token', token)
			.single();

		if (fetchError || !invitation) {
			return fail(404, { error: 'Invitación no encontrada' });
		}

		// Verify email matches
		if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
			return fail(403, { error: 'No tienes permiso para rechazar esta invitación' });
		}

		// Update invitation status
		await (supabase as any)
			.from('practice_invitations')
			.update({
				status: 'declined',
				declined_at: new Date().toISOString()
			})
			.eq('id', invitation.id);

		return { success: true, message: 'Invitación rechazada' };
	}
};
