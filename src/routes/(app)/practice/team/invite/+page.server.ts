import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { randomBytes } from 'crypto';
import { sendPracticeInvite } from '$lib/services/email.service';

// Helper to get practice membership from user session
async function getMembership(supabase: any, userId: string): Promise<{ practiceId: string; role: string } | null> {
	const { data: membership } = await supabase
		.from('practice_members')
		.select('practice_id, role')
		.eq('user_id', userId)
		.in('role', ['owner', 'admin', 'manager'])
		.single();
	if (!membership) return null;
	return { practiceId: membership.practice_id, role: membership.role };
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();

	// Check if user has permission to invite (owner or admin only)
	if (!['owner', 'admin'].includes(parentData.membership.role)) {
		return {
			canInvite: false,
			error: 'No tienes permisos para invitar miembros'
		};
	}

	return {
		canInvite: true,
		practiceName: parentData.membership.practices.name,
		userRole: parentData.membership.role
	};
};

export const actions: Actions = {
	invite: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			return fail(401, { error: 'No autenticado' });
		}

		const membership = await getMembership(supabase, session.user.id);
		if (!membership) {
			return fail(403, { error: 'No tienes acceso a esta práctica' });
		}

		const { practiceId, role: userRole } = membership;

		if (!['owner', 'admin'].includes(userRole)) {
			return fail(403, { error: 'No tienes permisos para invitar miembros' });
		}

		const formData = await request.formData();
		const email = (formData.get('email') as string)?.toLowerCase().trim();
		const role = formData.get('role') as string;
		const title = formData.get('title') as string;

		if (!email) {
			return fail(400, { error: 'El email es requerido' });
		}

		if (!role) {
			return fail(400, { error: 'El rol es requerido' });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'El formato del email no es válido' });
		}

		// Validate role
		const allowedRoles = ['therapist', 'receptionist', 'manager', 'admin'];
		if (!allowedRoles.includes(role)) {
			return fail(400, { error: 'Rol no válido' });
		}

		// Only owners can invite admins
		if (role === 'admin' && userRole !== 'owner') {
			return fail(403, { error: 'Solo el propietario puede invitar administradores' });
		}

		// Check if user is already a member
		const { data: existingUser } = await (supabase as any)
			.from('users')
			.select('id')
			.eq('email', email)
			.single();

		if (existingUser) {
			const { data: existingMember } = await (supabase as any)
				.from('practice_members')
				.select('id')
				.eq('practice_id', practiceId)
				.eq('user_id', (existingUser as any).id)
				.single();

			if (existingMember) {
				return fail(400, { error: 'Este usuario ya es miembro de la práctica' });
			}
		}

		// Check for existing pending invitation
		const { data: existingInvite } = await (supabase as any)
			.from('practice_invitations')
			.select('id')
			.eq('practice_id', practiceId)
			.eq('email', email)
			.eq('status', 'pending')
			.single();

		if (existingInvite) {
			return fail(400, { error: 'Ya existe una invitación pendiente para este email' });
		}

		// Generate invitation token
		const token = randomBytes(32).toString('hex');
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

		// Create invitation
		const { error: insertError } = await (supabase as any)
			.from('practice_invitations')
			.insert({
				practice_id: practiceId,
				email,
				role,
				title: title || null,
				token,
				expires_at: expiresAt.toISOString(),
				invited_by: session.user.id
			});

		if (insertError) {
			console.error('Error creating invitation:', insertError);
			return fail(500, { error: 'Error al crear la invitación' });
		}

		// Get inviter info and practice name for the email
		const { data: inviter } = await (supabase as any)
			.from('users')
			.select('full_name')
			.eq('id', session.user.id)
			.single();

		const { data: practice } = await (supabase as any)
			.from('practices')
			.select('name')
			.eq('id', practiceId)
			.single();

		// Send invitation email
		const emailSent = await sendPracticeInvite({
			email,
			practiceName: practice?.name || 'Tu práctica',
			inviterName: inviter?.full_name || 'Un administrador',
			role,
			token,
			expiresAt
		});

		if (!emailSent) {
			console.warn(`[Practice Invite] Email could not be sent to ${email}, but invitation was created`);
		}

		return {
			success: true,
			message: `Invitación enviada a ${email}`
		};
	}
};
