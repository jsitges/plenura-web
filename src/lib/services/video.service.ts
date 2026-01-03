/**
 * Video Session Service
 * Manages JaaS (Jitsi as a Service) integration for online therapy sessions
 *
 * JaaS provides video conferencing with:
 * - Free tier: 25,000 participant minutes/month
 * - JWT-based authentication
 * - No WebRTC complexity - uses embedded iframe
 */

import { env } from '$env/dynamic/private';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$types/database.types';

// JaaS Configuration
const JAAS_APP_ID = env.JAAS_APP_ID ?? '';
const JAAS_API_KEY = env.JAAS_API_KEY ?? '';
const JAAS_PRIVATE_KEY = env.JAAS_PRIVATE_KEY ?? '';
const JAAS_DOMAIN = '8x8.vc';

// Session time windows
const JOIN_BEFORE_MINUTES = 10; // Can join 10 minutes before scheduled time
const JOIN_AFTER_MINUTES = 15; // Grace period after scheduled start
const SESSION_BUFFER_MINUTES = 30; // Buffer after scheduled end

interface CreateSessionInput {
	bookingId: string;
	scheduledStart: string;
	scheduledEnd: string;
}

interface JoinSessionResult {
	roomName: string;
	fullRoomName: string; // {appId}/{roomName} for JaaS
	jwt: string;
	domain: string;
	displayName: string;
	isModerator: boolean;
	sessionId: string;
	scheduledStart: string;
	scheduledEnd: string;
}

interface VideoSessionStatus {
	status: string;
	roomName: string | null;
	therapistJoined: boolean;
	clientJoined: boolean;
	duration: number | null;
	scheduledStart: string;
	scheduledEnd: string;
}

/**
 * Check if video service is enabled
 */
export function isVideoEnabled(): boolean {
	return !!(JAAS_APP_ID && JAAS_API_KEY && JAAS_PRIVATE_KEY);
}

/**
 * Generate a unique room name for a booking
 */
function generateRoomName(bookingId: string): string {
	const shortId = bookingId.substring(0, 8);
	const random = Math.random().toString(36).substring(2, 8);
	return `plenura-${shortId}-${random}`;
}

/**
 * Convert PEM key to crypto key for signing
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
	// Handle escaped newlines from environment variable
	const pemContents = pem
		.replace(/\\n/g, '\n')
		.replace(/-----BEGIN PRIVATE KEY-----/, '')
		.replace(/-----END PRIVATE KEY-----/, '')
		.replace(/\s/g, '');

	const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

	return crypto.subtle.importKey(
		'pkcs8',
		binaryDer,
		{
			name: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256'
		},
		false,
		['sign']
	);
}

/**
 * Base64URL encode
 */
function base64UrlEncode(data: Uint8Array | string): string {
	const str = typeof data === 'string' ? data : new TextDecoder().decode(data);
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate JaaS JWT for a participant
 */
async function generateJaasToken(params: {
	roomName: string;
	participantName: string;
	participantEmail: string;
	participantId: string;
	isModerator: boolean;
	avatarUrl?: string;
	expiresInMinutes?: number;
}): Promise<string> {
	const privateKey = await importPrivateKey(JAAS_PRIVATE_KEY);

	const now = Math.floor(Date.now() / 1000);
	const exp = now + (params.expiresInMinutes || 180) * 60; // Default 3 hours

	// JaaS JWT payload
	const payload = {
		context: {
			user: {
				id: params.participantId,
				name: params.participantName,
				email: params.participantEmail,
				avatar: params.avatarUrl || '',
				moderator: params.isModerator
			},
			features: {
				livestreaming: false,
				recording: false,
				transcription: false,
				'outbound-call': false
			}
		},
		room: params.roomName,
		aud: 'jitsi',
		iss: 'chat',
		sub: JAAS_APP_ID,
		exp,
		nbf: now,
		iat: now
	};

	// Create JWT header
	const header = {
		alg: 'RS256',
		typ: 'JWT',
		kid: JAAS_API_KEY
	};

	// Encode header and payload
	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	const signingInput = `${encodedHeader}.${encodedPayload}`;

	// Sign
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		privateKey,
		new TextEncoder().encode(signingInput)
	);

	const encodedSignature = base64UrlEncode(new Uint8Array(signature));

	return `${signingInput}.${encodedSignature}`;
}

