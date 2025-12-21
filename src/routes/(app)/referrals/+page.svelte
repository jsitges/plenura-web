<script lang="ts">
	let { data } = $props();

	const formatPrice = (cents: number) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

	let copied = $state(false);

	function copyCode() {
		if (data.referralCode?.code) {
			navigator.clipboard.writeText(data.referralCode.code);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function shareCode() {
		if (data.referralCode?.code) {
			const text = `Usa mi código ${data.referralCode.code} para registrarte en Plenura y recibe un descuento en tu primera reserva. https://plenura.redbroomsoftware.com/register?ref=${data.referralCode.code}`;
			if (navigator.share) {
				navigator.share({ text });
			} else {
				navigator.clipboard.writeText(text);
				copied = true;
				setTimeout(() => (copied = false), 2000);
			}
		}
	}
</script>

<svelte:head>
	<title>Referidos - Plenura</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-900 mb-2">Programa de Referidos</h1>
	<p class="text-gray-600 mb-8">
		Invita amigos y gana $100 MXN por cada uno que complete su primera reserva.
	</p>

	<!-- Referral Code Card -->
	<div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white mb-8">
		<div class="flex flex-col md:flex-row items-center justify-between gap-6">
			<div>
				<p class="text-primary-100 text-sm mb-2">Tu código de referido</p>
				<div class="flex items-center gap-3">
					<span class="text-3xl font-mono font-bold tracking-wider">
						{data.referralCode?.code ?? '---'}
					</span>
					<button
						onclick={copyCode}
						class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
						aria-label="Copiar código"
					>
						{#if copied}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
			<button
				onclick={shareCode}
				class="flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
				</svg>
				Compartir
			</button>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
			<p class="text-3xl font-bold text-gray-900">{data.stats?.totalReferrals ?? 0}</p>
			<p class="text-sm text-gray-500">Total referidos</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
			<p class="text-3xl font-bold text-amber-600">{data.stats?.pendingReferrals ?? 0}</p>
			<p class="text-sm text-gray-500">Pendientes</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
			<p class="text-3xl font-bold text-green-600">{data.stats?.completedReferrals ?? 0}</p>
			<p class="text-sm text-gray-500">Completados</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
			<p class="text-3xl font-bold text-primary-600">{formatPrice(data.stats?.totalEarnings ?? 0)}</p>
			<p class="text-sm text-gray-500">Total ganado</p>
		</div>
	</div>

	<!-- How it works -->
	<div class="bg-white rounded-xl border border-gray-100 p-6 mb-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Cómo funciona</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
					<span class="text-primary-600 font-bold">1</span>
				</div>
				<div>
					<h3 class="font-medium text-gray-900">Comparte tu código</h3>
					<p class="text-sm text-gray-500">Envía tu código a amigos y familiares interesados en servicios de bienestar.</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
					<span class="text-primary-600 font-bold">2</span>
				</div>
				<div>
					<h3 class="font-medium text-gray-900">Ellos se registran</h3>
					<p class="text-sm text-gray-500">Tu amigo se registra usando tu código y hace su primera reserva.</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
					<span class="text-green-600 font-bold">$</span>
				</div>
				<div>
					<h3 class="font-medium text-gray-900">Ganas $100 MXN</h3>
					<p class="text-sm text-gray-500">Una vez completada su primera reserva, recibes tu recompensa.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Referrals -->
	{#if data.recentReferrals && data.recentReferrals.length > 0}
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="p-4 border-b border-gray-100">
				<h2 class="font-semibold text-gray-900">Referidos recientes</h2>
			</div>
			<div class="divide-y divide-gray-100">
				{#each data.recentReferrals as referral}
					{@const r = referral as { id: string; status: string; created_at: string; converted_at: string | null; reward_paid_cents: number; users: { full_name: string } }}
					<div class="p-4 flex items-center justify-between">
						<div>
							<p class="font-medium text-gray-900">{r.users?.full_name ?? 'Usuario'}</p>
							<p class="text-sm text-gray-500">Registrado el {formatDate(r.created_at)}</p>
						</div>
						<div class="text-right">
							{#if r.status === 'completed'}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
									Completado
								</span>
								<p class="text-sm text-green-600 mt-1">+{formatPrice(r.reward_paid_cents)}</p>
							{:else}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
									Pendiente
								</span>
								<p class="text-xs text-gray-500 mt-1">Esperando primera reserva</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="bg-gray-50 rounded-xl p-8 text-center">
			<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Aún no tienes referidos</h3>
			<p class="text-gray-500">Comparte tu código y empieza a ganar recompensas.</p>
		</div>
	{/if}
</div>
