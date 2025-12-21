import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, Tables } from '$lib/types/database.types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			session: Session | null;
			user: User | null;
			userProfile: Tables<'users'> | null;
			therapistProfile: Tables<'therapists'> | null;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
			userProfile: Tables<'users'> | null;
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
