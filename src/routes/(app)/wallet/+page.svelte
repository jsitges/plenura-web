<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const formatPrice = (cents: number) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

	let depositAmount = $state('');
	let showDepositForm = $state(false);
	let loading = $state(false);

	const transactionTypeLabels: Record<string, string> = {
		deposit: 'Depósito',
		payment: 'Pago de sesión',
		referral_credit: 'Recompensa referido',
		promo_credit: 'Crédito promocional',
		refund: 'Reembolso'
	};

	const transactionTypeColors: Record<string, string> = {
		deposit: 'text-green-600',
		payment: 'text-red-600',
		referral_credit: 'text-primary-600',
		promo_credit: 'text-purple-600',
		refund: 'text-blue-600'
	};

	const quickAmounts = [100, 250, 500, 1000];
</script>

<svelte:head>
	<title>Mi Cartera - Plenura</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-900 mb-2">Mi Cartera</h1>
	<p class="text-gray-600 mb-8">
		Administra tu saldo para pagar sesiones de forma rápida.
	</p>

	<!-- Balance Card -->
	<div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white mb-8">
		<div class="flex flex-col md:flex-row items-center justify-between gap-6">
			<div>
				<p class="text-primary-100 text-sm mb-1">Saldo disponible</p>
				<p class="text-4xl font-bold">
					{formatPrice(data.wallet?.balanceCents ?? 0)}
				</p>
				{#if data.wallet?.referralCreditsCents && data.wallet.referralCreditsCents > 0}
					<p class="text-primary-200 text-sm mt-2">
						Incluye {formatPrice(data.wallet.referralCreditsCents)} en créditos de referidos
					</p>
				{/if}
			</div>
			<button
				onclick={() => (showDepositForm = !showDepositForm)}
				class="flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Agregar fondos
			</button>
		</div>
	</div>

	<!-- Deposit Form -->
	{#if showDepositForm}
		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Agregar fondos a tu cartera</h2>

			{#if form?.error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
					{form.message}
				</div>
			{/if}

			<form
				method="POST"
				action="?/deposit"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<div class="mb-4">
					<label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
						Monto a depositar
					</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
						<input
							type="number"
							id="amount"
							name="amount"
							bind:value={depositAmount}
							min="50"
							max="10000"
							step="1"
							placeholder="0.00"
							class="w-full pl-8 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							required
						/>
						<span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">MXN</span>
					</div>
					<p class="text-sm text-gray-500 mt-1">Mínimo $50, máximo $10,000</p>
				</div>

				<!-- Quick amounts -->
				<div class="flex flex-wrap gap-2 mb-6">
					{#each quickAmounts as amount}
						<button
							type="button"
							onclick={() => (depositAmount = String(amount))}
							class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors {depositAmount === String(amount) ? 'bg-primary-50 border-primary-500 text-primary-700' : ''}"
						>
							{formatPrice(amount * 100)}
						</button>
					{/each}
				</div>

				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => (showDepositForm = false)}
						class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading || !depositAmount}
						class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							<span class="inline-flex items-center gap-2">
								<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								Procesando...
							</span>
						{:else}
							Depositar {depositAmount ? formatPrice(parseFloat(depositAmount) * 100) : ''}
						{/if}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- How it works -->
	<div class="bg-primary-50 rounded-xl p-6 mb-8">
		<h3 class="font-semibold text-primary-900 mb-3">¿Cómo funciona?</h3>
		<ul class="space-y-2 text-primary-800 text-sm">
			<li class="flex items-start gap-2">
				<svg class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				Agrega fondos a tu cartera con tarjeta o transferencia
			</li>
			<li class="flex items-start gap-2">
				<svg class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				Paga tus sesiones al instante sin ingresar datos de pago
			</li>
			<li class="flex items-start gap-2">
				<svg class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				Gana créditos por referir amigos ($100 por cada referido)
			</li>
		</ul>
	</div>

	<!-- Transaction History -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200">
		<div class="p-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">Historial de movimientos</h2>
		</div>

		{#if data.transactions.length === 0}
			<div class="p-8 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<p class="text-gray-500">Aún no tienes movimientos</p>
				<p class="text-sm text-gray-400 mt-1">Agrega fondos para comenzar</p>
			</div>
		{:else}
			<div class="divide-y divide-gray-100">
				{#each data.transactions as transaction}
					<div class="p-4 flex items-center justify-between hover:bg-gray-50">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
								{#if transaction.type === 'deposit'}
									<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
								{:else if transaction.type === 'payment'}
									<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								{:else}
									<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								{/if}
							</div>
							<div>
								<p class="font-medium text-gray-900">
									{transactionTypeLabels[transaction.type] ?? transaction.type}
								</p>
								<p class="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
							</div>
						</div>
						<div class="text-right">
							<p class="font-semibold {transactionTypeColors[transaction.type] ?? 'text-gray-900'}">
								{transaction.amountCents >= 0 ? '+' : ''}{formatPrice(transaction.amountCents)}
							</p>
							<p class="text-xs text-gray-400 capitalize">{transaction.status}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Link to referrals -->
	<div class="mt-6 text-center">
		<a href="/referrals" class="text-primary-600 hover:text-primary-700 font-medium">
			Invita amigos y gana créditos &rarr;
		</a>
	</div>
</div>
