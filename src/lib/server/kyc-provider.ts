/**
 * KYC Provider Abstraction
 *
 * This module provides an abstraction layer for KYC (Know Your Customer) verification.
 * Currently uses local storage (Supabase), but designed to be swapped to Colectiva
 * when the ecosystem-wide KYC system is ready.
 *
 * PHASE 1 (Current): Local verification with Supabase storage
 * PHASE 2 (Future): Delegate to Colectiva KYC API
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { VerificationStatus } from '$lib/types/database.types';
import {
	checkAndUpdateVerificationStatus,
	approveDocument,
	rejectDocument,
	bulkApproveDocuments
} from './verification.service';

// KYC Provider Types
export interface KYCDocument {
	type: 'government_id' | 'selfie' | 'professional_license' | 'degree_certificate';
	url: string;
	uploadedAt: string;
	status: 'pending' | 'approved' | 'rejected';
	reviewedAt?: string;
	rejectionReason?: string;
}

export interface KYCVerificationResult {
	status: VerificationStatus;
	identityVerified: boolean;
	credentialVerified: boolean;
	documents: KYCDocument[];
}

export interface KYCUploadResult {
	success: boolean;
	document: KYCDocument;
	newStatus: VerificationStatus;
}

export interface KYCProvider {
	/**
	 * Upload a verification document
	 */
	uploadDocument(
		userId: string,
		file: File,
		documentType: KYCDocument['type']
	): Promise<KYCUploadResult>;

	/**
	 * Get verification status for a user
	 */
	getVerificationStatus(userId: string): Promise<KYCVerificationResult>;

	/**
	 * Approve a document (admin only)
	 */
	approveDocument(userId: string, documentType: KYCDocument['type']): Promise<VerificationStatus>;

	/**
	 * Reject a document (admin only)
	 */
	rejectDocument(
		userId: string,
		documentType: KYCDocument['type'],
		reason: string
	): Promise<VerificationStatus>;

	/**
	 * Bulk approve all documents (admin only, for trusted sources)
	 */
	bulkApprove(userId: string): Promise<VerificationStatus>;
}

/**
 * Local KYC Provider - Uses Supabase for storage and verification
 * This is Phase 1 implementation
 */
export class LocalKYCProvider implements KYCProvider {
	private supabase: SupabaseClient;

	constructor(supabase: SupabaseClient) {
		this.supabase = supabase;
	}

	async uploadDocument(
		userId: string,
		file: File,
		documentType: KYCDocument['type']
	): Promise<KYCUploadResult> {
		// Get therapist ID from user ID
		const { data: therapist } = await this.supabase
			.from('therapists')
			.select('id, verification_documents')
			.eq('user_id', userId)
			.single();

		if (!therapist) {
			throw new Error('Therapist profile not found');
		}

		// Generate unique filename
		const ext = file.name.split('.').pop();
		const filename = `${userId}/${documentType}_${Date.now()}.${ext}`;

		// Upload to Supabase Storage
		const { error: uploadError } = await this.supabase.storage
			.from('verification-documents')
			.upload(filename, file, { cacheControl: '3600', upsert: true });

		if (uploadError) {
			throw new Error(`Upload failed: ${uploadError.message}`);
		}

		// Get URL (private bucket, so use signed URL or reference path)
		const { data: urlData } = this.supabase.storage
			.from('verification-documents')
			.getPublicUrl(filename);

		// Create document record
		const newDoc: KYCDocument = {
			type: documentType,
			url: urlData.publicUrl,
			uploadedAt: new Date().toISOString(),
			status: 'pending'
		};

		// Update therapist verification documents
		const existingDocs = (therapist.verification_documents || []) as KYCDocument[];
		const filteredDocs = existingDocs.filter(d => d.type !== documentType);
		const updatedDocs = [...filteredDocs, newDoc];

		await this.supabase
			.from('therapists')
			.update({
				verification_documents: updatedDocs,
				verification_status: 'pending',
				verification_submitted_at: new Date().toISOString()
			})
			.eq('id', therapist.id);

		// Check if status should be updated
		const { status } = await checkAndUpdateVerificationStatus(this.supabase, therapist.id);

		return {
			success: true,
			document: newDoc,
			newStatus: status
		};
	}

	async getVerificationStatus(userId: string): Promise<KYCVerificationResult> {
		const { data: therapist } = await this.supabase
			.from('therapists')
			.select(`
				verification_status,
				verification_documents,
				identity_verified_at,
				credential_verified_at
			`)
			.eq('user_id', userId)
			.single();

		if (!therapist) {
			return {
				status: 'unverified',
				identityVerified: false,
				credentialVerified: false,
				documents: []
			};
		}

		return {
			status: therapist.verification_status as VerificationStatus || 'unverified',
			identityVerified: !!therapist.identity_verified_at,
			credentialVerified: !!therapist.credential_verified_at,
			documents: (therapist.verification_documents || []) as KYCDocument[]
		};
	}

	async approveDocument(
		userId: string,
		documentType: KYCDocument['type']
	): Promise<VerificationStatus> {
		const { data: therapist } = await this.supabase
			.from('therapists')
			.select('id')
			.eq('user_id', userId)
			.single();

		if (!therapist) {
			throw new Error('Therapist not found');
		}

		const result = await approveDocument(this.supabase, therapist.id, documentType);
		return result.newStatus;
	}

	async rejectDocument(
		userId: string,
		documentType: KYCDocument['type'],
		reason: string
	): Promise<VerificationStatus> {
		const { data: therapist } = await this.supabase
			.from('therapists')
			.select('id')
			.eq('user_id', userId)
			.single();

		if (!therapist) {
			throw new Error('Therapist not found');
		}

		const result = await rejectDocument(this.supabase, therapist.id, documentType, reason);
		return result.newStatus;
	}

