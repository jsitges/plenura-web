<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Track which services the therapist already has
	let myServiceIds = $derived(new Set(data.myServices.map((s) => s.service_id)));

	// Filter state
	let selectedCategory = $state('all');
	let showAddModal = $state(false);
	let selectedService = $state<(typeof data.allServices)[0] | null>(null);
	let editingService = $state<(typeof data.myServices)[0] | null>(null);

	// Form state for adding/editing
	let formPrice = $state(0);
	let formDuration = $state(60);
	let saving = $state(false);

	// Group services by category for display
	let servicesByCategory = $derived(() => {
		const grouped = new Map<
			string,
			{
				category: { id: string; name: string; name_es: string; icon: string | null };
				services: typeof data.allServices;
			}
		>();

		for (const service of data.allServices) {
			const cat = service.categories;
			if (!grouped.has(cat.id)) {
				grouped.set(cat.id, { category: cat, services: [] });
			}
			grouped.get(cat.id)!.services.push(service);
		}

		return Array.from(grouped.values());
	});

	// Filter my services by category
	let filteredMyServices = $derived(
		selectedCategory === 'all'
			? data.myServices
			: data.myServices.filter((s) => s.services.category_id === selectedCategory)
	);

	function openAddModal(service: (typeof data.allServices)[0]) {
		selectedService = service;
		formPrice = service.default_price_cents / 100;
		formDuration = service.default_duration_minutes;
		showAddModal = true;
	}

	function openEditModal(therapistService: (typeof data.myServices)[0]) {
		editingService = therapistService;
		formPrice = therapistService.price_cents / 100;
		formDuration = therapistService.duration_minutes;
	}

	function closeModals() {
		showAddModal = false;
		selectedService = null;
		editingService = null;
	}

	function formatPrice(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(cents / 100);
	}
</script>

