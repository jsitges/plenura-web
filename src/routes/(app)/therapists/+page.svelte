<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	let searchQuery = $state(data.filters.query ?? '');
	let selectedCategory = $state(data.filters.categoryId ?? '');
	let selectedService = $state(data.filters.serviceId ?? '');
	let minRating = $state(data.filters.minRating ?? 0);
	let showFilters = $state(false);

	const categoryIcons: Record<string, string> = {
		'massage': '💆',
		'physiotherapy': '🏃',
		'psychology': '🧠',
		'nutrition': '🥗',
		'yoga': '🧘',
		'spa': '🛁'
	};

	function getCategoryIcon(slug: string): string {
		return categoryIcons[slug] ?? '✨';
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedCategory) params.set('category', selectedCategory);
		if (selectedService) params.set('service', selectedService);
		if (minRating > 0) params.set('rating', String(minRating));

		goto(`/therapists?${params.toString()}`);
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategory = '';
		selectedService = '';
		minRating = 0;
		goto('/therapists');
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		applyFilters();
	}

	// Get min price for a therapist (in cents, convert to display)
	function getMinPrice(therapist: (typeof data.therapists)[0]): number {
		if (!therapist.therapist_services?.length) return 0;
		return Math.min(...therapist.therapist_services.map(s => s.price_cents)) / 100;
	}

	// Format price (expects pesos, not cents)
	function formatPrice(price: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(price);
	}
</script>

<svelte:head>
	<title>Buscar Terapeutas - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Encuentra tu terapeuta ideal</h1>
		<p class="text-gray-500 mt-1">Profesionales verificados cerca de ti</p>
	</div>

	<!-- Search Bar -->
	<form onsubmit={handleSearch} class="flex gap-3">
		<div class="flex-1 relative">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Buscar por nombre, especialidad..."
				class="input-wellness pl-10"
			/>
		</div>
		<button type="submit" class="btn-primary-gradient px-6">
			Buscar
		</button>
		<button
			type="button"
			onclick={() => showFilters = !showFilters}
			class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
			</svg>
			<span class="hidden sm:inline">Filtros</span>
		</button>
	</form>

	<!-- Filters Panel -->
	{#if showFilters}
		<div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<!-- Category Filter -->
				<div>
					<label for="category" class="block text-sm font-medium text-gray-700 mb-1">
						Categoría
					</label>
					<select
						id="category"
						bind:value={selectedCategory}
						onchange={applyFilters}
						class="input-wellness"
					>
						<option value="">Todas las categorías</option>
						{#each data.categories as category}
							<option value={category.id}>
								{getCategoryIcon(category.slug)} {category.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Service Filter -->
				<div>
					<label for="service" class="block text-sm font-medium text-gray-700 mb-1">
						Servicio
					</label>
					<select
						id="service"
						bind:value={selectedService}
						onchange={applyFilters}
						class="input-wellness"
					>
						<option value="">Todos los servicios</option>
						{#each data.services as service}
							<option value={service.id}>{service.name}</option>
						{/each}
					</select>
				</div>

				<!-- Rating Filter -->
				<div>
					<label for="rating" class="block text-sm font-medium text-gray-700 mb-1">
						Rating mínimo
					</label>
					<select
						id="rating"
						bind:value={minRating}
						onchange={applyFilters}
						class="input-wellness"
					>
						<option value={0}>Cualquier rating</option>
						<option value={4}>4+ estrellas</option>
						<option value={4.5}>4.5+ estrellas</option>
						<option value={5}>5 estrellas</option>
					</select>
				</div>

				<!-- Clear Filters -->
				<div class="flex items-end">
					<button
						type="button"
						onclick={clearFilters}
						class="w-full px-4 py-3 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Limpiar filtros
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Category Pills -->
	<div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
		<button
			type="button"
			onclick={() => { selectedCategory = ''; applyFilters(); }}
			class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors {!selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
		>
			Todos
		</button>
		{#each data.categories as category}
			<button
				type="button"
				onclick={() => { selectedCategory = category.id; applyFilters(); }}
				class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 {selectedCategory === category.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				<span>{getCategoryIcon(category.slug)}</span>
				<span>{category.name}</span>
			</button>
		{/each}
	</div>

	<!-- Results Count -->
	<div class="flex items-center justify-between">
		<p class="text-sm text-gray-500">
			{data.therapists.length} terapeuta{data.therapists.length !== 1 ? 's' : ''} encontrado{data.therapists.length !== 1 ? 's' : ''}
		</p>
	</div>

	<!-- Therapist Grid -->
	{#if data.therapists.length > 0}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.therapists as therapist}
				<a
					href="/therapists/{therapist.id}"
					class="card-wellness group hover:border-primary-200"
				>
					<!-- Header with Avatar -->
					<div class="flex items-start gap-4 mb-4">
						<div class="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
							{#if therapist.users?.avatar_url}
								<img
									src={therapist.users.avatar_url}
									alt={therapist.users.full_name ?? ''}
									class="w-full h-full object-cover"
								/>
							{:else}
								<span class="text-2xl text-primary-600">
									{(therapist.users?.full_name ?? '?')[0].toUpperCase()}
								</span>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
								{therapist.users?.full_name ?? 'Terapeuta'}
							</h3>
							<div class="flex items-center gap-1 text-sm">
								<span class="text-yellow-500">★</span>
								<span class="font-medium">{therapist.rating_avg.toFixed(1)}</span>
								<span class="text-gray-400">({therapist.rating_count})</span>
							</div>
							{#if therapist.years_of_experience}
								<p class="text-sm text-gray-500">
									{therapist.years_of_experience} años de experiencia
								</p>
							{/if}
						</div>
					</div>

					<!-- Bio -->
					{#if therapist.bio}
						<p class="text-sm text-gray-600 line-clamp-2 mb-4">
							{therapist.bio}
						</p>
					{/if}

					<!-- Services Tags -->
					{#if therapist.therapist_services?.length}
						<div class="flex flex-wrap gap-1.5 mb-4">
							{#each therapist.therapist_services.slice(0, 3) as ts}
								<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
									{ts.services?.name}
								</span>
							{/each}
							{#if therapist.therapist_services.length > 3}
								<span class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
									+{therapist.therapist_services.length - 3} más
								</span>
							{/if}
						</div>
					{/if}

					<!-- Footer -->
					<div class="flex items-center justify-between pt-4 border-t border-gray-100">
						<div>
							<p class="text-xs text-gray-500">Desde</p>
							<p class="text-lg font-semibold text-primary-600">
								{formatPrice(getMinPrice(therapist))}
							</p>
						</div>
						<span class="text-primary-600 font-medium text-sm group-hover:underline">
							Ver perfil →
						</span>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="text-center py-12">
			<div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No encontramos terapeutas</h3>
			<p class="text-gray-500 mb-6">
				Intenta ajustar los filtros o busca en otra categoría
			</p>
			<button
				type="button"
				onclick={clearFilters}
				class="btn-primary-gradient"
			>
				Limpiar filtros
			</button>
		</div>
	{/if}
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
