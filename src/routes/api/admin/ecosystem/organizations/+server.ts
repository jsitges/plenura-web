/**
 * Plenura Ecosystem Organizations API (Internal/Admin Only)
 *
 * Lists all Plenura organizations (practices + independent therapists).
 *
 * ⚠️ IMPORTANT: This endpoint is for internal/admin use only.
 * For ecosystem integration, Plenura registers organizations TO Colectiva
 * via POST /api/ecosystem-orgs (following the same pattern as Caracol,
 * La Hoja, and Cosmos Pet). External apps should query Colectiva, not this endpoint.
 *
 * Authentication: Requires admin access
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServiceRoleClient } from '$lib/supabase/server';

/**
 * GET /api/admin/ecosystem/organizations
 * List all Plenura ecosystem organizations
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();

	// Check if user is authenticated admin
	const isAdmin = session?.user?.user_metadata?.role === 'admin';

	// TODO: Add ecosystem signature validation for Camino access
	// For now, require admin authentication
	if (!isAdmin) {
		throw error(403, 'Admin access required');
	}

	try {
		const supabase = createServiceRoleClient();

		// Get query params
		const search = url.searchParams.get('search') || null;
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Call database function
		const { data: organizations, error: dbError } = await supabase.rpc(
			'get_ecosystem_organizations',
			{
				p_search: search,
				p_limit: limit,
				p_offset: offset
			}
		);

		if (dbError) {
			console.error('[Plenura Ecosystem] Error fetching organizations:', dbError);
			throw error(500, 'Failed to fetch ecosystem organizations');
		}

		// Transform to match Colectiva's format exactly
		const formatted = (organizations || []).map((org: any) => ({
			id: org.ecosystem_org_id,
			name: org.organization_name,
			rfc: org.metadata?.tax_id || null,
			type: org.business_type || 'business',
			linkedApps: {
				plenura: {
					org_id: org.ecosystem_org_id,
					name: org.organization_name,
					syncEnabled: true
				}
			},
			billing: {
				plan: org.subscription_tier || 'free',
				status: org.is_active ? 'active' : 'inactive'
			},
			memberCount: org.member_count || 1,
			createdAt: org.created_at
		}));

		return json({
			success: true,
			orgs: formatted,  // Match Colectiva's response key
			count: formatted.length,
			total: formatted.length
		});
	} catch (err: any) {
		console.error('[Plenura Ecosystem] Error:', err);
		if (err.status) throw err;
		throw error(500, err.message || 'Failed to fetch ecosystem organizations');
	}
};
