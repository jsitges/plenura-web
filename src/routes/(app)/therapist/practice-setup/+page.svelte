<script lang="ts">
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			pendingPractice: {
				name: string;
				type: string;
				taxId: string | null;
			};
			user: any;
			userProfile: any;
		};
	}

	let { data }: Props = $props();

	let creating = $state(false);
	let error = $state<string | null>(null);

	// Additional fields for practice setup
	let description = $state('');
	let phone = $state('');
	let address = $state('');
	let city = $state('');
	let state = $state('');
	let postalCode = $state('');

	const practiceTypeLabels: Record<string, string> = {
		clinic: 'Clínica',
		wellness_center: 'Centro de Bienestar',
		therapy_center: 'Centro de Terapia',
		medical_office: 'Consultorio Médico',
		spa: 'Spa'
	};

	async function createPractice() {
		creating = true;
		error = null;

		try {
			const response = await fetch('/api/practice/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description: description.trim() || null,
					phone: phone.trim() || null,
					address: address.trim() || null,
					city: city.trim() || null,
					state: state.trim() || null,
					postal_code: postalCode.trim() || null
				})
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Error al crear la práctica');
			}

			// Redirect to practice dashboard
			goto('/practice');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al crear la práctica';
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>Configurar Práctica - Plenura</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
	<div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-gray-900">Configura tu práctica</h1>
			<p class="text-gray-500 mt-2">
				Completa la información de <strong>{data.pendingPractice.name}</strong>
			</p>
		</div>

		<!-- Practice summary -->
		<div class="bg-gray-50 rounded-xl p-4 mb-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<span class="text-primary-600 font-bold text-xl">{data.pendingPractice.name.charAt(0)}</span>
				</div>
				<div>
					<p class="font-semibold text-gray-900">{data.pendingPractice.name}</p>
					<p class="text-sm text-gray-500">
						{practiceTypeLabels[data.pendingPractice.type] || data.pendingPractice.type}
						{#if data.pendingPractice.taxId}
							<span class="mx-1">·</span>
							RFC: {data.pendingPractice.taxId}
						{/if}
					</p>
				</div>
			</div>
		</div>

		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); createPractice(); }} class="space-y-6">
			<!-- Description -->
			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 mb-1.5">
					Descripción (opcional)
				</label>
				<textarea
					id="description"
					bind:value={description}
					rows={3}
					placeholder="Describe brevemente tu práctica y los servicios que ofreces..."
					class="input-wellness resize-none"
					disabled={creating}
				></textarea>
			</div>

			<!-- Phone -->
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1.5">
					Teléfono de contacto (opcional)
				</label>
				<input
					type="tel"
					id="phone"
					bind:value={phone}
					placeholder="+52 55 1234 5678"
					class="input-wellness"
					disabled={creating}
				/>
			</div>

			<!-- Address -->
			<div>
				<label for="address" class="block text-sm font-medium text-gray-700 mb-1.5">
					Dirección (opcional)
				</label>
				<input
					type="text"
					id="address"
					bind:value={address}
					placeholder="Calle, número, colonia"
					class="input-wellness"
					disabled={creating}
				/>
			</div>

			<!-- City, State, Postal Code -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label for="city" class="block text-sm font-medium text-gray-700 mb-1.5">
						Ciudad
					</label>
					<input
						type="text"
						id="city"
						bind:value={city}
						placeholder="Ciudad de México"
						class="input-wellness"
						disabled={creating}
					/>
				</div>
				<div>
					<label for="state" class="block text-sm font-medium text-gray-700 mb-1.5">
						Estado
					</label>
					<input
						type="text"
						id="state"
						bind:value={state}
						placeholder="CDMX"
						class="input-wellness"
						disabled={creating}
					/>
				</div>
				<div>
					<label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1.5">
						Código Postal
					</label>
					<input
						type="text"
						id="postalCode"
						bind:value={postalCode}
						placeholder="06600"
						class="input-wellness"
						disabled={creating}
					/>
				</div>
			</div>

			<!-- Info note -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex gap-3">
					<svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="text-sm text-blue-700">
						<p class="font-medium">Puedes completar esto después</p>
						<p class="mt-1">
							Esta información es opcional y puedes actualizarla en cualquier momento desde la configuración de tu práctica.
						</p>
					</div>
				</div>
			</div>

			<!-- Submit button -->
			<button
				type="submit"
				disabled={creating}
				class="w-full btn-primary-gradient py-3 text-lg font-medium"
			>
				{#if creating}
					<span class="flex items-center justify-center gap-2">
						<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Creando práctica...
					</span>
				{:else}
					Crear mi práctica
				{/if}
			</button>
		</form>
	</div>
</div>
