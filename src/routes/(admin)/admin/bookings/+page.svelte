<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			bookings: Array<{
				id: string;
				status: string;
				scheduled_at: string;
				scheduled_end_at: string;
				price_cents: number;
				commission_cents: number;
				client_address: string | null;
				created_at: string;
				completed_at: string | null;
				client: {
					id: string;
					full_name: string;
					email: string;
				};
				therapist: {
					id: string;
					full_name: string;
					email: string;
				};
				service: string;
			}>;
			totalCount: number;
			currentPage: number;
			totalPages: number;
			statusCounts: {
				all: number;
				pending: number;
				confirmed: number;
				completed: number;
				cancelled: number;
			};
			stats: {
				totalRevenue: number;
				totalCommission: number;
				completedCount: number;
			};
			filters: {
				status: string;
				dateFrom: string;
				dateTo: string;
			};
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	const statusColors: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-700',
		confirmed: 'bg-blue-100 text-blue-700',
		completed: 'bg-green-100 text-green-700',
		cancelled: 'bg-red-100 text-red-700',
		cancelled_by_client: 'bg-red-100 text-red-700',
		cancelled_by_therapist: 'bg-red-100 text-red-700'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Pendiente',
		confirmed: 'Confirmada',
		completed: 'Completada',
		cancelled: 'Cancelada',
		cancelled_by_client: 'Cancelada',
		cancelled_by_therapist: 'Cancelada'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('es-MX', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString('es-MX', {
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

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedStatus !== 'all') params.set('status', selectedStatus);
		if (dateFrom) params.set('from', dateFrom);
		if (dateTo) params.set('to', dateTo);
		goto(`/admin/bookings?${params.toString()}`);
	}

	function clearFilters() {
		selectedStatus = 'all';
		dateFrom = '';
		dateTo = '';
		goto('/admin/bookings');
	}

	let selectedStatus = $state(data.filters.status);
	let dateFrom = $state(data.filters.dateFrom);
	let dateTo = $state(data.filters.dateTo);
</script>

<svelte:head>
	<title>Reservas - Admin Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Reservas</h1>
			<p class="text-gray-500 mt-1">{data.totalCount} reservas en total</p>
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
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Ingresos totales</p>
			<p class="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.totalRevenue)}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Comisión total</p>
			<p class="text-2xl font-bold text-green-600">{formatCurrency(data.stats.totalCommission)}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Reservas completadas</p>
			<p class="text-2xl font-bold text-gray-900">{data.stats.completedCount}</p>
		</div>
	</div>

	<!-- Status Tabs -->
	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each [
			{ value: 'all', label: 'Todas', count: data.statusCounts.all },
			{ value: 'pending', label: 'Pendientes', count: data.statusCounts.pending },
			{ value: 'confirmed', label: 'Confirmadas', count: data.statusCounts.confirmed },
			{ value: 'completed', label: 'Completadas', count: data.statusCounts.completed },
			{ value: 'cancelled', label: 'Canceladas', count: data.statusCounts.cancelled }
		] as tab}
			<button
				type="button"
				onclick={() => { selectedStatus = tab.value; applyFilters(); }}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
					{selectedStatus === tab.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				{tab.label} ({tab.count})
			</button>
		{/each}
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-4">
		<div class="flex flex-wrap gap-4 items-end">
			<div>
				<label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
				<input
					type="date"
					id="dateFrom"
					bind:value={dateFrom}
					class="border rounded-lg px-3 py-2"
				/>
			</div>
			<div>
				<label for="dateTo" class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
				<input
					type="date"
					id="dateTo"
					bind:value={dateTo}
					class="border rounded-lg px-3 py-2"
				/>
			</div>
			<button
				type="button"
				onclick={applyFilters}
				class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
			>
				Filtrar
			</button>
			<button
				type="button"
				onclick={clearFilters}
				class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
			>
				Limpiar
			</button>
		</div>
	</div>

	<!-- Bookings Table -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50 border-b border-gray-200">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terapeuta</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.bookings as booking}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4">
							<div>
								<p class="font-medium text-gray-900">{booking.client.full_name}</p>
								<p class="text-sm text-gray-500">{booking.client.email}</p>
							</div>
						</td>
						<td class="px-6 py-4">
							<div>
								<p class="font-medium text-gray-900">{booking.therapist.full_name}</p>
								<p class="text-sm text-gray-500">{booking.therapist.email}</p>
							</div>
						</td>
						<td class="px-6 py-4 text-gray-900">
							{booking.service}
						</td>
						<td class="px-6 py-4">
							<p class="text-gray-900">{formatDate(booking.scheduled_at)}</p>
							<p class="text-sm text-gray-500">{formatTime(booking.scheduled_at)} - {formatTime(booking.scheduled_end_at)}</p>
						</td>
						<td class="px-6 py-4">
							<span class="px-2 py-1 text-xs rounded-full {statusColors[booking.status]}">
								{statusLabels[booking.status] ?? booking.status}
							</span>
						</td>
						<td class="px-6 py-4">
							<p class="font-medium text-gray-900">{formatCurrency(booking.price_cents)}</p>
							<p class="text-xs text-green-600">+{formatCurrency(booking.commission_cents)}</p>
						</td>
						<td class="px-6 py-4 text-right">
							<div class="flex items-center justify-end gap-2">
								{#if booking.status === 'pending'}
									<form method="POST" action="?/updateStatus" use:enhance>
										<input type="hidden" name="bookingId" value={booking.id} />
										<input type="hidden" name="status" value="confirmed" />
										<button type="submit" class="text-sm text-blue-600 hover:text-blue-700">
											Confirmar
										</button>
									</form>
								{/if}
								{#if booking.status === 'confirmed'}
									<form method="POST" action="?/updateStatus" use:enhance>
										<input type="hidden" name="bookingId" value={booking.id} />
										<input type="hidden" name="status" value="completed" />
										<button type="submit" class="text-sm text-green-600 hover:text-green-700">
											Completar
										</button>
									</form>
								{/if}
								{#if !['completed', 'cancelled', 'cancelled_by_client', 'cancelled_by_therapist'].includes(booking.status)}
									<form method="POST" action="?/cancelBooking" use:enhance>
										<input type="hidden" name="bookingId" value={booking.id} />
										<button type="submit" class="text-sm text-red-600 hover:text-red-700">
											Cancelar
										</button>
									</form>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if data.bookings.length === 0}
			<div class="p-8 text-center text-gray-500">
				No se encontraron reservas
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
						href="/admin/bookings?page={data.currentPage - 1}&status={data.filters.status}&from={data.filters.dateFrom}&to={data.filters.dateTo}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Anterior
					</a>
				{/if}
				{#if data.currentPage < data.totalPages}
					<a
						href="/admin/bookings?page={data.currentPage + 1}&status={data.filters.status}&from={data.filters.dateFrom}&to={data.filters.dateTo}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Siguiente
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
