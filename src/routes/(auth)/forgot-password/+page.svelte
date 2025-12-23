<script lang="ts">
	import { createClient } from '$lib/supabase/client';

	let email = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	const supabase = createClient();

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!email) return;

		error = null;
		loading = true;
		success = false;

		try {
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`
			});

			if (resetError) {
				error = resetError.message;
				return;
			}

			success = true;
		} catch (err) {
			error = 'Error al enviar el correo. Intenta de nuevo.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Recuperar Contrasena - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-gray-900">Recuperar Contrasena</h1>
		<p class="text-gray-500 mt-2">
			Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena
		</p>
	</div>

	{#if success}
		<div class="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
			<svg class="w-12 h-12 mx-auto mb-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<h2 class="text-lg font-semibold text-green-800 mb-2">Correo enviado</h2>
			<p class="text-green-700 text-sm mb-4">
				Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contrasena.
			</p>
			<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">
				Volver a iniciar sesion
			</a>
		</div>
	{:else}
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
					Correo electronico
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					disabled={loading}
					placeholder="tu@email.com"
					class="input-wellness"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full btn-primary-gradient py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
			>
				{#if loading}
					<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Enviando...
				{:else}
					Enviar enlace de recuperacion
				{/if}
			</button>
		</form>

		<div class="text-center">
			<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Volver a iniciar sesion
			</a>
		</div>
	{/if}
</div>
