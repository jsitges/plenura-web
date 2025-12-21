import { createServerSupabaseClient } from '$lib/supabase/server';
import type { Handle } from '@sveltejs/kit';
import type { Tables } from '$lib/types/database.types';

export const handle: Handle = async ({ event, resolve }) => {
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
