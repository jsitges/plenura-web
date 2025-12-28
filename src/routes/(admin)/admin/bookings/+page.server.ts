import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase } = locals;

	// Get filter params
	const status = url.searchParams.get('status') ?? 'all';
	const dateFrom = url.searchParams.get('from') ?? '';
	const dateTo = url.searchParams.get('to') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	// Build query
	let query = (supabase as any)
		.from('bookings')
		.select(`
			id,
			status,
			scheduled_at,
			scheduled_end_at,
			price_cents,
			commission_cents,
			client_address,
			created_at,
			completed_at,
			users:client_id (
				id,
				full_name,
				email
			),
			therapists!inner (
				id,
				users!inner (full_name, email)
			),
			therapist_services!inner (
				services!inner (name, name_es)
			)
		`, { count: 'exact' })
		.order('scheduled_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// Apply status filter
	if (status !== 'all') {
		if (status === 'cancelled') {
			query = query.in('status', ['cancelled', 'cancelled_by_client', 'cancelled_by_therapist']);
		} else {
			query = query.eq('status', status);
		}
	}

	// Apply date filters
	if (dateFrom) {
		query = query.gte('scheduled_at', `${dateFrom}T00:00:00`);
	}
	if (dateTo) {
		query = query.lte('scheduled_at', `${dateTo}T23:59:59`);
	}

	const { data: bookings, count, error } = await query;

	if (error) {
		console.error('Error fetching bookings:', error);
	}

	// Get status counts
	const { data: allBookings } = await (supabase as any)
		.from('bookings')
		.select('status');

	const statusCounts = {
		all: allBookings?.length ?? 0,
		pending: allBookings?.filter((b: any) => b.status === 'pending').length ?? 0,
		confirmed: allBookings?.filter((b: any) => b.status === 'confirmed').length ?? 0,
		completed: allBookings?.filter((b: any) => b.status === 'completed').length ?? 0,
		cancelled: allBookings?.filter((b: any) => ['cancelled', 'cancelled_by_client', 'cancelled_by_therapist'].includes(b.status)).length ?? 0
	};

	// Calculate revenue stats
	const completedBookings = allBookings?.filter((b: any) => b.status === 'completed') ?? [];
	const { data: revenueData } = await (supabase as any)
		.from('bookings')
		.select('price_cents, commission_cents')
		.eq('status', 'completed');

	const totalRevenue = (revenueData ?? []).reduce((sum: number, b: any) => sum + (b.price_cents ?? 0), 0);
	const totalCommission = (revenueData ?? []).reduce((sum: number, b: any) => sum + (b.commission_cents ?? 0), 0);

	return {
		bookings: (bookings ?? []).map((b: any) => ({
			id: b.id,
			status: b.status,
			scheduled_at: b.scheduled_at,
			scheduled_end_at: b.scheduled_end_at,
			price_cents: b.price_cents,
			commission_cents: b.commission_cents,
			client_address: b.client_address,
			created_at: b.created_at,
			completed_at: b.completed_at,
			client: {
				id: b.users?.id,
				full_name: b.users?.full_name ?? 'Cliente',
				email: b.users?.email
			},
			therapist: {
				id: b.therapists?.id,
				full_name: b.therapists?.users?.full_name ?? 'Terapeuta',
				email: b.therapists?.users?.email
			},
			service: b.therapist_services?.services?.name_es ?? b.therapist_services?.services?.name ?? 'Servicio'
		})),
		totalCount: count ?? 0,
		currentPage: page,
		totalPages: Math.ceil((count ?? 0) / limit),
		statusCounts,
		stats: {
			totalRevenue,
			totalCommission,
			completedCount: completedBookings.length
		},
		filters: { status, dateFrom, dateTo }
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;
		const newStatus = formData.get('status') as string;

		if (!bookingId || !newStatus) {
			return fail(400, { error: 'Datos incompletos' });
		}

		const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
		if (!validStatuses.includes(newStatus)) {
			return fail(400, { error: 'Estado inválido' });
		}

		const updateData: Record<string, unknown> = {
			status: newStatus,
			updated_at: new Date().toISOString()
		};

		if (newStatus === 'completed') {
			updateData.completed_at = new Date().toISOString();
		}

		const { error } = await (supabase as any)
			.from('bookings')
			.update(updateData)
			.eq('id', bookingId);

		if (error) {
			return fail(500, { error: 'Error al actualizar estado' });
		}

		return { success: true, message: 'Estado actualizado' };
	},

	cancelBooking: async ({ request, locals }) => {
		const { supabase } = locals;

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;
		const reason = formData.get('reason') as string;

		if (!bookingId) {
			return fail(400, { error: 'ID de reserva requerido' });
		}

		const { error } = await (supabase as any)
			.from('bookings')
			.update({
				status: 'cancelled',
				cancellation_reason: reason || 'Cancelado por administrador',
				cancelled_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('id', bookingId);

		if (error) {
			return fail(500, { error: 'Error al cancelar reserva' });
		}

		return { success: true, message: 'Reserva cancelada' };
	}
};
