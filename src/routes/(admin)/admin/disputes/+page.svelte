<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			disputes: Array<{
				id: string;
				bookingId: string;
				colectivaDisputeId: string | null;
				status: string;
				reason: string | null;
				resolutionNotes: string | null;
				assignedTo: string | null;
				assignedUserName: string | null;
				openedAt: string;
				resolvedAt: string | null;
				booking: {
					scheduledAt: string;
					priceCents: number;
					clientName: string;
					clientEmail: string;
					therapistName: string;
					therapistEmail: string;
				};
			}>;
			totalCount: number;
			currentPage: number;
			totalPages: number;
			stats: {
				total: number;
				open: number;
				investigating: number;
				resolved: number;
			};
			adminUsers: Array<{ id: string; full_name: string }>;
			filters: {
				status: string;
			};
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(cents / 100);
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'open':
				return 'bg-red-100 text-red-700';
			case 'investigating':
				return 'bg-amber-100 text-amber-700';
			case 'resolved_for_client':
			case 'resolved_for_therapist':
				return 'bg-green-100 text-green-700';
			case 'closed':
				return 'bg-gray-100 text-gray-700';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'open':
				return 'Abierta';
			case 'investigating':
				return 'En investigación';
			case 'resolved_for_client':
				return 'Resuelta (Cliente)';
			case 'resolved_for_therapist':
				return 'Resuelta (Terapeuta)';
			case 'closed':
				return 'Cerrada';
			default:
				return status;
		}
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedStatus !== 'all') params.set('status', selectedStatus);
		goto(`/admin/disputes?${params.toString()}`);
	}

	let selectedStatus = $state(data.filters.status);
	let expandedDispute = $state<string | null>(null);
</script>

