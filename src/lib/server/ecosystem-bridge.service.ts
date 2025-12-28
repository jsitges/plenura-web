/**
 * Ecosystem Bridge Service for Plenura
 *
 * Resolves therapist identity across the RBS ecosystem.
 * When a user logs in via SSO (Camino OAuth2), they receive an `rbsOrgId` claim.
 * This service maps that to the local Plenura therapistId using the ecosystem_orgs registry.
 *
 * Architecture:
 * - Camino (Supabase) issues `organization_id` via OAuth2
 * - Constanza/Colectiva maintain `ecosystem_orgs` collection in Firestore
 * - Each ecosystem_org has `linkedApps.{app}.orgId` mapping to app-specific IDs
 * - This bridge looks up the mapping to resolve Plenura's therapistId
 */

import { getEcosystemDb, isEcosystemBridgeEnabled } from './firebase-admin';
import { env } from '$env/dynamic/private';

interface LinkedApp {
	orgId?: string;
	therapistId?: string;
	practiceId?: string;
	syncEnabled?: boolean;
	posEnabled?: boolean;
	walletEnabled?: boolean;
	crmEnabled?: boolean;
}

interface EcosystemOrgMember {
	uid: string;
	email: string;
	role: string;
	apps: string[];
	joinedAt: Date;
}

interface EcosystemOrg {
	id: string;
	name: string;
	rfc: string | null;
	linkedApps: {
		constanza?: LinkedApp;
		colectiva?: LinkedApp;
		la_hoja?: LinkedApp;
		caracol?: LinkedApp;
		camino?: LinkedApp;
		mancha?: LinkedApp;
		cosmos_pet?: LinkedApp;
		plenura?: LinkedApp;
		agora?: LinkedApp;
	};
	memberIds: string[];
	members?: EcosystemOrgMember[];
}

// Cache for ecosystem lookups (5 minute TTL)
const ecosystemCache = new Map<string, { therapistId: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve Plenura therapistId from RBS ecosystem organization ID
 *
 * @param rbsOrgId - The organization_id from Camino OAuth2 (ecosystem_tenants.id in Supabase)
 * @returns The Plenura therapistId or null if not found/linked
 */
export async function resolveTherapistIdFromEcosystem(rbsOrgId: string): Promise<string | null> {
	if (!rbsOrgId || !isEcosystemBridgeEnabled()) return null;

	const adminDb = getEcosystemDb();
	if (!adminDb) return null;

	// Check cache first
	const cached = ecosystemCache.get(rbsOrgId);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.therapistId;
	}

	try {
		// Look up ecosystem_orgs where linkedApps.camino.orgId matches rbsOrgId
		const ecosystemOrgsRef = adminDb.collection('ecosystem_orgs');

		const snapshot = await ecosystemOrgsRef
			.where('linkedApps.camino.orgId', '==', rbsOrgId)
			.limit(1)
			.get();

		if (snapshot.empty) {
			console.log(`[EcosystemBridge] No ecosystem_org found for rbsOrgId: ${rbsOrgId}`);
			ecosystemCache.set(rbsOrgId, { therapistId: null, timestamp: Date.now() });
			return null;
		}

		const ecosystemOrg = snapshot.docs[0].data() as EcosystemOrg;
		const plenuraLink = ecosystemOrg.linkedApps?.plenura;
		const therapistId = plenuraLink?.therapistId || plenuraLink?.orgId;

		if (!therapistId) {
			console.log(`[EcosystemBridge] Ecosystem org ${ecosystemOrg.id} has no Plenura link`);
			ecosystemCache.set(rbsOrgId, { therapistId: null, timestamp: Date.now() });
			return null;
		}

		console.log(`[EcosystemBridge] Resolved rbsOrgId ${rbsOrgId} -> Plenura therapistId ${therapistId}`);
		ecosystemCache.set(rbsOrgId, { therapistId, timestamp: Date.now() });
		return therapistId;

	} catch (error) {
		console.error('[EcosystemBridge] Error resolving therapistId:', error);
		return null;
	}
}

/**
 * Find ecosystem org by rbsOrgId (Camino organization_id)
 */
