<script lang="ts">
	import { enhance } from '$app/forms';
	import VerificationBadge from '$lib/components/VerificationBadge.svelte';
	import type { VerificationStatus } from '$lib/types/database.types';

	interface Props {
		data: {
			practice: {
				id: string;
				name: string;
				verification_status: VerificationStatus;
				business_registration_number: string | null;
				tax_id: string | null;
				insurance_provider: string | null;
				insurance_policy_number: string | null;
				phone: string | null;
				email: string | null;
				address: string | null;
				city: string | null;
				state: string | null;
				postal_code: string | null;
			} | null;
			documents: Array<{
				id: string;
				document_type: string;
				file_url: string;
				status: string;
				rejection_reason: string | null;
				created_at: string;
			}>;
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	const documentTypes = [
		{ value: 'business_license', label: 'Licencia comercial', description: 'Licencia o permiso de funcionamiento' },
		{ value: 'tax_registration', label: 'Registro fiscal', description: 'RFC o constancia de situación fiscal' },
		{ value: 'insurance', label: 'Póliza de seguro', description: 'Seguro de responsabilidad civil' },
		{ value: 'health_permit', label: 'Permiso sanitario', description: 'Licencia sanitaria o COFEPRIS' },
		{ value: 'other', label: 'Otro documento', description: 'Otro documento de verificación' }
	];

	const statusColors: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-700',
		approved: 'bg-green-100 text-green-700',
		rejected: 'bg-red-100 text-red-700'
	};

	const statusLabels: Record<string, string> = {
		pending: 'En revisión',
		approved: 'Aprobado',
		rejected: 'Rechazado'
	};

	function getDocumentsByType(type: string) {
		return data.documents.filter(d => d.document_type === type);
	}

	function hasApprovedDocument(type: string): boolean {
		return data.documents.some(d => d.document_type === type && d.status === 'approved');
	}

	let selectedDocumentType = $state('business_license');
	let isUploading = $state(false);

	const completionChecks = $derived([
		{ label: 'Información de contacto', complete: !!(data.practice?.phone && data.practice?.email) },
		{ label: 'Dirección completa', complete: !!(data.practice?.address && data.practice?.city) },
		{ label: 'Información fiscal', complete: !!(data.practice?.tax_id) },
		{ label: 'Licencia comercial', complete: hasApprovedDocument('business_license') },
		{ label: 'Seguro de responsabilidad', complete: !!(data.practice?.insurance_provider) || hasApprovedDocument('insurance') }
	]);

	const completionPercent = $derived(
		Math.round((completionChecks.filter(c => c.complete).length / completionChecks.length) * 100)
	);
</script>

<svelte:head>
	<title>Verificación - {data.practice?.name} - Plenura</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<a href="/practice/settings" class="text-gray-500 hover:text-gray-700">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</a>
				<h1 class="text-2xl font-bold text-gray-900">Verificación de Práctica</h1>
			</div>
			<p class="text-gray-500">Verifica tu práctica para generar confianza con los clientes</p>
		</div>
		<VerificationBadge status={data.practice?.verification_status ?? 'unverified'} size="lg" />
	</div>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
			{form.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{form.error}
		</div>
	{/if}

	<!-- Progress -->
	<div class="bg-white rounded-xl border border-gray-200 p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="font-semibold text-gray-900">Progreso de verificación</h2>
			<span class="text-sm text-gray-500">{completionPercent}% completado</span>
		</div>
		<div class="w-full bg-gray-100 rounded-full h-2 mb-4">
			<div
				class="bg-primary-500 h-2 rounded-full transition-all"
				style="width: {completionPercent}%"
			></div>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
			{#each completionChecks as check}
				<div class="flex items-center gap-2">
					{#if check.complete}
						<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					{:else}
						<svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="10" stroke-width="2" />
						</svg>
					{/if}
					<span class="{check.complete ? 'text-gray-900' : 'text-gray-500'}">{check.label}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Business Information -->
	<div class="bg-white rounded-xl border border-gray-200 p-6">
		<h2 class="font-semibold text-gray-900 mb-4">Información del negocio</h2>
		<form method="POST" action="?/updateBusinessInfo" use:enhance>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="business_registration_number" class="block text-sm font-medium text-gray-700 mb-1">
						Número de registro comercial
					</label>
					<input
						type="text"
						id="business_registration_number"
						name="business_registration_number"
						value={data.practice?.business_registration_number ?? ''}
						class="w-full border rounded-lg px-3 py-2"
						placeholder="Ej: REG-12345"
					/>
				</div>
				<div>
					<label for="tax_id" class="block text-sm font-medium text-gray-700 mb-1">
						RFC
					</label>
					<input
						type="text"
						id="tax_id"
						name="tax_id"
						value={data.practice?.tax_id ?? ''}
						class="w-full border rounded-lg px-3 py-2"
						placeholder="Ej: XAXX010101000"
					/>
				</div>
				<div>
					<label for="insurance_provider" class="block text-sm font-medium text-gray-700 mb-1">
						Aseguradora
					</label>
					<input
						type="text"
						id="insurance_provider"
						name="insurance_provider"
						value={data.practice?.insurance_provider ?? ''}
						class="w-full border rounded-lg px-3 py-2"
						placeholder="Nombre de la aseguradora"
					/>
				</div>
				<div>
					<label for="insurance_policy_number" class="block text-sm font-medium text-gray-700 mb-1">
						Número de póliza
					</label>
					<input
						type="text"
						id="insurance_policy_number"
						name="insurance_policy_number"
						value={data.practice?.insurance_policy_number ?? ''}
						class="w-full border rounded-lg px-3 py-2"
						placeholder="Número de póliza"
					/>
				</div>
			</div>
			<div class="mt-4">
				<button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
					Guardar información
				</button>
			</div>
		</form>
	</div>

	<!-- Documents -->
	<div class="bg-white rounded-xl border border-gray-200 p-6">
		<h2 class="font-semibold text-gray-900 mb-4">Documentos de verificación</h2>

		<!-- Existing documents -->
		{#if data.documents.length > 0}
			<div class="space-y-3 mb-6">
				{#each data.documents as doc}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div class="flex items-center gap-3">
							<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<div>
								<p class="font-medium text-gray-900">
									{documentTypes.find(d => d.value === doc.document_type)?.label ?? doc.document_type}
								</p>
								<p class="text-sm text-gray-500">
									Subido el {new Date(doc.created_at).toLocaleDateString('es-MX')}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<span class="px-2 py-1 text-xs rounded-full {statusColors[doc.status]}">
								{statusLabels[doc.status]}
							</span>
							<a
								href={doc.file_url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary-600 hover:text-primary-700 text-sm"
							>
								Ver
							</a>
						</div>
					</div>
					{#if doc.status === 'rejected' && doc.rejection_reason}
						<div class="ml-11 text-sm text-red-600 bg-red-50 p-2 rounded">
							Razón: {doc.rejection_reason}
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Upload form -->
		<form
			method="POST"
			action="?/uploadDocument"
			enctype="multipart/form-data"
			use:enhance={() => {
				isUploading = true;
				return async ({ update }) => {
					await update();
					isUploading = false;
				};
			}}
		>
			<div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
				<div class="text-center mb-4">
					<svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<p class="text-gray-600">Sube un documento de verificación</p>
					<p class="text-sm text-gray-500">PDF, JPG o PNG hasta 10MB</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="document_type" class="block text-sm font-medium text-gray-700 mb-1">
							Tipo de documento
						</label>
						<select
							id="document_type"
							name="document_type"
							bind:value={selectedDocumentType}
							class="w-full border rounded-lg px-3 py-2"
						>
							{#each documentTypes as docType}
								<option value={docType.value}>{docType.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="document" class="block text-sm font-medium text-gray-700 mb-1">
							Archivo
						</label>
						<input
							type="file"
							id="document"
							name="document"
							accept=".pdf,.jpg,.jpeg,.png,.webp"
							required
							class="w-full border rounded-lg px-3 py-2"
						/>
					</div>
				</div>

				<div class="mt-4 text-center">
					<button
						type="submit"
						disabled={isUploading}
						class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
					>
						{#if isUploading}
							Subiendo...
						{:else}
							Subir documento
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>

	<!-- Request Verification -->
	{#if data.practice?.verification_status === 'unverified' && completionPercent >= 60}
		<div class="bg-primary-50 border border-primary-200 rounded-xl p-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-primary-900">¿Listo para verificar?</h3>
					<p class="text-primary-700 text-sm">
						Has completado suficiente información. Solicita la verificación y un administrador revisará tu práctica.
					</p>
				</div>
				<form method="POST" action="?/requestVerification" use:enhance>
					<button
						type="submit"
						class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
					>
						Solicitar verificación
					</button>
				</form>
			</div>
		</div>
	{:else if data.practice?.verification_status === 'pending'}
		<div class="bg-amber-50 border border-amber-200 rounded-xl p-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-amber-900">Verificación en proceso</h3>
					<p class="text-amber-700 text-sm">
						Tu solicitud está siendo revisada. Te notificaremos cuando esté lista.
					</p>
				</div>
			</div>
		</div>
	{:else if data.practice?.verification_status === 'fully_verified'}
		<div class="bg-green-50 border border-green-200 rounded-xl p-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-green-900">Práctica verificada</h3>
					<p class="text-green-700 text-sm">
						Tu práctica ha sido verificada completamente. Los clientes verán la insignia de verificación en tu perfil.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
