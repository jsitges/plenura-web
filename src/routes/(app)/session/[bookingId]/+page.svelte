<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { data, form } = $props();

	// Session state
	let sessionState = $state<'pre-session' | 'joining' | 'in-session' | 'ended'>('pre-session');
	let jitsiApi = $state<any>(null);
	let sessionConfig = $state<{
		roomName: string;
		fullRoomName: string;
		jwt: string;
		domain: string;
		displayName: string;
		isModerator: boolean;
		scheduledEnd: string;
	} | null>(null);

	// UI state
	let showNotes = $state(false);
	let notes = $state('');
	let savingNotes = $state(false);
	let countdown = $state('');
	let sessionDuration = $state(0);
	let durationInterval: ReturnType<typeof setInterval>;

	// Time calculations
	const scheduledStart = new Date(data.booking.scheduledAt);
	const scheduledEnd = new Date(data.booking.scheduledEndAt);
	const joinWindowStart = new Date(scheduledStart.getTime() - 10 * 60 * 1000); // 10 min before

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('es-MX', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	function updateCountdown() {
		const now = new Date();
		const diff = joinWindowStart.getTime() - now.getTime();

		if (diff <= 0) {
			countdown = '';
			return;
		}

		const minutes = Math.floor(diff / 60000);
		const seconds = Math.floor((diff % 60000) / 1000);
		countdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function canJoinNow(): boolean {
		const now = new Date();
		return now >= joinWindowStart;
	}

	// Load Jitsi External API
	async function loadJitsiScript(): Promise<void> {
		if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI) {
			return;
		}

		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://8x8.vc/external_api.js';
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load Jitsi script'));
			document.head.appendChild(script);
		});
	}

	// Initialize Jitsi Meet
	async function initJitsi() {
		if (!sessionConfig || !browser) return;

		try {
			await loadJitsiScript();

			const container = document.getElementById('jitsi-container');
			if (!container) return;

			const options = {
				roomName: sessionConfig.fullRoomName,
				jwt: sessionConfig.jwt,
				parentNode: container,
				width: '100%',
				height: '100%',
				configOverwrite: {
					startWithAudioMuted: false,
					startWithVideoMuted: false,
					disableDeepLinking: true,
					prejoinPageEnabled: true,
					disableInviteFunctions: true,
					enableClosePage: false,
					enableWelcomePage: false,
					hideConferenceSubject: false,
					hideConferenceTimer: false,
					toolbarButtons: [
						'microphone',
						'camera',
						'desktop',
						'fullscreen',
						'chat',
						'settings',
						'videoquality',
						'tileview'
					]
				},
				interfaceConfigOverwrite: {
					SHOW_JITSI_WATERMARK: false,
					SHOW_WATERMARK_FOR_GUESTS: false,
					SHOW_BRAND_WATERMARK: false,
					SHOW_POWERED_BY: false,
					DEFAULT_BACKGROUND: '#1a1a2e',
					TOOLBAR_BUTTONS: [
						'microphone',
						'camera',
						'desktop',
						'fullscreen',
						'chat',
						'settings',
						'videoquality',
						'tileview'
					],
					MOBILE_APP_PROMO: false
				},
				userInfo: {
					displayName: sessionConfig.displayName
				}
			};

			jitsiApi = new (window as any).JitsiMeetExternalAPI(sessionConfig.domain, options);

			// Event listeners
			jitsiApi.addListener('readyToClose', handleSessionEnd);
			jitsiApi.addListener('participantJoined', handleParticipantJoined);
			jitsiApi.addListener('participantLeft', handleParticipantLeft);

			// Start duration timer
			durationInterval = setInterval(() => {
				sessionDuration++;
			}, 1000);

		} catch (err) {
			console.error('Error initializing Jitsi:', err);
			sessionState = 'pre-session';
		}
	}

	function handleParticipantJoined(event: any) {
		console.log('Participant joined:', event);
	}

	function handleParticipantLeft(event: any) {
		console.log('Participant left:', event);
	}

	function handleSessionEnd() {
		if (jitsiApi) {
			jitsiApi.dispose();
			jitsiApi = null;
		}
		if (durationInterval) {
			clearInterval(durationInterval);
		}
		sessionState = 'ended';
		if (data.isTherapist) {
			showNotes = true;
		}
	}

	// Watch for session config changes
	$effect(() => {
		if (form?.success && form?.session) {
			sessionConfig = form.session;
			sessionState = 'in-session';
		}
		if (form?.success && form?.ended) {
			handleSessionEnd();
		}
		if (form?.success && form?.left) {
			sessionState = 'ended';
		}
	});

	$effect(() => {
		if (sessionState === 'in-session' && sessionConfig) {
			initJitsi();
		}
	});

	onMount(() => {
		// Update countdown every second
		const countdownInterval = setInterval(updateCountdown, 1000);
		updateCountdown();

		return () => {
			clearInterval(countdownInterval);
			if (durationInterval) {
				clearInterval(durationInterval);
			}
			if (jitsiApi) {
				jitsiApi.dispose();
			}
		};
	});

	onDestroy(() => {
		if (jitsiApi) {
			jitsiApi.dispose();
		}
		if (durationInterval) {
			clearInterval(durationInterval);
		}
	});
