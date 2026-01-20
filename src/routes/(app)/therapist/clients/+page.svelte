<script lang="ts">
	let { data } = $props();

	let searchQuery = $state('');

	// Filter clients based on search
	const filteredClients = $derived(
		data.clients.filter((client: any) => {
			const query = searchQuery.toLowerCase();
			return (
				client.full_name?.toLowerCase().includes(query) ||
				client.email?.toLowerCase().includes(query) ||
				client.phone?.toLowerCase().includes(query)
			);
		})
	);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Directorio de Clientes - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Directorio de Clientes</h1>
		<p class="text-gray-500">Gestiona tu lista de clientes</p>
	</div>

	<!-- Search Bar -->
	<div class="bg-white rounded-xl border border-gray-100 p-4">
		<div class="relative">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Buscar por nombre, email o teléfono..."
				class="input-wellness pl-10 w-full"
			/>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
					<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{data.clients.length}</p>
					<p class="text-sm text-gray-500">Clientes totales</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{data.stats.completedBookings}</p>
					<p class="text-sm text-gray-500">Citas completadas</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{data.stats.upcomingBookings}</p>
					<p class="text-sm text-gray-500">Citas próximas</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Clients List -->
	{#if filteredClients.length > 0}
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-100">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Cliente
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Contacto
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Citas
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Última cita
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each filteredClients as client}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
											{#if client.avatar_url}
												<img src={client.avatar_url} alt="" class="w-full h-full rounded-full object-cover" />
											{:else}
												<span class="text-sm font-medium text-primary-600">
													{(client.full_name ?? '?')[0].toUpperCase()}
												</span>
											{/if}
										</div>
										<div>
											<p class="font-medium text-gray-900">{client.full_name}</p>
											<p class="text-sm text-gray-500">Cliente desde {formatDate(client.created_at)}</p>
										</div>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="space-y-1">
										<p class="text-sm text-gray-900">{client.email}</p>
										{#if client.phone}
											<p class="text-sm text-gray-500">{client.phone}</p>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="space-y-1">
										<p class="text-sm font-medium text-gray-900">{client.total_bookings} total</p>
										<p class="text-sm text-gray-500">{client.completed_bookings} completadas</p>
									</div>
								</td>
								<td class="px-6 py-4">
									{#if client.last_booking_date}
										<p class="text-sm text-gray-900">{formatDate(client.last_booking_date)}</p>
									{:else}
										<p class="text-sm text-gray-400 italic">Sin citas</p>
									{/if}
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-2">
										<a
											href="/therapist/clients/{client.id}"
											class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
										>
											Ver perfil
										</a>
										<a
											href="/therapist/bookings/create?client={client.id}"
											class="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
										>
											Nueva cita
										</a>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-100 p-12 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				{searchQuery ? 'No se encontraron clientes' : 'Aún no tienes clientes'}
			</h3>
			<p class="text-gray-500">
				{searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los clientes aparecerán aquí cuando reserven contigo'}
			</p>
		</div>
	{/if}
</div>
