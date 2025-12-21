<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const filters = [
		{ id: 'pending', label: 'Pendientes' },
		{ id: 'upcoming', label: 'Próximas' },
		{ id: 'past', label: 'Completadas' },
		{ id: 'cancelled', label: 'Canceladas' }
	];

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			weekday: 'long',
			month: 'long',
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

	function formatPrice(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(cents / 100);
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'bg-amber-100 text-amber-700',
			confirmed: 'bg-green-100 text-green-700',
			completed: 'bg-blue-100 text-blue-700',
			cancelled: 'bg-red-100 text-red-700',
			no_show: 'bg-gray-100 text-gray-700'
		};
		return colors[status] ?? 'bg-gray-100 text-gray-700';
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'Pendiente',
			confirmed: 'Confirmada',
			completed: 'Completada',
			cancelled: 'Cancelada',
			no_show: 'No asistió'
		};
		return labels[status] ?? status;
	}

	function isPast(dateString: string): boolean {
		return new Date(dateString) < new Date();
	}
</script>

<svelte:head>
	<title>Mis Citas - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Mis Citas</h1>
		<p class="text-gray-500">Gestiona las reservas de tus clientes</p>
	</div>

	<!-- Filter Tabs -->
	<div class="flex gap-2 border-b border-gray-200 overflow-x-auto">
		{#each filters as filter}
			<a
				href="/therapist/bookings?filter={filter.id}"
				class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap {data.filter === filter.id ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-700'}"
			>
				{filter.label}
			</a>
		{/each}
	</div>

	<!-- Bookings List -->
	{#if data.bookings.length > 0}
		<div class="space-y-4">
			{#each data.bookings as booking}
				{@const b = booking as {
					id: string;
					scheduled_at: string;
					scheduled_end_at: string;
					status: string;
					client_address: string | null;
					notes: string | null;
					price_cents: number;
					users: { full_name: string; avatar_url: string | null; phone: string | null; email: string };
					therapist_services: { price_cents: number; duration_minutes: number; services: { name: string } }
				}}
				<div class="bg-white rounded-xl border border-gray-100 p-6">
					<div class="flex flex-col lg:flex-row lg:items-start gap-4">
						<!-- Client Info -->
						<div class="flex items-start gap-4 flex-1">
							<div class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
								{#if b.users?.avatar_url}
									<img src={b.users.avatar_url} alt="" class="w-full h-full rounded-xl object-cover" />
								{:else}
									<span class="text-xl text-gray-600 font-medium">
										{(b.users?.full_name ?? '?')[0].toUpperCase()}
									</span>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-gray-900">{b.users?.full_name}</h3>
								<p class="text-primary-600 font-medium">{b.therapist_services?.services?.name}</p>

								<div class="mt-2 space-y-1 text-sm text-gray-600">
									<div class="flex items-center gap-2">
										<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										<span>{formatDate(b.scheduled_at)}</span>
									</div>
									<div class="flex items-center gap-2">
										<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span>{formatTime(b.scheduled_at)} - {formatTime(b.scheduled_end_at)}</span>
									</div>
									{#if b.client_address}
										<div class="flex items-start gap-2">
											<svg class="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
											<span>{b.client_address}</span>
										</div>
									{/if}
								</div>

								{#if b.notes}
									<div class="mt-3 p-3 bg-gray-50 rounded-lg">
										<p class="text-sm text-gray-500 font-medium mb-1">Notas del cliente:</p>
										<p class="text-sm text-gray-700">{b.notes}</p>
									</div>
								{/if}

								<!-- Contact Info (for confirmed bookings) -->
								{#if b.status === 'confirmed' && (b.users?.phone || b.users?.email)}
									<div class="mt-3 flex flex-wrap gap-3">
										{#if b.users?.phone}
											<a href="tel:{b.users.phone}" class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
												</svg>
												{b.users.phone}
											</a>
										{/if}
										{#if b.users?.email}
											<a href="mailto:{b.users.email}" class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
												</svg>
												Email
											</a>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<!-- Price & Status -->
						<div class="flex flex-col items-end gap-3">
							<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(b.status)}">
								{getStatusLabel(b.status)}
							</span>
							<p class="text-xl font-bold text-gray-900">
								{formatPrice(b.price_cents)}
							</p>
						</div>
					</div>

					<!-- Actions -->
					{#if b.status === 'pending'}
						<div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
							<form method="POST" action="?/confirm" use:enhance>
								<input type="hidden" name="bookingId" value={b.id} />
								<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
									Confirmar
								</button>
							</form>
							<form method="POST" action="?/reject" use:enhance>
								<input type="hidden" name="bookingId" value={b.id} />
								<button type="submit" class="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
									Rechazar
								</button>
							</form>
						</div>
					{:else if b.status === 'confirmed' && isPast(b.scheduled_at)}
						<div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
							<form method="POST" action="?/complete" use:enhance>
								<input type="hidden" name="bookingId" value={b.id} />
								<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
									Marcar como completada
								</button>
							</form>
							<form method="POST" action="?/noshow" use:enhance>
								<input type="hidden" name="bookingId" value={b.id} />
								<button type="submit" class="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
									No asistió
								</button>
							</form>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-100 p-12 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				{#if data.filter === 'pending'}
					No tienes citas pendientes
				{:else if data.filter === 'upcoming'}
					No tienes citas próximas
				{:else if data.filter === 'past'}
					No tienes citas completadas
				{:else}
					No tienes citas canceladas
				{/if}
			</h3>
			<p class="text-gray-500">
				Las citas aparecerán aquí cuando los clientes te reserven
			</p>
		</div>
	{/if}
</div>
