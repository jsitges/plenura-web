import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, Tables } from '$lib/types/database.types';

interface DeveloperSession {
	developer_uid: string;
	developer_email: string;
	developer_name: string;
	target_org: {
		ecosystem_org_id: string;
		app_org_id: string;
		name: string;
	};
	expires_at: string;
	created_at: string;
}

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			session: Session | null;
			user: User | null;
			userProfile: Tables<'users'> | null;
			therapistProfile: Tables<'therapists'> | null;
			developerSession: DeveloperSession | null;
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
