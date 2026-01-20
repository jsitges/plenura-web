<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let editingNoteId = $state<string | null>(null);
	let noteContent = $state('');
	let saving = $state(false);

	function startEditingNote(booking: any) {
		editingNoteId = booking.id;
		noteContent = booking.therapist_notes || '';
	}

	function cancelEdit() {
		editingNoteId = null;
		noteContent = '';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			weekday: 'long',
			year: 'numeric',
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
</script>

<svelte:head>
	<title>{data.client.full_name} - Cliente - Plenura</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-start gap-4">
		<a href="/therapist/clients" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<div class="flex-1">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-4">
					<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
						{#if data.client.avatar_url}
							<img src={data.client.avatar_url} alt="" class="w-full h-full rounded-full object-cover" />
						{:else}
							<span class="text-2xl font-medium text-primary-600">
								{(data.client.full_name ?? '?')[0].toUpperCase()}
							</span>
						{/if}
					</div>
					<div>
						<h1 class="text-2xl font-bold text-gray-900">{data.client.full_name}</h1>
						<p class="text-gray-500">{data.client.email}</p>
						{#if data.client.phone}
							<p class="text-gray-500">{data.client.phone}</p>
						{/if}
					</div>
				</div>
				<a
					href="/therapist/bookings/create?client={data.client.id}"
					class="btn-primary-gradient px-4 py-2 inline-flex items-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Nueva cita
				</a>
			</div>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<p class="text-sm text-gray-500 mb-1">Citas totales</p>
			<p class="text-3xl font-bold text-gray-900">{data.stats.total}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<p class="text-sm text-gray-500 mb-1">Completadas</p>
			<p class="text-3xl font-bold text-green-600">{data.stats.completed}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<p class="text-sm text-gray-500 mb-1">Próximas</p>
			<p class="text-3xl font-bold text-blue-600">{data.stats.upcoming}</p>
		</div>
	</div>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 rounded-xl p-4">
			<p class="text-green-800">Notas guardadas correctamente</p>
		</div>
	{/if}

	<!-- Booking History -->
	<div class="bg-white rounded-xl border border-gray-100">
		<div class="p-6 border-b border-gray-100">
			<h2 class="text-lg font-semibold text-gray-900">Historial de Sesiones</h2>
			<p class="text-sm text-gray-500">Citas y notas de sesión</p>
		</div>

		{#if data.bookings.length > 0}
			<div class="divide-y divide-gray-100">
				{#each data.bookings as booking}
					<div class="p-6 space-y-4">
						<!-- Booking Info -->
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="font-semibold text-gray-900">{booking.therapist_services.services.name}</h3>
									<span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(booking.status)}">
										{getStatusLabel(booking.status)}
									</span>
								</div>
								<div class="space-y-1 text-sm text-gray-600">
									<p>📅 {formatDate(booking.scheduled_at)}</p>
									<p>🕐 {formatTime(booking.scheduled_at)} - {formatTime(booking.scheduled_end_at)}</p>
									{#if booking.service_modality === 'home_visit' && booking.client_address}
										<p>📍 {booking.client_address}</p>
									{/if}
								</div>
								{#if booking.notes}
									<div class="mt-3 p-3 bg-gray-50 rounded-lg">
										<p class="text-xs text-gray-500 font-medium mb-1">Notas del cliente:</p>
										<p class="text-sm text-gray-700">{booking.notes}</p>
									</div>
								{/if}
							</div>
						</div>

						<!-- Session Notes -->
						<div class="pt-3 border-t border-gray-100">
							{#if editingNoteId === booking.id}
								<!-- Edit Mode -->
								<form
									method="POST"
									action="?/saveNote"
									use:enhance={() => {
										saving = true;
										return async ({ update }) => {
											await update();
											saving = false;
											editingNoteId = null;
											noteContent = '';
										};
									}}
								>
									<input type="hidden" name="booking_id" value={booking.id} />
									<textarea
										name="therapist_notes"
										bind:value={noteContent}
										rows="4"
										placeholder="Escribe tus notas de sesión aquí (privadas, solo tú las verás)..."
										class="input-wellness w-full mb-2"
									></textarea>
									<div class="flex items-center gap-2">
										<button
											type="submit"
											disabled={saving}
											class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
										>
											{saving ? 'Guardando...' : 'Guardar'}
										</button>
										<button
											type="button"
											onclick={cancelEdit}
											class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
										>
											Cancelar
										</button>
									</div>
								</form>
							{:else}
								<!-- View Mode -->
								{#if booking.therapist_notes}
									<div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
										<div class="flex items-start justify-between mb-2">
											<p class="text-xs text-amber-700 font-medium">📝 Notas de sesión (privadas)</p>
											<button
												onclick={() => startEditingNote(booking)}
												class="text-xs text-amber-600 hover:text-amber-700"
											>
												Editar
											</button>
										</div>
										<p class="text-sm text-gray-700 whitespace-pre-wrap">{booking.therapist_notes}</p>
									</div>
								{:else if booking.status === 'completed'}
									<button
										onclick={() => startEditingNote(booking)}
										class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-2"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
										</svg>
										Agregar notas de sesión
									</button>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-12 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">Sin citas registradas</h3>
				<p class="text-gray-500 mb-4">Este cliente aún no tiene citas contigo</p>
				<a
					href="/therapist/bookings/create?client={data.client.id}"
					class="btn-primary-gradient px-4 py-2 inline-flex items-center gap-2"
				>
					Crear primera cita
				</a>
			</div>
		{/if}
	</div>
</div>