	async bulkApprove(userId: string): Promise<VerificationStatus> {
		const { data: therapist } = await this.supabase
			.from('therapists')
			.select('id')
			.eq('user_id', userId)
			.single();

		if (!therapist) {
			throw new Error('Therapist not found');
		}

		const result = await bulkApproveDocuments(this.supabase, therapist.id);
		return result.newStatus;
	}
}

/**
 * Colectiva KYC Provider - Delegates to Colectiva API
 * Phase 2 implementation for centralized KYC across RBS ecosystem
 *
 * Flow:
 * 1. User initiates KYC → redirect to Colectiva portal
 * 2. User completes verification in Colectiva
 * 3. Colectiva sends webhook to Plenura with status update
 * 4. Plenura syncs status to therapist profile
 */
export class ColectivaKYCProvider implements KYCProvider {
	private colectivaApiUrl: string;
	private colectivaApiKey: string;

	constructor(apiUrl: string, apiKey: string) {
		this.colectivaApiUrl = apiUrl;
		this.colectivaApiKey = apiKey;
	}

	/**
	 * Upload not supported - use initiateKYCSession to redirect user
	 */
	async uploadDocument(
		_userId: string,
		_file: File,
		_documentType: KYCDocument['type']
	): Promise<KYCUploadResult> {
		throw new Error(
			'Direct upload not supported with Colectiva KYC. Use initiateKYCSession() to redirect user to Colectiva portal.'
		);
	}

	/**
	 * Fetch verification status from Colectiva API
	 */
	async getVerificationStatus(userId: string): Promise<KYCVerificationResult> {
		try {
			const response = await fetch(`${this.colectivaApiUrl}/kyc/users/${userId}/status`, {
				headers: {
					Authorization: `Bearer ${this.colectivaApiKey}`,
					'X-App-ID': 'plenura'
				}
			});

			if (!response.ok) {
				if (response.status === 404) {
					// User hasn't started KYC in Colectiva
					return {
						status: 'unverified',
						identityVerified: false,
						credentialVerified: false,
						documents: []
					};
				}
				throw new Error(`Colectiva API error: ${response.status}`);
			}

			const data = await response.json();

			return {
				status: data.status as VerificationStatus,
				identityVerified: !!data.identity_verified_at,
				credentialVerified: !!data.credential_verified_at,
				documents: (data.documents || []).map(
					(doc: { type: string; status: string; uploaded_at: string; reviewed_at?: string }) => ({
						type: doc.type as KYCDocument['type'],
						url: '', // Colectiva stores documents, URLs not exposed
						uploadedAt: doc.uploaded_at,
						status: doc.status as 'pending' | 'approved' | 'rejected',
						reviewedAt: doc.reviewed_at
					})
				)
			};
		} catch (error) {
			console.error('Error fetching Colectiva KYC status:', error);
			throw error;
		}
	}

	/**
	 * Admin functions are managed in Colectiva admin panel
	 */
	async approveDocument(
		_userId: string,
		_documentType: KYCDocument['type']
	): Promise<VerificationStatus> {
		throw new Error('Document approval is managed in Colectiva admin panel');
	}

	async rejectDocument(
		_userId: string,
		_documentType: KYCDocument['type'],
		_reason: string
	): Promise<VerificationStatus> {
		throw new Error('Document rejection is managed in Colectiva admin panel');
	}

	async bulkApprove(_userId: string): Promise<VerificationStatus> {
		throw new Error('Bulk approval is managed in Colectiva admin panel');
	}

	/**
	 * Initiate KYC session in Colectiva
	 * Returns the portal URL where user should be redirected
	 */
	async initiateKYCSession(
		userId: string,
		email: string,
		fullName: string,
		returnUrl: string
	): Promise<{ sessionId: string; portalUrl: string }> {
		const response = await fetch(`${this.colectivaApiUrl}/kyc/sessions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.colectivaApiKey}`,
				'X-App-ID': 'plenura'
			},
			body: JSON.stringify({
				user_id: userId,
				email,
				name: fullName,
				app: 'plenura',
				return_url: returnUrl,
				document_types: ['government_id', 'selfie', 'professional_license', 'degree_certificate']
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Failed to initiate KYC session');
		}

		const data = await response.json();
		return {
			sessionId: data.session_id,
			portalUrl: data.portal_url
		};
	}

	/**
	 * Generate direct URL for Colectiva KYC portal
	 * Alternative to initiateKYCSession for simpler redirects
	 */
	getKYCPortalUrl(userId: string, returnUrl: string): string {
		const params = new URLSearchParams({
			user_id: userId,
			return_url: returnUrl,
			app: 'plenura'
		});
		return `${this.colectivaApiUrl}/kyc/start?${params.toString()}`;
	}
}

/**
 * Factory function to get the appropriate KYC provider
 * Switch between local and Colectiva based on environment
 */
export function getKYCProvider(supabase: SupabaseClient): KYCProvider {
	const useColectiva = process.env.USE_COLECTIVA_KYC === 'true';

	if (useColectiva) {
		const apiUrl = process.env.COLECTIVA_API_URL;
		const apiKey = process.env.COLECTIVA_API_KEY;

		if (!apiUrl || !apiKey) {
			console.warn('Colectiva KYC not configured, falling back to local provider');
			return new LocalKYCProvider(supabase);
		}

		return new ColectivaKYCProvider(apiUrl, apiKey);
	}

	return new LocalKYCProvider(supabase);
}
