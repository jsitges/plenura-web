/**
 * Developer Access Entry Point for Plenura
 *
 * Validates developer access tokens from Colectiva
 * and creates a special developer session cookie.
 */

import { json, redirect, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

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

/**
 * GET /dev-access?token=xxx
 *
 * Validates the developer access token and creates a developer session.
 */
export async function GET({ url, cookies }: RequestEvent) {
	const token = url.searchParams.get('token');

	if (!token) {
		return json({ error: 'Token parameter required' }, { status: 400 });
	}

	const colectivaUrl = env.COLECTIVA_API_URL || 'https://colectiva.redbroomsoftware.com';

	try {
		// Validate token with Colectiva
		const response = await fetch(
			`${colectivaUrl}/api/developer-access/validate?token=${encodeURIComponent(token)}`
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('[DevAccess] Token validation failed:', errorData);
			return json(
				{ error: errorData.error || 'Invalid or expired token' },
				{ status: response.status }
			);
		}

		const data = await response.json();

		if (!data.valid) {
			return json(
				{ error: data.error || 'Token validation failed' },
				{ status: 401 }
			);
		}

		// Create developer session cookie
		const developerSession: DeveloperSession = {
			developer_uid: data.developer.uid,
			developer_email: data.developer.email,
			developer_name: data.developer.name,
			target_org: data.target_org,
			expires_at: data.expires_at,
			created_at: new Date().toISOString()
		};

		console.log(`[DevAccess] Developer ${data.developer.email} accessing organization ${data.target_org.name}`);

		// Store developer session in a cookie
		cookies.set('developer_session', JSON.stringify(developerSession), {
			path: '/',
			httpOnly: false, // Needs to be readable by client for UI
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 // 1 hour
		});

		// Redirect to dashboard
		throw redirect(303, '/dashboard?developer_mode=true');
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'status' in err && err.status === 303) throw err; // Redirect
		const error = err as Error;
		console.error('[DevAccess] Error:', error);
		return json(
			{ error: error.message || 'Failed to validate access token' },
			{ status: 500 }
		);
	}
};
