<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { data } = $props();

	const statusColors: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-800',
		approved: 'bg-green-100 text-green-800',
		rejected: 'bg-red-100 text-red-800',
		suspended: 'bg-gray-100 text-gray-800'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Pendiente',
		approved: 'Aprobado',
		rejected: 'Rechazado',
		suspended: 'Suspendido'
	};

	const tierLabels: Record<string, string> = {
		free: 'Gratis',
		pro: 'Pro',
		business: 'Business',
		enterprise: 'Enterprise'
	};

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
</script>

<div>
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Terapeutas</h1>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl shadow-sm p-4 mb-6">
		<div class="flex flex-wrap gap-2">
			<a
				href="/admin/therapists"
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {data.status === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				Todos ({data.totalCount})
			</a>
			<a
				href="/admin/therapists?status=pending"
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {data.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}"
			>
				Pendientes
			</a>
			<a
				href="/admin/therapists?status=approved"
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {data.status === 'approved' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}"
			>
				Aprobados
			</a>
			<a
				href="/admin/therapists?status=rejected"
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {data.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}"
			>
				Rechazados
			</a>
			<a
				href="/admin/therapists?status=suspended"
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {data.status === 'suspended' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				Suspendidos
			</a>
		</div>
	</div>

	<!-- Table -->
	<div class="bg-white rounded-xl shadow-sm overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Terapeuta
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Estado
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Plan
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Rating
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Registro
					</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
						Acciones
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.therapists as therapist}
					{@const t = therapist as {
						id: string;
						vetting_status: string;
						subscription_tier: string;
						rating_avg: number;
						rating_count: number;
						is_available: boolean;
						created_at: string;
						users: { full_name: string; email: string; phone: string };
					}}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4">
							<div>
								<p class="font-medium text-gray-900">{t.users.full_name}</p>
								<p class="text-sm text-gray-500">{t.users.email}</p>
								{#if t.users.phone}
									<p class="text-xs text-gray-400">{t.users.phone}</p>
								{/if}
							</div>
						</td>
						<td class="px-6 py-4">
							<span class="px-2 py-1 text-xs rounded-full {statusColors[t.vetting_status] ?? 'bg-gray-100'}">
								{statusLabels[t.vetting_status] ?? t.vetting_status}
							</span>
							{#if t.is_available}
								<span class="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block" title="Disponible"></span>
							{/if}
						</td>
						<td class="px-6 py-4">
							<span class="text-sm text-gray-900">{tierLabels[t.subscription_tier] ?? t.subscription_tier}</span>
						</td>
						<td class="px-6 py-4">
							{#if t.rating_count > 0}
								<div class="flex items-center gap-1">
									<svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
									</svg>
									<span class="text-sm text-gray-900">{t.rating_avg.toFixed(1)}</span>
									<span class="text-xs text-gray-500">({t.rating_count})</span>
								</div>
							{:else}
								<span class="text-sm text-gray-400">Sin reseñas</span>
							{/if}
						</td>
						<td class="px-6 py-4">
							<span class="text-sm text-gray-500">{formatDate(t.created_at)}</span>
						</td>
						<td class="px-6 py-4 text-right">
							<div class="flex items-center justify-end gap-2">
								{#if t.vetting_status === 'pending'}
									<form method="POST" action="?/approve" use:enhance>
										<input type="hidden" name="therapistId" value={t.id} />
										<button
											type="submit"
											class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
										>
											Aprobar
										</button>
									</form>
									<form method="POST" action="?/reject" use:enhance>
										<input type="hidden" name="therapistId" value={t.id} />
										<button
											type="submit"
											class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
										>
											Rechazar
										</button>
									</form>
								{:else if t.vetting_status === 'approved'}
									<form method="POST" action="?/suspend" use:enhance>
										<input type="hidden" name="therapistId" value={t.id} />
										<button
											type="submit"
											class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
										>
											Suspender
										</button>
									</form>
								{:else if t.vetting_status === 'suspended' || t.vetting_status === 'rejected'}
									<form method="POST" action="?/approve" use:enhance>
										<input type="hidden" name="therapistId" value={t.id} />
										<button
											type="submit"
											class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
										>
											Reactivar
										</button>
									</form>
								{/if}
								<a
									href="/admin/therapists/{t.id}"
									class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
								>
									Ver
								</a>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-6 py-12 text-center text-gray-500">
							No hay terapeutas en esta categoría
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="flex items-center justify-center gap-2 mt-6">
			{#if data.currentPage > 1}
				<a
					href="/admin/therapists?status={data.status}&page={data.currentPage - 1}"
					class="px-3 py-1 bg-white border rounded hover:bg-gray-50"
				>
					← Anterior
				</a>
			{/if}
			<span class="text-sm text-gray-600">
				Página {data.currentPage} de {data.totalPages}
			</span>
			{#if data.currentPage < data.totalPages}
				<a
					href="/admin/therapists?status={data.status}&page={data.currentPage + 1}"
					class="px-3 py-1 bg-white border rounded hover:bg-gray-50"
				>
					Siguiente →
				</a>
			{/if}
		</div>
	{/if}
</div>