/**
 * Create a video session for a booking
 */
export async function createVideoSession(
	supabase: SupabaseClient<Database>,
	input: CreateSessionInput
): Promise<{ sessionId: string; roomName: string }> {
	// Verify booking exists and is online_video modality
	const { data: booking, error: bookingError } = await supabase
		.from('bookings')
		.select('id, service_modality, status')
		.eq('id', input.bookingId)
		.single();

	if (bookingError || !booking) {
		throw new Error('Reserva no encontrada');
	}

	if (booking.service_modality !== 'online_video') {
		throw new Error('Esta reserva no es una sesión de video');
	}

	// Check if session already exists
	const { data: existingSession } = await supabase
		.from('video_sessions')
		.select('id, room_name')
		.eq('booking_id', input.bookingId)
		.single();

	if (existingSession) {
		return {
			sessionId: existingSession.id,
			roomName: existingSession.room_name
		};
	}

	// Create new session
	const roomName = generateRoomName(input.bookingId);

	const { data: session, error: sessionError } = await supabase
		.from('video_sessions')
		.insert({
			booking_id: input.bookingId,
			room_name: roomName,
			scheduled_start: input.scheduledStart,
			scheduled_end: input.scheduledEnd,
			status: 'scheduled'
		})
		.select('id, room_name')
		.single();

	if (sessionError || !session) {
		console.error('Failed to create video session:', sessionError);
		throw new Error('No se pudo crear la sesión de video');
	}

	return {
		sessionId: session.id,
		roomName: session.room_name
	};
}

/**
 * Check if user can join a video session
 */
function canJoinSession(scheduledStart: string, scheduledEnd: string): { canJoin: boolean; reason?: string } {
	const now = new Date();
	const start = new Date(scheduledStart);
	const end = new Date(scheduledEnd);

	const joinWindowStart = new Date(start.getTime() - JOIN_BEFORE_MINUTES * 60 * 1000);
	const joinWindowEnd = new Date(end.getTime() + SESSION_BUFFER_MINUTES * 60 * 1000);

	if (now < joinWindowStart) {
		const minutesUntil = Math.ceil((joinWindowStart.getTime() - now.getTime()) / 60000);
		return {
			canJoin: false,
			reason: `La sesión aún no está disponible. Podrás unirte en ${minutesUntil} minutos.`
		};
	}

	if (now > joinWindowEnd) {
		return {
			canJoin: false,
			reason: 'La sesión ha terminado.'
		};
	}

	return { canJoin: true };
}

/**
 * Join a video session (returns JWT and room info)
 */
