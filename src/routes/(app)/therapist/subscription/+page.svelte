<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const { currentTier, expiresAt, tiers } = data;

	let upgrading = $state<string | null>(null);
	let cancelling = $state(false);

	const tierOrder = ['free', 'pro', 'business', 'enterprise'];

	function formatPrice(price: number): string {
		if (price === 0) return 'Gratis';
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(price);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getTierColor(tier: string): string {
		switch (tier) {
			case 'free':
				return 'border-gray-200';
			case 'pro':
				return 'border-primary-500 ring-2 ring-primary-100';
			case 'business':
				return 'border-purple-500 ring-2 ring-purple-100';
			case 'enterprise':
				return 'border-amber-500 ring-2 ring-amber-100';
			default:
				return 'border-gray-200';
		}
	}

	function isUpgrade(tier: string): boolean {
		return tierOrder.indexOf(tier) > tierOrder.indexOf(currentTier);
	}

	function isDowngrade(tier: string): boolean {
		return tierOrder.indexOf(tier) < tierOrder.indexOf(currentTier);
	}
</script>

<svelte:head>
	<title>Mi Plan - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Mi Plan</h1>
		<p class="text-gray-600 mt-1">Elige el plan que mejor se adapte a tu práctica</p>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
			{form.error}
		</div>
	{/if}

	<!-- Current Plan Banner -->
	{#if currentTier !== 'free'}
		<div class="bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl p-6 text-white">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm opacity-90">Tu plan actual</p>
					<h2 class="text-2xl font-bold">{tiers[currentTier as keyof typeof tiers].name}</h2>
					{#if expiresAt}
						<p class="text-sm opacity-90 mt-1">Renueva el {formatDate(expiresAt)}</p>
					{/if}
				</div>
				<div class="text-right">
					<p class="text-3xl font-bold">
						{tiers[currentTier as keyof typeof tiers].commission}%
					</p>
					<p class="text-sm opacity-90">comisión</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Pricing Grid -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each Object.entries(tiers) as [tierId, tier]}
			<div
				class="bg-white rounded-xl border-2 p-6 relative {getTierColor(tierId)} {currentTier === tierId ? 'bg-gray-50' : ''}"
			>
				{#if tierId === 'pro'}
					<div
						class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full"
					>
						Popular
					</div>
				{/if}

				{#if currentTier === tierId}
					<div
						class="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full"
					>
						Actual
					</div>
				{/if}

				<div class="text-center mb-6">
					<h3 class="text-lg font-bold text-gray-900">{tier.name}</h3>
					<div class="mt-2">
						<span class="text-3xl font-bold text-gray-900">{formatPrice(tier.price)}</span>
						{#if tier.price > 0}
							<span class="text-gray-500">/mes</span>
						{/if}
					</div>
					<p class="mt-2 text-sm text-gray-600">{tier.commission}% comisión</p>
				</div>

				<ul class="space-y-3 mb-6">
					{#each tier.features as feature}
						<li class="flex items-start gap-2 text-sm">
							<svg
								class="w-5 h-5 text-green-500 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span class="text-gray-600">{feature}</span>
						</li>
					{/each}
				</ul>

				{#if currentTier === tierId}
					{#if tierId !== 'free'}
						<form
							method="POST"
							action="?/cancel"
							use:enhance={() => {
								cancelling = true;
								return async ({ update }) => {
									await update();
									cancelling = false;
								};
							}}
						>
							<button
								type="submit"
								disabled={cancelling}
								class="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
							>
								{cancelling ? 'Cancelando...' : 'Cancelar plan'}
							</button>
						</form>
					{:else}
						<div class="py-2 px-4 bg-gray-100 rounded-lg text-center text-gray-500 text-sm">
							Plan actual
						</div>
					{/if}
				{:else if isUpgrade(tierId)}
					<form
						method="POST"
						action="?/upgrade"
						use:enhance={() => {
							upgrading = tierId;
							return async ({ update }) => {
								await update();
								upgrading = null;
							};
						}}
					>
						<input type="hidden" name="tier" value={tierId} />
						<button
							type="submit"
							disabled={upgrading === tierId}
							class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm"
						>
							{upgrading === tierId ? 'Procesando...' : 'Mejorar plan'}
						</button>
					</form>
				{:else if isDowngrade(tierId)}
					<div class="py-2 px-4 bg-gray-100 rounded-lg text-center text-gray-400 text-sm">
						Plan inferior
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- FAQ -->
	<div class="bg-gray-50 rounded-xl p-6">
		<h3 class="font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h3>
		<div class="space-y-4 text-sm">
			<div>
				<p class="font-medium text-gray-900">¿Puedo cambiar de plan en cualquier momento?</p>
				<p class="text-gray-600 mt-1">
					Sí, puedes mejorar tu plan en cualquier momento. Los cambios se aplican inmediatamente.
				</p>
			</div>
			<div>
				<p class="font-medium text-gray-900">¿Qué pasa si cancelo mi suscripción?</p>
				<p class="text-gray-600 mt-1">
					Volverás al plan Free con 10% de comisión. Tus datos y clientes se mantienen.
				</p>
			</div>
			<div>
				<p class="font-medium text-gray-900">¿Cómo funciona la comisión?</p>
				<p class="text-gray-600 mt-1">
					La comisión se descuenta automáticamente de cada servicio completado antes de transferir
					tu pago.
				</p>
			</div>
		</div>
	</div>
</div>
