<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	let selectedClient = $state('');
	let selectedService = $state('');
	let selectedDate = $state('');
	let selectedTime = $state('');
	let duration = $state(60);
	let notes = $state('');
	let clientAddress = $state('');
	let serviceModality = $state<'home_visit' | 'therapist_location' | 'virtual'>('home_visit');
	let saving = $state(false);

	// Generate time slots (30-min intervals)
	const timeSlots = Array.from({ length: 48 }, (_, i) => {
		const hour = Math.floor(i / 2);
		const minute = (i % 2) * 30;
		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	});

	// Update duration when service changes
	function onServiceChange() {
		const service = data.services.find((s: any) => s.id === selectedService);
		if (service) {
			duration = service.duration_minutes;
		}
	}

	// Format price
	function formatPrice(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(cents / 100);
	}
</script>

<svelte:head>
	<title>Crear Cita Manual - Plenura</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<a href="/therapist/bookings" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Crear Cita Manual</h1>
			<p class="text-gray-500">Registra una cita para un cliente</p>
		</div>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-xl p-4">
			<p class="text-red-800">{form.error}</p>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				await update();
				saving = false;
				if (result.type === 'success') {
					goto('/therapist/bookings');
				}
			};
		}}
		class="bg-white rounded-xl border border-gray-100 p-6 space-y-6"
	>
		<!-- Client Selection -->
		<div>
			<label for="client" class="block text-sm font-medium text-gray-700 mb-2">
				Cliente *
			</label>
			<select
				id="client"
				name="client_id"
				bind:value={selectedClient}
				required
				class="input-wellness w-full"
			>
				<option value="">Selecciona un cliente</option>
				{#each data.clients as client}
					<option value={client.id}>
						{client.full_name} - {client.email}
					</option>
				{/each}
			</select>
			<p class="mt-1 text-sm text-gray-500">
				Si el cliente no aparece, debe registrarse primero en la plataforma
			</p>
		</div>

		<!-- Service Selection -->
		<div>
			<label for="service" class="block text-sm font-medium text-gray-700 mb-2">
				Servicio *
			</label>
			<select
				id="service"
				name="therapist_service_id"
				bind:value={selectedService}
				onchange={onServiceChange}
				required
				class="input-wellness w-full"
			>
				<option value="">Selecciona un servicio</option>
				{#each data.services as service}
					<option value={service.id}>
						{service.services.name} - {formatPrice(service.price_cents)} ({service.duration_minutes} min)
					</option>
				{/each}
			</select>
		</div>

		<!-- Date & Time -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="date" class="block text-sm font-medium text-gray-700 mb-2">
					Fecha *
				</label>
				<input
					type="date"
					id="date"
					name="date"
					bind:value={selectedDate}
					required
					min={new Date().toISOString().split('T')[0]}
					class="input-wellness w-full"
				/>
			</div>

			<div>
				<label for="time" class="block text-sm font-medium text-gray-700 mb-2">
					Hora *
				</label>
				<select
					id="time"
					name="time"
					bind:value={selectedTime}
					required
					class="input-wellness w-full"
				>
					<option value="">Selecciona una hora</option>
					{#each timeSlots as slot}
						<option value={slot}>{slot}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Service Modality -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				Modalidad *
			</label>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				<label class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer {serviceModality === 'home_visit' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}">
					<input
						type="radio"
						name="service_modality"
						value="home_visit"
						bind:group={serviceModality}
						class="text-primary-600"
					/>
					<span>Domicilio</span>
				</label>
				<label class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer {serviceModality === 'therapist_location' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}">
					<input
						type="radio"
						name="service_modality"
						value="therapist_location"
						bind:group={serviceModality}
						class="text-primary-600"
					/>
					<span>Consultorio</span>
				</label>
				<label class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer {serviceModality === 'virtual' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}">
					<input
						type="radio"
						name="service_modality"
						value="virtual"
						bind:group={serviceModality}
						class="text-primary-600"
					/>
					<span>Virtual</span>
				</label>
			</div>
		</div>

		<!-- Client Address (only for home visits) -->
		{#if serviceModality === 'home_visit'}
			<div>
				<label for="address" class="block text-sm font-medium text-gray-700 mb-2">
					Dirección del cliente *
				</label>
				<textarea
					id="address"
					name="client_address"
					bind:value={clientAddress}
					required={serviceModality === 'home_visit'}
					rows="2"
					class="input-wellness w-full"
					placeholder="Calle, número, colonia, ciudad..."
				></textarea>
			</div>
		{/if}

		<!-- Notes -->
		<div>
			<label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
				Notas (opcional)
			</label>
			<textarea
				id="notes"
				name="notes"
				bind:value={notes}
				rows="3"
				class="input-wellness w-full"
				placeholder="Motivo de la cita, requisitos especiales, etc."
			></textarea>
		</div>

		<!-- Actions -->
		<div class="flex items-center justify-end gap-3 pt-4 border-t">
			<a
				href="/therapist/bookings"
				class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
			>
				Cancelar
			</a>
			<button
				type="submit"
				disabled={saving}
				class="btn-primary-gradient px-6 py-2 disabled:opacity-50"
			>
				{saving ? 'Creando...' : 'Crear cita'}
			</button>
		</div>
	</form>
</div>
