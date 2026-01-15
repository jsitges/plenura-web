/**
 * Admin Ecosystem Lookup Endpoint
 *
 * Allows authorized ecosystem apps (primarily Camino) to resolve
 * rbsOrgId -> Plenura entity for admin troubleshooting.
 *
 * Security:
 * - Signed request verification (HMAC-SHA256)
 * - Admin JWT token validation
 * - Rate limiting (10/min per admin)
 * - Full audit logging
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import {
	verifySignedRequest,
	verifyAdminToken,
	hasPermission,
	checkRateLimit
} from '$lib/server/ecosystem-auth';
import {
	resolveTherapistIdFromEcosystem,
	resolvePracticeIdFromEcosystem,
	findEcosystemOrgByRbsOrgId
} from '$lib/server/ecosystem-bridge.service';
import { logAdminLookup, logAuthFailure } from '$lib/server/audit-log.service';
import { createServiceRoleClient } from '$lib/supabase/server';

interface LookupRequest {
	rbsOrgId: string;
	reason?: string;
}

interface LookupResponse {
	success: boolean;
	entity?: {
		type: 'therapist' | 'practice';
		id: string;
		name?: string;
		email?: string;
	};
	session?: {
		id: string;
		expiresAt: string;
		readOnly: boolean;
	};
	error?: {
		code: string;
		message: string;
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
		request.headers.get('x-real-ip') ||
		'unknown';

	// Step 1: Read body for signature verification
	const bodyText = await request.text();
	let body: LookupRequest;

	try {
		body = JSON.parse(bodyText);
	} catch {
		return json<LookupResponse>({
			success: false,
			error: { code: 'INVALID_JSON', message: 'Invalid JSON body' }
		}, { status: 400 });
	}

	// Step 2: Verify signed request from ecosystem app
	const signatureResult = verifySignedRequest(request.headers, bodyText);

	if (!signatureResult.valid) {
		await logAuthFailure({
			reason: signatureResult.error || 'Signature verification failed',
			ip: clientIp,
			appId: request.headers.get('X-RBS-App') || undefined,
			metadata: { endpoint: '/api/admin/ecosystem/lookup' }
		});

		return json<LookupResponse>({
			success: false,
			error: { code: 'UNAUTHORIZED', message: signatureResult.error || 'Invalid signature' }
		}, { status: 401 });
	}

	// Step 3: Check app has admin:lookup permission
	if (!hasPermission(signatureResult.app!, 'admin:lookup')) {
		await logAuthFailure({
			reason: 'Missing admin:lookup permission',
			ip: clientIp,
			appId: signatureResult.app!.id,
			metadata: { permissions: signatureResult.app!.permissions }
		});

		return json<LookupResponse>({
			success: false,
			error: { code: 'FORBIDDEN', message: 'App does not have admin:lookup permission' }
		}, { status: 403 });
	}

	// Step 4: Verify admin JWT token
	const authHeader = request.headers.get('Authorization');
	const tokenResult = await verifyAdminToken(authHeader || '');

	if (!tokenResult.valid) {
		await logAuthFailure({
			reason: tokenResult.error || 'Invalid admin token',
			ip: clientIp,
			appId: signatureResult.app!.id,
			metadata: { endpoint: '/api/admin/ecosystem/lookup' }
		});

		return json<LookupResponse>({
			success: false,
			error: { code: 'UNAUTHORIZED', message: tokenResult.error || 'Invalid admin token' }
		}, { status: 401 });
	}

	// Step 5: Check rate limit
	const rateLimitKey = `admin:lookup:${tokenResult.adminId}`;
	const rateLimit = checkRateLimit(rateLimitKey);

	if (!rateLimit.allowed) {
		await logAdminLookup({
			adminId: tokenResult.adminId!,
			adminEmail: tokenResult.adminEmail,
			adminIp: clientIp,
			rbsOrgId: body.rbsOrgId,
			outcome: 'denied',
			reason: body.reason,
			errorMessage: 'Rate limit exceeded'
		});

		return json<LookupResponse>({
			success: false,
			error: {
				code: 'RATE_LIMITED',
				message: `Rate limit exceeded. Try again after ${rateLimit.resetAt.toISOString()}`
			}
		}, {
			status: 429,
			headers: {
				'X-RateLimit-Remaining': rateLimit.remaining.toString(),
				'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
			}
		});
	}

	// Step 6: Validate request body
	if (!body.rbsOrgId) {
		return json<LookupResponse>({
			success: false,
			error: { code: 'INVALID_REQUEST', message: 'rbsOrgId is required' }
		}, { status: 400 });
	}

	// Step 7: Resolve entity from ecosystem
	try {
		// Try to find the ecosystem org first
		const ecosystemOrg = await findEcosystemOrgByRbsOrgId(body.rbsOrgId);

		if (!ecosystemOrg) {
			await logAdminLookup({
				adminId: tokenResult.adminId!,
				adminEmail: tokenResult.adminEmail,
				adminIp: clientIp,
				rbsOrgId: body.rbsOrgId,
				outcome: 'failure',
				reason: body.reason,
				errorMessage: 'Ecosystem org not found'
			});

			return json<LookupResponse>({
				success: false,
				error: { code: 'NOT_FOUND', message: 'No ecosystem organization found for this rbsOrgId' }
			}, { status: 404 });
		}

		// Try to resolve therapist first
		const therapistId = await resolveTherapistIdFromEcosystem(body.rbsOrgId);

		if (therapistId) {
			// Fetch therapist details
			const supabase = createServiceRoleClient();
			const { data: therapist } = await supabase
				.from('therapists')
				.select('id, user_id, users!inner(email, full_name)')
				.eq('id', therapistId)
				.single();

			const sessionId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

			await logAdminLookup({
				adminId: tokenResult.adminId!,
				adminEmail: tokenResult.adminEmail,
				adminIp: clientIp,
				rbsOrgId: body.rbsOrgId,
				targetType: 'therapist',
				targetId: therapistId,
				outcome: 'success',
				reason: body.reason
			});

			return json<LookupResponse>({
				success: true,
				entity: {
					type: 'therapist',
					id: therapistId,
					name: (therapist?.users as { full_name?: string })?.full_name || ecosystemOrg.name,
					email: (therapist?.users as { email?: string })?.email
				},
				session: {
					id: sessionId,
					expiresAt: expiresAt.toISOString(),
					readOnly: true
				}
			}, {
				headers: {
					'X-RateLimit-Remaining': rateLimit.remaining.toString(),
					'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
				}
			});
		}

		// Try to resolve practice
		const practiceId = await resolvePracticeIdFromEcosystem(body.rbsOrgId);

		if (practiceId) {
			const supabase = createServiceRoleClient();
			const { data: practice } = await supabase
				.from('practices')
				.select('id, name, email')
				.eq('id', practiceId)
				.single();

			const sessionId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

			await logAdminLookup({
				adminId: tokenResult.adminId!,
				adminEmail: tokenResult.adminEmail,
				adminIp: clientIp,
				rbsOrgId: body.rbsOrgId,
				targetType: 'practice',
				targetId: practiceId,
				outcome: 'success',
				reason: body.reason
			});

			return json<LookupResponse>({
				success: true,
				entity: {
					type: 'practice',
					id: practiceId,
					name: practice?.name || ecosystemOrg.name,
					email: practice?.email
				},
				session: {
					id: sessionId,
					expiresAt: expiresAt.toISOString(),
					readOnly: true
				}
			}, {
				headers: {
					'X-RateLimit-Remaining': rateLimit.remaining.toString(),
					'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
				}
			});
		}

		// Ecosystem org exists but no Plenura entity linked
		await logAdminLookup({
			adminId: tokenResult.adminId!,
			adminEmail: tokenResult.adminEmail,
			adminIp: clientIp,
			rbsOrgId: body.rbsOrgId,
			outcome: 'failure',
			reason: body.reason,
			errorMessage: 'No Plenura entity linked to ecosystem org'
		});

		return json<LookupResponse>({
			success: false,
			error: {
				code: 'NOT_LINKED',
				message: 'Ecosystem organization exists but has no Plenura therapist or practice linked'
			}
		}, { status: 404 });

	} catch (error) {
		console.error('[AdminLookup] Error:', error);

		await logAdminLookup({
			adminId: tokenResult.adminId!,
			adminEmail: tokenResult.adminEmail,
			adminIp: clientIp,
			rbsOrgId: body.rbsOrgId,
			outcome: 'failure',
			reason: body.reason,
			errorMessage: String(error)
		});

		return json<LookupResponse>({
			success: false,
			error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve entity' }
		}, { status: 500 });
	}
};
