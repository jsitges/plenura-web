<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let saving = $state(false);

	const preferences = [
		{
			key: 'booking_reminders',
			label: 'Recordatorios de citas',
			description: 'Recibe un email 24 horas y 1 hora antes de tu cita'
		},
		{
			key: 'review_requests',
			label: 'Solicitudes de reseña',
			description: 'Te pedimos que califiques tu experiencia después de cada cita'
		},
		{
			key: 'tips_received',
			label: 'Propinas recibidas',
			description: 'Notificación cuando recibes una propina (solo terapeutas)'
		},
		{
			key: 'weekly_reports',
			label: 'Reportes semanales',
			description: 'Resumen semanal de tu actividad (solo terapeutas)'
		},
		{
			key: 'marketing',
			label: 'Ofertas y novedades',
			description: 'Promociones especiales y nuevas funcionalidades'
		}
	];
</script>

<svelte:head>
	<title>Configuración - Plenura</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-900 mb-2">Configuración</h1>
	<p class="text-gray-600 mb-8">Administra tus preferencias de notificación y cuenta.</p>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
			<div class="flex items-center gap-3">
				<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<p class="text-green-700">Preferencias guardadas</p>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
			<p class="text-red-700">{form.error}</p>
		</div>
	{/if}

	<!-- Email Preferences -->
	<div class="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Notificaciones por email</h2>
			<p class="text-sm text-gray-500 mt-1">Elige qué emails quieres recibir</p>
		</div>

		<form
			method="POST"
			action="?/updatePreferences"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update();
					saving = false;
				};
			}}
		>
			<div class="divide-y divide-gray-100">
				{#each preferences as pref}
					{@const checked = data.emailPreferences[pref.key as keyof typeof data.emailPreferences]}
					<label class="flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer">
						<input
							type="checkbox"
							name={pref.key}
							checked={checked}
							class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
						/>
						<div class="flex-1">
							<p class="font-medium text-gray-900">{pref.label}</p>
							<p class="text-sm text-gray-500">{pref.description}</p>
						</div>
					</label>
				{/each}
			</div>

			<div class="p-4 bg-gray-50 border-t border-gray-100">
				<button
					type="submit"
					disabled={saving}
					class="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
				>
					{saving ? 'Guardando...' : 'Guardar preferencias'}
				</button>
			</div>
		</form>
	</div>

	<!-- Account Section -->
	<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Cuenta</h2>
		</div>

		<div class="p-4 space-y-4">
			<a
				href="/settings/profile"
				class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
			>
				<div class="flex items-center gap-3">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					<span class="text-gray-900">Editar perfil</span>
				</div>
				<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a
				href="/settings/password"
				class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
			>
				<div class="flex items-center gap-3">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<span class="text-gray-900">Cambiar contraseña</span>
				</div>
				<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>

	<!-- Danger Zone -->
	<div class="mt-6 bg-red-50 rounded-xl border border-red-200 p-4">
		<h3 class="font-medium text-red-800 mb-2">Zona de peligro</h3>
		<p class="text-sm text-red-600 mb-3">
			Estas acciones son irreversibles. Procede con cuidado.
		</p>
		<button
			type="button"
			class="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
		>
			Eliminar mi cuenta
		</button>
	</div>
</div>