<svelte:head>
	<title>Mis Servicios - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Mis Servicios</h1>
		<p class="text-gray-500">Configura los servicios que ofreces y sus precios</p>
	</div>

	<!-- Category Filter -->
	<div class="flex gap-2 overflow-x-auto pb-2">
		<button
			onclick={() => (selectedCategory = 'all')}
			class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {selectedCategory ===
			'all'
				? 'bg-primary-600 text-white'
				: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
		>
			Todos
		</button>
		{#each data.categories as category}
			<button
				onclick={() => (selectedCategory = category.id)}
				class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors {selectedCategory ===
				category.id
					? 'bg-primary-600 text-white'
					: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				{category.name_es || category.name}
			</button>
		{/each}
	</div>

	<!-- My Active Services -->
	{#if filteredMyServices.length > 0}
		<div class="bg-white rounded-xl border border-gray-100">
			<div class="p-4 border-b border-gray-100">
				<h2 class="font-semibold text-gray-900">Servicios Activos ({filteredMyServices.length})</h2>
			</div>
			<div class="divide-y divide-gray-100">
				{#each filteredMyServices as therapistService}
					<div class="p-4 flex items-center gap-4">
						<div
							class="w-10 h-10 rounded-lg flex items-center justify-center {therapistService.is_active
								? 'bg-primary-100'
								: 'bg-gray-100'}"
						>
							<span class={therapistService.is_active ? 'text-primary-600' : 'text-gray-400'}>
								{therapistService.services.categories?.icon || '✨'}
							</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<h3 class="font-medium text-gray-900 truncate">
									{therapistService.services.name_es || therapistService.services.name}
								</h3>
								{#if !therapistService.is_active}
									<span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
										>Pausado</span
									>
								{/if}
							</div>
							<p class="text-sm text-gray-500">
								{formatPrice(therapistService.price_cents)} · {therapistService.duration_minutes} min
							</p>
						</div>
						<div class="flex items-center gap-2">
							<button
								onclick={() => openEditModal(therapistService)}
								class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
								title="Editar"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>
							<form
								method="POST"
								action="?/toggle"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="therapist_service_id" value={therapistService.id} />
								<button
									type="submit"
									class="p-2 rounded-lg transition-colors {therapistService.is_active
										? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
										: 'text-green-500 hover:text-green-600 hover:bg-green-50'}"
									title={therapistService.is_active ? 'Pausar' : 'Activar'}
								>
									{#if therapistService.is_active}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									{:else}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									{/if}
								</button>
							</form>
							<form
								method="POST"
								action="?/remove"
								use:enhance={() => {
									if (!confirm('¿Estás seguro de eliminar este servicio?')) {
										return () => {};
									}
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="therapist_service_id" value={therapistService.id} />
								<button
									type="submit"
									class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
									title="Eliminar"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-100 p-8 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
					/>
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No tienes servicios configurados</h3>
			<p class="text-gray-500 mb-4">Agrega servicios del catálogo para que los clientes puedan reservar contigo</p>
		</div>
	{/if}

	<!-- Available Services to Add -->
	<div class="bg-white rounded-xl border border-gray-100">
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Agregar Servicios</h2>
			<p class="text-sm text-gray-500">Selecciona los servicios que deseas ofrecer</p>
		</div>

		<div class="divide-y divide-gray-100">
			{#each servicesByCategory() as group}
				{#if selectedCategory === 'all' || selectedCategory === group.category.id}
					<div class="p-4">
						<h3 class="text-sm font-medium text-gray-500 mb-3">
							{group.category.icon || '📁'}
							{group.category.name_es || group.category.name}
						</h3>
						<div class="grid gap-3">
							{#each group.services as service}
								{@const alreadyAdded = myServiceIds.has(service.id)}
								<div
									class="flex items-center gap-4 p-3 rounded-lg border {alreadyAdded
										? 'border-gray-100 bg-gray-50'
										: 'border-gray-200 hover:border-primary-200 hover:bg-primary-50/30'} transition-colors"
								>
									<div class="flex-1 min-w-0">
										<h4 class="font-medium text-gray-900">
											{service.name_es || service.name}
										</h4>
										{#if service.description}
											<p class="text-sm text-gray-500 truncate">{service.description}</p>
										{/if}
										<p class="text-xs text-gray-400 mt-1">
											Precio sugerido: {formatPrice(service.default_price_cents)} · {service.default_duration_minutes}
											min
										</p>
									</div>
									{#if alreadyAdded}
										<span class="text-sm text-green-600 font-medium flex items-center gap-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												/>
											</svg>
											Agregado
										</span>
									{:else}
										<button
											onclick={() => openAddModal(service)}
											class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
										>
											Agregar
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>

<!-- Add Service Modal -->
{#if showAddModal && selectedService}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl max-w-md w-full p-6">
			<h2 class="text-xl font-bold text-gray-900 mb-2">Agregar Servicio</h2>
			<p class="text-gray-500 mb-4">{selectedService.name_es || selectedService.name}</p>

			<form
				method="POST"
				action="?/add"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update();
						saving = false;
						closeModals();
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="service_id" value={selectedService.id} />
				<input type="hidden" name="price_cents" value={Math.round(formPrice * 100)} />

				<div>
					<label for="price" class="block text-sm font-medium text-gray-700 mb-1">
						Precio (MXN)
					</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
						<input
							type="number"
							id="price"
							bind:value={formPrice}
							min="0"
							step="50"
							class="input-wellness pl-8"
							required
						/>
					</div>
					<p class="text-xs text-gray-500 mt-1">
						Precio sugerido: {formatPrice(selectedService.default_price_cents)}
					</p>
				</div>

				<div>
					<label for="duration" class="block text-sm font-medium text-gray-700 mb-1">
						Duración (minutos)
					</label>
					<select id="duration" name="duration_minutes" bind:value={formDuration} class="input-wellness">
						<option value={30}>30 minutos</option>
						<option value={45}>45 minutos</option>
						<option value={60}>1 hora</option>
						<option value={90}>1 hora 30 min</option>
						<option value={120}>2 horas</option>
					</select>
				</div>

				<div class="flex gap-3 pt-4">
					<button
						type="button"
						onclick={closeModals}
						class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={saving}
						class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
					>
						{saving ? 'Guardando...' : 'Agregar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Service Modal -->
{#if editingService}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl max-w-md w-full p-6">
			<h2 class="text-xl font-bold text-gray-900 mb-2">Editar Servicio</h2>
			<p class="text-gray-500 mb-4">{editingService.services.name_es || editingService.services.name}</p>

			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update();
						saving = false;
						closeModals();
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="therapist_service_id" value={editingService.id} />
				<input type="hidden" name="price_cents" value={Math.round(formPrice * 100)} />

				<div>
					<label for="edit_price" class="block text-sm font-medium text-gray-700 mb-1">
						Precio (MXN)
					</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
						<input
							type="number"
							id="edit_price"
							bind:value={formPrice}
							min="0"
							step="50"
							class="input-wellness pl-8"
							required
						/>
					</div>
				</div>

				<div>
					<label for="edit_duration" class="block text-sm font-medium text-gray-700 mb-1">
						Duración (minutos)
					</label>
					<select id="edit_duration" name="duration_minutes" bind:value={formDuration} class="input-wellness">
						<option value={30}>30 minutos</option>
						<option value={45}>45 minutos</option>
						<option value={60}>1 hora</option>
						<option value={90}>1 hora 30 min</option>
						<option value={120}>2 horas</option>
					</select>
				</div>

				<div class="flex gap-3 pt-4">
					<button
						type="button"
						onclick={closeModals}
						class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={saving}
						class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
					>
						{saving ? 'Guardando...' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