export async function findEcosystemOrgByRbsOrgId(rbsOrgId: string): Promise<EcosystemOrg | null> {
	if (!rbsOrgId || !isEcosystemBridgeEnabled()) return null;

	const adminDb = getEcosystemDb();
	if (!adminDb) return null;

	try {
		const ecosystemOrgsRef = adminDb.collection('ecosystem_orgs');
		const snapshot = await ecosystemOrgsRef
			.where('linkedApps.camino.orgId', '==', rbsOrgId)
			.limit(1)
			.get();

		if (snapshot.empty) {
			return null;
		}

		return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EcosystemOrg;
	} catch (error) {
		console.error('[EcosystemBridge] Error finding ecosystem org:', error);
		return null;
	}
}

/**
 * Add user to ecosystem org members
 */
export async function addUserToEcosystemOrg(
	ecosystemOrgId: string,
	userUid: string,
	userEmail: string
): Promise<boolean> {
	if (!isEcosystemBridgeEnabled()) return false;

	const adminDb = getEcosystemDb();
	if (!adminDb) return false;

	try {
		const ecosystemOrgRef = adminDb.collection('ecosystem_orgs').doc(ecosystemOrgId);
		const doc = await ecosystemOrgRef.get();

		if (!doc.exists) return false;

		const orgData = doc.data() as EcosystemOrg;

		// Check if already a member
		if (orgData.memberIds?.includes(userUid)) {
			return true;
		}

		await ecosystemOrgRef.update({
			memberIds: [...(orgData.memberIds || []), userUid],
			members: [...(orgData.members || []), {
				uid: userUid,
				email: userEmail,
				role: 'member',
				apps: ['plenura'],
				joinedAt: new Date()
			}]
		});

		console.log(`[EcosystemBridge] Added user ${userUid} to ecosystem org ${ecosystemOrgId}`);
		return true;
	} catch (error) {
		console.error('[EcosystemBridge] Error adding user to org:', error);
		return false;
	}
}

/**
 * Link a Plenura therapist to an ecosystem organization
 */
export async function linkTherapistToEcosystem(
	ecosystemOrgId: string,
	therapistId: string
): Promise<boolean> {
	if (!isEcosystemBridgeEnabled()) return false;

	const adminDb = getEcosystemDb();
	if (!adminDb) return false;

	try {
		const ecosystemOrgRef = adminDb.collection('ecosystem_orgs').doc(ecosystemOrgId);

		await ecosystemOrgRef.update({
			'linkedApps.plenura': {
				therapistId: therapistId,
				syncEnabled: true
			}
		});

		console.log(`[EcosystemBridge] Linked Plenura therapist ${therapistId} to ecosystem org ${ecosystemOrgId}`);
		ecosystemCache.clear();
		return true;
	} catch (error) {
		console.error('[EcosystemBridge] Error linking therapist:', error);
		return false;
	}
}

/**
 * Clear the ecosystem cache
 */
export function clearEcosystemCache(): void {
	ecosystemCache.clear();
}

/**
 * Register therapist with Colectiva ecosystem
 *
 * Creates or links an ecosystem_org for the therapist, enabling cross-app SSO
 * and centralized management in the RBS ecosystem.
 *
 * @param therapistId - The Plenura therapist ID
 * @param therapistName - Display name for the therapist/practice
 * @param ownerEmail - Email of the therapist account owner
 * @param rbsOrgId - If provided, links to existing Camino organization for cross-app SSO
 * @param isIndependent - Whether the therapist is independent (true) or part of a practice (false)
 */
export async function registerTherapistWithEcosystem(
	therapistId: string,
	therapistName: string,
	ownerEmail: string,
	rbsOrgId?: string | null,
	isIndependent: boolean = true
): Promise<{ ecosystemOrgId?: string; error?: string }> {
	const COLECTIVA_API_URL = env.COLECTIVA_API_URL || 'https://colectiva.redbroomsoftware.com';
	const COLECTIVA_API_KEY = env.COLECTIVA_API_KEY;

	if (!COLECTIVA_API_KEY) {
		console.log('[Ecosystem] Colectiva API key not configured, skipping ecosystem registration');
		return { error: 'Colectiva not configured' };
	}

	try {
		const response = await fetch(`${COLECTIVA_API_URL}/api/ecosystem-orgs`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${COLECTIVA_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: therapistName,
				rfc: null,
				type: isIndependent ? 'individual' : 'business',
				app_org_id: therapistId,
				owner_email: ownerEmail,
				rbs_org_id: rbsOrgId || null, // Links to Camino organization for cross-app SSO
				billing: { plan: 'free', status: 'active' }
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Ecosystem] Failed to register with Colectiva:', errorText);
			return { error: errorText };
		}

		const result = await response.json();
		console.log(`[Ecosystem] Registered therapist ${therapistId} as ${result.ecosystem_org_id}`);

		// Clear cache since we have a new registration
		clearEcosystemCache();

		return { ecosystemOrgId: result.ecosystem_org_id };
	} catch (err) {
		console.error('[Ecosystem] Error registering with Colectiva:', err);
		return { error: String(err) };
	}
}

