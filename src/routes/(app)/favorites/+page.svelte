<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let removingId = $state<string | null>(null);

	function formatPrice(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(cents / 100);
	}

	function getMinPrice(
		services: Array<{ price_cents: number; services: { name: string } | null }>
	): number {
		if (!services || services.length === 0) return 0;
		return Math.min(...services.map((s) => s.price_cents));
	}

	function formatRating(rating: number): string {
		return rating.toFixed(1);
	}
</script>

<svelte:head>
	<title>Favoritos - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
		<a href="/therapists" class="btn-primary-gradient"> Buscar terapeutas </a>
	</div>

	{#if data.favorites.length > 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.favorites as favorite}
				{@const therapist = favorite.therapist}
				{#if therapist}
					<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
						<!-- Header -->
						<div class="p-4">
							<div class="flex items-start gap-4">
								<!-- Avatar -->
								<div
									class="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0"
								>
									{#if therapist.users?.avatar_url}
										<img
											src={therapist.users.avatar_url}
											alt=""
											class="w-full h-full rounded-xl object-cover"
										/>
									{:else}
										<span class="text-2xl text-primary-600">
											{(therapist.users?.full_name ?? '?')[0].toUpperCase()}
										</span>
									{/if}
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-gray-900 truncate">
										{therapist.users?.full_name}
									</h3>

									<!-- Rating -->
									{#if therapist.total_reviews > 0}
										<div class="flex items-center gap-1 mt-1">
											<svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
												<path
													d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
												/>
											</svg>
											<span class="text-sm font-medium text-gray-700">
												{formatRating(therapist.rating_avg)}
											</span>
											<span class="text-sm text-gray-500">
												({therapist.total_reviews} reseñas)
											</span>
										</div>
									{:else}
										<p class="text-sm text-gray-500 mt-1">Sin reseñas aún</p>
									{/if}

									<!-- Price -->
									{#if therapist.therapist_services.length > 0}
										<p class="text-sm text-gray-600 mt-1">
											Desde
											<span class="font-semibold text-primary-600">
												{formatPrice(getMinPrice(therapist.therapist_services))}
											</span>
										</p>
									{/if}
								</div>

								<!-- Remove button -->
								<form
									method="POST"
									action="?/remove"
									use:enhance={() => {
										removingId = favorite.therapist_id;
										return async ({ update }) => {
											await update();
											removingId = null;
										};
									}}
								>
									<input type="hidden" name="therapist_id" value={favorite.therapist_id} />
									<button
										type="submit"
										disabled={removingId === favorite.therapist_id}
										class="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
										title="Quitar de favoritos"
									>
										<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</form>
							</div>

							<!-- Bio preview -->
							{#if therapist.bio}
								<p class="text-sm text-gray-600 mt-3 line-clamp-2">
									{therapist.bio}
								</p>
							{/if}
						</div>

						<!-- Actions -->
						<div class="px-4 pb-4 pt-2 border-t border-gray-100 flex gap-2">
							<a
								href="/therapists/{therapist.id}"
								class="flex-1 py-2 px-4 text-center text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
							>
								Ver perfil
							</a>
							<a
								href="/booking/new?therapist={therapist.id}"
								class="flex-1 py-2 px-4 text-center text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
							>
								Reservar
							</a>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="text-center py-12">
			<div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No tienes favoritos aún</h3>
			<p class="text-gray-500 mb-6">Guarda terapeutas para encontrarlos más fácil</p>
			<a href="/therapists" class="btn-primary-gradient"> Explorar terapeutas </a>
		</div>
	{/if}
</div>
