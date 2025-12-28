<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import VerificationBadge from '$lib/components/VerificationBadge.svelte';
	import type { VerificationStatus } from '$lib/types/database.types';
	import { VERIFICATION_BADGES } from '$lib/types/database.types';

	interface Props {
		data: {
			therapist: {
				id: string;
				verification_status: VerificationStatus;
				verification_documents: Array<{
					type: string;
					url: string;
					uploaded_at: string;
					status: 'pending' | 'approved' | 'rejected';
				}>;
				id_document_verified: boolean;
				license_verified: boolean;
				background_check_passed: boolean;
			};
			useColectivaKYC: boolean;
			colectivaKYCUrl: string | null;
		};
	}

	let { data }: Props = $props();

	// Check if returning from Colectiva KYC
	const kycComplete = $page.url.searchParams.get('kyc_complete') === 'true';
	let colectivaRedirecting = $state(false);

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state<string | null>(null);

	// Document types required for full verification
	// Phase 1: Local verification
	// Phase 2: Will migrate to Colectiva KYC API
	const documentTypes = [
		{
			id: 'government_id',
			label: 'Identificación oficial',
			description: 'INE, pasaporte o licencia de conducir vigente',
			required: true,
			category: 'identity' as const
		},
		{
			id: 'selfie',
			label: 'Selfie con identificación',
			description: 'Foto tuya sosteniendo tu identificación oficial',
			required: true,
			category: 'identity' as const
		},
		{
			id: 'professional_license',
			label: 'Cédula profesional',
			description: 'Cédula profesional emitida por la SEP',
			required: true,
			category: 'credential' as const
		},
		{
			id: 'degree_certificate',
			label: 'Título o certificado',
			description: 'Título universitario o certificado de formación profesional',
			required: true,
			category: 'credential' as const
		}
	];

	// Group documents by category
	const identityDocs = documentTypes.filter(d => d.category === 'identity');
	const credentialDocs = documentTypes.filter(d => d.category === 'credential');

	function getDocumentStatus(docType: string): 'none' | 'pending' | 'approved' | 'rejected' {
		const doc = data.therapist.verification_documents?.find(d => d.type === docType);
		if (!doc) return 'none';
		return doc.status;
	}

	function getUploadedDoc(docType: string) {
		return data.therapist.verification_documents?.find(d => d.type === docType);
	}

	async function handleFileUpload(event: Event, docType: string) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate file
		if (file.size > 10 * 1024 * 1024) {
			uploadError = 'El archivo debe ser menor a 10MB';
			return;
		}

		const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
		if (!allowedTypes.includes(file.type)) {
			uploadError = 'Solo se permiten archivos JPG, PNG o PDF';
			return;
		}

		uploading = true;
		uploadError = null;
		uploadSuccess = null;

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('documentType', docType);

			const response = await fetch('/api/therapist/verification/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Error al subir el documento');
			}

			uploadSuccess = 'Documento subido exitosamente. Lo revisaremos pronto.';
			// Reload the page to show updated status
			setTimeout(() => window.location.reload(), 1500);
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Error al subir el documento';
		} finally {
			uploading = false;
		}
	}

	// Calculate verification progress
	const identityComplete = $derived(
		identityDocs.every(d => getDocumentStatus(d.id) === 'approved')
	);
	const credentialComplete = $derived(
		credentialDocs.every(d => getDocumentStatus(d.id) === 'approved')
	);
	const hasPendingDocs = $derived(
		documentTypes.some(d => getDocumentStatus(d.id) === 'pending')
	);
	const hasAnyDocs = $derived(
		documentTypes.some(d => getDocumentStatus(d.id) !== 'none')
	);

	const verificationSteps = $derived([
		{ status: 'unverified' as const, label: 'Registro', completed: true },
		{ status: 'pending' as const, label: 'Documentos', completed: hasAnyDocs },
		{ status: 'identity_verified' as const, label: 'Identidad', completed: identityComplete },
		{ status: 'credential_verified' as const, label: 'Credenciales', completed: credentialComplete },
		{ status: 'fully_verified' as const, label: 'Completo', completed: identityComplete && credentialComplete }
	]);
</script>

<svelte:head>
	<title>Verificación - Plenura</title>
</svelte:head>

