<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			users: Array<{
				id: string;
				email: string;
				full_name: string;
				phone: string | null;
				avatar_url: string | null;
				role: string;
				created_at: string;
				last_sign_in_at: string | null;
				is_blocked: boolean;
				is_therapist: boolean;
				is_practice_member: boolean;
			}>;
			totalCount: number;
			currentPage: number;
			totalPages: number;
			roleCounts: {
				all: number;
				client: number;
				therapist: number;
				admin: number;
			};
			filters: {
				search: string;
				role: string;
			};
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	const roleLabels: Record<string, string> = {
		client: 'Cliente',
		therapist: 'Terapeuta',
		admin: 'Admin'
	};

	const roleColors: Record<string, string> = {
		client: 'bg-blue-100 text-blue-700',
		therapist: 'bg-green-100 text-green-700',
		admin: 'bg-purple-100 text-purple-700'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (selectedRole !== 'all') params.set('role', selectedRole);
		goto(`/admin/users?${params.toString()}`);
	}

	let searchQuery = $state(data.filters.search);
	let selectedRole = $state(data.filters.role);
</script>

<svelte:head>
	<title>Usuarios - Admin Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Usuarios</h1>
			<p class="text-gray-500 mt-1">{data.totalCount} usuarios registrados</p>
		</div>
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

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-4">
		<div class="flex flex-wrap gap-4 items-end">
			<div class="flex-1 min-w-[200px]">
				<label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
				<input
					type="text"
					id="search"
					bind:value={searchQuery}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					placeholder="Email o nombre..."
					class="w-full border rounded-lg px-3 py-2"
				/>
			</div>
			<div>
				<label for="role" class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
				<select
					id="role"
					bind:value={selectedRole}
					onchange={applyFilters}
					class="border rounded-lg px-3 py-2"
				>
					<option value="all">Todos ({data.roleCounts.all})</option>
					<option value="client">Clientes ({data.roleCounts.client})</option>
					<option value="therapist">Terapeutas ({data.roleCounts.therapist})</option>
					<option value="admin">Admins ({data.roleCounts.admin})</option>
				</select>
			</div>
			<button
				type="button"
				onclick={applyFilters}
				class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
			>
				Buscar
			</button>
		</div>
	</div>

	<!-- Users Table -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50 border-b border-gray-200">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último acceso</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.users as user}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4">
							<div class="flex items-center gap-3">
								{#if user.avatar_url}
									<img src={user.avatar_url} alt="" class="w-10 h-10 rounded-full object-cover" />
								{:else}
									<div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
										<span class="text-gray-600 font-medium">{user.full_name?.charAt(0) ?? user.email.charAt(0)}</span>
									</div>
								{/if}
								<div>
									<p class="font-medium text-gray-900">{user.full_name ?? 'Sin nombre'}</p>
									<p class="text-sm text-gray-500">{user.email}</p>
								</div>
							</div>
						</td>
						<td class="px-6 py-4">
							<div class="flex flex-wrap gap-1">
								<span class="px-2 py-1 text-xs rounded-full {roleColors[user.role] ?? 'bg-gray-100 text-gray-700'}">
									{roleLabels[user.role] ?? user.role}
								</span>
								{#if user.is_therapist}
									<span class="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-700">
										Terapeuta
									</span>
								{/if}
								{#if user.is_practice_member}
									<span class="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
										Práctica
									</span>
								{/if}
							</div>
						</td>
						<td class="px-6 py-4 text-gray-500">
							{formatDate(user.created_at)}
						</td>
						<td class="px-6 py-4 text-gray-500">
							{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca'}
						</td>
						<td class="px-6 py-4">
							{#if user.is_blocked}
								<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Bloqueado</span>
							{:else}
								<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Activo</span>
							{/if}
						</td>
						<td class="px-6 py-4 text-right">
							<div class="flex items-center justify-end gap-2">
								{#if user.is_blocked}
									<form method="POST" action="?/unblockUser" use:enhance>
										<input type="hidden" name="userId" value={user.id} />
										<button type="submit" class="text-sm text-green-600 hover:text-green-700">
											Desbloquear
										</button>
									</form>
								{:else}
									<form method="POST" action="?/blockUser" use:enhance>
										<input type="hidden" name="userId" value={user.id} />
										<button type="submit" class="text-sm text-red-600 hover:text-red-700">
											Bloquear
										</button>
									</form>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if data.users.length === 0}
			<div class="p-8 text-center text-gray-500">
				No se encontraron usuarios
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="flex items-center justify-between">
			<p class="text-sm text-gray-500">
				Página {data.currentPage} de {data.totalPages}
			</p>
			<div class="flex gap-2">
				{#if data.currentPage > 1}
					<a
						href="/admin/users?page={data.currentPage - 1}&search={data.filters.search}&role={data.filters.role}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Anterior
					</a>
				{/if}
				{#if data.currentPage < data.totalPages}
					<a
						href="/admin/users?page={data.currentPage + 1}&search={data.filters.search}&role={data.filters.role}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Siguiente
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
