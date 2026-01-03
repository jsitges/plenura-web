import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	isVideoEnabled,
	joinVideoSession,
	endVideoSession,
	leaveVideoSession,
	saveSessionNotes,
	getVideoSessionStatus
} from '$lib/services/video.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	if (!isVideoEnabled()) {
		throw error(503, 'El servicio de video no está disponible');
	}

	// Get booking to verify access and get details
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
					full_name,
					avatar_url
				)
			),
			users!bookings_client_id_fkey (
				full_name,
				avatar_url
			),
			therapist_services!inner (
				services!inner (
					name
				)
			)
		`
		)
		.eq('id', params.bookingId)
		.single();

	if (bookingError || !booking) {
		throw error(404, 'Reserva no encontrada');
	}

	// Verify this is a video session
	if (booking.service_modality !== 'online_video') {
		throw error(400, 'Esta reserva no es una sesión de video');
	}

	// Verify user is a participant
	const therapistData = booking.therapists as any;
	const isTherapist = therapistData.user_id === user.id;
	const isClient = booking.client_id === user.id;

	if (!isTherapist && !isClient) {
		throw error(403, 'No eres participante de esta sesión');
	}

	// Check booking status
	if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
		throw error(400, 'La sesión no está disponible. Verifica el estado de tu reserva.');
	}

	// Get existing session status (if any)
	const sessionStatus = await getVideoSessionStatus(supabase, params.bookingId);

	// Format booking data for the page
	const clientData = booking.users as any;
	const serviceData = booking.therapist_services as any;

	return {
		booking: {
			id: booking.id,
			scheduledAt: booking.scheduled_at,
			scheduledEndAt: booking.scheduled_end_at,
			status: booking.status,
			serviceName: serviceData.services.name,
			therapist: {
				name: therapistData.users.full_name,
				avatarUrl: therapistData.users.avatar_url
			},
			client: {
				name: clientData.full_name,
				avatarUrl: clientData.avatar_url
			}
		},
		isTherapist,
		sessionStatus,
		// Participant info for the other party
		otherParticipant: isTherapist
			? { name: clientData.full_name, avatarUrl: clientData.avatar_url, role: 'cliente' }
			: { name: therapistData.users.full_name, avatarUrl: therapistData.users.avatar_url, role: 'terapeuta' }
	};
};

export const actions: Actions = {
	join: async ({ locals, params }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		try {
			const result = await joinVideoSession(supabase, params.bookingId, user.id);

			return {
				success: true,
				session: {
					roomName: result.roomName,
					fullRoomName: result.fullRoomName,
					jwt: result.jwt,
					domain: result.domain,
					displayName: result.displayName,
					isModerator: result.isModerator,
					scheduledEnd: result.scheduledEnd
				}
			};
		} catch (err: any) {
			return fail(400, { success: false, error: err.message });
		}
	},

	leave: async ({ locals, params }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		try {
			await leaveVideoSession(supabase, params.bookingId, user.id);
			return { success: true, left: true };
		} catch (err: any) {
			return fail(400, { success: false, error: err.message });
		}
	},

	end: async ({ locals, params }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		try {
			await endVideoSession(supabase, params.bookingId, user.id);
			return { success: true, ended: true };
		} catch (err: any) {
			return fail(400, { success: false, error: err.message });
		}
	},

	saveNotes: async ({ locals, params, request }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const notes = formData.get('notes')?.toString() || '';

		try {
			await saveSessionNotes(supabase, params.bookingId, user.id, notes);
			return { success: true, notesSaved: true };
		} catch (err: any) {
			return fail(400, { success: false, error: err.message });
		}
	}
};