<div class="max-w-3xl mx-auto py-8 px-4">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">Verificación de perfil</h1>
		<p class="text-gray-600 mt-1">
			Completa la verificación para aumentar la confianza de tus clientes y desbloquear más funciones.
		</p>
	</div>

	<!-- Current status -->
	<div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
		<div class="flex items-center gap-4">
			<VerificationBadge status={data.therapist.verification_status} size="lg" showTooltip={false} />
			<div>
				<h2 class="font-semibold text-gray-900">
					{VERIFICATION_BADGES[data.therapist.verification_status].label}
				</h2>
				<p class="text-sm text-gray-500">
					{VERIFICATION_BADGES[data.therapist.verification_status].description}
				</p>
			</div>
		</div>

		<!-- Progress steps -->
		<div class="mt-6">
			<div class="flex items-center justify-between">
				{#each verificationSteps as step, i}
					<div class="flex flex-col items-center flex-1">
						<div
							class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
								{step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}"
						>
							{#if step.completed}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else}
								{i + 1}
							{/if}
						</div>
						<span class="text-xs text-gray-500 mt-1 text-center">{step.label}</span>
					</div>
					{#if i < verificationSteps.length - 1}
						<div class="flex-1 h-0.5 {verificationSteps[i + 1].completed ? 'bg-green-500' : 'bg-gray-200'} mx-2 mb-6"></div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- Benefits of verification -->
	{#if data.therapist.verification_status !== 'fully_verified'}
		<div class="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-8">
			<h3 class="font-semibold text-gray-900 mb-3">Beneficios de la verificación completa</h3>
			<ul class="space-y-2">
				<li class="flex items-center gap-2 text-sm text-gray-700">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Insignia de verificación visible en tu perfil
				</li>
				<li class="flex items-center gap-2 text-sm text-gray-700">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Mayor visibilidad en resultados de búsqueda
				</li>
				<li class="flex items-center gap-2 text-sm text-gray-700">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Acceso a clientes corporativos vía Camino
				</li>
				<li class="flex items-center gap-2 text-sm text-gray-700">
					<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Menor comisión en reservas
				</li>
			</ul>
		</div>
	{/if}

	<!-- Error/Success messages -->
	{#if uploadError}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
			{uploadError}
		</div>
	{/if}

	{#if uploadSuccess}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
			{uploadSuccess}
		</div>
	{/if}

	{#if kycComplete}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
			Tu verificación está siendo procesada. Recibirás una notificación cuando esté completa.
		</div>
	{/if}

	<!-- Colectiva KYC Section (Phase 2) -->
	{#if data.useColectivaKYC}
		<div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-gray-900">Verificación Segura con Colectiva</h3>
					<p class="text-sm text-gray-600 mt-1">
						Usamos Colectiva para verificar tu identidad de forma segura. Tu verificación será válida en todas las apps del ecosistema.
					</p>

					{#if data.therapist.verification_status === 'fully_verified'}
						<div class="mt-4 p-3 bg-green-50 rounded-lg">
							<p class="text-sm text-green-700 font-medium">
								✓ Tu identidad ha sido verificada completamente
							</p>
						</div>
					{:else if data.therapist.verification_status === 'pending'}
						<div class="mt-4 p-3 bg-yellow-50 rounded-lg">
							<p class="text-sm text-yellow-700">
								Tu verificación está en proceso. Te notificaremos cuando esté lista.
							</p>
						</div>
					{:else}
						<div class="mt-4">
							{#if data.colectivaKYCUrl}
								<a
									href={data.colectivaKYCUrl}
									class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all"
									onclick={() => colectivaRedirecting = true}
								>
									{#if colectivaRedirecting}
										<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
										</svg>
										Redirigiendo...
									{:else}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
										</svg>
										Iniciar Verificación
									{/if}
								</a>
							{:else}
								<form method="POST" action="?/initiateColectivaKYC" use:enhance>
									<button
										type="submit"
										class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all"
										disabled={colectivaRedirecting}
									>
										{#if colectivaRedirecting}
											<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
											</svg>
											Redirigiendo...
										{:else}
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
											</svg>
											Iniciar Verificación
										{/if}
									</button>
								</form>
							{/if}
						</div>
						<p class="text-xs text-gray-500 mt-3">
							Serás redirigido al portal seguro de Colectiva para completar tu verificación.
						</p>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Local Document Upload Section (Phase 1) -->
		<!-- Identity Documents Section -->
		<div class="space-y-8">
		<div>
			<div class="flex items-center gap-3 mb-4">
				<div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
					<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">Verificación de identidad</h3>
					<p class="text-sm text-gray-500">
						Sube tu identificación oficial y una selfie
						{#if hasPendingDocs}
							<span class="text-yellow-600 ml-1">- Documentos en revisión</span>
						{/if}
					</p>
				</div>
			</div>
			<div class="space-y-4">
				{#each identityDocs as docType}
					{@const status = getDocumentStatus(docType.id)}
					{@const uploadedDoc = getUploadedDoc(docType.id)}
					<div class="bg-white rounded-xl border border-gray-200 p-6">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h4 class="font-medium text-gray-900">{docType.label}</h4>
									{#if docType.required}
										<span class="text-xs text-red-500">*</span>
									{/if}
								</div>
								<p class="text-sm text-gray-500 mt-1">{docType.description}</p>
							</div>
							<div class="flex-shrink-0 ml-4">
								{#if status === 'approved'}
									<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-sm rounded-full">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
										Aprobado
									</span>
								{:else if status === 'pending'}
									<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										En revisión
									</span>
								{:else if status === 'rejected'}
									<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-sm rounded-full">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
										Rechazado
									</span>
								{:else}
									<span class="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
										Pendiente
									</span>
								{/if}
							</div>
						</div>

						{#if status !== 'approved'}
							<div class="mt-4">
								{#if uploadedDoc && status === 'rejected'}
									<p class="text-sm text-red-600 mb-2">
										Tu documento fue rechazado. Por favor sube uno nuevo.
									</p>
								{/if}
								<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {uploading ? 'opacity-50 pointer-events-none' : ''}">
									<div class="flex flex-col items-center justify-center pt-5 pb-6">
										{#if uploading}
											<svg class="animate-spin h-8 w-8 text-primary-500 mb-2" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
											</svg>
											<p class="text-sm text-gray-500">Subiendo...</p>
										{:else}
											<svg class="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
											</svg>
											<p class="text-sm text-gray-500">
												<span class="font-medium text-primary-600">Haz clic para subir</span> o arrastra
											</p>
											<p class="text-xs text-gray-400 mt-1">JPG, PNG o PDF (máx. 10MB)</p>
										{/if}
									</div>
									<input type="file" class="hidden" accept="image/jpeg,image/png,application/pdf" onchange={(e) => handleFileUpload(e, docType.id)} disabled={uploading} />
								</label>
							</div>
						{:else}
							<div class="mt-4 p-3 bg-green-50 rounded-lg">
								<p class="text-sm text-green-700">
									Documento verificado el {new Date(uploadedDoc?.uploaded_at || '').toLocaleDateString('es-MX')}
								</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Credential Documents Section -->
		<div>
			<div class="flex items-center gap-3 mb-4">
				<div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
					<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">Verificación de credenciales</h3>
					<p class="text-sm text-gray-500">Sube tu cédula profesional y título</p>
				</div>
			</div>
			<div class="space-y-4">
				{#each credentialDocs as docType}
					{@const status = getDocumentStatus(docType.id)}
					{@const uploadedDoc = getUploadedDoc(docType.id)}
					<div class="bg-white rounded-xl border border-gray-200 p-6">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h4 class="font-medium text-gray-900">{docType.label}</h4>
									{#if docType.required}
										<span class="text-xs text-red-500">*</span>
									{/if}
								</div>
								<p class="text-sm text-gray-500 mt-1">{docType.description}</p>
							</div>
							<div class="flex-shrink-0 ml-4">
								{#if status === 'approved'}
									<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-sm rounded-full">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
										Aprobado
									</span>
								{:else if status === 'pending'}
									<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										En revisión
									</span>
								{:else if status === 'rejected'}
									<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-sm rounded-full">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
										Rechazado
									</span>
								{:else}
									<span class="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
										Pendiente
									</span>
								{/if}
							</div>
						</div>

						{#if status !== 'approved'}
							<div class="mt-4">
								{#if uploadedDoc && status === 'rejected'}
									<p class="text-sm text-red-600 mb-2">
										Tu documento fue rechazado. Por favor sube uno nuevo.
									</p>
								{/if}
								<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {uploading ? 'opacity-50 pointer-events-none' : ''}">
									<div class="flex flex-col items-center justify-center pt-5 pb-6">
										{#if uploading}
											<svg class="animate-spin h-8 w-8 text-primary-500 mb-2" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
											</svg>
											<p class="text-sm text-gray-500">Subiendo...</p>
										{:else}
											<svg class="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
											</svg>
											<p class="text-sm text-gray-500">
												<span class="font-medium text-primary-600">Haz clic para subir</span> o arrastra
											</p>
											<p class="text-xs text-gray-400 mt-1">JPG, PNG o PDF (máx. 10MB)</p>
										{/if}
									</div>
									<input type="file" class="hidden" accept="image/jpeg,image/png,application/pdf" onchange={(e) => handleFileUpload(e, docType.id)} disabled={uploading} />
								</label>
							</div>
						{:else}
							<div class="mt-4 p-3 bg-green-50 rounded-lg">
								<p class="text-sm text-green-700">
									Documento verificado el {new Date(uploadedDoc?.uploaded_at || '').toLocaleDateString('es-MX')}
								</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
	{/if}

	<!-- Future Colectiva KYC note -->
	<div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
		<div class="flex gap-3">
			<svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div class="text-sm text-blue-700">
				<p class="font-medium">Verificación segura</p>
				<p class="mt-1">
					Tus documentos se almacenan de forma segura y solo son accesibles por nuestro equipo de verificación.
					Próximamente podrás usar tu verificación en todas las apps del ecosistema.
				</p>
			</div>
		</div>
	</div>

	<!-- Help section -->
	<div class="mt-6 p-6 bg-gray-50 rounded-xl">
		<h3 class="font-medium text-gray-900 mb-2">¿Necesitas ayuda?</h3>
		<p class="text-sm text-gray-600 mb-4">
			Si tienes problemas con la verificación o tus documentos fueron rechazados, contáctanos.
		</p>
		<a
			href="/support"
			class="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			Contactar soporte
		</a>
	</div>
</div>
