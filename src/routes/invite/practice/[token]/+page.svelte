<script lang="ts">
	import { enhance } from '$app/forms';
	import VerificationBadge from '$lib/components/VerificationBadge.svelte';
	import type { VerificationStatus } from '$lib/types/database.types';

	interface Props {
		data: {
			invitation: {
				id: string;
				email: string;
				role: string;
				title: string | null;
				expires_at: string;
				practice: {
					id: string;
					name: string;
					logo_url: string | null;
					verification_status: VerificationStatus;
				};
				inviter_name: string;
			} | null;
			isLoggedIn: boolean;
			emailMatch: boolean;
			userEmail: string | null;
			error: string | null;
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	const roleLabels: Record<string, string> = {
		therapist: 'Terapeuta',
		receptionist: 'Recepcionista',
		manager: 'Gerente',
		admin: 'Administrador'
	};

	const roleDescriptions: Record<string, string> = {
		therapist: 'Podrás atender clientes y gestionar tu agenda dentro de la práctica',
		receptionist: 'Podrás gestionar reservas y ver información de clientes',
		manager: 'Podrás gestionar el equipo y ver reportes de la práctica',
		admin: 'Tendrás acceso completo a la configuración de la práctica'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	let isProcessing = $state(false);
</script>

<svelte:head>
	<title>Invitación - Plenura</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="max-w-md w-full">
		{#if data.error}
			<!-- Error State -->
			<div class="bg-white rounded-2xl shadow-lg p-8 text-center">
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				<h1 class="text-xl font-bold text-gray-900 mb-2">Invitación no válida</h1>
				<p class="text-gray-600 mb-6">{data.error}</p>
				<a
					href="/"
					class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
				>
					Ir al inicio
				</a>
			</div>
		{:else if form?.success}
			<!-- Declined State -->
			<div class="bg-white rounded-2xl shadow-lg p-8 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 class="text-xl font-bold text-gray-900 mb-2">Invitación rechazada</h1>
				<p class="text-gray-600 mb-6">{form.message}</p>
				<a
					href="/"
					class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
				>
					Ir al inicio
				</a>
			</div>
		{:else if data.invitation}
			<!-- Invitation Card -->
			<div class="bg-white rounded-2xl shadow-lg overflow-hidden">
				<!-- Header -->
				<div class="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-center text-white">
					<p class="text-primary-100 text-sm mb-2">Has sido invitado a unirte a</p>
					<div class="flex items-center justify-center gap-3 mb-2">
						{#if data.invitation.practice.logo_url}
							<img
								src={data.invitation.practice.logo_url}
								alt={data.invitation.practice.name}
								class="w-12 h-12 rounded-lg object-cover bg-white"
							/>
						{:else}
							<div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
								<span class="text-2xl font-bold">{data.invitation.practice.name.charAt(0)}</span>
							</div>
						{/if}
						<div class="text-left">
							<h1 class="text-2xl font-bold">{data.invitation.practice.name}</h1>
							<VerificationBadge
								status={data.invitation.practice.verification_status}
								size="sm"
								showTooltip={false}
							/>
						</div>
					</div>
				</div>

				<!-- Body -->
				<div class="p-6">
					<!-- Inviter info -->
					<p class="text-center text-gray-600 mb-6">
						<span class="font-medium text-gray-900">{data.invitation.inviter_name}</span> te ha invitado
					</p>

					<!-- Role info -->
					<div class="bg-gray-50 rounded-xl p-4 mb-6">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
								<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							</div>
							<div>
								<p class="font-medium text-gray-900">
									{roleLabels[data.invitation.role] ?? data.invitation.role}
									{#if data.invitation.title}
										<span class="text-gray-500 font-normal">· {data.invitation.title}</span>
									{/if}
								</p>
								<p class="text-sm text-gray-500">
									{roleDescriptions[data.invitation.role] ?? ''}
								</p>
							</div>
						</div>
					</div>

					<!-- Expiry info -->
					<p class="text-center text-sm text-gray-500 mb-6">
						Esta invitación expira el {formatDate(data.invitation.expires_at)}
					</p>

					{#if form?.error}
						<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
							{form.error}
						</div>
					{/if}

					{#if !data.isLoggedIn}
						<!-- Not logged in -->
						<div class="space-y-3">
							<p class="text-center text-gray-600 mb-4">
								Inicia sesión con <strong>{data.invitation.email}</strong> para aceptar esta invitación
							</p>
							<a
								href="/login?redirect=/invite/practice/{data.invitation.id}"
								class="block w-full py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors font-medium"
							>
								Iniciar sesión
							</a>
							<a
								href="/register?email={encodeURIComponent(data.invitation.email)}"
								class="block w-full py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors font-medium"
							>
								Crear cuenta
							</a>
						</div>
					{:else if !data.emailMatch}
						<!-- Wrong account -->
						<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
							<div class="flex gap-3">
								<svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								<div>
									<p class="font-medium text-amber-800">Cuenta incorrecta</p>
									<p class="text-sm text-amber-700 mt-1">
										Estás conectado como <strong>{data.userEmail}</strong>, pero esta invitación es para <strong>{data.invitation.email}</strong>.
									</p>
								</div>
							</div>
						</div>
						<a
							href="/logout?redirect=/invite/practice/{data.invitation.id}"
							class="block w-full py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors font-medium"
						>
							Cambiar de cuenta
						</a>
					{:else}
						<!-- Ready to accept -->
						<div class="space-y-3">
							<form
								method="POST"
								action="?/accept"
								use:enhance={() => {
									isProcessing = true;
									return async ({ update }) => {
										await update();
										isProcessing = false;
									};
								}}
							>
								<button
									type="submit"
									disabled={isProcessing}
									class="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
								>
									{#if isProcessing}
										Procesando...
									{:else}
										Aceptar invitación
									{/if}
								</button>
							</form>

							<form
								method="POST"
								action="?/decline"
								use:enhance={() => {
									isProcessing = true;
									return async ({ update }) => {
										await update();
										isProcessing = false;
									};
								}}
							>
								<button
									type="submit"
									disabled={isProcessing}
									class="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
								>
									Rechazar
								</button>
							</form>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer link -->
			<p class="text-center text-gray-500 text-sm mt-6">
				<a href="/" class="hover:text-primary-600">Volver a Plenura</a>
			</p>
		{/if}
	</div>
</div>
