import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	approveDocument,
	rejectDocument,
	bulkApproveDocuments
} from '$lib/server/verification.service';

// POST /api/admin/verification/[therapistId] - Approve or reject a document
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, userProfile } = locals;
	const { therapistId } = params;

	if (!userProfile || userProfile.role !== 'admin') {
		throw error(403, 'Acceso denegado');
	}

	if (!therapistId) {
		throw error(400, 'ID de terapeuta requerido');
	}

	const body = await request.json();
	const { action, documentType, reason } = body;

	if (!action) {
		throw error(400, 'Acción requerida');
	}

	try {
		let result;

		switch (action) {
			case 'approve':
				if (!documentType) {
					throw error(400, 'Tipo de documento requerido');
				}
				result = await approveDocument(supabase, therapistId, documentType);
				break;

			case 'reject':
				if (!documentType || !reason) {
					throw error(400, 'Tipo de documento y razón requeridos');
				}
				result = await rejectDocument(supabase, therapistId, documentType, reason);
				break;

			case 'bulk_approve':
				result = await bulkApproveDocuments(supabase, therapistId);
				break;

			default:
				throw error(400, 'Acción no válida');
		}

		return json({
			success: true,
			newStatus: result.newStatus
		});
	} catch (err) {
		console.error('Error processing verification action:', err);
		throw error(500, err instanceof Error ? err.message : 'Error al procesar la acción');
	}
};
