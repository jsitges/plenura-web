import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'No autenticado');
	}

	const invitationId = params.id;

	// Get the invitation
	const { data: invitation } = await supabase
		.from('practice_invitations')
		.select('id, practice_id, status')
		.eq('id', invitationId)
		.single();

	if (!invitation) {
		throw error(404, 'Invitación no encontrada');
	}

	// Check if user has permission to cancel
	const { data: membership } = await supabase
		.from('practice_members')
		.select('role')
		.eq('practice_id', invitation.practice_id)
		.eq('user_id', session.user.id)
		.in('role', ['owner', 'admin'])
		.single();

	if (!membership) {
		throw error(403, 'No tienes permisos para cancelar esta invitación');
	}

	if (invitation.status !== 'pending') {
		throw error(400, 'Esta invitación ya no está pendiente');
	}

	// Update invitation status to cancelled
	const { error: updateError } = await supabase
		.from('practice_invitations')
		.update({ status: 'cancelled' })
		.eq('id', invitationId);

	if (updateError) {
		console.error('Error cancelling invitation:', updateError);
		throw error(500, 'Error al cancelar la invitación');
	}

	return json({ success: true });
};
