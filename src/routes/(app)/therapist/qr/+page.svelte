<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import QRCode from 'qrcode';

	let { data } = $props();

	let qrCanvas: HTMLCanvasElement;
	let qrSize = $state(300);
	let qrColor = $state('#16a34a'); // primary-600
	let bgColor = $state('#ffffff');
	let isGenerating = $state(false);

	const presetColors = [
		{ name: 'Verde Plenura', value: '#16a34a' },
		{ name: 'Azul', value: '#2563eb' },
		{ name: 'Morado', value: '#7c3aed' },
		{ name: 'Rosa', value: '#db2777' },
		{ name: 'Negro', value: '#1f2937' }
	];

	async function generateQR() {
		if (!browser || !qrCanvas) return;

		isGenerating = true;
		try {
			await QRCode.toCanvas(qrCanvas, data.profileUrl, {
				width: qrSize,
				margin: 2,
				color: {
					dark: qrColor,
					light: bgColor
				},
				errorCorrectionLevel: 'H'
			});
		} catch (err) {
			console.error('Error generating QR:', err);
		}
		isGenerating = false;
	}

	function downloadQR(format: 'png' | 'svg') {
		if (!qrCanvas) return;

		if (format === 'png') {
			const link = document.createElement('a');
			link.download = `plenura-${data.therapistName.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
			link.href = qrCanvas.toDataURL('image/png');
			link.click();
		} else {
			// For SVG, we need to generate it differently
			QRCode.toString(data.profileUrl, {
				type: 'svg',
				width: qrSize,
				margin: 2,
				color: {
					dark: qrColor,
					light: bgColor
				},
				errorCorrectionLevel: 'H'
			}).then((svg) => {
				const blob = new Blob([svg], { type: 'image/svg+xml' });
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.download = `plenura-${data.therapistName.replace(/\s+/g, '-').toLowerCase()}-qr.svg`;
				link.href = url;
				link.click();
				URL.revokeObjectURL(url);
			});
		}
	}

	onMount(() => {
		generateQR();
	});

	$effect(() => {
		// Regenerate QR when options change
		qrColor;
		qrSize;
		bgColor;
		generateQR();
	});
</script>

<svelte:head>
	<title>Mi Código QR - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Mi Código QR</h1>
			<p class="text-gray-500">Descarga tu código QR para tarjetas de presentación</p>
		</div>
		<a
			href="/therapist/profile"
			class="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Volver al perfil
		</a>
	</div>

	<div class="grid lg:grid-cols-2 gap-8">
		<!-- QR Preview -->
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<h2 class="font-semibold text-gray-900 mb-4">Vista previa</h2>

			<div class="flex flex-col items-center">
				<!-- QR Code Canvas -->
				<div class="bg-gray-50 rounded-xl p-6 mb-4">
					<canvas
						bind:this={qrCanvas}
						class="rounded-lg"
						style="width: {qrSize}px; height: {qrSize}px;"
					></canvas>
				</div>

				<!-- Profile URL -->
				<p class="text-sm text-gray-500 text-center break-all max-w-full px-4">
					{data.profileUrl}
				</p>

				<!-- Download Buttons -->
				<div class="flex gap-3 mt-6">
					<button
						type="button"
						onclick={() => downloadQR('png')}
						class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
						Descargar PNG
					</button>
					<button
						type="button"
						onclick={() => downloadQR('svg')}
						class="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
						Descargar SVG
					</button>
				</div>
			</div>
		</div>

		<!-- Customization Options -->
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<h2 class="font-semibold text-gray-900 mb-4">Personalizar</h2>

			<div class="space-y-6">
				<!-- Size -->
				<div>
					<label for="qr-size" class="block text-sm font-medium text-gray-700 mb-2">
						Tamaño: {qrSize}px
					</label>
					<input
						type="range"
						id="qr-size"
						bind:value={qrSize}
						min="150"
						max="500"
						step="50"
						class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
					/>
					<div class="flex justify-between text-xs text-gray-500 mt-1">
						<span>150px</span>
						<span>500px</span>
					</div>
				</div>

				<!-- QR Color -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Color del código</label>
					<div class="flex flex-wrap gap-2">
						{#each presetColors as color}
							<button
								type="button"
								onclick={() => qrColor = color.value}
								class="w-10 h-10 rounded-lg border-2 transition-all {qrColor === color.value ? 'border-gray-900 scale-110' : 'border-gray-200 hover:border-gray-300'}"
								style="background-color: {color.value};"
								title={color.name}
							></button>
						{/each}
						<div class="relative">
							<input
								type="color"
								bind:value={qrColor}
								class="w-10 h-10 rounded-lg cursor-pointer"
								title="Color personalizado"
							/>
						</div>
					</div>
				</div>

				<!-- Background Color -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Color de fondo</label>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => bgColor = '#ffffff'}
							class="w-10 h-10 rounded-lg border-2 bg-white transition-all {bgColor === '#ffffff' ? 'border-gray-900' : 'border-gray-200 hover:border-gray-300'}"
							title="Blanco"
						></button>
						<button
							type="button"
							onclick={() => bgColor = '#f3f4f6'}
							class="w-10 h-10 rounded-lg border-2 bg-gray-100 transition-all {bgColor === '#f3f4f6' ? 'border-gray-900' : 'border-gray-200 hover:border-gray-300'}"
							title="Gris claro"
						></button>
						<button
							type="button"
							onclick={() => bgColor = '#dcfce7'}
							class="w-10 h-10 rounded-lg border-2 bg-green-100 transition-all {bgColor === '#dcfce7' ? 'border-gray-900' : 'border-gray-200 hover:border-gray-300'}"
							title="Verde claro"
						></button>
						<div class="relative">
							<input
								type="color"
								bind:value={bgColor}
								class="w-10 h-10 rounded-lg cursor-pointer"
								title="Color personalizado"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Tips -->
			<div class="mt-8 pt-6 border-t border-gray-100">
				<h3 class="font-medium text-gray-900 mb-3">Tips para usar tu QR</h3>
				<ul class="space-y-2 text-sm text-gray-600">
					<li class="flex items-start gap-2">
						<svg class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>Imprime el QR en tus tarjetas de presentación</span>
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>Colócalo en flyers o material promocional</span>
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>Usa SVG para impresiones de alta calidad</span>
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span>Asegúrate de que haya buen contraste entre colores</span>
					</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Business Card Preview -->
	<div class="bg-white rounded-xl border border-gray-100 p-6">
		<h2 class="font-semibold text-gray-900 mb-4">Vista previa de tarjeta de presentación</h2>
		<p class="text-sm text-gray-500 mb-6">
			Así se vería tu código QR en una tarjeta de presentación profesional
		</p>

		<div class="flex justify-center">
			<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-lg max-w-sm w-full">
				<div class="flex items-start gap-4">
					<!-- Avatar placeholder -->
					<div class="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
						<span class="text-2xl text-primary-600">
							{data.therapistName[0].toUpperCase()}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="font-bold text-gray-900 truncate">{data.therapistName}</h3>
						<p class="text-sm text-primary-600 font-medium">Terapeuta Profesional</p>
						<p class="text-xs text-gray-500 mt-1">Reserva tu cita en Plenura</p>
					</div>
				</div>

				<div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center">
							<span class="text-white text-xs">P</span>
						</div>
						<span class="text-xs text-gray-500">plenura.com</span>
					</div>
					<div class="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
						<svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24">
							<rect x="3" y="3" width="6" height="6" fill="currentColor" rx="1" />
							<rect x="15" y="3" width="6" height="6" fill="currentColor" rx="1" />
							<rect x="3" y="15" width="6" height="6" fill="currentColor" rx="1" />
							<rect x="9" y="9" width="6" height="6" fill="currentColor" rx="1" />
							<rect x="15" y="15" width="3" height="3" fill="currentColor" rx="0.5" />
							<rect x="18" y="18" width="3" height="3" fill="currentColor" rx="0.5" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
