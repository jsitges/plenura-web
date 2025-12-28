/**
 * RBS SSO - OAuth Callback Handler (Supabase)
 *
 * Creates/finds user and generates magic link for session.
 * Also links user to RBS ecosystem organization if available.
 */
import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RBSAuth, validateState } from '$lib/services/rbs-auth.service';
import { createServiceRoleClient } from '$lib/supabase/server';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import {
	findEcosystemOrgByRbsOrgId,
	resolveTherapistIdFromEcosystem,
	addUserToEcosystemOrg
} from '$lib/server/ecosystem-bridge.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const appUrl = publicEnv.PUBLIC_APP_URL || 'https://plenura.redbroomsoftware.com';

	const oauthError = url.searchParams.get('error');
	if (oauthError) {
		throw redirect(302, `/login?error=${encodeURIComponent(url.searchParams.get('error_description') || oauthError)}`);
	}

	const code = url.searchParams.get('code');
	if (!code) throw error(400, 'Missing authorization code');

	const savedState = cookies.get('rbs_oauth_state');
	if (!validateState(url.searchParams.get('state'), savedState)) {
		throw error(400, 'Invalid state parameter');
	}

	const codeVerifier = cookies.get('rbs_oauth_verifier');
	const returnTo = cookies.get('rbs_oauth_return') || '/dashboard';

	cookies.delete('rbs_oauth_state', { path: '/' });
	cookies.delete('rbs_oauth_verifier', { path: '/' });
	cookies.delete('rbs_oauth_return', { path: '/' });

	if (!env.RBS_CLIENT_ID || !env.RBS_CLIENT_SECRET) {
		throw error(500, 'RBS SSO not configured');
	}

	const auth = new RBSAuth({
		clientId: env.RBS_CLIENT_ID,
		clientSecret: env.RBS_CLIENT_SECRET,
		redirectUri: `${appUrl}/auth/rbs/callback`
	});

	try {
		const tokens = await auth.exchangeCode(code, codeVerifier);
		const userInfo = await auth.getUserInfo(tokens.access_token);

		const supabaseAdmin = createServiceRoleClient();

		// Find or create user in Supabase
		const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
		let supabaseUser = existingUsers?.users?.find(u => u.email === userInfo.email);

		// Resolve therapistId from ecosystem if user has organization_id
		let resolvedTherapistId: string | null = null;
		let ecosystemOrg = null;

		if (userInfo.organization_id) {
			console.log(`[RBS SSO] User has organization_id: ${userInfo.organization_id}`);

			// Find the ecosystem org
			ecosystemOrg = await findEcosystemOrgByRbsOrgId(userInfo.organization_id);

			if (ecosystemOrg) {
				console.log(`[RBS SSO] Found ecosystem org: ${ecosystemOrg.id}`);
				// Resolve Plenura therapistId from ecosystem
				resolvedTherapistId = await resolveTherapistIdFromEcosystem(userInfo.organization_id);
			}
		}

		if (!supabaseUser) {
			const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
				email: userInfo.email,
				email_confirm: true,
				user_metadata: {
					full_name: userInfo.name,
					rbs_user_id: userInfo.sub,
					rbs_org_id: userInfo.organization_id,
					rbs_org_name: userInfo.organization_name,
					ecosystem_org_id: ecosystemOrg?.id || null,
					therapist_id: resolvedTherapistId
				}
			});

			if (createError) {
				console.error('[RBS SSO] User creation error:', createError);
				throw new Error('Failed to create user account');
			}
			supabaseUser = newUser.user;

			// Add new user to ecosystem org members
			if (ecosystemOrg && supabaseUser) {
				await addUserToEcosystemOrg(ecosystemOrg.id, supabaseUser.id, userInfo.email);
			}
		} else {
			// Update existing user with ecosystem info if not already set
			const currentMetadata = supabaseUser.user_metadata || {};
			if (userInfo.organization_id && !currentMetadata.ecosystem_org_id && ecosystemOrg) {
				await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
					user_metadata: {
						...currentMetadata,
						rbs_org_id: userInfo.organization_id,
						rbs_org_name: userInfo.organization_name,
						ecosystem_org_id: ecosystemOrg.id,
						therapist_id: resolvedTherapistId || currentMetadata.therapist_id
					}
				});

				// Add existing user to ecosystem org members if not already
				await addUserToEcosystemOrg(ecosystemOrg.id, supabaseUser.id, userInfo.email);
			}
		}

		// Generate magic link for session
		const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
			type: 'magiclink',
			email: userInfo.email,
			options: {
				redirectTo: `${appUrl}/callback?next=${encodeURIComponent(returnTo)}`
			}
		});

		if (linkError || !linkData) {
			console.error('[RBS SSO] Magic link error:', linkError);
			throw new Error('Failed to generate session');
		}

		// Store user info in cookie
		cookies.set('rbs_user', JSON.stringify({
			id: userInfo.sub,
			email: userInfo.email,
			name: userInfo.name,
			picture: userInfo.picture,
			organization_id: userInfo.organization_id
		}), { path: '/', httpOnly: false, secure: true, sameSite: 'lax', maxAge: tokens.expires_in });

		// Redirect to Supabase auth flow
		const authUrl = linkData.properties?.verification_token
			? `${PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${linkData.properties.verification_token}&type=magiclink&redirect_to=${encodeURIComponent(appUrl + '/callback?next=' + returnTo)}`
			: linkData.properties?.action_link;

		if (!authUrl) {
			throw new Error('No auth URL generated');
		}

		throw redirect(302, authUrl);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('[RBS SSO] Error:', err);
		throw redirect(302, `/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'Auth failed')}`);
	}
};
