<script lang="ts">
	import { onMount } from 'svelte';

	let deferredPrompt: BeforeInstallPromptEvent | null = null;
	let showPrompt = $state(false);
	let isIOS = $state(false);
	let isStandalone = $state(false);

	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	onMount(() => {
		// Check if already installed
		isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as unknown as { standalone?: boolean }).standalone === true;

		if (isStandalone) return;

		// Check if iOS
		isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;

			// Check if user has dismissed before (within last 14 days)
			const dismissed = localStorage.getItem('pwa-install-dismissed');
			if (dismissed) {
				const dismissedDate = new Date(dismissed);
				const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
				if (daysSince < 14) return;
			}

			// Show prompt after a delay
			setTimeout(() => {
				showPrompt = true;
			}, 5000);
		});

		// Check if iOS and show custom prompt
		if (isIOS) {
			const dismissed = localStorage.getItem('pwa-install-dismissed');
			if (!dismissed) {
				setTimeout(() => {
					showPrompt = true;
				}, 8000);
			}
		}
	});

	async function handleInstall() {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			showPrompt = false;
		}

		deferredPrompt = null;
	}

	function handleDismiss() {
		showPrompt = false;
		localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
	}
</script>

{#if showPrompt && !isStandalone}
	<div class="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
		<div class="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
			<!-- Header -->
			<div class="bg-gradient-to-r from-[#4a7c59] to-[#3d6b4a] px-4 py-3 flex items-center justify-between">
				<div class="flex items-center gap-2 text-white">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
					<span class="font-medium">Instalar Plenura</span>
				</div>
				<button
					onclick={handleDismiss}
					class="text-white/80 hover:text-white transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-4">
				{#if isIOS}
					<p class="text-gray-600 text-sm mb-3">
						Para instalar Plenura en tu dispositivo:
					</p>
					<ol class="text-sm text-gray-600 space-y-2 mb-4">
						<li class="flex items-start gap-2">
							<span class="bg-[#4a7c59]/20 text-[#4a7c59] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
							<span>Toca el boton <strong>Compartir</strong> en Safari</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="bg-[#4a7c59]/20 text-[#4a7c59] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
							<span>Selecciona <strong>"Agregar a pantalla de inicio"</strong></span>
						</li>
					</ol>
					<button
						onclick={handleDismiss}
						class="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
					>
						Entendido
					</button>
				{:else}
					<p class="text-gray-600 text-sm mb-4">
						Instala Plenura para acceso rapido a tus citas, recordatorios y sesiones de terapia.
					</p>
					<div class="flex gap-2">
						<button
							onclick={handleInstall}
							class="flex-1 flex items-center justify-center gap-2 bg-[#4a7c59] hover:bg-[#3d6b4a] text-white py-2 px-4 rounded-lg font-medium transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Instalar
						</button>
						<button
							onclick={handleDismiss}
							class="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
						>
							Ahora no
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
