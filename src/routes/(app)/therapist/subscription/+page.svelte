<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const formatPrice = (cents: number) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);

	let upgrading = $state<string | null>(null);
</script>

<svelte:head>
	<title>Mi Suscripción - Plenura</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-900 mb-2">Mi Suscripción</h1>
	<p class="text-gray-600 mb-8">
		Elige el plan que mejor se adapte a tu práctica.
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
	<div class="bg-white rounded-xl border border-gray-100 p-6 mb-8">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<p class="text-sm text-gray-500 mb-1">Tu plan actual</p>
				<h2 class="text-2xl font-bold text-gray-900 capitalize">{data.currentTier}</h2>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-500 mb-1">Reservas este mes</p>
				<p class="text-2xl font-bold text-gray-900">
					{data.monthlyBookingCount}
					{#if data.currentTier === 'free'}
						<span class="text-sm font-normal text-gray-500">/ 5</span>
					{/if}
				</p>
			</div>
		</div>
	</div>

	<!-- Plans Grid -->
	<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each data.tiers as tier}
			{@const isCurrentTier = data.currentTier === tier.id}
			<div class="bg-white rounded-xl border-2 {tier.popular ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100'} p-6 relative flex flex-col">
				{#if tier.popular}
					<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
						Más popular
					</div>
				{/if}

				<h3 class="text-xl font-bold text-gray-900">{tier.name}</h3>
				
				<div class="mt-4 mb-2">
					{#if tier.priceCents === 0}
						<span class="text-3xl font-bold text-gray-900">Gratis</span>
					{:else}
						<span class="text-3xl font-bold text-gray-900">{formatPrice(tier.priceCents)}</span>
						<span class="text-gray-500">/mes</span>
					{/if}
				</div>

				<p class="text-sm text-primary-600 font-medium mb-4">
					{tier.commission}% de comisión
				</p>

				<ul class="space-y-2 flex-1 mb-6">
					{#each tier.features as feature}
						<li class="flex items-start gap-2 text-sm text-gray-600">
							<svg class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							{feature}
						</li>
					{/each}
				</ul>

				<form method="POST" action="?/upgrade" use:enhance={() => {
					upgrading = tier.id;
					return async ({ update }) => {
						await update();
						upgrading = null;
					};
				}}>
					<input type="hidden" name="tierId" value={tier.id} />
					<button
						type="submit"
						disabled={isCurrentTier || upgrading !== null}
						class="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {isCurrentTier ? 'bg-gray-100 text-gray-500' : tier.popular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}"
					>
						{#if upgrading === tier.id}
							<span class="flex items-center justify-center gap-2">
								<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Procesando...
							</span>
						{:else if isCurrentTier}
							Plan actual
						{:else if tier.priceCents === 0}
							Cambiar a Gratis
						{:else}
							Actualizar
						{/if}
					</button>
				</form>
			</div>
		{/each}
	</div>

	<!-- FAQ -->
	<div class="mt-12 bg-white rounded-xl border border-gray-100 p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Preguntas frecuentes</h2>
		<div class="space-y-4">
			<div>
				<h3 class="font-medium text-gray-900">¿Qué incluye la comisión?</h3>
				<p class="text-sm text-gray-600 mt-1">La comisión cubre el procesamiento de pagos, hosting, soporte y todas las funcionalidades de la plataforma.</p>
			</div>
			<div>
				<h3 class="font-medium text-gray-900">¿Puedo cambiar de plan en cualquier momento?</h3>
				<p class="text-sm text-gray-600 mt-1">Sí, puedes subir o bajar de plan cuando quieras. Los cambios se aplican inmediatamente.</p>
			</div>
			<div>
				<h3 class="font-medium text-gray-900">¿Qué pasa si supero el límite de reservas en el plan gratuito?</h3>
				<p class="text-sm text-gray-600 mt-1">No podrás aceptar nuevas reservas hasta el siguiente mes o hasta que actualices a un plan con reservas ilimitadas.</p>
			</div>
		</div>
	</div>

	<p class="text-center text-sm text-gray-500 mt-6">
		¿Necesitas ayuda? <a href="mailto:soporte@plenura.com" class="text-primary-600 hover:underline">Contáctanos</a>
	</p>
</div>