<svelte:head>
	<title>Disputas - Admin Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Disputas de Pago</h1>
			<p class="text-gray-500 mt-1">{data.totalCount} disputas en total</p>
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

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Total</p>
			<p class="text-2xl font-bold text-gray-900">{data.stats.total}</p>
		</div>
		<div class="bg-white rounded-xl border border-red-200 p-4">
			<p class="text-sm text-gray-500">Abiertas</p>
			<p class="text-2xl font-bold text-red-600">{data.stats.open}</p>
		</div>
		<div class="bg-white rounded-xl border border-amber-200 p-4">
			<p class="text-sm text-gray-500">En investigación</p>
			<p class="text-2xl font-bold text-amber-600">{data.stats.investigating}</p>
		</div>
		<div class="bg-white rounded-xl border border-green-200 p-4">
			<p class="text-sm text-gray-500">Resueltas</p>
			<p class="text-2xl font-bold text-green-600">{data.stats.resolved}</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-4">
		<div class="flex gap-4 items-end">
			<div>
				<label for="status" class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
				<select
					id="status"
					bind:value={selectedStatus}
					onchange={applyFilters}
					class="border rounded-lg px-3 py-2"
				>
					<option value="all">Todas</option>
					<option value="open">Abiertas</option>
					<option value="investigating">En investigación</option>
					<option value="resolved_for_client">Resueltas (Cliente)</option>
					<option value="resolved_for_therapist">Resueltas (Terapeuta)</option>
					<option value="closed">Cerradas</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Disputes List -->
	<div class="space-y-4">
		{#each data.disputes as dispute}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<button
					type="button"
					class="w-full p-6 text-left hover:bg-gray-50 transition-colors"
					onclick={() => (expandedDispute = expandedDispute === dispute.id ? null : dispute.id)}
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<span class="px-2 py-1 text-xs rounded-full {getStatusColor(dispute.status)}">
									{getStatusLabel(dispute.status)}
								</span>
								<span class="text-sm text-gray-500">
									Abierta: {formatDate(dispute.openedAt)}
								</span>
							</div>
							<div class="grid md:grid-cols-2 gap-4">
								<div>
									<p class="text-sm text-gray-500">Cliente</p>
									<p class="font-medium text-gray-900">{dispute.booking.clientName}</p>
									<p class="text-sm text-gray-500">{dispute.booking.clientEmail}</p>
								</div>
								<div>
									<p class="text-sm text-gray-500">Terapeuta</p>
									<p class="font-medium text-gray-900">{dispute.booking.therapistName}</p>
									<p class="text-sm text-gray-500">{dispute.booking.therapistEmail}</p>
								</div>
							</div>
							<div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
								<span>Monto: <strong class="text-gray-900">{formatCurrency(dispute.booking.priceCents)}</strong></span>
								{#if dispute.assignedUserName}
									<span>Asignado a: <strong class="text-gray-900">{dispute.assignedUserName}</strong></span>
								{/if}
							</div>
						</div>
						<svg
							class="w-5 h-5 text-gray-400 transition-transform {expandedDispute === dispute.id
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				</button>

				{#if expandedDispute === dispute.id}
					<div class="border-t border-gray-200 p-6 bg-gray-50">
						<div class="space-y-4">
							{#if dispute.reason}
								<div>
									<p class="text-sm font-medium text-gray-700">Razón de la disputa</p>
									<p class="text-gray-900 mt-1">{dispute.reason}</p>
								</div>
							{/if}

							{#if dispute.resolutionNotes}
								<div>
									<p class="text-sm font-medium text-gray-700">Notas de resolución</p>
									<p class="text-gray-900 mt-1">{dispute.resolutionNotes}</p>
								</div>
							{/if}

							<div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
								<!-- Assign Form -->
								<form method="POST" action="?/assignDispute" use:enhance class="space-y-2">
									<input type="hidden" name="disputeId" value={dispute.id} />
									<label for="assignedTo-{dispute.id}" class="block text-sm font-medium text-gray-700">
										Asignar a
									</label>
									<div class="flex gap-2">
										<select
											id="assignedTo-{dispute.id}"
											name="assignedTo"
											class="flex-1 border rounded-lg px-3 py-2 text-sm"
										>
											<option value="">Sin asignar</option>
											{#each data.adminUsers as admin}
												<option value={admin.id} selected={admin.id === dispute.assignedTo}>
													{admin.full_name}
												</option>
											{/each}
										</select>
										<button type="submit" class="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
											Asignar
										</button>
									</div>
								</form>

								<!-- Status Update Form -->
								<form method="POST" action="?/updateStatus" use:enhance class="space-y-2">
									<input type="hidden" name="disputeId" value={dispute.id} />
									<label for="status-{dispute.id}" class="block text-sm font-medium text-gray-700">
										Cambiar estado
									</label>
									<div class="flex gap-2">
										<select
											id="status-{dispute.id}"
											name="status"
											class="flex-1 border rounded-lg px-3 py-2 text-sm"
										>
											<option value="open" selected={dispute.status === 'open'}>Abierta</option>
											<option value="investigating" selected={dispute.status === 'investigating'}>
												En investigación
											</option>
											<option value="resolved_for_client" selected={dispute.status === 'resolved_for_client'}>
												Resuelta (Cliente gana)
											</option>
											<option value="resolved_for_therapist" selected={dispute.status === 'resolved_for_therapist'}>
												Resuelta (Terapeuta gana)
											</option>
											<option value="closed" selected={dispute.status === 'closed'}>Cerrada</option>
										</select>
										<button type="submit" class="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
											Actualizar
										</button>
									</div>
									<textarea
										name="resolutionNotes"
										placeholder="Notas de resolución (opcional)"
										rows="2"
										class="w-full border rounded-lg px-3 py-2 text-sm mt-2"
									></textarea>
								</form>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/each}

		{#if data.disputes.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
				No se encontraron disputas
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
						href="/admin/disputes?page={data.currentPage - 1}&status={data.filters.status}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Anterior
					</a>
				{/if}
				{#if data.currentPage < data.totalPages}
					<a
						href="/admin/disputes?page={data.currentPage + 1}&status={data.filters.status}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Siguiente
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
