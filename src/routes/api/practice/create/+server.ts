import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registerPracticeWithEcosystem } from '$lib/server/ecosystem-bridge.service';
import { createServiceRoleClient } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, session } = locals;

	if (!session) {
		throw error(401, 'No autenticado');
	}

	// Check if user already has a practice
	const { data: existingMembership } = await supabase
		.from('practice_members')
		.select('id')
		.eq('user_id', session.user.id)
		.eq('role', 'owner')
		.single();

	if (existingMembership) {
		throw error(400, 'Ya tienes una práctica registrada');
	}

	const body = await request.json();
	const {
		name,
		type = 'solo',
		email,
		phone,
		address,
		city,
		state,
		taxId
	} = body;

	if (!name || !email) {
		throw error(400, 'Nombre y email son requeridos');
	}

	// Create the practice
	const { data: practice, error: practiceError } = await supabase
		.from('practices')
		.insert({
			name,
			business_type: type,
			email: email.toLowerCase().trim(),
			phone: phone || null,
			address: address || null,
			city: city || null,
			state: state || null,
			tax_id: taxId || null,
			verification_status: 'unverified'
		})
		.select()
		.single();

	if (practiceError) {
		console.error('Error creating practice:', practiceError);
		throw error(500, 'Error al crear la práctica');
	}

	// Add user as owner
	const { error: memberError } = await supabase
		.from('practice_members')
		.insert({
			practice_id: practice.id,
			user_id: session.user.id,
			role: 'owner',
			status: 'active',
			joined_at: new Date().toISOString()
		});

	if (memberError) {
		console.error('Error adding owner:', memberError);
		// Rollback practice creation
		await supabase.from('practices').delete().eq('id', practice.id);
		throw error(500, 'Error al configurar el propietario');
	}

	// Check if user has a therapist profile and link it
	const { data: therapist } = await supabase
		.from('therapists')
		.select('id')
		.eq('user_id', session.user.id)
		.single();

	if (therapist) {
		// Update therapist to be part of practice
		await supabase
			.from('therapists')
			.update({
				is_independent: false,
				primary_practice_id: practice.id
			})
			.eq('id', therapist.id);

		// Update practice_members with therapist_id
		await supabase
			.from('practice_members')
			.update({ therapist_id: therapist.id })
			.eq('practice_id', practice.id)
			.eq('user_id', session.user.id);
	}

	// Get user's rbs_org_id from auth metadata
	const supabaseAdmin = createServiceRoleClient();
	const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(session.user.id);
	const rbsOrgId = authUser?.user?.user_metadata?.rbs_org_id as string | null;

	// Register with ecosystem (fire and forget)
	registerPracticeWithEcosystem(practice.id, name, email, taxId, rbsOrgId)
		.then((result) => {
			if (result.ecosystemOrgId) {
				supabase
					.from('practices')
					.update({ ecosystem_org_id: result.ecosystemOrgId })
					.eq('id', practice.id)
					.then(() => {
						console.log(`[Ecosystem] Updated practice ${practice.id} with ecosystem_org_id`);
					});
			}
		})
		.catch((err) => {
			console.error('[Ecosystem] Practice registration failed:', err);
		});

	// Clear pending_practice from user metadata
	await supabaseAdmin.auth.admin.updateUserById(session.user.id, {
		user_metadata: {
			...authUser?.user?.user_metadata,
			pending_practice: null,
			practice_id: practice.id
		}
	});

	return json({
		success: true,
		practice: {
			id: practice.id,
			name: practice.name,
			slug: practice.slug
		}
	});
};
