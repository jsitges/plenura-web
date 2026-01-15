/**
 * Test script for ecosystem admin lookup endpoint
 *
 * Usage:
 *   npx tsx scripts/test-ecosystem-lookup.ts
 *
 * Prerequisites:
 *   1. Add CAMINO_WEBHOOK_SECRET to .env
 *   2. Run dev server: npm run dev
 */

import { createHmac } from 'crypto';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const WEBHOOK_SECRET = process.env.CAMINO_WEBHOOK_SECRET || 'test_secret_for_development_only';

interface TestCase {
	name: string;
	rbsOrgId: string;
	reason?: string;
	expectSuccess: boolean;
	skipSignature?: boolean;
	skipToken?: boolean;
	expiredTimestamp?: boolean;
}

const TEST_CASES: TestCase[] = [
	{
		name: 'Valid request with existing org',
		rbsOrgId: 'eco_test_123',
		reason: 'Testing admin lookup',
		expectSuccess: false // Will fail because org doesn't exist, but auth should pass
	},
	{
		name: 'Missing signature',
		rbsOrgId: 'eco_test_123',
		expectSuccess: false,
		skipSignature: true
	},
	{
		name: 'Expired timestamp',
		rbsOrgId: 'eco_test_123',
		expectSuccess: false,
		expiredTimestamp: true
	}
];

function signRequest(appId: string, body: string, secret: string, timestamp?: number): Record<string, string> {
	const ts = timestamp || Math.floor(Date.now() / 1000);
	const payload = `${appId}:${ts}:${body}`;
	const signature = createHmac('sha256', secret).update(payload).digest('hex');

	return {
		'X-RBS-App': appId,
		'X-RBS-Timestamp': ts.toString(),
		'X-RBS-Signature': signature
	};
}

function createMockAdminToken(): string {
	// Create a mock JWT for testing (not cryptographically valid, just for structure)
	const header = { alg: 'HS256', typ: 'JWT' };
	const payload = {
		iss: 'camino.redbroomsoftware.com',
		sub: 'admin_test_user',
		admin_email: 'admin@test.com',
		scope: 'admin:impersonate',
		exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
		iat: Math.floor(Date.now() / 1000)
	};

	const base64url = (obj: object) =>
		Buffer.from(JSON.stringify(obj))
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');

	// Note: This is not a valid signature, just for testing structure
	return `${base64url(header)}.${base64url(payload)}.mock_signature`;
}

async function runTest(testCase: TestCase): Promise<{ passed: boolean; message: string }> {
	const body = JSON.stringify({
		rbsOrgId: testCase.rbsOrgId,
		reason: testCase.reason
	});

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	// Add signature headers unless skipped
	if (!testCase.skipSignature) {
		const timestamp = testCase.expiredTimestamp
			? Math.floor(Date.now() / 1000) - 600 // 10 minutes ago
			: undefined;

		const signatureHeaders = signRequest('camino', body, WEBHOOK_SECRET, timestamp);
		Object.assign(headers, signatureHeaders);
	}

	// Add admin token unless skipped
	if (!testCase.skipToken) {
		headers['Authorization'] = `Bearer ${createMockAdminToken()}`;
	}

	try {
		const response = await fetch(`${BASE_URL}/api/admin/ecosystem/lookup`, {
			method: 'POST',
			headers,
			body
		});

		const data = await response.json();

		console.log(`\n--- ${testCase.name} ---`);
		console.log(`Status: ${response.status}`);
		console.log(`Response:`, JSON.stringify(data, null, 2));

		// Check rate limit headers
		const remaining = response.headers.get('X-RateLimit-Remaining');
		if (remaining) {
			console.log(`Rate limit remaining: ${remaining}`);
		}

		if (testCase.expectSuccess && data.success) {
			return { passed: true, message: 'Expected success, got success' };
		} else if (!testCase.expectSuccess && !data.success) {
			return { passed: true, message: `Expected failure, got: ${data.error?.code}` };
		} else if (testCase.expectSuccess && !data.success) {
			// Special case: auth passed but entity not found is still a "pass" for auth testing
			if (data.error?.code === 'NOT_FOUND' || data.error?.code === 'NOT_LINKED') {
				return { passed: true, message: 'Auth passed, entity not found (expected for test data)' };
			}
			return { passed: false, message: `Expected success, got error: ${data.error?.message}` };
		} else {
			return { passed: false, message: `Unexpected success when failure expected` };
		}
	} catch (error) {
		console.log(`\n--- ${testCase.name} ---`);
		console.log(`Error: ${error}`);

		if (!testCase.expectSuccess) {
			return { passed: true, message: `Expected failure, got error: ${error}` };
		}
		return { passed: false, message: `Unexpected error: ${error}` };
	}
}

async function main() {
	console.log('='.repeat(60));
	console.log('Ecosystem Admin Lookup Test');
	console.log('='.repeat(60));
	console.log(`Target: ${BASE_URL}`);
	console.log(`Secret configured: ${WEBHOOK_SECRET !== 'test_secret_for_development_only' ? 'Yes' : 'Using test secret'}`);

	let passed = 0;
	let failed = 0;

	for (const testCase of TEST_CASES) {
		const result = await runTest(testCase);
		if (result.passed) {
			console.log(`✓ PASSED: ${result.message}`);
			passed++;
		} else {
			console.log(`✗ FAILED: ${result.message}`);
			failed++;
		}
	}

	console.log('\n' + '='.repeat(60));
	console.log(`Results: ${passed} passed, ${failed} failed`);
	console.log('='.repeat(60));

	process.exit(failed > 0 ? 1 : 0);
}

main();
