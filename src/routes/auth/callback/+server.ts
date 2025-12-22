import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/dashboard';
	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	// Handle OAuth errors
	if (error) {
		console.error('OAuth error:', error, errorDescription);
		throw redirect(303, `/login?error=${encodeURIComponent(errorDescription || error)}`);
	}

	if (!code) {
		throw redirect(303, '/login?error=No authorization code provided');
	}

	try {
		// Exchange the code for a session
		const { error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (exchangeError) {
			console.error('Code exchange error:', exchangeError);
			throw redirect(303, `/login?error=${encodeURIComponent(exchangeError.message)}`);
		}

		// Successful login - redirect to dashboard or intended destination
		throw redirect(303, next);
	} catch (err) {
		// Re-throw redirects
		if (err instanceof Response || (err as any)?.status === 303) {
			throw err;
		}

		console.error('Auth callback error:', err);
		throw redirect(303, '/login?error=Authentication failed');
	}
};
