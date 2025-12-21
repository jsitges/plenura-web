<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const formatPrice = (cents: number) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

	let purchasing = $state<string | null>(null);

	const isFeaturedActive =
		data.therapist?.is_featured &&
		data.therapist?.featured_until &&
		new Date(data.therapist.featured_until) > new Date();
</script>

<div class="max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-900 mb-2">Destacar mi Perfil</h1>
	<p class="text-gray-600 mb-8">
		Aparece primero en los resultados de búsqueda y atrae más clientes.
	</p>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
			<div class="flex items-center gap-3">
				<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<p class="text-green-700">{form.message}</p>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
			<p class="text-red-700">{form.error}</p>
		</div>
	{/if}

	<!-- Current Status -->
	{#if isFeaturedActive}
		<div class="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-8">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-amber-900">Tu perfil está destacado</h3>
					<p class="text-amber-700">
						Activo hasta el {formatDate(data.therapist.featured_until)}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Benefits -->
	<div class="bg-white rounded-xl border border-gray-100 p-6 mb-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Beneficios de ser Destacado</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
					</svg>
				</div>
				<div>
					<h3 class="font-medium text-gray-900">Aparece primero</h3>
					<p class="text-sm text-gray-500">Tu perfil se muestra antes que otros en los resultados de búsqueda.</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
					</svg>
				</div>
				<div>
					<h3 class="font-medium text-gray-900">Insignia destacada</h3>
					<p class="text-sm text-gray-500">Una estrella dorada indica que eres un terapeuta destacado.</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
					</svg>
				</div>
				<div>
					<h3 class="font-medium text-gray-900">Más visibilidad</h3>
					<p class="text-sm text-gray-500">Hasta 3x más visitas a tu perfil y más reservas.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Packages -->
	<h2 class="text-lg font-semibold text-gray-900 mb-4">Elige tu plan</h2>
	<div class="grid md:grid-cols-3 gap-4">
		{#each data.packages as pkg}
			<div class="bg-white rounded-xl border-2 {pkg.id === 'month' ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100'} p-6 relative">
				{#if pkg.id === 'month'}
					<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
						Más popular
					</div>
				{/if}
				{#if pkg.savings}
					<div class="absolute top-4 right-4 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
						-{pkg.savings}%
					</div>
				{/if}

				<h3 class="text-xl font-bold text-gray-900">{pkg.name}</h3>
				<div class="mt-4">
					<span class="text-3xl font-bold text-gray-900">{formatPrice(pkg.priceCents)}</span>
				</div>
				<p class="text-sm text-gray-500 mt-2">{pkg.days} días destacado</p>

				<form method="POST" action="?/purchase" use:enhance={() => {
					purchasing = pkg.id;
					return async ({ update }) => {
						await update();
						purchasing = null;
					};
				}}>
					<input type="hidden" name="packageId" value={pkg.id} />
					<button
						type="submit"
						disabled={purchasing !== null}
						class="w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 {pkg.id === 'month' ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}"
					>
						{#if purchasing === pkg.id}
							<span class="flex items-center justify-center gap-2">
								<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Procesando...
							</span>
						{:else}
							{isFeaturedActive ? 'Extender' : 'Comprar'}
						{/if}
					</button>
				</form>
			</div>
		{/each}
	</div>

	<p class="text-center text-sm text-gray-500 mt-6">
		El pago se procesa de forma segura. Puedes cancelar en cualquier momento.
	</p>
</div>
