import { createServerSupabaseClient } from '$lib/supabase/server';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import type { Tables } from '$lib/types/database.types';
import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';

// Initialize Sentry
Sentry.init({
	dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
	environment: process.env.NODE_ENV,
	tracesSampleRate: 1.0
});

// Developer session middleware - handles cross-app developer access
const developerSessionHandle: Handle = async ({ event, resolve }) => {
	const developerSessionCookie = event.cookies.get('developer_session');

	if (developerSessionCookie) {
		try {
			const developerSession = JSON.parse(developerSessionCookie);

			// Check if session is expired
			const expiresAt = new Date(developerSession.expires_at);
			if (expiresAt > new Date()) {
				// Valid developer session
				event.locals.developerSession = developerSession;
				console.log(`[DevSession] Developer ${developerSession.developer_email} accessing org ${developerSession.target_org.name}`);
			} else {
				// Expired, clear cookie
				event.cookies.delete('developer_session', { path: '/' });
				event.locals.developerSession = null;
				console.log('[DevSession] Expired developer session, cleared cookie');
			}
		} catch (err) {
			// Invalid JSON, clear cookie
			event.cookies.delete('developer_session', { path: '/' });
			event.locals.developerSession = null;
			console.error('[DevSession] Invalid developer session cookie:', err);
		}
	} else {
		event.locals.developerSession = null;
	}

	return resolve(event);
};

const supabaseHandle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for this request
	const supabase = createServerSupabaseClient(event);

	// Get the session
	const {
		data: { session }
	} = await supabase.auth.getSession();

	// Make the supabase client and session available to routes
	event.locals.supabase = supabase;
	event.locals.session = session;
	event.locals.user = session?.user ?? null;

	// If user is logged in, fetch their profile
	if (session?.user) {
		const { data: profile } = await supabase
			.from('users')
			.select('*')
			.eq('id', session.user.id)
			.single();

		const userProfile = profile as Tables<'users'> | null;
		event.locals.userProfile = userProfile;

		// If user is a therapist, fetch their therapist profile
		if (userProfile?.role === 'therapist') {
			const { data: therapistProfile } = await supabase
				.from('therapists')
				.select('*')
				.eq('user_id', session.user.id)
				.single();

			event.locals.therapistProfile = therapistProfile as Tables<'therapists'> | null;
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Keep cookies for Supabase auth
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

// Combine all handles: developer session first, then Sentry, then Supabase
export const handle = sequence(developerSessionHandle, Sentry.sentryHandle(), supabaseHandle);

// Error handler with Sentry
export const handleError: HandleServerError = Sentry.handleErrorWithSentry();