export async function joinVideoSession(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	userId: string
): Promise<JoinSessionResult> {
	// Get booking with participant info
	const { data: booking, error: bookingError } = await supabase
		.from('bookings')
		.select(
			`
			id,
			client_id,
			therapist_id,
			scheduled_at,
			scheduled_end_at,
			service_modality,
			status,
			therapists!inner (
				id,
				user_id,
				users!inner (
					id,
					full_name,
					email,
					avatar_url
				)
			),
			users!bookings_client_id_fkey (
				id,
				full_name,
				email,
				avatar_url
			)
		`
		)
		.eq('id', bookingId)
		.single();

	if (bookingError || !booking) {
		throw new Error('Reserva no encontrada');
	}

	if (booking.service_modality !== 'online_video') {
		throw new Error('Esta reserva no es una sesión de video');
	}

	if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
		throw new Error('La sesión no está disponible');
	}

	// Determine if user is therapist or client
	const therapistData = booking.therapists as any;
	const clientData = booking.users as any;

	const isTherapist = therapistData.user_id === userId;
	const isClient = booking.client_id === userId;

	if (!isTherapist && !isClient) {
		throw new Error('No eres participante de esta sesión');
	}

	// Check time window
	const joinCheck = canJoinSession(booking.scheduled_at, booking.scheduled_end_at);
	if (!joinCheck.canJoin) {
		throw new Error(joinCheck.reason!);
	}

	// Get or create video session
	let session: any;
	const { data: existingSession } = await supabase
		.from('video_sessions')
		.select('*')
		.eq('booking_id', bookingId)
		.single();

	if (!existingSession) {
		// Create session if it doesn't exist
		const result = await createVideoSession(supabase, {
			bookingId,
			scheduledStart: booking.scheduled_at,
			scheduledEnd: booking.scheduled_end_at
		});

		const { data: newSession } = await supabase
			.from('video_sessions')
			.select('*')
			.eq('id', result.sessionId)
			.single();

		session = newSession;
	} else {
		session = existingSession;
	}

	if (!session) {
		throw new Error('No se pudo crear o encontrar la sesión de video');
	}

	// Get participant info
	const participant = isTherapist
		? {
				name: therapistData.users.full_name,
				email: therapistData.users.email,
				id: therapistData.user_id,
				avatarUrl: therapistData.users.avatar_url
			}
		: {
				name: clientData.full_name,
				email: clientData.email,
				id: booking.client_id,
				avatarUrl: clientData.avatar_url
			};

	// Generate JWT
	const jwt = await generateJaasToken({
		roomName: session.room_name,
		participantName: participant.name,
		participantEmail: participant.email,
		participantId: participant.id,
		avatarUrl: participant.avatarUrl,
		isModerator: isTherapist // Therapist is moderator
	});

	// Update session with join time
	const updateField = isTherapist ? 'therapist_joined_at' : 'client_joined_at';
	const updateData: Record<string, any> = {
		[updateField]: new Date().toISOString()
	};

	// Update status based on who joined
	if (session.status === 'scheduled') {
		updateData.status = 'waiting';
	} else if (session.status === 'waiting') {
		// Check if both participants have now joined
		const otherJoinedField = isTherapist ? 'client_joined_at' : 'therapist_joined_at';
		if (session[otherJoinedField]) {
			updateData.status = 'active';
			updateData.actual_start = new Date().toISOString();
		}
	}

	await supabase.from('video_sessions').update(updateData).eq('id', session.id);

	// Update booking status to in_progress if it's confirmed
	if (booking.status === 'confirmed') {
		await supabase.from('bookings').update({ status: 'in_progress' }).eq('id', bookingId);
	}

	return {
		roomName: session.room_name,
		fullRoomName: `${JAAS_APP_ID}/${session.room_name}`,
		jwt,
		domain: JAAS_DOMAIN,
		displayName: participant.name,
		isModerator: isTherapist,
		sessionId: session.id,
		scheduledStart: session.scheduled_start,
		scheduledEnd: session.scheduled_end
	};
}

/**
 * Record participant leaving a video session
 */
export async function leaveVideoSession(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	userId: string
): Promise<void> {
	// Get session with booking info
	const { data: session, error } = await supabase
		.from('video_sessions')
		.select(
			`
			*,
			bookings!inner (
				therapist_id,
				therapists!inner (
					user_id
				)
			)
		`
		)
		.eq('booking_id', bookingId)
		.single();

	if (error || !session) {
		throw new Error('Sesión no encontrada');
	}

	const bookingData = session.bookings as any;
	const isTherapist = bookingData.therapists.user_id === userId;
	const now = new Date().toISOString();

	// Update leave time
	const updateField = isTherapist ? 'therapist_left_at' : 'client_left_at';
	const updateData: Record<string, any> = {
		[updateField]: now
	};

	await supabase.from('video_sessions').update(updateData).eq('id', session.id);
}

/**
 * End a video session (therapist only)
 */
