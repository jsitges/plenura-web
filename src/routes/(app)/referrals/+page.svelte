<script lang="ts">
	let { data } = $props();

	let copied = $state(false);
	let shareUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}/register?ref=${data.referralCode?.code}`
			: ''
	);

	async function copyCode() {
		if (!data.referralCode?.code) return;

		try {
			await navigator.clipboard.writeText(data.referralCode.code);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function copyLink() {
		if (!shareUrl) return;

		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function shareNative() {
		if (!navigator.share) return;

		try {
			await navigator.share({
				title: 'Únete a Plenura',
				text: `Te invito a Plenura, la mejor plataforma de bienestar. Usa mi código ${data.referralCode?.code} y obtén beneficios.`,
				url: shareUrl
			});
		} catch (err) {
			// User cancelled or error
		}
	}

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
</script>

<svelte:head>
	<title>Referidos - Plenura</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Programa de Referidos</h1>
		<p class="text-gray-500">Invita amigos y gana $100 MXN por cada uno</p>
	</div>

	<!-- Referral Code Card -->
	<div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
		<div class="text-center mb-6">
			<p class="text-primary-100 mb-2">Tu código de referido</p>
			<div class="flex items-center justify-center gap-3">
				<span class="text-4xl font-bold tracking-widest">
					{data.referralCode?.code ?? '--------'}
				</span>
				<button
					type="button"
					onclick={copyCode}
					class="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
					title="Copiar código"
				>
					{#if copied}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<div class="flex gap-3">
			<button
				type="button"
				onclick={copyLink}
				class="flex-1 py-3 bg-white text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors"
			>
				Copiar enlace
			</button>
			{#if typeof navigator !== 'undefined' && navigator.share}
				<button
					type="button"
					onclick={shareNative}
					class="flex-1 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
				>
					Compartir
				</button>
			{/if}
		</div>
	</div>

	<!-- Stats -->
	{#if data.stats}
		<div class="grid grid-cols-3 gap-4">
			<div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
				<p class="text-3xl font-bold text-gray-900">{data.stats.totalReferrals}</p>
				<p class="text-sm text-gray-500">Invitados</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
				<p class="text-3xl font-bold text-green-600">{data.stats.completedReferrals}</p>
				<p class="text-sm text-gray-500">Completados</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
				<p class="text-3xl font-bold text-primary-600">
					{formatPrice(data.stats.totalEarnings)}
				</p>
				<p class="text-sm text-gray-500">Ganado</p>
			</div>
		</div>
	{/if}

	<!-- How it works -->
	<div class="bg-white rounded-xl border border-gray-100 p-6">
		<h2 class="font-semibold text-gray-900 mb-4">¿Cómo funciona?</h2>
		<div class="space-y-4">
			<div class="flex gap-4">
				<div
					class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
				>
					<span class="text-primary-600 font-bold">1</span>
				</div>
				<div>
					<p class="font-medium text-gray-900">Comparte tu código</p>
					<p class="text-sm text-gray-500">Envía tu código o enlace a amigos y familiares</p>
				</div>
			</div>
			<div class="flex gap-4">
				<div
					class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
				>
					<span class="text-primary-600 font-bold">2</span>
				</div>
				<div>
					<p class="font-medium text-gray-900">Ellos se registran</p>
					<p class="text-sm text-gray-500">Tu amigo usa tu código al crear su cuenta</p>
				</div>
			</div>
			<div class="flex gap-4">
				<div
					class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
				>
					<span class="text-primary-600 font-bold">3</span>
				</div>
				<div>
					<p class="font-medium text-gray-900">Completan su primera cita</p>
					<p class="text-sm text-gray-500">Cuando tu referido complete su primera sesión</p>
				</div>
			</div>
			<div class="flex gap-4">
				<div
					class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"
				>
					<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div>
					<p class="font-medium text-gray-900">Ganas $100 MXN</p>
					<p class="text-sm text-gray-500">El dinero se agrega a tu saldo automáticamente</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Referral history -->
	{#if data.referrals.length > 0}
		<div class="bg-white rounded-xl border border-gray-100">
			<div class="p-4 border-b border-gray-100">
				<h2 class="font-semibold text-gray-900">Historial de referidos</h2>
			</div>
			<div class="divide-y divide-gray-100">
				{#each data.referrals as referral}
					<div class="p-4 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
							>
								<span class="text-gray-500 text-sm">
									{(referral.referred_user?.full_name ?? '?')[0].toUpperCase()}
								</span>
							</div>
							<div>
								<p class="font-medium text-gray-900">
									{referral.referred_user?.full_name ?? 'Usuario'}
								</p>
								<p class="text-sm text-gray-500">{formatDate(referral.created_at)}</p>
							</div>
						</div>
						<div class="text-right">
							{#if referral.status === 'completed'}
								<span class="text-green-600 font-medium">
									+{formatPrice(referral.reward_paid_cents ?? 0)}
								</span>
							{:else if referral.status === 'pending'}
								<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
									Pendiente
								</span>
							{:else}
								<span class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
									Cancelado
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-100 p-8 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</div>
			<h3 class="font-medium text-gray-900 mb-2">Aún no tienes referidos</h3>
			<p class="text-gray-500 text-sm">Comparte tu código y empieza a ganar</p>
		</div>
	{/if}
</div>
