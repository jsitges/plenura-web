<script lang="ts">
	import VerificationBadge from '$lib/components/VerificationBadge.svelte';
	import type { VerificationStatus, PracticeRole } from '$lib/types/database.types';

	interface TeamMember {
		id: string;
		user_id: string;
		role: PracticeRole;
		title: string | null;
		status: string;
		joined_at: string | null;
		user: {
			full_name: string;
			email: string;
			avatar_url: string | null;
		};
		therapist: {
			id: string;
			verification_status: VerificationStatus;
			rating_avg: number;
			is_available: boolean;
		} | null;
	}

	interface PendingInvite {
		id: string;
		email: string;
		role: PracticeRole;
		title: string | null;
		created_at: string;
		expires_at: string;
	}

	interface Props {
		data: {
			members: TeamMember[];
			pendingInvites: PendingInvite[];
			userRole: PracticeRole;
		};
	}

	let { data }: Props = $props();

	let showInviteModal = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<PracticeRole>('therapist');
	let inviteTitle = $state('');
	let inviting = $state(false);
	let inviteError = $state<string | null>(null);

	const canManageTeam = $derived(data.userRole === 'owner' || data.userRole === 'admin');

	const roleLabels: Record<PracticeRole, string> = {
		owner: 'Propietario',
		admin: 'Administrador',
		manager: 'Gerente',
		therapist: 'Terapeuta',
		receptionist: 'Recepcionista'
	};

	const roleColors: Record<PracticeRole, string> = {
		owner: 'purple',
		admin: 'blue',
		manager: 'green',
		therapist: 'primary',
		receptionist: 'gray'
	};

	async function sendInvite() {
		if (!inviteEmail.trim()) {
			inviteError = 'El correo electrónico es requerido';
			return;
		}

		inviting = true;
		inviteError = null;

		try {
			const response = await fetch('/api/practice/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: inviteEmail.trim(),
					role: inviteRole,
					title: inviteTitle.trim() || null
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Error al enviar invitación');
			}

			// Success - reload page
			window.location.reload();
		} catch (err) {
			inviteError = err instanceof Error ? err.message : 'Error al enviar invitación';
		} finally {
			inviting = false;
		}
	}

	async function cancelInvite(inviteId: string) {
		if (!confirm('¿Estás seguro de cancelar esta invitación?')) return;

		try {
			const response = await fetch(`/api/practice/invite/${inviteId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				window.location.reload();
			}
		} catch (err) {
			console.error('Error cancelling invite:', err);
		}
	}

	async function removeMember(memberId: string, memberName: string) {
		if (!confirm(`¿Estás seguro de remover a ${memberName} del equipo?`)) return;

		try {
			const response = await fetch(`/api/practice/members/${memberId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				window.location.reload();
			}
		} catch (err) {
			console.error('Error removing member:', err);
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Equipo - Plenura</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Equipo</h1>
			<p class="text-gray-500 mt-1">
				Gestiona los miembros de tu práctica
			</p>
		</div>

		{#if canManageTeam}
			<button
				type="button"
				onclick={() => showInviteModal = true}
				class="btn-primary-gradient px-4 py-2 flex items-center gap-2"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
				</svg>
				Invitar miembro
			</button>
		{/if}
	</div>

	<!-- Pending invitations -->
	{#if data.pendingInvites.length > 0 && canManageTeam}
		<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
			<h2 class="font-semibold text-yellow-800 mb-4">Invitaciones pendientes</h2>
			<div class="space-y-3">
				{#each data.pendingInvites as invite}
					<div class="flex items-center justify-between bg-white rounded-lg p-4 border border-yellow-100">
						<div>
							<p class="font-medium text-gray-900">{invite.email}</p>
							<p class="text-sm text-gray-500">
								{roleLabels[invite.role]}
								{#if invite.title} - {invite.title}{/if}
								<span class="mx-2">·</span>
								Expira: {formatDate(invite.expires_at)}
							</p>
						</div>
						<button
							type="button"
							onclick={() => cancelInvite(invite.id)}
							class="text-red-600 hover:text-red-700 text-sm"
						>
							Cancelar
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Team members -->
	<div class="bg-white rounded-xl border border-gray-200">
		<div class="p-6 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Miembros del equipo ({data.members.length})</h2>
		</div>

		{#if data.members.length === 0}
			<div class="p-8 text-center">
				<p class="text-gray-500">No hay miembros en el equipo aún</p>
				{#if canManageTeam}
					<button
						type="button"
						onclick={() => showInviteModal = true}
						class="mt-4 text-primary-600 hover:text-primary-700 font-medium"
					>
						Invitar al primer miembro
					</button>
				{/if}
			</div>
		{:else}
			<div class="divide-y divide-gray-100">
				{#each data.members as member}
					<div class="p-4 hover:bg-gray-50 transition-colors">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<!-- Avatar -->
								{#if member.user.avatar_url}
									<img
										src={member.user.avatar_url}
										alt={member.user.full_name}
										class="w-12 h-12 rounded-full object-cover"
									/>
								{:else}
									<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
										<span class="text-gray-600 font-medium text-lg">
											{member.user.full_name.charAt(0)}
										</span>
									</div>
								{/if}

								<!-- Info -->
								<div>
									<div class="flex items-center gap-2">
										<p class="font-medium text-gray-900">{member.user.full_name}</p>
										{#if member.therapist}
											<VerificationBadge status={member.therapist.verification_status} size="sm" />
										{/if}
									</div>
									<p class="text-sm text-gray-500">
										{member.user.email}
										{#if member.title}
											<span class="mx-1">·</span>
											{member.title}
										{/if}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-4">
								<!-- Role badge -->
								<span
									class="px-3 py-1 rounded-full text-sm font-medium
										bg-{roleColors[member.role]}-100 text-{roleColors[member.role]}-700"
								>
									{roleLabels[member.role]}
								</span>

								<!-- Therapist status -->
								{#if member.therapist}
									<div class="flex items-center gap-1 text-sm">
										<span
											class="w-2 h-2 rounded-full
												{member.therapist.is_available ? 'bg-green-500' : 'bg-gray-300'}"
										></span>
										<span class="text-gray-500">
											{member.therapist.is_available ? 'Disponible' : 'No disponible'}
										</span>
									</div>
								{/if}

								<!-- Actions -->
								{#if canManageTeam && member.role !== 'owner'}
									<button
										type="button"
										onclick={() => removeMember(member.id, member.user.full_name)}
										class="text-gray-400 hover:text-red-600 transition-colors"
										title="Remover del equipo"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Invite modal -->
{#if showInviteModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl max-w-md w-full p-6">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-gray-900">Invitar miembro</h2>
				<button
					type="button"
					onclick={() => showInviteModal = false}
					class="text-gray-400 hover:text-gray-600"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{#if inviteError}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
					{inviteError}
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); sendInvite(); }} class="space-y-4">
				<div>
					<label for="inviteEmail" class="block text-sm font-medium text-gray-700 mb-1.5">
						Correo electrónico
					</label>
					<input
						type="email"
						id="inviteEmail"
						bind:value={inviteEmail}
						required
						placeholder="nombre@ejemplo.com"
						class="input-wellness"
						disabled={inviting}
					/>
				</div>

				<div>
					<label for="inviteRole" class="block text-sm font-medium text-gray-700 mb-1.5">
						Rol
					</label>
					<select
						id="inviteRole"
						bind:value={inviteRole}
						class="input-wellness"
						disabled={inviting}
					>
						<option value="therapist">Terapeuta</option>
						<option value="receptionist">Recepcionista</option>
						<option value="manager">Gerente</option>
						<option value="admin">Administrador</option>
					</select>
				</div>

				<div>
					<label for="inviteTitle" class="block text-sm font-medium text-gray-700 mb-1.5">
						Título/Puesto (opcional)
					</label>
					<input
						type="text"
						id="inviteTitle"
						bind:value={inviteTitle}
						placeholder="Ej: Terapeuta Senior"
						class="input-wellness"
						disabled={inviting}
					/>
				</div>

				<div class="flex gap-3 pt-4">
					<button
						type="button"
						onclick={() => showInviteModal = false}
						class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
						disabled={inviting}
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={inviting}
						class="flex-1 btn-primary-gradient py-2"
					>
						{#if inviting}
							Enviando...
						{:else}
							Enviar invitación
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
