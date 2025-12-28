/**
 * Firebase Admin SDK for Ecosystem Integration
 *
 * Used only for querying the shared ecosystem_orgs collection in Firestore.
 * Plenura's primary database is Supabase; Firebase is used only for
 * cross-app ecosystem coordination.
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { env } from '$env/dynamic/private';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let initialized = false;

function initializeFirebaseAdmin(): boolean {
	if (initialized) return adminDb !== null;

	try {
		// Check if Firebase credentials are available
		const projectId = env.FIREBASE_PROJECT_ID;
		const clientEmail = env.FIREBASE_CLIENT_EMAIL;
		const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

		if (!projectId || !clientEmail || !privateKey) {
			console.log('[Firebase Admin] Credentials not configured - ecosystem bridge disabled');
			initialized = true;
			return false;
		}

		// Check if app already exists
		const existingApps = getApps();
		if (existingApps.length > 0) {
			adminApp = existingApps[0];
		} else {
			adminApp = initializeApp({
				credential: cert({
					projectId,
					clientEmail,
					privateKey
				})
			});
		}

		adminDb = getFirestore(adminApp);
		console.log('[Firebase Admin] Initialized for ecosystem bridge');
		initialized = true;
		return true;
	} catch (error) {
		console.error('[Firebase Admin] Initialization failed:', error);
		initialized = true;
		return false;
	}
}

/**
 * Get Firestore instance for ecosystem_orgs queries
 * Returns null if Firebase is not configured
 */
export function getEcosystemDb(): Firestore | null {
	if (!initialized) {
		initializeFirebaseAdmin();
	}
	return adminDb;
}

/**
 * Check if ecosystem bridge is available
 */
export function isEcosystemBridgeEnabled(): boolean {
	if (!initialized) {
		initializeFirebaseAdmin();
	}
	return adminDb !== null;
}
