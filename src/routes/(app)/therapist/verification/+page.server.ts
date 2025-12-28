import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';
import { ColectivaKYCProvider } from '$lib/server/kyc-provider';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw redirect(303, '/login');
	}

	// Get therapist profile with verification info
	const { data: therapist, error } = await supabase
		.from('therapists')
		.select(`
			id,
			verification_status,
			verification_documents,
			verification_submitted_at,
			verification_completed_at,
			id_document_verified,
			license_verified,
			background_check_passed
		`)
		.eq('user_id', session.user.id)
		.single();

	if (error || !therapist) {
		// If no therapist profile, redirect to therapist setup
		throw redirect(303, '/therapist');
	}

	// Check if Colectiva KYC is enabled
	const useColectivaKYC = env.USE_COLECTIVA_KYC === 'true';
	let colectivaKYCUrl: string | null = null;

	if (useColectivaKYC && env.COLECTIVA_API_URL) {
		// Generate Colectiva KYC portal URL
		const returnUrl = `${url.origin}/therapist/verification?kyc_complete=true`;
		const provider = new ColectivaKYCProvider(
			env.COLECTIVA_API_URL,
			env.COLECTIVA_API_KEY || ''
		);
		colectivaKYCUrl = provider.getKYCPortalUrl(session.user.id, returnUrl);
	}

	return {
		therapist: {
			...therapist,
			verification_status: therapist.verification_status || 'unverified',
			verification_documents: therapist.verification_documents || [],
			id_document_verified: therapist.id_document_verified || false,
			license_verified: therapist.license_verified || false,
			background_check_passed: therapist.background_check_passed || false
		},
		useColectivaKYC,
		colectivaKYCUrl
	};
};

export const actions: Actions = {
	// Action to initiate Colectiva KYC session (alternative to direct URL)
	initiateColectivaKYC: async ({ locals, url }) => {
		const { session } = locals;

		if (!session) {
			throw redirect(303, '/login');
		}

		const useColectivaKYC = env.USE_COLECTIVA_KYC === 'true';

		if (!useColectivaKYC || !env.COLECTIVA_API_URL || !env.COLECTIVA_API_KEY) {
			return { success: false, error: 'Colectiva KYC not configured' };
		}

		try {
			const provider = new ColectivaKYCProvider(env.COLECTIVA_API_URL, env.COLECTIVA_API_KEY);
			const { data: user } = await locals.supabase
				.from('users')
				.select('email, full_name')
				.eq('id', session.user.id)
				.single();

			if (!user) {
				return { success: false, error: 'User not found' };
			}

			const returnUrl = `${url.origin}/therapist/verification?kyc_complete=true`;
			const result = await provider.initiateKYCSession(
				session.user.id,
				user.email,
				user.full_name || 'Unknown',
				returnUrl
			);

			throw redirect(303, result.portalUrl);
		} catch (error) {
			if (error instanceof Response) throw error; // Re-throw redirect
			console.error('Error initiating Colectiva KYC:', error);
			return { success: false, error: 'Failed to start verification' };
		}
	}
};
