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
				practice_commission_cents: number;
				client_address: string;
				notes: string | null;
				assigned_by: string | null;
				assignment_notes: string | null;
				therapist_id: string;
				therapists: {
					id: string;
					users: { full_name: string; avatar_url: string | null };
				};
				users: {
					id: string;
					full_name: string;
					email: string;
					phone: string | null;
				};
				therapist_services: {
					services: { name: string; name_es: string };
				};
			}>;
			therapists: Array<{ id: string; name: string }>;
			statusCounts: {
				all: number;
				pending: number;
				confirmed: number;
				completed: number;
				cancelled: number;
			};
			filters: {
				status: string;
				therapistId: string;
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
		pending: 'bg-amber-100 text-amber-800',
		confirmed: 'bg-blue-100 text-blue-800',
		completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800',
		cancelled_by_client: 'bg-red-100 text-red-800',
		cancelled_by_therapist: 'bg-red-100 text-red-800'
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
		if (selectedTherapist !== 'all') params.set('therapist', selectedTherapist);
		if (dateFrom) params.set('from', dateFrom);
		if (dateTo) params.set('to', dateTo);
		goto(`/practice/bookings?${params.toString()}`);
	}

	function clearFilters() {
		selectedStatus = 'all';
		selectedTherapist = 'all';
		dateFrom = '';
		dateTo = '';
		goto('/practice/bookings');
	}

	let selectedStatus = $state(data.filters.status);
	let selectedTherapist = $state(data.filters.therapistId);
	let dateFrom = $state(data.filters.dateFrom);
	let dateTo = $state(data.filters.dateTo);

	let showAssignModal = $state(false);
	let selectedBooking = $state<string | null>(null);
	let assignTherapistId = $state('');
	let assignNotes = $state('');
</script>

