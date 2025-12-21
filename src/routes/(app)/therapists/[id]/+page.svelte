<script lang="ts">
	import { createClient } from '$lib/supabase/client';
	import { invalidateAll } from '$app/navigation';
	import ShareButton from '$lib/components/ShareButton.svelte';

	let { data } = $props();

	const supabase = createClient();
	const therapist = data.therapist;
	const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

	let selectedService = $state<string | null>(null);
	let isFavorite = $state(data.isFavorite);
	let favoriteLoading = $state(false);

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
			minimumFractionDigits: 0
		}).format(price);
	}

	function formatTime(time: string): string {
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function toggleFavorite() {
		if (favoriteLoading) return;
		favoriteLoading = true;

		try {
			if (isFavorite) {
				await supabase
					.from('favorites')
					.delete()
					.eq('therapist_id', therapist.id);
			} else {
				await supabase
					.from('favorites')
					.insert({ therapist_id: therapist.id });
			}
			isFavorite = !isFavorite;
		} catch (err) {
			console.error('Error toggling favorite:', err);
		} finally {
			favoriteLoading = false;
		}
	}

	function selectService(serviceId: string) {
		selectedService = selectedService === serviceId ? null : serviceId;
	}

	// Get active services
	const activeServices = therapist.therapist_services?.filter(ts => ts.is_active) ?? [];
</script>

<svelte:head>
	<title>{therapist.users?.full_name ?? 'Terapeuta'} - Plenura</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<!-- Back Button -->
	<a href="/therapists" class="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors">
		<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Volver a búsqueda
	</a>

	<!-- Profile Header -->
	<div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
		<div class="bg-gradient-to-r from-primary-500 to-primary-600 h-32"></div>
		<div class="px-6 pb-6">
			<div class="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
				<!-- Avatar -->
				<div class="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
					{#if therapist.users?.avatar_url}
						<img
							src={therapist.users.avatar_url}
							alt={therapist.users.full_name ?? ''}
							class="w-full h-full object-cover"
						/>
					{:else}
						<div class="w-full h-full bg-primary-100 flex items-center justify-center">
							<span class="text-3xl text-primary-600">
								{(therapist.users?.full_name ?? '?')[0].toUpperCase()}
							</span>
						</div>
					{/if}
				</div>

				<!-- Name & Stats -->
				<div class="flex-1">
					<div class="flex items-start justify-between">
						<div>
							<h1 class="text-2xl font-bold text-gray-900">
								{therapist.users?.full_name ?? 'Terapeuta'}
							</h1>
							<div class="flex items-center gap-4 mt-1">
								<div class="flex items-center gap-1">
									<span class="text-yellow-500 text-lg">★</span>
									<span class="font-semibold">{therapist.rating_avg.toFixed(1)}</span>
									<span class="text-gray-400">({therapist.rating_count} reseñas)</span>
								</div>
								{#if therapist.years_of_experience}
									<span class="text-gray-400">•</span>
									<span class="text-gray-600">{therapist.years_of_experience} años exp.</span>
								{/if}
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center gap-1">
							<!-- Share Button -->
							<ShareButton
								title={therapist.users?.full_name ?? 'Terapeuta'}
								text={`Conoce a ${therapist.users?.full_name ?? 'este terapeuta'} en Plenura - ${therapist.rating_avg.toFixed(1)} estrellas`}
								variant="icon"
							/>

							<!-- Favorite Button -->
							<button
								type="button"
								onclick={toggleFavorite}
								disabled={favoriteLoading}
								class="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
								aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
							>
								{#if isFavorite}
									<svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
									</svg>
								{:else}
									<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
									</svg>
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="grid lg:grid-cols-3 gap-8">
		<!-- Main Content -->
		<div class="lg:col-span-2 space-y-6">
			<!-- About -->
			{#if therapist.bio}
				<div class="bg-white rounded-xl border border-gray-100 p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-3">Acerca de mí</h2>
					<p class="text-gray-600 whitespace-pre-line">{therapist.bio}</p>
				</div>
			{/if}

			<!-- Services -->
			<div class="bg-white rounded-xl border border-gray-100 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Servicios</h2>
				<div class="space-y-3">
					{#each activeServices as ts}
						<button
							type="button"
							onclick={() => selectService(ts.id)}
							class="w-full text-left p-4 rounded-xl border-2 transition-all {selectedService === ts.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}"
						>
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-medium text-gray-900">{ts.services?.name}</h3>
									{#if ts.services?.description}
										<p class="text-sm text-gray-500 mt-1">{ts.services.description}</p>
									{/if}
									<p class="text-sm text-gray-400 mt-1">
										{ts.duration_minutes} minutos
									</p>
								</div>
								<div class="text-right">
									<p class="text-lg font-semibold text-primary-600">
										{formatPrice(ts.price_cents / 100)}
									</p>
								</div>
							</div>
						</button>
					{/each}

					{#if activeServices.length === 0}
						<p class="text-gray-500 text-center py-4">
							No hay servicios disponibles actualmente
						</p>
					{/if}
				</div>
			</div>

			<!-- Availability -->
			{#if data.availability.length > 0}
				<div class="bg-white rounded-xl border border-gray-100 p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Horario</h2>
					<div class="space-y-2">
						{#each data.availability as slot}
							<div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
								<span class="font-medium text-gray-700">{dayNames[slot.day_of_week]}</span>
								<span class="text-gray-600">
									{formatTime(slot.start_time)} - {formatTime(slot.end_time)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Reviews -->
			<div class="bg-white rounded-xl border border-gray-100 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">
					Reseñas ({data.reviews.length})
				</h2>

				{#if data.reviews.length > 0}
					<div class="space-y-4">
						{#each data.reviews as review}
							<div class="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
								<div class="flex items-start gap-3">
									<div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
										{#if review.users?.avatar_url}
											<img
												src={review.users.avatar_url}
												alt=""
												class="w-full h-full rounded-full object-cover"
											/>
										{:else}
											<span class="text-gray-500 text-sm">
												{(review.users?.full_name ?? '?')[0].toUpperCase()}
											</span>
										{/if}
									</div>
									<div class="flex-1">
										<div class="flex items-center justify-between">
											<span class="font-medium text-gray-900">
												{review.users?.full_name ?? 'Usuario'}
											</span>
											<span class="text-sm text-gray-400">
												{formatDate(review.created_at)}
											</span>
										</div>
										<div class="flex items-center gap-0.5 my-1">
											{#each Array(5) as _, i}
												<svg class="w-4 h-4 {i < review.rating ? 'text-yellow-400' : 'text-gray-200'}" fill="currentColor" viewBox="0 0 20 20">
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											{/each}
										</div>
										{#if review.comment}
											<p class="text-gray-600 text-sm">{review.comment}</p>
										{/if}
										{#if review.therapist_response}
											<div class="mt-3 bg-gray-50 rounded-lg p-3">
												<p class="text-sm text-gray-500 font-medium mb-1">Respuesta del terapeuta:</p>
												<p class="text-sm text-gray-600">{review.therapist_response}</p>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 text-center py-4">
						Aún no hay reseñas para este terapeuta
					</p>
				{/if}
			</div>
		</div>

		<!-- Sidebar - Booking Card -->
		<div class="lg:col-span-1">
			<div class="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
				<h3 class="font-semibold text-gray-900 mb-4">Reservar cita</h3>

				{#if selectedService}
					{@const service = activeServices.find(s => s.id === selectedService)}
					{#if service}
						<div class="bg-primary-50 rounded-lg p-4 mb-4">
							<p class="font-medium text-gray-900">{service.services?.name}</p>
							<p class="text-sm text-gray-600">{service.duration_minutes} min</p>
							<p class="text-lg font-semibold text-primary-600 mt-1">
								{formatPrice(service.price_cents / 100)}
							</p>
						</div>
					{/if}

					<a
						href="/booking/new?therapist={therapist.id}&service={selectedService}"
						class="block w-full btn-primary-gradient text-center py-3"
					>
						Seleccionar fecha
					</a>
				{:else}
					<p class="text-gray-500 text-sm mb-4">
						Selecciona un servicio para continuar
					</p>
					<button
						type="button"
						disabled
						class="w-full py-3 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
					>
						Seleccionar fecha
					</button>
				{/if}

				<div class="mt-6 pt-6 border-t border-gray-100">
					<div class="flex items-center gap-3 text-sm text-gray-600">
						<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						<span>Terapeuta verificado</span>
					</div>
					<div class="flex items-center gap-3 text-sm text-gray-600 mt-2">
						<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						<span>Pago seguro</span>
					</div>
					<div class="flex items-center gap-3 text-sm text-gray-600 mt-2">
						<svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<span>Cancelación flexible</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
