<script lang="ts">
	let { data } = $props();

	const { summary, recentEarnings, subscriptionTier } = data;

	// Commission rates by tier
	const commissionRates: Record<string, number> = {
		free: 10,
		pro: 5,
		business: 3,
		enterprise: 0
	};

	const currentCommission = commissionRates[subscriptionTier] ?? 10;

	function formatPrice(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(cents / 100);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getStatusLabel(status: string): string {
		return status === 'completed' ? 'Pagado' : 'Pendiente';
	}

	function getStatusColor(status: string): string {
		return status === 'completed'
			? 'bg-green-100 text-green-700'
			: 'bg-amber-100 text-amber-700';
	}

	// Calculate growth percentage
	const growth =
		summary.lastMonthEarningsCents > 0
			? Math.round(
					((summary.thisMonthEarningsCents - summary.lastMonthEarningsCents) /
						summary.lastMonthEarningsCents) *
						100
				)
			: summary.thisMonthEarningsCents > 0
				? 100
				: 0;
</script>

<svelte:head>
	<title>Mis Ganancias - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Mis Ganancias</h1>
		<a
			href="/therapist/subscription"
			class="text-sm text-primary-600 hover:text-primary-700 font-medium"
		>
			Plan {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} ({currentCommission}%
			comisión)
		</a>
	</div>

	<!-- Summary Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Total Earnings -->
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<span class="text-sm text-gray-600">Total Ganado</span>
			</div>
			<p class="text-2xl font-bold text-gray-900">{formatPrice(summary.totalEarningsCents)}</p>
			<p class="text-sm text-gray-500 mt-1">{summary.completedBookings} servicios completados</p>
		</div>

		<!-- This Month -->
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
					<svg
						class="w-5 h-5 text-primary-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<span class="text-sm text-gray-600">Este Mes</span>
			</div>
			<p class="text-2xl font-bold text-gray-900">{formatPrice(summary.thisMonthEarningsCents)}</p>
			{#if growth !== 0}
				<p class="text-sm mt-1 {growth >= 0 ? 'text-green-600' : 'text-red-600'}">
					{growth >= 0 ? '+' : ''}{growth}% vs mes anterior
				</p>
			{:else}
				<p class="text-sm text-gray-500 mt-1">Sin cambios</p>
			{/if}
		</div>

		<!-- Pending -->
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<span class="text-sm text-gray-600">En Escrow</span>
			</div>
			<p class="text-2xl font-bold text-gray-900">{formatPrice(summary.pendingPayoutCents)}</p>
			<p class="text-sm text-gray-500 mt-1">Pendiente de completar</p>
		</div>

		<!-- Commission Saved -->
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
					<svg
						class="w-5 h-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				</div>
				<span class="text-sm text-gray-600">Tu Comisión</span>
			</div>
			<p class="text-2xl font-bold text-gray-900">{currentCommission}%</p>
			{#if subscriptionTier !== 'enterprise'}
				<a href="/therapist/subscription" class="text-sm text-primary-600 hover:underline mt-1 block">
					Reduce tu comisión
				</a>
			{:else}
				<p class="text-sm text-green-600 mt-1">Mejor tarifa disponible</p>
			{/if}
		</div>
	</div>

	<!-- Recent Transactions -->
	<div class="bg-white rounded-xl border border-gray-100">
		<div class="p-6 border-b border-gray-100">
			<h2 class="text-lg font-semibold text-gray-900">Historial de Ganancias</h2>
		</div>

		{#if recentEarnings.length > 0}
			<div class="divide-y divide-gray-100">
				{#each recentEarnings as earning}
					<div class="p-4 sm:p-6 flex items-center justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3">
								<p class="font-medium text-gray-900 truncate">
									{earning.client?.full_name ?? 'Cliente'}
								</p>
								<span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(earning.status)}">
									{getStatusLabel(earning.status)}
								</span>
							</div>
							<p class="text-sm text-gray-600 mt-0.5">
								{earning.service?.name ?? 'Servicio'} - {formatDate(earning.scheduled_at)}
							</p>
						</div>

						<div class="text-right">
							<p class="font-semibold text-gray-900">
								{formatPrice(earning.therapist_payout_cents)}
							</p>
							{#if earning.commission_cents > 0}
								<p class="text-xs text-gray-500">
									-{formatPrice(earning.commission_cents)} comisión
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-12 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">Sin ganancias aún</h3>
				<p class="text-gray-500">Completa servicios para ver tus ganancias aquí</p>
			</div>
		{/if}
	</div>

	<!-- Commission Breakdown Info -->
	<div class="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6">
		<h3 class="font-semibold text-gray-900 mb-3">Cómo funcionan las comisiones</h3>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
			<div class="bg-white/60 rounded-lg p-3">
				<p class="font-medium text-gray-900">Free</p>
				<p class="text-gray-600">10% comisión</p>
			</div>
			<div class="bg-white/60 rounded-lg p-3">
				<p class="font-medium text-gray-900">Pro - $299/mes</p>
				<p class="text-gray-600">5% comisión</p>
			</div>
			<div class="bg-white/60 rounded-lg p-3">
				<p class="font-medium text-gray-900">Business - $699/mes</p>
				<p class="text-gray-600">3% comisión</p>
			</div>
			<div class="bg-white/60 rounded-lg p-3">
				<p class="font-medium text-gray-900">Enterprise - $1,299/mes</p>
				<p class="text-gray-600">0% comisión</p>
			</div>
		</div>
		<a href="/therapist/subscription" class="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
			Mejorar mi plan →
		</a>
	</div>
</div>
