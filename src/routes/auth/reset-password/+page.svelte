<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase/client';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);
	let isValidSession = $state(false);
	let isChecking = $state(true);

	const supabase = createClient();

	onMount(async () => {
		// Supabase sends the token in the URL hash fragment
		// The client library automatically handles the session from the URL
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();

		if (sessionError) {
			error = 'Error al verificar el enlace de recuperación';
			isChecking = false;
			return;
		}

		// Check if we have a valid recovery session
		// Supabase sets type = 'recovery' for password reset links
		if (session) {
			isValidSession = true;
		} else {
			// Try to exchange the token from URL
			const hashParams = new URLSearchParams(window.location.hash.substring(1));
			const accessToken = hashParams.get('access_token');
			const type = hashParams.get('type');

			if (accessToken && type === 'recovery') {
				const { error: setSessionError } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: hashParams.get('refresh_token') || ''
				});

				if (!setSessionError) {
					isValidSession = true;
				} else {
					error = 'El enlace de recuperación ha expirado o no es válido';
				}
			} else {
				error = 'Enlace de recuperación inválido. Solicita uno nuevo.';
			}
		}

		isChecking = false;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (password.length < 8) {
			error = 'La contraseña debe tener al menos 8 caracteres';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Las contraseñas no coinciden';
			return;
		}

		error = null;
		loading = true;

		try {
			const { error: updateError } = await supabase.auth.updateUser({
				password: password
			});

			if (updateError) {
				error = updateError.message;
				return;
			}

			success = true;

			// Sign out and redirect to login after a short delay
			await supabase.auth.signOut();
			setTimeout(() => {
				goto('/login?message=password_reset');
			}, 2000);
		} catch (err) {
			error = 'Error al actualizar la contraseña. Intenta de nuevo.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Restablecer Contraseña - Plenura</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<a href="/" class="inline-block">
				<span class="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
					Plenura
				</span>
			</a>
		</div>

		<div class="bg-white rounded-2xl shadow-xl p-8">
			{#if isChecking}
				<div class="text-center py-8">
					<svg class="animate-spin h-8 w-8 mx-auto text-primary-600 mb-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<p class="text-gray-600">Verificando enlace...</p>
				</div>
			{:else if success}
				<div class="text-center py-8">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 class="text-xl font-bold text-gray-900 mb-2">Contraseña actualizada</h2>
					<p class="text-gray-600 mb-4">Tu contraseña ha sido cambiada exitosamente.</p>
					<p class="text-sm text-gray-500">Redirigiendo al inicio de sesión...</p>
				</div>
			{:else if !isValidSession}
				<div class="text-center py-8">
					<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<h2 class="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h2>
					<p class="text-gray-600 mb-6">{error}</p>
					<a
						href="/forgot-password"
						class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
					>
						Solicitar nuevo enlace
					</a>
				</div>
			{:else}
				<div class="space-y-6">
					<div class="text-center">
						<h1 class="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
						<p class="text-gray-500 mt-2">
							Ingresa tu nueva contraseña
						</p>
					</div>

					{#if error}
						<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
							{error}
						</div>
					{/if}

					<form onsubmit={handleSubmit} class="space-y-4">
						<div>
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
								Nueva contraseña
							</label>
							<input
								type="password"
								id="password"
								bind:value={password}
								required
								minlength="8"
								disabled={loading}
								placeholder="Mínimo 8 caracteres"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">
								Confirmar contraseña
							</label>
							<input
								type="password"
								id="confirmPassword"
								bind:value={confirmPassword}
								required
								disabled={loading}
								placeholder="Repite tu contraseña"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
						>
							{#if loading}
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Guardando...
							{:else}
								Guardar nueva contraseña
							{/if}
						</button>
					</form>
				</div>
			{/if}
		</div>

		<p class="text-center text-gray-500 text-sm mt-6">
			<a href="/login" class="text-primary-600 hover:text-primary-700">
				Volver al inicio de sesión
			</a>
		</p>
	</div>
</div>
