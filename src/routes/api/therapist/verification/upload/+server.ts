import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkAndUpdateVerificationStatus } from '$lib/server/verification.service';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'No autenticado');
	}

	// Get therapist profile
	const { data: therapist, error: therapistError } = await supabase
		.from('therapists')
		.select('id, verification_documents')
		.eq('user_id', session.user.id)
		.single();

	if (therapistError || !therapist) {
		throw error(404, 'Perfil de terapeuta no encontrado');
	}

	// Parse form data
	const formData = await request.formData();
	const file = formData.get('file') as File;
	const documentType = formData.get('documentType') as string;

	if (!file || !documentType) {
		throw error(400, 'Archivo y tipo de documento requeridos');
	}

	// Validate file type
	const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
	if (!allowedTypes.includes(file.type)) {
		throw error(400, 'Tipo de archivo no permitido. Solo JPG, PNG o PDF.');
	}

	// Validate file size (10MB)
	if (file.size > 10 * 1024 * 1024) {
		throw error(400, 'El archivo debe ser menor a 10MB');
	}

	// Generate unique filename
	const ext = file.name.split('.').pop();
	const filename = `${therapist.id}/${documentType}_${Date.now()}.${ext}`;

	// Upload to Supabase Storage
	const { data: uploadData, error: uploadError } = await supabase.storage
		.from('verification-documents')
		.upload(filename, file, {
			cacheControl: '3600',
			upsert: true
		});

	if (uploadError) {
		console.error('Upload error:', uploadError);
		throw error(500, 'Error al subir el archivo');
	}

	// Get public URL
	const { data: urlData } = supabase.storage
		.from('verification-documents')
		.getPublicUrl(filename);

	// Update verification documents array
	const existingDocs = (therapist.verification_documents as Array<{
		type: string;
		url: string;
		uploaded_at: string;
		status: string;
	}>) || [];

	// Remove existing document of same type and add new one
	const filteredDocs = existingDocs.filter(doc => doc.type !== documentType);
	const newDoc = {
		type: documentType,
		url: urlData.publicUrl,
		uploaded_at: new Date().toISOString(),
		status: 'pending'
	};

	const updatedDocs = [...filteredDocs, newDoc];

	// Update therapist record
	const { error: updateError } = await supabase
		.from('therapists')
		.update({
			verification_documents: updatedDocs,
			verification_status: 'pending',
			verification_submitted_at: new Date().toISOString()
		})
		.eq('id', therapist.id);

	if (updateError) {
		console.error('Update error:', updateError);
		throw error(500, 'Error al actualizar el perfil');
	}

	// Check if verification status should be updated based on all documents
	const { status: currentStatus, changed } = await checkAndUpdateVerificationStatus(
		supabase,
		therapist.id
	);

	return json({
		success: true,
		document: newDoc,
		verificationStatus: currentStatus,
		statusChanged: changed
	});
};
