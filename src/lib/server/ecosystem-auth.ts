/**
 * Ecosystem Authentication Service
 *
 * Validates incoming requests from other RBS ecosystem apps.
 * Uses signed requests (HMAC-SHA256) instead of static API keys for security.
 *
 * Security features:
 * - Signed requests with timestamp (prevents replay attacks)
 * - Timing-safe signature comparison (prevents timing attacks)
 * - 5-minute window for timestamp validation
 * - Rate limiting integration
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '$env/dynamic/private';

export interface EcosystemApp {
	id: string;
	name: string;
	permissions: string[];
}

export interface AuthResult {
	valid: boolean;
	app?: EcosystemApp;
	error?: string;
	adminId?: string;
	adminEmail?: string;
}

// Known ecosystem apps and their permissions
const ECOSYSTEM_APPS: Record<string, Omit<EcosystemApp, 'id'>> = {
	camino: {
		name: 'Camino CRM',
		permissions: ['admin:lookup', 'admin:impersonate', 'customer:sync']
	},
	colectiva: {
		name: 'Colectiva HR',
		permissions: ['admin:lookup', 'wallet:manage', 'payroll:sync']
	},
	constanza: {
		name: 'Constanza Fiscal',
		permissions: ['admin:lookup', 'invoice:sync']
	}
};

// Rate limit tracking (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute for admin endpoints

/**
 * Get the shared secret for an ecosystem app
 */
function getAppSecret(appId: string): string | null {
	const secretKey = `${appId.toUpperCase()}_WEBHOOK_SECRET`;
	return env[secretKey] || null;
}

/**
 * Verify signed request from ecosystem app
 *
 * Headers required:
 * - X-RBS-App: app identifier (e.g., 'camino')
 * - X-RBS-Timestamp: Unix timestamp in seconds
 * - X-RBS-Signature: HMAC-SHA256 signature
 */
export function verifySignedRequest(
	headers: Headers,
	body: string
): AuthResult {
	const appId = headers.get('X-RBS-App');
	const timestamp = headers.get('X-RBS-Timestamp');
	const signature = headers.get('X-RBS-Signature');

	// Check required headers
	if (!appId || !timestamp || !signature) {
		return {
			valid: false,
			error: 'Missing required headers: X-RBS-App, X-RBS-Timestamp, X-RBS-Signature'
		};
	}

	// Check if app is known
	const appConfig = ECOSYSTEM_APPS[appId.toLowerCase()];
	if (!appConfig) {
		return { valid: false, error: `Unknown app: ${appId}` };
	}

	// Get app secret
	const secret = getAppSecret(appId);
	if (!secret) {
		console.error(`[EcosystemAuth] No secret configured for app: ${appId}`);
		return { valid: false, error: 'App not configured' };
	}

	// Validate timestamp (prevent replay attacks)
	const timestampNum = parseInt(timestamp, 10);
	const now = Math.floor(Date.now() / 1000);
	const maxAge = 5 * 60; // 5 minutes

	if (isNaN(timestampNum) || Math.abs(now - timestampNum) > maxAge) {
		return { valid: false, error: 'Request timestamp expired or invalid' };
	}

	// Compute expected signature
	const payload = `${appId}:${timestamp}:${body}`;
	const expectedSignature = createHmac('sha256', secret)
		.update(payload)
		.digest('hex');

	// Timing-safe comparison
	try {
		const signatureBuffer = Buffer.from(signature, 'hex');
		const expectedBuffer = Buffer.from(expectedSignature, 'hex');

		if (signatureBuffer.length !== expectedBuffer.length) {
			return { valid: false, error: 'Invalid signature' };
		}

		if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
			return { valid: false, error: 'Invalid signature' };
		}
	} catch {
		return { valid: false, error: 'Invalid signature format' };
	}

	return {
		valid: true,
		app: {
			id: appId.toLowerCase(),
			...appConfig
		}
	};
}

/**
 * Check if app has required permission
 */
export function hasPermission(app: EcosystemApp, permission: string): boolean {
	return app.permissions.includes(permission) || app.permissions.includes('*');
}

/**
 * Check rate limit for admin operations
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: Date } {
	const now = Date.now();
	const entry = rateLimitMap.get(key);

	// Clean up expired entries periodically
	if (Math.random() < 0.01) {
		for (const [k, v] of rateLimitMap.entries()) {
			if (v.resetAt < now) rateLimitMap.delete(k);
		}
	}

	if (!entry || entry.resetAt < now) {
		// New window
		rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
		return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: new Date(now + RATE_LIMIT_WINDOW) };
	}

	if (entry.count >= RATE_LIMIT_MAX) {
		return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
	}

	entry.count++;
	return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: new Date(entry.resetAt) };
}

/**
 * Verify admin JWT token from Camino
 *
 * In production, this should verify the JWT signature against Camino's public key.
 * For now, we decode and validate claims.
 */
export async function verifyAdminToken(token: string): Promise<AuthResult> {
	if (!token) {
		return { valid: false, error: 'No token provided' };
	}

	try {
		// Remove 'Bearer ' prefix if present
		const jwt = token.startsWith('Bearer ') ? token.slice(7) : token;

		// Decode JWT (base64url)
		const parts = jwt.split('.');
		if (parts.length !== 3) {
			return { valid: false, error: 'Invalid token format' };
		}

		const payload = JSON.parse(
			Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
		);

		// Validate claims
		const now = Math.floor(Date.now() / 1000);

		if (!payload.exp || payload.exp < now) {
			return { valid: false, error: 'Token expired' };
		}

		if (!payload.iss || !payload.iss.includes('camino')) {
			return { valid: false, error: 'Invalid token issuer' };
		}

		if (!payload.scope || !payload.scope.includes('admin:impersonate')) {
			return { valid: false, error: 'Token missing required scope' };
		}

		// TODO: In production, verify JWT signature against Camino's public key
		// For now, we trust tokens from signed requests

		return {
			valid: true,
			adminId: payload.sub,
			adminEmail: payload.admin_email || payload.email
		};
	} catch (error) {
		console.error('[EcosystemAuth] Token verification error:', error);
		return { valid: false, error: 'Token verification failed' };
	}
}

/**
 * Generate signature for outbound requests (for Plenura calling other apps)
 */
export function signRequest(body: string): { headers: Record<string, string> } {
	const appId = 'plenura';
	const secret = env.PLENURA_WEBHOOK_SECRET;

	if (!secret) {
		throw new Error('PLENURA_WEBHOOK_SECRET not configured');
	}

	const timestamp = Math.floor(Date.now() / 1000).toString();
	const payload = `${appId}:${timestamp}:${body}`;
	const signature = createHmac('sha256', secret).update(payload).digest('hex');

	return {
		headers: {
			'X-RBS-App': appId,
			'X-RBS-Timestamp': timestamp,
			'X-RBS-Signature': signature
		}
	};
}
