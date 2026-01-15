/**
 * Plenura Ecosystem Organizations API
 *
 * Lists all Plenura organizations (practices + independent therapists)
 * for display in Camino's ecosystem dashboard.
 *
 * Authentication: Requires admin access or valid ecosystem signature
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServiceSupabase } from '$lib/supabase/server';

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
		const supabase = getServiceSupabase();

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

		// Transform to Camino-compatible format
		const formatted = (organizations || []).map((org: any) => ({
			id: org.ecosystem_org_id,
			name: org.organization_name,
			email: org.email,
			businessType: org.business_type,
			subscriptionTier: org.subscription_tier,
			verificationStatus: org.verification_status,
			isActive: org.is_active,
			location: org.location,
			memberCount: org.member_count,
			rating: org.rating_avg,
			createdAt: org.created_at,
			linkedApps: {
				plenura: {
					appId: 'plenura',
					orgId: org.ecosystem_org_id,
					subscriptionStatus: org.is_active ? 'active' : 'inactive',
					subscriptionTier: org.subscription_tier
				}
			},
			metadata: org.metadata
		}));

		return json({
			success: true,
			organizations: formatted,
			total: formatted.length,
			limit,
			offset
		});
	} catch (err: any) {
		console.error('[Plenura Ecosystem] Error:', err);
		if (err.status) throw err;
		throw error(500, err.message || 'Failed to fetch ecosystem organizations');
	}
};
