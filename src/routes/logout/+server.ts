import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase } = locals;

	// Sign out the user
	await supabase.auth.signOut();

	// Get redirect URL from query params, default to home
	const redirectTo = url.searchParams.get('redirect') || '/';

	// Validate redirect URL to prevent open redirect vulnerabilities
	// Only allow relative URLs or URLs to the same origin
	let safeRedirectUrl = '/';

	if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
		// Relative URL starting with single slash is safe
		safeRedirectUrl = redirectTo;
	} else {
		try {
			const redirectUrl = new URL(redirectTo, url.origin);
			// Only allow same-origin redirects
			if (redirectUrl.origin === url.origin) {
				safeRedirectUrl = redirectUrl.pathname + redirectUrl.search;
			}
		} catch {
			// Invalid URL, use default
			safeRedirectUrl = '/';
		}
	}

	redirect(303, safeRedirectUrl);
};

export const POST: RequestHandler = async ({ request, url, locals }) => {
	const { supabase } = locals;

	// Sign out the user
	await supabase.auth.signOut();

	// Try to get redirect from form data or query params
	let redirectTo = url.searchParams.get('redirect');

	if (!redirectTo) {
		try {
			const formData = await request.formData();
			redirectTo = formData.get('redirect') as string | null;
		} catch {
			// No form data
		}
	}

	redirectTo = redirectTo || '/';

	// Validate redirect URL
	let safeRedirectUrl = '/';

	if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
		safeRedirectUrl = redirectTo;
	} else {
		try {
			const redirectUrl = new URL(redirectTo, url.origin);
			if (redirectUrl.origin === url.origin) {
				safeRedirectUrl = redirectUrl.pathname + redirectUrl.search;
			}
		} catch {
			safeRedirectUrl = '/';
		}
	}

	redirect(303, safeRedirectUrl);
};
