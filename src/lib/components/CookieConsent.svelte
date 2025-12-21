<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	const COOKIE_CONSENT_KEY = 'plenura_cookie_consent';
	const CONSENT_VERSION = '1.0';

	type ConsentLevel = 'all' | 'necessary' | 'none';

	interface ConsentData {
		level: ConsentLevel;
		version: string;
		timestamp: string;
	}

	let showBanner = $state(false);
	let showDetails = $state(false);

	function getStoredConsent(): ConsentData | null {
		if (!browser) return null;
		const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
		if (!stored) return null;
		try {
			const data = JSON.parse(stored) as ConsentData;
			// Check if consent is still valid (same version)
			if (data.version !== CONSENT_VERSION) return null;
			return data;
		} catch {
			return null;
		}
	}

	function saveConsent(level: ConsentLevel) {
		if (!browser) return;
		const data: ConsentData = {
			level,
			version: CONSENT_VERSION,
			timestamp: new Date().toISOString()
		};
		localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
		showBanner = false;

		// Emit custom event for analytics to pick up
		window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: data }));
	}

	function acceptAll() {
		saveConsent('all');
	}

	function acceptNecessary() {
		saveConsent('necessary');
	}

	function declineAll() {
		saveConsent('none');
	}

	onMount(() => {
		const consent = getStoredConsent();
		if (!consent) {
			// Small delay to avoid layout shift
			setTimeout(() => {
				showBanner = true;
			}, 1000);
		}
	});
</script>

{#if showBanner}
	<div class="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
		<div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
			<div class="p-4 sm:p-6">
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
						<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold text-gray-900 mb-1">
							Tu privacidad es importante
						</h3>
						<p class="text-gray-600 text-sm">
							Usamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido.
							Puedes aceptar todas las cookies o personalizar tus preferencias.
						</p>

						{#if showDetails}
							<div class="mt-4 space-y-3 text-sm">
								<div class="bg-gray-50 rounded-lg p-3">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-medium text-gray-900">Cookies necesarias</p>
											<p class="text-gray-500 text-xs">Requeridas para el funcionamiento del sitio</p>
										</div>
										<span class="text-xs text-primary-600 font-medium">Siempre activas</span>
									</div>
								</div>
								<div class="bg-gray-50 rounded-lg p-3">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-medium text-gray-900">Cookies analíticas</p>
											<p class="text-gray-500 text-xs">Nos ayudan a entender cómo usas el sitio</p>
										</div>
										<span class="text-xs text-gray-500">PostHog, Sentry</span>
									</div>
								</div>
								<div class="bg-gray-50 rounded-lg p-3">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-medium text-gray-900">Cookies de marketing</p>
											<p class="text-gray-500 text-xs">Personalizan anuncios y contenido</p>
										</div>
										<span class="text-xs text-gray-500">Opcional</span>
									</div>
								</div>
								<p class="text-xs text-gray-500">
									Para más información, consulta nuestra
									<a href="/privacy" class="text-primary-600 hover:underline">Política de Privacidad</a>.
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<button
						type="button"
						onclick={() => showDetails = !showDetails}
						class="text-sm text-gray-600 hover:text-gray-900 underline"
					>
						{showDetails ? 'Ocultar detalles' : 'Ver detalles'}
					</button>
					<a href="/privacy" class="text-sm text-primary-600 hover:text-primary-700">
						Aviso de Privacidad
					</a>
				</div>
				<div class="flex items-center gap-3 w-full sm:w-auto">
					<button
						type="button"
						onclick={acceptNecessary}
						class="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
					>
						Solo necesarias
					</button>
					<button
						type="button"
						onclick={acceptAll}
						class="flex-1 sm:flex-none px-6 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
					>
						Aceptar todas
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
