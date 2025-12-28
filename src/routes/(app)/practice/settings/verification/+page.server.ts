import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

// Helper to get practice ID from user session
async function getPracticeId(supabase: any, userId: string): Promise<string | null> {
	const { data: membership } = await supabase
		.from('practice_members')
		.select('practice_id')
		.eq('user_id', userId)
		.in('role', ['owner', 'admin', 'manager'])
		.single();
	return membership?.practice_id ?? null;
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const practiceId = parentData.membership.practice_id;

	// Fetch practice verification details
	const { data: practice } = await (supabase as any)
		.from('practices')
		.select(`
			id,
			name,
			verification_status,
			business_registration_number,
			tax_id,
			insurance_provider,
			insurance_policy_number,
			phone,
			email,
			address,
			city,
			state,
			postal_code
		`)
		.eq('id', practiceId)
		.single();

	// Fetch verification documents
	const { data: documents } = await (supabase as any)
		.from('practice_verification_documents')
		.select('*')
		.eq('practice_id', practiceId)
		.order('created_at', { ascending: false });

	return {
		practice: practice ?? null,
		documents: documents ?? []
	};
};

export const actions: Actions = {
	updateBusinessInfo: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			return fail(401, { error: 'No autenticado' });
		}

		const practiceId = await getPracticeId(supabase, session.user.id);
		if (!practiceId) {
			return fail(403, { error: 'No tienes acceso a esta práctica' });
		}

		const formData = await request.formData();
		const business_registration_number = formData.get('business_registration_number') as string;
		const tax_id = formData.get('tax_id') as string;
		const insurance_provider = formData.get('insurance_provider') as string;
		const insurance_policy_number = formData.get('insurance_policy_number') as string;

		const { error } = await (supabase as any)
			.from('practices')
			.update({
				business_registration_number,
				tax_id,
				insurance_provider,
				insurance_policy_number,
				updated_at: new Date().toISOString()
			})
			.eq('id', practiceId);

		if (error) {
			return fail(500, { error: 'Error al actualizar la información' });
		}

		return { success: true, message: 'Información actualizada' };
	},

	uploadDocument: async ({ request, locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			return fail(401, { error: 'No autenticado' });
		}

		const practiceId = await getPracticeId(supabase, session.user.id);
		if (!practiceId) {
			return fail(403, { error: 'No tienes acceso a esta práctica' });
		}

		const formData = await request.formData();
		const file = formData.get('document') as File;
		const documentType = formData.get('document_type') as string;

		if (!file || file.size === 0) {
			return fail(400, { error: 'No se seleccionó ningún archivo' });
		}

		if (!documentType) {
			return fail(400, { error: 'Tipo de documento requerido' });
		}

		// Validate file size (10MB max for documents)
		if (file.size > 10 * 1024 * 1024) {
			return fail(400, { error: 'El archivo es muy grande. Máximo 10MB' });
		}

		// Validate file type
		const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return fail(400, { error: 'Solo se permiten archivos PDF, JPG, PNG o WebP' });
		}

		const ext = file.name.split('.').pop();
		const filename = `${practiceId}/${documentType}_${Date.now()}.${ext}`;

		// Upload to storage
		const { error: uploadError } = await supabase.storage
			.from('practice-documents')
			.upload(filename, file, { cacheControl: '3600', upsert: false });

		if (uploadError) {
			console.error('Upload error:', uploadError);
			return fail(500, { error: 'Error al subir el documento' });
		}

		const { data: urlData } = supabase.storage.from('practice-documents').getPublicUrl(filename);

		// Save document record
		const { error: insertError } = await (supabase as any)
			.from('practice_verification_documents')
			.insert({
				practice_id: practiceId,
				document_type: documentType,
				file_url: urlData.publicUrl,
				status: 'pending',
				uploaded_by: session.user.id
			});

		if (insertError) {
			console.error('Insert error:', insertError);
			return fail(500, { error: 'Error al guardar el documento' });
		}

		return { success: true, message: 'Documento subido exitosamente' };
	},

	requestVerification: async ({ locals }) => {
		const { supabase, session } = locals;

		if (!session) {
			return fail(401, { error: 'No autenticado' });
		}

		const practiceId = await getPracticeId(supabase, session.user.id);
		if (!practiceId) {
			return fail(403, { error: 'No tienes acceso a esta práctica' });
		}

		// Update practice status to pending verification
		const { error } = await (supabase as any)
			.from('practices')
			.update({
				verification_status: 'pending',
				updated_at: new Date().toISOString()
			})
			.eq('id', practiceId);

		if (error) {
			return fail(500, { error: 'Error al solicitar verificación' });
		}

		return { success: true, message: 'Solicitud de verificación enviada' };
	}
};
