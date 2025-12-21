<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	let selectedSlot = $state<string | null>(null);
	let address = $state('');
	let notes = $state('');
	let loading = $state(false);

	// Generate next 7 days for date selection
	const dates = Array.from({ length: 7 }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() + i + 1);
		return date.toISOString().split('T')[0];
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-MX', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleTimeString('es-MX', {
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

	function selectDate(date: string) {
		selectedSlot = null;
		goto(`/booking/new?therapist=${data.therapist.id}&service=${data.service.id}&date=${date}`);
	}
</script>

<svelte:head>
	<title>Nueva Reserva - Plenura</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Back Button -->
	<a
		href="/therapists/{data.therapist.id}"
		class="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
	>
		<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Volver al perfil
	</a>

	<h1 class="text-2xl font-bold text-gray-900">Nueva Reserva</h1>

	<!-- Service Summary -->
	<div class="bg-white rounded-xl border border-gray-100 p-6">
		<div class="flex items-center gap-4">
			<div class="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
				{#if data.therapist.users?.avatar_url}
					<img
						src={data.therapist.users.avatar_url}
						alt=""
						class="w-full h-full rounded-xl object-cover"
					/>
				{:else}
					<span class="text-xl text-primary-600">
						{(data.therapist.users?.full_name ?? '?')[0].toUpperCase()}
					</span>
				{/if}
			</div>
			<div class="flex-1">
				<h3 class="font-semibold text-gray-900">{data.therapist.users?.full_name}</h3>
				<p class="text-gray-600">{data.service.services?.name}</p>
				<p class="text-sm text-gray-500">{data.service.duration_minutes} minutos</p>
			</div>
			<div class="text-right">
				<p class="text-lg font-bold text-primary-600">
					{formatPrice(data.service.price_cents / 100)}
				</p>
			</div>
		</div>
	</div>

	<!-- Date Selection -->
	<div class="bg-white rounded-xl border border-gray-100 p-6">
		<h2 class="font-semibold text-gray-900 mb-4">Selecciona una fecha</h2>
		<div class="flex gap-2 overflow-x-auto pb-2">
			{#each dates as date}
				<button
					type="button"
					onclick={() => selectDate(date)}
					class="flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all text-center min-w-[90px] {data.selectedDate === date ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}"
				>
					<p class="text-xs text-gray-500 uppercase">{formatDate(date).split(' ')[0]}</p>
					<p class="font-semibold text-gray-900">{formatDate(date).split(' ').slice(1).join(' ')}</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- Time Slots -->
	<div class="bg-white rounded-xl border border-gray-100 p-6">
		<h2 class="font-semibold text-gray-900 mb-4">Horarios disponibles</h2>

		{#if data.availableSlots.length > 0}
			<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
				{#each data.availableSlots as slot}
					<button
						type="button"
						onclick={() => selectedSlot = slot}
						class="px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all {selectedSlot === slot ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 hover:border-gray-200 text-gray-700'}"
					>
						{formatTime(slot)}
					</button>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<p class="text-gray-500">No hay horarios disponibles para esta fecha</p>
				<p class="text-sm text-gray-400 mt-1">Prueba con otro día</p>
			</div>
		{/if}
	</div>

	<!-- Booking Form -->
	{#if selectedSlot}
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'redirect') {
						goto(result.location);
					} else {
						await update();
					}
				};
			}}
			class="bg-white rounded-xl border border-gray-100 p-6 space-y-4"
		>
			<h2 class="font-semibold text-gray-900">Completa tu reserva</h2>

			<input type="hidden" name="therapistId" value={data.therapist.id} />
			<input type="hidden" name="serviceId" value={data.service.id} />
			<input type="hidden" name="scheduledAt" value={selectedSlot} />

			{#if form?.error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
					{form.error}
				</div>
			{/if}

			<div>
				<label for="address" class="block text-sm font-medium text-gray-700 mb-1.5">
					Dirección del servicio
				</label>
				<textarea
					id="address"
					name="address"
					bind:value={address}
					required
					rows={2}
					placeholder="Ingresa la dirección donde quieres recibir el servicio"
					class="input-wellness resize-none"
				></textarea>
			</div>

			<div>
				<label for="notes" class="block text-sm font-medium text-gray-700 mb-1.5">
					Notas adicionales (opcional)
				</label>
				<textarea
					id="notes"
					name="notes"
					bind:value={notes}
					rows={2}
					placeholder="Alguna indicación especial para el terapeuta..."
					class="input-wellness resize-none"
				></textarea>
			</div>

			<!-- Summary -->
			<div class="bg-gray-50 rounded-lg p-4">
				<div class="flex justify-between text-sm mb-2">
					<span class="text-gray-600">Fecha</span>
					<span class="font-medium">{formatDate(data.selectedDate)}</span>
				</div>
				<div class="flex justify-between text-sm mb-2">
					<span class="text-gray-600">Hora</span>
					<span class="font-medium">{formatTime(selectedSlot)}</span>
				</div>
				<div class="flex justify-between text-sm mb-2">
					<span class="text-gray-600">Duración</span>
					<span class="font-medium">{data.service.duration_minutes} minutos</span>
				</div>
				<hr class="my-3">
				<div class="flex justify-between">
					<span class="font-semibold text-gray-900">Total</span>
					<span class="font-bold text-primary-600 text-lg">
						{formatPrice(data.service.price_cents / 100)}
					</span>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading || !address}
				class="w-full btn-primary-gradient py-3 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<span class="inline-flex items-center gap-2">
						<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Procesando...
					</span>
				{:else}
					Confirmar Reserva
				{/if}
			</button>

			<p class="text-xs text-gray-500 text-center">
				Al confirmar, aceptas los términos de servicio y la política de cancelación
			</p>
		</form>
	{/if}
</div>