</script>

<svelte:head>
	<title>Sesión de Video - Plenura</title>
</svelte:head>

{#if sessionState === 'pre-session'}
	<!-- Pre-session waiting room -->
	<div class="max-w-2xl mx-auto space-y-6">
		<!-- Header -->
		<div class="text-center space-y-2">
			<div class="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
				Sesión de Video
			</div>
			<h1 class="text-2xl font-bold text-gray-900">
				{data.booking.serviceName}
			</h1>
		</div>

		<!-- Error Message -->
		{#if form?.error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
				{form.error}
			</div>
		{/if}

		<!-- Session Info Card -->
		<div class="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
			<!-- Other participant -->
			<div class="flex items-center gap-4">
				<div class="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
					{#if data.otherParticipant.avatarUrl}
						<img
							src={data.otherParticipant.avatarUrl}
							alt=""
							class="w-full h-full object-cover"
						/>
					{:else}
						<span class="text-2xl text-primary-600 font-bold">
							{data.otherParticipant.name[0].toUpperCase()}
						</span>
					{/if}
				</div>
				<div>
					<p class="text-sm text-gray-500 capitalize">Tu {data.otherParticipant.role}</p>
					<h3 class="text-lg font-semibold text-gray-900">
						{data.otherParticipant.name}
					</h3>
				</div>
			</div>

			<hr />

			<!-- Session time -->
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<span class="text-gray-700">{formatDate(data.booking.scheduledAt)}</span>
				</div>
				<div class="flex items-center gap-3">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span class="text-gray-700">
						{formatTime(data.booking.scheduledAt)} - {formatTime(data.booking.scheduledEndAt)}
					</span>
				</div>
			</div>

			<!-- Countdown or Join -->
			{#if !canJoinNow() && countdown}
				<div class="bg-amber-50 rounded-lg p-4 text-center">
					<p class="text-amber-800 text-sm mb-1">La sala estará disponible en</p>
					<p class="text-2xl font-bold text-amber-900 font-mono">{countdown}</p>
				</div>
			{:else}
				<form
					method="POST"
					action="?/join"
					use:enhance={() => {
						sessionState = 'joining';
						return async ({ update }) => {
							await update();
							if (form?.error) {
								sessionState = 'pre-session';
							}
						};
					}}
				>
					<button
						type="submit"
						disabled={sessionState === 'joining'}
						class="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
					>
						{#if sessionState === 'joining'}
							<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Conectando...
						{:else}
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
							Unirse a la sesión
						{/if}
					</button>
				</form>
			{/if}
		</div>

		<!-- Tips -->
		<div class="bg-gray-50 rounded-xl p-6">
			<h3 class="font-semibold text-gray-900 mb-3">Antes de comenzar</h3>
			<ul class="space-y-2 text-sm text-gray-600">
				<li class="flex items-start gap-2">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Busca un lugar tranquilo con buena iluminación
				</li>
				<li class="flex items-start gap-2">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Verifica que tu cámara y micrófono funcionen correctamente
				</li>
				<li class="flex items-start gap-2">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Asegúrate de tener una conexión estable a internet
				</li>
				<li class="flex items-start gap-2">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Usa auriculares para mejor calidad de audio
				</li>
			</ul>
		</div>

		<div class="text-center">
			<a href="/bookings" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
				&larr; Volver a mis citas
			</a>
		</div>
	</div>

{:else if sessionState === 'in-session'}
	<!-- Video session -->
	<div class="fixed inset-0 bg-gray-900 flex flex-col">
		<!-- Header bar -->
		<div class="bg-gray-800 px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
					<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
				</div>
				<div>
					<p class="text-white font-medium text-sm">{data.booking.serviceName}</p>
					<p class="text-gray-400 text-xs">con {data.otherParticipant.name}</p>
				</div>
			</div>

			<div class="flex items-center gap-4">
				<!-- Duration -->
				<div class="flex items-center gap-2 text-gray-300 text-sm">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span class="font-mono">{formatDuration(sessionDuration)}</span>
				</div>

				<!-- End session button (therapist only) -->
				{#if data.isTherapist}
					<form
						method="POST"
						action="?/end"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
							};
						}}
					>
						<button
							type="submit"
							class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
							Finalizar sesión
						</button>
					</form>
				{:else}
					<form
						method="POST"
						action="?/leave"
						use:enhance
					>
						<button
							type="submit"
							class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
						>
							Salir
						</button>
					</form>
				{/if}
			</div>
		</div>

		<!-- Jitsi container -->
		<div id="jitsi-container" class="flex-1"></div>
	</div>

{:else if sessionState === 'ended'}
	<!-- Post-session -->
	<div class="max-w-lg mx-auto text-center space-y-6">
		<div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
			<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Sesión Finalizada</h1>
			<p class="text-gray-600">
				{#if sessionDuration > 0}
					Duración: {formatDuration(sessionDuration)}
				{:else}
					La sesión de video ha terminado
				{/if}
			</p>
		</div>

		<!-- Therapist notes form -->
		{#if data.isTherapist && showNotes}
			<div class="bg-white rounded-xl border border-gray-100 p-6 text-left">
				<h3 class="font-semibold text-gray-900 mb-3">Notas de la sesión</h3>
				<p class="text-sm text-gray-500 mb-4">
					Estas notas son privadas y no serán visibles para el cliente.
				</p>

				<form
					method="POST"
					action="?/saveNotes"
					use:enhance={() => {
						savingNotes = true;
						return async ({ update }) => {
							await update();
							savingNotes = false;
						};
					}}
				>
					<textarea
						name="notes"
						bind:value={notes}
						rows="4"
						placeholder="Escribe tus notas sobre la sesión..."
						class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
					></textarea>

					{#if form?.notesSaved}
						<p class="text-sm text-green-600 mt-2">Notas guardadas correctamente</p>
					{/if}

					<button
						type="submit"
						disabled={savingNotes}
						class="mt-3 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
					>
						{savingNotes ? 'Guardando...' : 'Guardar notas'}
					</button>
				</form>
			</div>
		{/if}

		<!-- Actions -->
		<div class="space-y-3">
			{#if !data.isTherapist}
				<a
					href="/booking/{data.booking.id}/review"
					class="block w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-center"
				>
					Dejar una reseña
				</a>
			{/if}

			<a
				href="/bookings"
				class="block w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center"
			>
				Ver mis citas
			</a>
		</div>
	</div>
{/if}
