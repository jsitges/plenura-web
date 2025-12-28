/**
 * Ecosystem Registration API
 *
 * Registers therapists and practices with the RBS ecosystem (Colectiva).
 * This enables cross-app SSO, centralized billing, and shared services.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	registerTherapistWithEcosystem,
	registerPracticeWithEcosystem
} from '$lib/server/ecosystem-bridge.service';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { type, therapistId, practiceId, name, taxId, rbsOrgId } = body;

	if (!type || !['therapist', 'practice'].includes(type)) {
		throw error(400, 'Invalid registration type. Must be "therapist" or "practice".');
	}

	// Get user details
	const { data: user } = await supabase
		.from('users')
		.select('id, email, full_name, role')
		.eq('id', session.user.id)
		.single();

	if (!user) {
		throw error(404, 'User not found');
	}

	if (type === 'therapist') {
		// Verify user is a therapist
		if (user.role !== 'therapist') {
			throw error(403, 'Only therapists can register as individual practitioners');
		}

		// Get therapist record
		const { data: therapist } = await (supabase as any)
			.from('therapists')
			.select('id, user_id, ecosystem_org_id')
			.eq('user_id', session.user.id)
			.single();

		if (!therapist) {
			throw error(404, 'Therapist profile not found');
		}

		// Check if already registered
		if (therapist.ecosystem_org_id) {
			return json({
				success: true,
				message: 'Already registered with ecosystem',
				ecosystemOrgId: therapist.ecosystem_org_id
			});
		}

		// Register with ecosystem
		const result = await registerTherapistWithEcosystem(
			therapistId || therapist.id,
			name || user.full_name || 'Unknown Therapist',
			user.email,
			rbsOrgId,
			true // isIndependent
		);

		if (result.error) {
			console.error('Ecosystem registration failed:', result.error);
			// Don't fail - ecosystem registration is optional
			return json({
				success: false,
				error: result.error,
				message: 'Ecosystem registration failed but account was created'
			});
		}

		// Update therapist with ecosystem_org_id
		if (result.ecosystemOrgId) {
			await (supabase as any)
				.from('therapists')
				.update({ ecosystem_org_id: result.ecosystemOrgId })
				.eq('id', therapist.id);
		}

		return json({
			success: true,
			ecosystemOrgId: result.ecosystemOrgId,
			message: 'Successfully registered with ecosystem'
		});

	} else if (type === 'practice') {
		// Verify practiceId is provided
		if (!practiceId) {
			throw error(400, 'practiceId is required for practice registration');
		}

		// Get practice and verify ownership
		const { data: practice } = await (supabase as any)
			.from('practices')
			.select('id, name, owner_id, ecosystem_org_id, tax_id')
			.eq('id', practiceId)
			.single();

		if (!practice) {
			throw error(404, 'Practice not found');
		}

		// Only owner can register practice
		if (practice.owner_id !== session.user.id) {
			throw error(403, 'Only practice owner can register with ecosystem');
		}

		// Check if already registered
		if (practice.ecosystem_org_id) {
			return json({
				success: true,
				message: 'Practice already registered with ecosystem',
				ecosystemOrgId: practice.ecosystem_org_id
			});
		}

		// Register with ecosystem
		const result = await registerPracticeWithEcosystem(
			practiceId,
			name || practice.name,
			user.email,
			taxId || practice.tax_id,
			rbsOrgId
		);

		if (result.error) {
			console.error('Practice ecosystem registration failed:', result.error);
			return json({
				success: false,
				error: result.error,
				message: 'Ecosystem registration failed'
			});
		}

		// Update practice with ecosystem_org_id
		if (result.ecosystemOrgId) {
			await (supabase as any)
				.from('practices')
				.update({ ecosystem_org_id: result.ecosystemOrgId })
				.eq('id', practiceId);
		}

		return json({
			success: true,
			ecosystemOrgId: result.ecosystemOrgId,
			message: 'Practice successfully registered with ecosystem'
		});
	}

	throw error(400, 'Invalid registration type');
};
