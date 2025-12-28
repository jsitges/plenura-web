import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'No autenticado');
	}

	const memberId = params.id;

	// Get the member to be removed
	const { data: targetMember } = await supabase
		.from('practice_members')
		.select('id, practice_id, user_id, role')
		.eq('id', memberId)
		.single();

	if (!targetMember) {
		throw error(404, 'Miembro no encontrado');
	}

	// Cannot remove the owner
	if (targetMember.role === 'owner') {
		throw error(400, 'No se puede remover al propietario de la práctica');
	}

	// Check if current user has permission
	const { data: currentMembership } = await supabase
		.from('practice_members')
		.select('role')
		.eq('practice_id', targetMember.practice_id)
		.eq('user_id', session.user.id)
		.single();

	if (!currentMembership) {
		throw error(403, 'No eres miembro de esta práctica');
	}

	// Only owners can remove admins
	if (targetMember.role === 'admin' && currentMembership.role !== 'owner') {
		throw error(403, 'Solo el propietario puede remover administradores');
	}

	// Owners and admins can remove other members
	if (!['owner', 'admin'].includes(currentMembership.role)) {
		throw error(403, 'No tienes permisos para remover miembros');
	}

	// Update member status to inactive (soft delete)
	const { error: updateError } = await supabase
		.from('practice_members')
		.update({ status: 'inactive' })
		.eq('id', memberId);

	if (updateError) {
		console.error('Error removing member:', updateError);
		throw error(500, 'Error al remover el miembro');
	}

	// Update therapist if applicable
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', targetMember.user_id)
		.eq('primary_practice_id', targetMember.practice_id)
		.single();

	if (therapist) {
		await supabase
			.from('therapists')
			.update({
				is_independent: true,
				primary_practice_id: null
			})
			.eq('id', therapist.id);
	}

	return json({ success: true });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'No autenticado');
	}

	const memberId = params.id;
	const body = await request.json();
	const { role, title } = body;

	// Get the member to be updated
	const { data: targetMember } = await supabase
		.from('practice_members')
		.select('id, practice_id, role')
		.eq('id', memberId)
		.single();

	if (!targetMember) {
		throw error(404, 'Miembro no encontrado');
	}

	// Cannot change owner role
	if (targetMember.role === 'owner') {
		throw error(400, 'No se puede modificar el rol del propietario');
	}

	// Check if current user has permission
	const { data: currentMembership } = await supabase
		.from('practice_members')
		.select('role')
		.eq('practice_id', targetMember.practice_id)
		.eq('user_id', session.user.id)
		.in('role', ['owner', 'admin'])
		.single();

	if (!currentMembership) {
		throw error(403, 'No tienes permisos para modificar miembros');
	}

	// Only owners can promote to admin
	if (role === 'admin' && currentMembership.role !== 'owner') {
		throw error(403, 'Solo el propietario puede asignar el rol de administrador');
	}

	const updateData: Record<string, unknown> = {};
	if (role) updateData.role = role;
	if (title !== undefined) updateData.title = title;

	const { error: updateError } = await supabase
		.from('practice_members')
		.update(updateData)
		.eq('id', memberId);

	if (updateError) {
		console.error('Error updating member:', updateError);
		throw error(500, 'Error al actualizar el miembro');
	}

	return json({ success: true });
};
