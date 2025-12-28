/**
 * RBS SSO - Login Initiation
 */
import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RBSAuth, generateState } from '$lib/services/rbs-auth.service';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const returnTo = url.searchParams.get('returnTo') || '/dashboard';
	const prompt = url.searchParams.get('prompt') as 'login' | 'consent' | 'none' | null;

	if (!env.RBS_CLIENT_ID || !env.RBS_CLIENT_SECRET) {
		throw error(500, 'RBS SSO not configured');
	}

	const appUrl = publicEnv.PUBLIC_APP_URL || 'https://plenura.redbroomsoftware.com';

	const auth = new RBSAuth({
		clientId: env.RBS_CLIENT_ID,
		clientSecret: env.RBS_CLIENT_SECRET,
		redirectUri: `${appUrl}/auth/rbs/callback`
	});

	const state = generateState();
	const { url: authUrl, pkce } = await auth.getAuthorizationUrl({
		state,
		usePKCE: true,
		prompt: prompt || undefined
	});

	cookies.set('rbs_oauth_state', state, { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600 });
	if (pkce) {
		cookies.set('rbs_oauth_verifier', pkce.codeVerifier, { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600 });
	}
	cookies.set('rbs_oauth_return', returnTo, { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600 });

	throw redirect(302, authUrl);
};
