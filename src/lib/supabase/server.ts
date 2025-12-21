import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$types/database.types';
import type { RequestEvent } from '@sveltejs/kit';

export function createServerSupabaseClient(event: RequestEvent) {
	return createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);
}

export function createServiceRoleClient() {
	// This should only be used in Edge Functions or secure server contexts
	// DO NOT import SUPABASE_SERVICE_ROLE_KEY in client-side code
	const { SUPABASE_SERVICE_ROLE_KEY } = process.env;
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
	}

	return createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		SUPABASE_SERVICE_ROLE_KEY,
		{
			cookies: {
				getAll: () => [],
				setAll: () => {}
			},
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		}
	);
}
