<script lang="ts">
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase/client';

	let { data } = $props();

	const supabase = createClient();
	let cancellingId = $state<string | null>(null);
	let showReviewSuccess = $state(data.justReviewed);

	// Convert to Set for faster lookup
	const reviewedBookingIds = new Set(data.reviewedBookingIds);

	const filters = [
		{ id: 'upcoming', label: 'Próximas' },
		{ id: 'past', label: 'Completadas' },
		{ id: 'cancelled', label: 'Canceladas' }
	];

	function canReview(booking: (typeof data.bookings)[0]): boolean {
		return booking.status === 'completed' && !reviewedBookingIds.has(booking.id);
	}

	function hasReviewed(booking: (typeof data.bookings)[0]): boolean {
		return booking.status === 'completed' && reviewedBookingIds.has(booking.id);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('es-MX', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(price);
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'Pendiente',
			confirmed: 'Confirmada',
			completed: 'Completada',
			cancelled_by_client: 'Cancelada',
			cancelled_by_therapist: 'Cancelada',
			no_show: 'No asistió'
		};
		return labels[status] ?? status;
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'bg-amber-100 text-amber-700',
			confirmed: 'bg-green-100 text-green-700',
			completed: 'bg-blue-100 text-blue-700',
			cancelled_by_client: 'bg-red-100 text-red-700',
			cancelled_by_therapist: 'bg-red-100 text-red-700',
			no_show: 'bg-gray-100 text-gray-700'
		};
		return colors[status] ?? 'bg-gray-100 text-gray-700';
	}

	async function cancelBooking(bookingId: string) {
		if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;

		cancellingId = bookingId;

		try {
			await supabase
				.from('bookings')
				.update({ status: 'cancelled_by_client' })
				.eq('id', bookingId);

			// Refresh the page
			goto('/bookings?filter=' + data.filter, { invalidateAll: true });
		} catch (err) {
			console.error('Error cancelling booking:', err);
			alert('Error al cancelar la cita');
		} finally {
			cancellingId = null;
		}
	}
</script>

<svelte:head>
	<title>Mis Citas - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Mis Citas</h1>
		<a href="/therapists" class="btn-primary-gradient">
			Nueva cita
		</a>
	</div>

	<!-- Review Success Message -->
	{#if showReviewSuccess}
		<div class="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<p class="text-green-700">¡Gracias por tu reseña! Tu opinión ayuda a otros clientes.</p>
			</div>
			<button
				type="button"
				onclick={() => (showReviewSuccess = false)}
				class="text-green-600 hover:text-green-700"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Filter Tabs -->
	<div class="flex gap-2 border-b border-gray-200">
		{#each filters as filter}
			<a
				href="/bookings?filter={filter.id}"
				class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px {data.filter === filter.id ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-700'}"
			>
				{filter.label}
			</a>
		{/each}
	</div>

	<!-- Bookings List -->
	{#if data.bookings.length > 0}
		<div class="space-y-4">
			{#each data.bookings as booking}
				<div class="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
					<div class="flex flex-col sm:flex-row sm:items-center gap-4">
						<!-- Therapist Info -->
						<div class="flex items-center gap-4 flex-1">
							<div class="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
								{#if booking.therapists?.users?.avatar_url}
									<img
										src={booking.therapists.users.avatar_url}
										alt=""
										class="w-full h-full rounded-xl object-cover"
									/>
								{:else}
									<span class="text-xl text-primary-600">
										{(booking.therapists?.users?.full_name ?? '?')[0].toUpperCase()}
									</span>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-gray-900 truncate">
									{booking.therapists?.users?.full_name}
								</h3>
								<p class="text-gray-600 text-sm">
									{booking.therapist_services?.services?.name}
								</p>
								<div class="flex items-center gap-2 mt-1">
									<span class="text-sm text-gray-500">
										{formatDate(booking.scheduled_at)} • {formatTime(booking.scheduled_at)}
									</span>
									<span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(booking.status)}">
										{getStatusLabel(booking.status)}
									</span>
								</div>
							</div>
						</div>

						<!-- Price & Actions -->
						<div class="flex items-center justify-between sm:flex-col sm:items-end gap-2">
							<p class="text-lg font-semibold text-primary-600">
								{formatPrice(booking.price_cents / 100)}
							</p>

							{#if booking.status === 'pending'}
								<button
									type="button"
									onclick={() => cancelBooking(booking.id)}
									disabled={cancellingId === booking.id}
									class="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
								>
									{cancellingId === booking.id ? 'Cancelando...' : 'Cancelar'}
								</button>
							{:else if canReview(booking)}
								<a
									href="/booking/{booking.id}/review"
									class="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
									Dejar reseña
								</a>
							{:else if hasReviewed(booking)}
								<span class="text-sm text-green-600 flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									Reseña enviada
								</span>
							{:else if booking.status === 'completed'}
								<a
									href="/therapists/{booking.therapist_id}"
									class="text-sm text-primary-600 hover:text-primary-700"
								>
									Reservar de nuevo
								</a>
							{/if}
						</div>
					</div>

					{#if booking.notes}
						<div class="mt-4 pt-4 border-t border-gray-100">
							<p class="text-sm text-gray-500">
								<span class="font-medium">Notas:</span> {booking.notes}
							</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="text-center py-12">
			<div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				{#if data.filter === 'upcoming'}
					No tienes citas programadas
				{:else if data.filter === 'past'}
					No tienes citas completadas
				{:else}
					No tienes citas canceladas
				{/if}
			</h3>
			<p class="text-gray-500 mb-6">
				{#if data.filter === 'upcoming'}
					Encuentra un terapeuta y agenda tu primera sesión
				{:else}
					Aquí aparecerán tus citas {data.filter === 'past' ? 'completadas' : 'canceladas'}
				{/if}
			</p>
			{#if data.filter === 'upcoming'}
				<a href="/therapists" class="btn-primary-gradient">
					Buscar terapeuta
				</a>
			{/if}
		</div>
	{/if}
</div>
