<script lang="ts">
	import { page } from '$app/stores';

	const email = $page.url.searchParams.get('email') || '';
</script>

<svelte:head>
	<title>Confirma tu correo - Plenura</title>
</svelte:head>

<div class="text-center">
	<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
		<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
		</svg>
	</div>

	<h1 class="text-2xl font-bold text-gray-900 mb-2">
		Revisa tu correo
	</h1>

	<p class="text-gray-600 mb-6">
		Te enviamos un enlace de confirmación a:
	</p>

	{#if email}
		<p class="font-medium text-gray-900 bg-gray-100 px-4 py-2 rounded-lg inline-block mb-6">
			{email}
		</p>
	{/if}

	<div class="space-y-4 text-sm text-gray-500">
		<p>
			Haz clic en el enlace del correo para activar tu cuenta.
		</p>
		<p>
			¿No lo encuentras? Revisa tu carpeta de spam.
		</p>
	</div>

	<div class="mt-8 pt-6 border-t border-gray-200">
		<a
			href="/login"
			class="text-primary-600 hover:text-primary-700 font-medium"
		>
			Ir a iniciar sesión
		</a>
	</div>
</div>