/**
 * Register practice/clinic with Colectiva ecosystem
 *
 * Creates an ecosystem_org for a practice/clinic with type 'business'.
 * This allows practices to be managed centrally and enables cross-app SSO
 * for all team members.
 *
 * @param practiceId - The Plenura practice ID
 * @param practiceName - Name of the practice/clinic
 * @param ownerEmail - Email of the practice owner
 * @param taxId - Optional RFC for the business
 * @param rbsOrgId - If provided, links to existing Camino organization
 */
export async function registerPracticeWithEcosystem(
	practiceId: string,
	practiceName: string,
	ownerEmail: string,
	taxId?: string | null,
	rbsOrgId?: string | null
): Promise<{ ecosystemOrgId?: string; error?: string }> {
	const COLECTIVA_API_URL = env.COLECTIVA_API_URL || 'https://colectiva.redbroomsoftware.com';
	const COLECTIVA_API_KEY = env.COLECTIVA_API_KEY;

	if (!COLECTIVA_API_KEY) {
		console.log('[Ecosystem] Colectiva API key not configured, skipping ecosystem registration');
		return { error: 'Colectiva not configured' };
	}

	try {
		const response = await fetch(`${COLECTIVA_API_URL}/api/ecosystem-orgs`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${COLECTIVA_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: practiceName,
				rfc: taxId || null,
				type: 'business', // Practices are businesses
				app_org_id: practiceId,
				owner_email: ownerEmail,
				rbs_org_id: rbsOrgId || null,
				billing: { plan: 'free', status: 'active' }
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Ecosystem] Failed to register practice with Colectiva:', errorText);
			return { error: errorText };
		}

		const result = await response.json();
		console.log(`[Ecosystem] Registered practice ${practiceId} as ${result.ecosystem_org_id}`);

		// Clear cache since we have a new registration
		clearEcosystemCache();

		return { ecosystemOrgId: result.ecosystem_org_id };
	} catch (err) {
		console.error('[Ecosystem] Error registering practice with Colectiva:', err);
		return { error: String(err) };
	}
}

/**
 * Resolve practice ID from RBS ecosystem organization ID
 *
 * Similar to resolveTherapistIdFromEcosystem but for practices.
 *
 * @param rbsOrgId - The organization_id from Camino OAuth2
 * @returns The Plenura practiceId or null if not found/linked
 */
export async function resolvePracticeIdFromEcosystem(rbsOrgId: string): Promise<string | null> {
	if (!rbsOrgId || !isEcosystemBridgeEnabled()) return null;

	const adminDb = getEcosystemDb();
	if (!adminDb) return null;

	try {
		const ecosystemOrgsRef = adminDb.collection('ecosystem_orgs');

		const snapshot = await ecosystemOrgsRef
			.where('linkedApps.camino.orgId', '==', rbsOrgId)
			.limit(1)
			.get();

		if (snapshot.empty) {
			console.log(`[EcosystemBridge] No ecosystem_org found for rbsOrgId: ${rbsOrgId}`);
			return null;
		}

		const ecosystemOrg = snapshot.docs[0].data() as EcosystemOrg;
		const plenuraLink = ecosystemOrg.linkedApps?.plenura;
		const practiceId = plenuraLink?.practiceId || plenuraLink?.orgId;

		if (!practiceId) {
			console.log(`[EcosystemBridge] Ecosystem org ${ecosystemOrg.id} has no Plenura practice link`);
			return null;
		}

		console.log(`[EcosystemBridge] Resolved rbsOrgId ${rbsOrgId} -> Plenura practiceId ${practiceId}`);
		return practiceId;

	} catch (error) {
		console.error('[EcosystemBridge] Error resolving practiceId:', error);
		return null;
	}
}
