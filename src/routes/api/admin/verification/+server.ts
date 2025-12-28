import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPendingVerifications } from '$lib/server/verification.service';

// GET /api/admin/verification - Get pending verifications
export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, userProfile } = locals;

	if (!userProfile || userProfile.role !== 'admin') {
		throw error(403, 'Acceso denegado');
	}

	try {
		const pendingVerifications = await getPendingVerifications(supabase);
		return json({ verifications: pendingVerifications });
	} catch (err) {
		console.error('Error fetching pending verifications:', err);
		throw error(500, 'Error al obtener verificaciones pendientes');
	}
};