export async function endVideoSession(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	userId: string
): Promise<void> {
	const { data: session, error } = await supabase
		.from('video_sessions')
		.select(
			`
			*,
			bookings!inner (
				therapist_id,
				therapists!inner (
					user_id
				)
			)
		`
		)
		.eq('booking_id', bookingId)
		.single();

	if (error || !session) {
		throw new Error('Sesión no encontrada');
	}

	const bookingData = session.bookings as any;
	const isTherapist = bookingData.therapists.user_id === userId;

	if (!isTherapist) {
		throw new Error('Solo el terapeuta puede finalizar la sesión');
	}

	const now = new Date().toISOString();

	const updateData: Record<string, any> = {
		therapist_left_at: now,
		status: 'completed',
		actual_end: now
	};

	// Calculate duration
	if (session.actual_start) {
		const start = new Date(session.actual_start).getTime();
		const end = new Date(now).getTime();
		updateData.duration_seconds = Math.floor((end - start) / 1000);
	}

	await supabase.from('video_sessions').update(updateData).eq('id', session.id);
}

/**
 * Get video session status
 */
export async function getVideoSessionStatus(
	supabase: SupabaseClient<Database>,
	bookingId: string
): Promise<VideoSessionStatus | null> {
	const { data: session } = await supabase
		.from('video_sessions')
		.select('*')
		.eq('booking_id', bookingId)
		.single();

	if (!session) {
		return null;
	}

	return {
		status: session.status,
		roomName: session.room_name,
		therapistJoined: !!session.therapist_joined_at,
		clientJoined: !!session.client_joined_at,
		duration: session.duration_seconds,
		scheduledStart: session.scheduled_start,
		scheduledEnd: session.scheduled_end
	};
}

/**
 * Save therapist session notes (private, post-session)
 */
export async function saveSessionNotes(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	therapistUserId: string,
	notes: string
): Promise<void> {
	// Verify therapist owns this session
	const { data: session, error } = await supabase
		.from('video_sessions')
		.select(
			`
			id,
			bookings!inner (
				therapists!inner (
					user_id
				)
			)
		`
		)
		.eq('booking_id', bookingId)
		.single();

	if (error || !session) {
		throw new Error('Sesión no encontrada');
	}

	const bookingData = session.bookings as any;
	if (bookingData.therapists.user_id !== therapistUserId) {
		throw new Error('No autorizado');
	}

	await supabase
		.from('video_sessions')
		.update({ therapist_session_notes: notes })
		.eq('id', session.id);
}

/**
 * Update connection quality for a participant
 */
export async function updateConnectionQuality(
	supabase: SupabaseClient<Database>,
	bookingId: string,
	userId: string,
	quality: 'excellent' | 'good' | 'fair' | 'poor'
): Promise<void> {
	// Get session to determine if user is therapist or client
	const { data: session, error } = await supabase
		.from('video_sessions')
		.select(
			`
			id,
			bookings!inner (
				client_id,
				therapists!inner (
					user_id
				)
			)
		`
		)
		.eq('booking_id', bookingId)
		.single();

	if (error || !session) {
		return; // Silently fail for quality updates
	}

	const bookingData = session.bookings as any;
	const isTherapist = bookingData.therapists.user_id === userId;

	const updateField = isTherapist ? 'connection_quality_therapist' : 'connection_quality_client';

	await supabase
		.from('video_sessions')
		.update({ [updateField]: quality })
		.eq('id', session.id);
}

/**
 * Mark session as missed (cron job utility)
 */
export async function markMissedSessions(supabase: SupabaseClient<Database>): Promise<number> {
	const graceEnd = new Date(Date.now() - (JOIN_AFTER_MINUTES + 5) * 60 * 1000).toISOString();

	const { data: missedSessions } = await supabase
		.from('video_sessions')
		.update({ status: 'missed' })
		.eq('status', 'scheduled')
		.lt('scheduled_start', graceEnd)
		.select('id');

	return missedSessions?.length ?? 0;
}
