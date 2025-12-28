/**
 * RBS Auth Service
 * OAuth2 client for authenticating with Camino (RBS Identity Provider)
 */

export interface RBSAuthConfig {
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	issuer?: string;
	scopes?: string[];
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
}

export interface RBSUserInfo {
	sub: string;
	email: string;
	email_verified: boolean;
	name?: string;
	picture?: string;
	organization_id?: string;
	organization_name?: string;
}

export interface PKCEPair {
	codeVerifier: string;
	codeChallenge: string;
}

const DEFAULT_ISSUER = 'https://camino.redbroomsoftware.com';
const DEFAULT_SCOPES = ['openid', 'profile', 'email', 'ecosystem'];

function getRandomBytes(length: number): Uint8Array {
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		return crypto.getRandomValues(new Uint8Array(length));
	}
	const { randomBytes } = require('crypto');
	return new Uint8Array(randomBytes(length));
}

function base64urlEncode(buffer: Uint8Array): string {
	const base64 = btoa(String.fromCharCode(...buffer));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(message: string): Promise<Uint8Array> {
	if (typeof crypto !== 'undefined' && crypto.subtle) {
		const encoder = new TextEncoder();
		const data = encoder.encode(message);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return new Uint8Array(hashBuffer);
	}
	const { createHash } = require('crypto');
	const hash = createHash('sha256').update(message).digest();
	return new Uint8Array(hash);
}

export class RBSAuth {
	private config: Required<Omit<RBSAuthConfig, 'clientSecret'>> & { clientSecret?: string };

	constructor(config: RBSAuthConfig) {
		this.config = {
			...config,
			issuer: config.issuer || DEFAULT_ISSUER,
			scopes: config.scopes || DEFAULT_SCOPES
		};
	}

	async generatePKCE(): Promise<PKCEPair> {
		const randomData = getRandomBytes(32);
		const codeVerifier = base64urlEncode(randomData);
		const hash = await sha256(codeVerifier);
		const codeChallenge = base64urlEncode(hash);
		return { codeVerifier, codeChallenge };
	}

	async getAuthorizationUrl(params: { state?: string; usePKCE?: boolean; prompt?: string } = {}): Promise<{ url: string; pkce?: PKCEPair }> {
		const usePKCE = params.usePKCE ?? true;
		const url = new URL(`${this.config.issuer}/oauth/authorize`);
		url.searchParams.set('client_id', this.config.clientId);
		url.searchParams.set('redirect_uri', this.config.redirectUri);
		url.searchParams.set('response_type', 'code');
		url.searchParams.set('scope', this.config.scopes.join(' '));
		if (params.state) url.searchParams.set('state', params.state);
		if (params.prompt) url.searchParams.set('prompt', params.prompt);

		let pkce: PKCEPair | undefined;
		if (usePKCE) {
			pkce = await this.generatePKCE();
			url.searchParams.set('code_challenge', pkce.codeChallenge);
			url.searchParams.set('code_challenge_method', 'S256');
		}
		return { url: url.toString(), pkce };
	}

	async exchangeCode(code: string, codeVerifier?: string): Promise<TokenResponse> {
		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: this.config.redirectUri,
			client_id: this.config.clientId
		});
		if (this.config.clientSecret) body.set('client_secret', this.config.clientSecret);
		if (codeVerifier) body.set('code_verifier', codeVerifier);

		const response = await fetch(`${this.config.issuer}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString()
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error_description || error.error || 'Token exchange failed');
		}
		return response.json();
	}

	async getUserInfo(accessToken: string): Promise<RBSUserInfo> {
		const response = await fetch(`${this.config.issuer}/oauth/userinfo`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error_description || error.error || 'Failed to get user info');
		}
		return response.json();
	}
}

export function generateState(): string {
	const randomData = getRandomBytes(16);
	return base64urlEncode(randomData);
}

export function validateState(received: string | null, expected: string | undefined): boolean {
	if (!received || !expected) return false;
	return received === expected;
}
