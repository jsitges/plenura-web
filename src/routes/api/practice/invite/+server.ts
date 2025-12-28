import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomBytes } from 'crypto';
import { sendPracticeInvite } from '$lib/services/email.service';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'No autenticado');
	}

	// Get user's practice membership
	const { data: membership } = await supabase
		.from('practice_members')
		.select('practice_id, role')
		.eq('user_id', session.user.id)
		.in('role', ['owner', 'admin'])
		.single();

	if (!membership) {
		throw error(403, 'No tienes permisos para invitar miembros');
	}

	const body = await request.json();
	const { email, role, title } = body;

	if (!email || !role) {
		throw error(400, 'Email y rol son requeridos');
	}

	// Validate role
	const allowedRoles = ['therapist', 'receptionist', 'manager', 'admin'];
	if (!allowedRoles.includes(role)) {
		throw error(400, 'Rol no válido');
	}

	// Only owners can invite admins
	if (role === 'admin' && membership.role !== 'owner') {
		throw error(403, 'Solo el propietario puede invitar administradores');
	}

	// Check if user is already a member
	const { data: existingUser } = await supabase
		.from('users')
		.select('id')
		.eq('email', email)
		.single();

	if (existingUser) {
		const { data: existingMember } = await supabase
			.from('practice_members')
			.select('id')
			.eq('practice_id', membership.practice_id)
			.eq('user_id', existingUser.id)
			.single();

		if (existingMember) {
			throw error(400, 'Este usuario ya es miembro de la práctica');
		}
	}

	// Check for existing pending invitation
	const { data: existingInvite } = await supabase
		.from('practice_invitations')
		.select('id')
		.eq('practice_id', membership.practice_id)
		.eq('email', email)
		.eq('status', 'pending')
		.single();

	if (existingInvite) {
		throw error(400, 'Ya existe una invitación pendiente para este email');
	}

	// Generate invitation token
	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

	// Create invitation
	const { data: invitation, error: insertError } = await supabase
		.from('practice_invitations')
		.insert({
			practice_id: membership.practice_id,
			email: email.toLowerCase().trim(),
			role,
			title: title || null,
			token,
			expires_at: expiresAt.toISOString(),
			invited_by: session.user.id
		})
		.select()
		.single();

	if (insertError) {
		console.error('Error creating invitation:', insertError);
		throw error(500, 'Error al crear la invitación');
	}

	// Get practice name and inviter info for email
	const { data: practice } = await supabase
		.from('practices')
		.select('name')
		.eq('id', membership.practice_id)
		.single();

	const { data: inviter } = await supabase
		.from('users')
		.select('full_name')
		.eq('id', session.user.id)
		.single();

	// Send invitation email
	const emailSent = await sendPracticeInvite({
		email: email.toLowerCase().trim(),
		practiceName: (practice as any)?.name || 'Tu práctica',
		inviterName: (inviter as any)?.full_name || 'Un administrador',
		role,
		token,
		expiresAt
	});

	if (!emailSent) {
		console.warn(`[Practice Invite] Email could not be sent to ${email}, but invitation was created`);
	}

	return json({
		success: true,
		invitation: {
			id: invitation.id,
			email: invitation.email,
			role: invitation.role,
			expires_at: invitation.expires_at
		}
	});
};
