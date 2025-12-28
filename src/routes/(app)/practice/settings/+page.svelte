<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		data: {
			practice: {
				id: string;
				name: string;
				description: string | null;
				phone: string | null;
				email: string | null;
				website: string | null;
				address: string | null;
				city: string | null;
				state: string | null;
				postal_code: string | null;
				logo_url: string | null;
				booking_mode: 'therapist_direct' | 'practice_assigns' | 'hybrid';
				payout_routing: 'therapist_wallet' | 'practice_wallet' | 'split';
				default_commission_rate: number;
				verification_status: string;
				subscription_tier: string;
			};
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	const bookingModes = [
		{
			value: 'therapist_direct',
			label: 'Reserva directa',
			description: 'Los clientes reservan directamente con el terapeuta de su elección'
		},
		{
			value: 'practice_assigns',
			label: 'Asignación por consultorio',
			description: 'El consultorio asigna un terapeuta disponible a cada reserva'
		},
		{
			value: 'hybrid',
			label: 'Híbrido',
			description: 'Los clientes pueden elegir terapeuta o dejar que el consultorio asigne'
		}
	];

	const payoutModes = [
		{
			value: 'therapist_wallet',
			label: 'Cartera del terapeuta',
			description: 'Los pagos van directamente a la cartera del terapeuta'
		},
		{
			value: 'practice_wallet',
			label: 'Cartera del consultorio',
			description: 'Los pagos van al consultorio (el consultorio paga a terapeutas)'
		},
		{
			value: 'split',
			label: 'Dividido',
			description: 'El pago se divide según la comisión configurada'
		}
	];

	let activeTab = $state<'profile' | 'booking' | 'billing'>('profile');
	let logoInput: HTMLInputElement;
</script>

<svelte:head>
	<title>Configuración - {data.practice.name} - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Configuración</h1>
		<p class="text-gray-500 mt-1">Administra la información y preferencias del consultorio</p>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
			{form.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{form.error}
		</div>
	{/if}

	<!-- Tabs -->
	<div class="border-b border-gray-200">
		<nav class="flex gap-6">
			<button
				type="button"
				onclick={() => activeTab = 'profile'}
				class="py-3 px-1 border-b-2 font-medium text-sm transition-colors
					{activeTab === 'profile'
						? 'border-primary-500 text-primary-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Perfil
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'booking'}
				class="py-3 px-1 border-b-2 font-medium text-sm transition-colors
					{activeTab === 'booking'
						? 'border-primary-500 text-primary-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Reservas y Pagos
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'billing'}
				class="py-3 px-1 border-b-2 font-medium text-sm transition-colors
					{activeTab === 'billing'
						? 'border-primary-500 text-primary-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Suscripción
			</button>
		</nav>
	</div>

	<!-- Profile Tab -->
	{#if activeTab === 'profile'}
		<div class="grid lg:grid-cols-3 gap-6">
			<!-- Logo Upload -->
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<h3 class="font-semibold text-gray-900 mb-4">Logo del consultorio</h3>

				<div class="flex flex-col items-center">
					{#if data.practice.logo_url}
						<img
							src={data.practice.logo_url}
							alt={data.practice.name}
							class="w-32 h-32 rounded-xl object-cover mb-4"
						/>
					{:else}
						<div class="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
							<span class="text-4xl text-gray-400">{data.practice.name.charAt(0)}</span>
						</div>
					{/if}

					<form method="POST" action="?/uploadLogo" enctype="multipart/form-data" use:enhance>
						<input
							type="file"
							name="logo"
							accept="image/jpeg,image/png,image/webp"
							class="hidden"
							bind:this={logoInput}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						/>
						<button
							type="button"
							onclick={() => logoInput.click()}
							class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							Cambiar logo
						</button>
					</form>
					<p class="text-xs text-gray-500 mt-2">JPG, PNG o WebP. Máximo 5MB</p>
				</div>
			</div>

			<!-- Profile Form -->
			<div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
				<h3 class="font-semibold text-gray-900 mb-4">Información del consultorio</h3>

				<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
					<div class="grid sm:grid-cols-2 gap-4">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
								Nombre *
							</label>
							<input
								type="text"
								id="name"
								name="name"
								value={data.practice.name}
								required
								class="w-full border rounded-lg px-3 py-2"
							/>
						</div>
						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
								Teléfono
							</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								value={data.practice.phone ?? ''}
								class="w-full border rounded-lg px-3 py-2"
							/>
						</div>
					</div>

					<div class="grid sm:grid-cols-2 gap-4">
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
								Email de contacto
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={data.practice.email ?? ''}
								class="w-full border rounded-lg px-3 py-2"
							/>
						</div>
						<div>
							<label for="website" class="block text-sm font-medium text-gray-700 mb-1">
								Sitio web
							</label>
							<input
								type="url"
								id="website"
								name="website"
								value={data.practice.website ?? ''}
								placeholder="https://"
								class="w-full border rounded-lg px-3 py-2"
							/>
						</div>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
							Descripción
						</label>
						<textarea
							id="description"
							name="description"
							rows="3"
							class="w-full border rounded-lg px-3 py-2"
							placeholder="Describe tu consultorio..."
						>{data.practice.description ?? ''}</textarea>
					</div>

					<hr class="my-4" />
					<h4 class="font-medium text-gray-900">Ubicación</h4>

					<div>
						<label for="address" class="block text-sm font-medium text-gray-700 mb-1">
							Dirección
						</label>
						<input
							type="text"
							id="address"
							name="address"
							value={data.practice.address ?? ''}
							class="w-full border rounded-lg px-3 py-2"
						/>
					</div>

					<div class="grid sm:grid-cols-3 gap-4">
						<div>
							<label for="city" class="block text-sm font-medium text-gray-700 mb-1">
								Ciudad
							</label>
							<input
								type="text"
								id="city"
								name="city"
								value={data.practice.city ?? ''}
								class="w-full border rounded-lg px-3 py-2"
							/>
						</div>
						<div>
							<label for="state" class="block text-sm font-medium text-gray-700 mb-1">
								Estado
							</label>
							<input
								type="text"
								id="state"
								name="state"
								value={data.practice.state ?? ''}
								class="w-full border rounded-lg px-3 py-2"
							/>
						</div>
						<div>
							<label for="postal_code" class="block text-sm font-medium text-gray-700 mb-1">
								Código postal
							</label>
							<input
								type="text"
								id="postal_code"
								name="postal_code"
								value={data.practice.postal_code ?? ''}
								class="w-full border rounded-lg px-3 py-2"
							/>
						</div>
					</div>

					<div class="pt-4">
						<button type="submit" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
							Guardar cambios
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Booking & Payment Tab -->
	{#if activeTab === 'booking'}
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<form method="POST" action="?/updateBookingSettings" use:enhance class="space-y-6">
				<!-- Booking Mode -->
				<div>
					<h3 class="font-semibold text-gray-900 mb-4">Modo de reservas</h3>
					<p class="text-sm text-gray-500 mb-4">
						Define cómo los clientes reservarán citas en tu consultorio
					</p>

					<div class="space-y-3">
						{#each bookingModes as mode}
							<label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 {data.practice.booking_mode === mode.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}">
								<input
									type="radio"
									name="booking_mode"
									value={mode.value}
									checked={data.practice.booking_mode === mode.value}
									class="mt-1"
								/>
								<div>
									<p class="font-medium text-gray-900">{mode.label}</p>
									<p class="text-sm text-gray-500">{mode.description}</p>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<hr />

				<!-- Payout Routing -->
				<div>
					<h3 class="font-semibold text-gray-900 mb-4">Destino de pagos</h3>
					<p class="text-sm text-gray-500 mb-4">
						Configura a dónde irán los pagos de las reservas
					</p>

					<div class="space-y-3">
						{#each payoutModes as mode}
							<label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 {data.practice.payout_routing === mode.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}">
								<input
									type="radio"
									name="payout_routing"
									value={mode.value}
									checked={data.practice.payout_routing === mode.value}
									class="mt-1"
								/>
								<div>
									<p class="font-medium text-gray-900">{mode.label}</p>
									<p class="text-sm text-gray-500">{mode.description}</p>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<hr />

				<!-- Commission Rate -->
				<div>
					<h3 class="font-semibold text-gray-900 mb-4">Comisión del consultorio</h3>
					<p class="text-sm text-gray-500 mb-4">
						Porcentaje que retiene el consultorio de cada reserva (después de la comisión de Plenura)
					</p>

					<div class="flex items-center gap-3 max-w-xs">
						<input
							type="number"
							name="default_commission_rate"
							value={data.practice.default_commission_rate}
							min="0"
							max="100"
							step="0.1"
							class="w-24 border rounded-lg px-3 py-2 text-center"
						/>
						<span class="text-gray-700">%</span>
					</div>
					<p class="text-xs text-gray-500 mt-2">
						Los miembros pueden tener tasas personalizadas en la configuración del equipo
					</p>
				</div>

				<div class="pt-4">
					<button type="submit" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
						Guardar configuración
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Billing Tab -->
	{#if activeTab === 'billing'}
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<h3 class="font-semibold text-gray-900 mb-4">Suscripción actual</h3>

			<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
					</svg>
				</div>
				<div>
					<p class="text-lg font-semibold text-gray-900 capitalize">{data.practice.subscription_tier}</p>
					<p class="text-sm text-gray-500">Plan actual del consultorio</p>
				</div>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 border rounded-lg">
					<div>
						<p class="font-medium text-gray-900">Estado de verificación</p>
						<p class="text-sm text-gray-500">
							{data.practice.verification_status === 'fully_verified'
								? 'Completamente verificado'
								: data.practice.verification_status === 'pending'
									? 'Verificación en proceso'
									: 'Verificación pendiente'}
						</p>
					</div>
					{#if data.practice.verification_status !== 'fully_verified'}
						<a
							href="/practice/settings/verification"
							class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
						>
							Completar verificación
						</a>
					{:else}
						<span class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
							Verificado
						</span>
					{/if}
				</div>

				<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<p class="text-sm text-blue-800">
						Para cambiar tu plan de suscripción o ver el historial de facturación,
						contacta a nuestro equipo de soporte.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
