import type { SupabaseClient } from '@supabase/supabase-js';
import type { VerificationStatus } from '$lib/types/database.types';

interface VerificationDocument {
	type: string;
	url: string;
	uploaded_at: string;
	status: 'pending' | 'approved' | 'rejected';
	reviewed_at?: string;
	rejection_reason?: string;
}

interface TherapistVerificationData {
	id: string;
	verification_status: VerificationStatus;
	verification_documents: VerificationDocument[] | null;
	identity_verified_at: string | null;
	credential_verified_at: string | null;
}

// Document types required for each verification tier
const IDENTITY_DOCUMENTS = ['government_id', 'selfie'];
const CREDENTIAL_DOCUMENTS = ['professional_license', 'degree_certificate'];

/**
 * Check and update therapist verification status based on uploaded documents
 */
export async function checkAndUpdateVerificationStatus(
	supabase: SupabaseClient,
	therapistId: string
): Promise<{ status: VerificationStatus; changed: boolean }> {
	// Get current therapist data
	const { data: therapist, error } = await supabase
		.from('therapists')
		.select('id, verification_status, verification_documents, identity_verified_at, credential_verified_at')
		.eq('id', therapistId)
		.single();

	if (error || !therapist) {
		throw new Error('Therapist not found');
	}

	const currentStatus = therapist.verification_status as VerificationStatus;
	const docs = (therapist.verification_documents || []) as VerificationDocument[];

	// Check document statuses
	const approvedDocs = docs.filter(d => d.status === 'approved');
	const pendingDocs = docs.filter(d => d.status === 'pending');
	const rejectedDocs = docs.filter(d => d.status === 'rejected');

	// Determine new status based on approved documents
	let newStatus: VerificationStatus = 'unverified';
	let identityVerified = therapist.identity_verified_at != null;
	let credentialVerified = therapist.credential_verified_at != null;

	// Check if identity documents are all approved
	const hasAllIdentityDocs = IDENTITY_DOCUMENTS.every(docType =>
		approvedDocs.some(d => d.type === docType)
	);

	// Check if credential documents are all approved
	const hasAllCredentialDocs = CREDENTIAL_DOCUMENTS.every(docType =>
		approvedDocs.some(d => d.type === docType)
	);

	// Determine status
	if (hasAllIdentityDocs && hasAllCredentialDocs) {
		newStatus = 'fully_verified';
		identityVerified = true;
		credentialVerified = true;
	} else if (hasAllCredentialDocs) {
		newStatus = 'credential_verified';
		credentialVerified = true;
	} else if (hasAllIdentityDocs) {
		newStatus = 'identity_verified';
		identityVerified = true;
	} else if (pendingDocs.length > 0 || (docs.length > 0 && rejectedDocs.length < docs.length)) {
		newStatus = 'pending';
	}

	// Update if status changed
	if (newStatus !== currentStatus) {
		const updateData: Record<string, any> = {
			verification_status: newStatus
		};

		if (identityVerified && !therapist.identity_verified_at) {
			updateData.identity_verified_at = new Date().toISOString();
		}

		if (credentialVerified && !therapist.credential_verified_at) {
			updateData.credential_verified_at = new Date().toISOString();
		}

		await supabase
			.from('therapists')
			.update(updateData)
			.eq('id', therapistId);

		return { status: newStatus, changed: true };
	}

	return { status: currentStatus, changed: false };
}

/**
 * Approve a verification document
 */
export async function approveDocument(
	supabase: SupabaseClient,
	therapistId: string,
	documentType: string
): Promise<{ success: boolean; newStatus: VerificationStatus }> {
	const { data: therapist, error } = await supabase
		.from('therapists')
		.select('id, verification_documents')
		.eq('id', therapistId)
		.single();

	if (error || !therapist) {
		throw new Error('Therapist not found');
	}

	const docs = (therapist.verification_documents || []) as VerificationDocument[];
	const updatedDocs = docs.map(doc => {
		if (doc.type === documentType) {
			return {
				...doc,
				status: 'approved' as const,
				reviewed_at: new Date().toISOString()
			};
		}
		return doc;
	});

	await supabase
		.from('therapists')
		.update({ verification_documents: updatedDocs })
		.eq('id', therapistId);

	// Re-check verification status
	const { status } = await checkAndUpdateVerificationStatus(supabase, therapistId);

	return { success: true, newStatus: status };
}

/**
 * Reject a verification document
 */
export async function rejectDocument(
	supabase: SupabaseClient,
	therapistId: string,
	documentType: string,
	reason: string
): Promise<{ success: boolean; newStatus: VerificationStatus }> {
	const { data: therapist, error } = await supabase
		.from('therapists')
		.select('id, verification_documents')
		.eq('id', therapistId)
		.single();

	if (error || !therapist) {
		throw new Error('Therapist not found');
	}

	const docs = (therapist.verification_documents || []) as VerificationDocument[];
	const updatedDocs = docs.map(doc => {
		if (doc.type === documentType) {
			return {
				...doc,
				status: 'rejected' as const,
				reviewed_at: new Date().toISOString(),
				rejection_reason: reason
			};
		}
		return doc;
	});

	await supabase
		.from('therapists')
		.update({ verification_documents: updatedDocs })
		.eq('id', therapistId);

	// Re-check verification status
	const { status } = await checkAndUpdateVerificationStatus(supabase, therapistId);

	return { success: true, newStatus: status };
}

/**
 * Get pending verifications for admin review
 */
export async function getPendingVerifications(
	supabase: SupabaseClient,
	limit: number = 50
): Promise<Array<{
	therapist: { id: string; user_id: string };
	user: { full_name: string; email: string };
	pendingDocuments: VerificationDocument[];
	submittedAt: string;
}>> {
	const { data: therapists, error } = await supabase
		.from('therapists')
		.select(`
			id,
			user_id,
			verification_documents,
			verification_submitted_at,
			users!inner (
				full_name,
				email
			)
		`)
		.eq('verification_status', 'pending')
		.order('verification_submitted_at', { ascending: true })
		.limit(limit);

	if (error) {
		throw new Error('Failed to fetch pending verifications');
	}

	return (therapists || []).map(t => ({
		therapist: { id: t.id, user_id: t.user_id },
		user: {
			full_name: (t.users as any).full_name,
			email: (t.users as any).email
		},
		pendingDocuments: ((t.verification_documents || []) as VerificationDocument[])
			.filter(d => d.status === 'pending'),
		submittedAt: t.verification_submitted_at
	}));
}

/**
 * Bulk approve all pending documents for a therapist (for trusted sources)
 */
export async function bulkApproveDocuments(
	supabase: SupabaseClient,
	therapistId: string
): Promise<{ success: boolean; newStatus: VerificationStatus }> {
	const { data: therapist, error } = await supabase
		.from('therapists')
		.select('id, verification_documents')
		.eq('id', therapistId)
		.single();

	if (error || !therapist) {
		throw new Error('Therapist not found');
	}

	const docs = (therapist.verification_documents || []) as VerificationDocument[];
	const updatedDocs = docs.map(doc => ({
		...doc,
		status: 'approved' as const,
		reviewed_at: new Date().toISOString()
	}));

	await supabase
		.from('therapists')
		.update({ verification_documents: updatedDocs })
		.eq('id', therapistId);

	// Re-check verification status
	const { status } = await checkAndUpdateVerificationStatus(supabase, therapistId);

	return { success: true, newStatus: status };
}
