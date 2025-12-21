import { writable, derived, type Readable } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '$types/database.types';

// Core auth state
export const session = writable<Session | null>(null);
export const user = writable<User | null>(null);
export const isLoading = writable<boolean>(true);

// User profile from our users table
export const userProfile = writable<Tables<'users'> | null>(null);

// Therapist profile if user is a therapist
export const therapistProfile = writable<Tables<'therapists'> | null>(null);

// Derived stores for convenience
export const isAuthenticated: Readable<boolean> = derived(
	user,
	($user) => $user !== null
);

export const userRole: Readable<'client' | 'therapist' | 'admin' | null> = derived(
	userProfile,
	($profile) => $profile?.role ?? null
);

export const isTherapist: Readable<boolean> = derived(
	userRole,
	($role) => $role === 'therapist'
);

export const isAdmin: Readable<boolean> = derived(
	userRole,
	($role) => $role === 'admin'
);

// Reset all auth state
export function resetAuthState() {
	session.set(null);
	user.set(null);
	userProfile.set(null);
	therapistProfile.set(null);
	isLoading.set(false);
}

// Set auth state from session
export function setAuthState(newSession: Session | null) {
	session.set(newSession);
	user.set(newSession?.user ?? null);
	isLoading.set(false);
}