<svelte:head>
	<title>Reservas - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Reservas</h1>
			<p class="text-gray-500 mt-1">Gestiona las reservas de tu equipo</p>
		</div>
	</div>

	<!-- Success/Error Messages -->
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

	<!-- Status Tabs -->
	<div class="flex gap-2 overflow-x-auto pb-2">
		<button
			type="button"
			onclick={() => { selectedStatus = 'all'; applyFilters(); }}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
				{selectedStatus === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
		>
			Todas ({data.statusCounts.all})
		</button>
		<button
			type="button"
			onclick={() => { selectedStatus = 'pending'; applyFilters(); }}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
				{selectedStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}"
		>
			Pendientes ({data.statusCounts.pending})
		</button>
		<button
			type="button"
			onclick={() => { selectedStatus = 'confirmed'; applyFilters(); }}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
				{selectedStatus === 'confirmed' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}"
		>
			Confirmadas ({data.statusCounts.confirmed})
		</button>
		<button
			type="button"
			onclick={() => { selectedStatus = 'completed'; applyFilters(); }}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
				{selectedStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}"
		>
			Completadas ({data.statusCounts.completed})
		</button>
		<button
			type="button"
			onclick={() => { selectedStatus = 'cancelled'; applyFilters(); }}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
				{selectedStatus === 'cancelled' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}"
		>
			Canceladas ({data.statusCounts.cancelled})
		</button>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-4">
		<div class="grid sm:grid-cols-4 gap-4">
			<div>
				<label for="therapist" class="block text-sm font-medium text-gray-700 mb-1">Terapeuta</label>
				<select
					id="therapist"
					bind:value={selectedTherapist}
					onchange={applyFilters}
					class="w-full border rounded-lg px-3 py-2"
				>
					<option value="all">Todos los terapeutas</option>
					{#each data.therapists as therapist}
						<option value={therapist.id}>{therapist.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
				<input
					type="date"
					id="dateFrom"
					bind:value={dateFrom}
					onchange={applyFilters}
					class="w-full border rounded-lg px-3 py-2"
				/>
			</div>
			<div>
				<label for="dateTo" class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
				<input
					type="date"
					id="dateTo"
					bind:value={dateTo}
					onchange={applyFilters}
					class="w-full border rounded-lg px-3 py-2"
				/>
			</div>
			<div class="flex items-end">
				<button
					type="button"
					onclick={clearFilters}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Limpiar filtros
				</button>
			</div>
		</div>
	</div>

	<!-- Bookings List -->
	{#if data.bookings.length === 0}
		<div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
			<p class="text-gray-500">No se encontraron reservas con los filtros seleccionados</p>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<table class="w-full">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terapeuta</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
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
									<p class="font-medium text-gray-900">{booking.users.full_name}</p>
									<p class="text-sm text-gray-500">{booking.users.email}</p>
								</div>
							</td>
							<td class="px-6 py-4">
								<p class="text-gray-900">{booking.therapist_services.services.name_es}</p>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-2">
									{#if booking.therapists.users.avatar_url}
										<img src={booking.therapists.users.avatar_url} alt="" class="w-8 h-8 rounded-full object-cover" />
									{:else}
										<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
											<span class="text-sm font-medium text-primary-600">{booking.therapists.users.full_name.charAt(0)}</span>
										</div>
									{/if}
									<span class="text-gray-900">{booking.therapists.users.full_name}</span>
								</div>
							</td>
							<td class="px-6 py-4">
								<p class="text-gray-900">{formatDate(booking.scheduled_at)}</p>
								<p class="text-sm text-gray-500">{formatTime(booking.scheduled_at)} - {formatTime(booking.scheduled_end_at)}</p>
							</td>
							<td class="px-6 py-4">
								<span class="px-2 py-1 text-xs rounded-full {statusColors[booking.status] ?? 'bg-gray-100 text-gray-700'}">
									{statusLabels[booking.status] ?? booking.status}
								</span>
							</td>
							<td class="px-6 py-4">
								<p class="font-medium text-gray-900">{formatCurrency(booking.price_cents)}</p>
								{#if booking.practice_commission_cents > 0}
									<p class="text-xs text-green-600">+{formatCurrency(booking.practice_commission_cents)} comisión</p>
								{/if}
							</td>
							<td class="px-6 py-4 text-right">
								<div class="flex items-center justify-end gap-2">
									{#if booking.status === 'pending'}
										<form method="POST" action="?/updateStatus" use:enhance>
											<input type="hidden" name="bookingId" value={booking.id} />
											<input type="hidden" name="status" value="confirmed" />
											<button type="submit" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
												Confirmar
											</button>
										</form>
									{/if}
									{#if booking.status === 'confirmed'}
										<form method="POST" action="?/updateStatus" use:enhance>
											<input type="hidden" name="bookingId" value={booking.id} />
											<input type="hidden" name="status" value="completed" />
											<button type="submit" class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
												Completar
											</button>
										</form>
									{/if}
									<button
										type="button"
										onclick={() => { selectedBooking = booking.id; assignTherapistId = booking.therapist_id; showAssignModal = true; }}
										class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
									>
										Reasignar
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Assign Therapist Modal -->
{#if showAssignModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
			<h3 class="text-lg font-semibold mb-4">Asignar Terapeuta</h3>
			<form method="POST" action="?/assignTherapist" use:enhance>
				<input type="hidden" name="bookingId" value={selectedBooking} />

				<div class="mb-4">
					<label for="assignTherapist" class="block text-sm font-medium text-gray-700 mb-1">
						Terapeuta
					</label>
					<select
						id="assignTherapist"
						name="therapistId"
						bind:value={assignTherapistId}
						class="w-full border rounded-lg px-3 py-2"
						required
					>
						{#each data.therapists as therapist}
							<option value={therapist.id}>{therapist.name}</option>
						{/each}
					</select>
				</div>

				<div class="mb-4">
					<label for="assignNotes" class="block text-sm font-medium text-gray-700 mb-1">
						Notas (opcional)
					</label>
					<textarea
						id="assignNotes"
						name="notes"
						bind:value={assignNotes}
						rows="2"
						class="w-full border rounded-lg px-3 py-2"
						placeholder="Razón de la reasignación..."
					></textarea>
				</div>

				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={() => { showAssignModal = false; selectedBooking = null; assignNotes = ''; }}
						class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
					>
						Cancelar
					</button>
					<button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
						Asignar
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
