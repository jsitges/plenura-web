<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			canInvite: boolean;
			practiceName?: string;
			userRole?: string;
			error?: string;
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	const roleOptions = [
		{ value: 'therapist', label: 'Terapeuta', description: 'Puede atender clientes y gestionar su agenda' },
		{ value: 'receptionist', label: 'Recepcionista', description: 'Puede gestionar reservas y ver información de clientes' },
		{ value: 'manager', label: 'Gerente', description: 'Puede gestionar el equipo y ver reportes' },
		{ value: 'admin', label: 'Administrador', description: 'Acceso completo a la configuración de la práctica' }
	];

	// Filter admin option if user is not owner
	const availableRoles = $derived(
		data.userRole === 'owner'
			? roleOptions
			: roleOptions.filter(r => r.value !== 'admin')
	);

	let email = $state('');
	let role = $state('therapist');
	let title = $state('');
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Invitar Miembro - {data.practiceName} - Plenura</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6">
		<a href="/practice/team" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Volver al equipo
		</a>
	</div>

	{#if !data.canInvite}
		<div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
			<svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<h2 class="text-lg font-semibold text-red-800 mb-2">Acceso denegado</h2>
			<p class="text-red-600">{data.error}</p>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="mb-6">
				<h1 class="text-2xl font-bold text-gray-900">Invitar Miembro</h1>
				<p class="text-gray-500 mt-1">Envía una invitación para unirse a {data.practiceName}</p>
			</div>

			{#if form?.success}
				<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
					<div class="flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>{form.message}</span>
					</div>
					<div class="mt-3 flex gap-3">
						<button
							type="button"
							onclick={() => { email = ''; role = 'therapist'; title = ''; }}
							class="text-sm text-green-700 hover:text-green-800 underline"
						>
							Invitar a otro
						</button>
						<a href="/practice/team" class="text-sm text-green-700 hover:text-green-800 underline">
							Ver equipo
						</a>
					</div>
				</div>
			{/if}

			{#if form?.error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				action="?/invite"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-6">
					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
							Email <span class="text-red-500">*</span>
						</label>
						<input
							type="email"
							id="email"
							name="email"
							bind:value={email}
							required
							class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							placeholder="correo@ejemplo.com"
						/>
						<p class="text-sm text-gray-500 mt-1">
							Se enviará un enlace de invitación a este correo
						</p>
					</div>

					<!-- Role -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Rol <span class="text-red-500">*</span>
						</label>
						<div class="space-y-2">
							{#each availableRoles as roleOption}
								<label
									class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
										{role === roleOption.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}"
								>
									<input
										type="radio"
										name="role"
										value={roleOption.value}
										bind:group={role}
										class="mt-0.5"
									/>
									<div>
										<span class="font-medium text-gray-900">{roleOption.label}</span>
										<p class="text-sm text-gray-500">{roleOption.description}</p>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<!-- Title (optional) -->
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
							Título o especialidad (opcional)
						</label>
						<input
							type="text"
							id="title"
							name="title"
							bind:value={title}
							class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							placeholder="Ej: Fisioterapeuta, Psicóloga Clínica"
						/>
						<p class="text-sm text-gray-500 mt-1">
							Aparecerá junto al nombre en el perfil del equipo
						</p>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
					<a
						href="/practice/team"
						class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
					>
						Cancelar
					</a>
					<button
						type="submit"
						disabled={isSubmitting || !email}
						class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
					>
						{#if isSubmitting}
							<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Enviando...</span>
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
							<span>Enviar invitación</span>
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Info box -->
		<div class="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
			<div class="flex gap-3">
				<svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div class="text-sm text-blue-800">
					<p class="font-medium mb-1">Sobre las invitaciones</p>
					<ul class="list-disc list-inside space-y-1 text-blue-700">
						<li>Las invitaciones expiran en 7 días</li>
						<li>El invitado puede registrarse o usar una cuenta existente</li>
						<li>Si el invitado ya es terapeuta, se vinculará su perfil existente</li>
						<li>Puedes cancelar invitaciones pendientes desde la página del equipo</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>
