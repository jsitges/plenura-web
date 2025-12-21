<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const t = data.therapist as unknown as {
		id: string;
		bio: string | null;
		years_of_experience: number | null;
		certification_details: { rejection_reason?: string } | null;
		service_radius_km: number;
		rating_avg: number;
		rating_count: number;
		vetting_status: string;
		is_available: boolean;
		timezone: string;
		colectiva_wallet_id: string | null;
		subscription_tier: string;
		is_featured: boolean;
		featured_until: string | null;
		monthly_booking_count: number;
		created_at: string;
		updated_at: string;
		users: {
			id: string;
			email: string;
			full_name: string;
			phone: string | null;
			avatar_url: string | null;
			created_at: string;
		};
		therapist_services: Array<{
			id: string;
			price_cents: number;
			duration_minutes: number;
			is_active: boolean;
			services: {
				id: string;
				name: string;
				name_es: string;
				categories: { name: string; name_es: string };
			};
		}>;
	};

	const reviews = data.reviews as Array<{
		id: string;
		rating: number;
		comment: string | null;
		therapist_response: string | null;
		created_at: string;
		users: { full_name: string };
	}>;

	const statusColors: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-800 border-amber-200',
		approved: 'bg-green-100 text-green-800 border-green-200',
		rejected: 'bg-red-100 text-red-800 border-red-200',
		suspended: 'bg-gray-100 text-gray-800 border-gray-200'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Pendiente de Aprobacion',
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

	const formatPrice = (cents: number) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

	const formatDateTime = (date: string) =>
		new Date(date).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

	let showRejectModal = $state(false);
	let showSuspendModal = $state(false);
	let showTierModal = $state(false);
	let showFeaturedModal = $state(false);
	let rejectionReason = $state('');
	let suspensionReason = $state('');
	let selectedTier = $state(t.subscription_tier);
	let featuredDays = $state(30);
</script>

<svelte:head>
	<title>{t.users.full_name} - Admin Plenura</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/therapists" class="p-2 hover:bg-gray-100 rounded-lg">
				<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
			<div class="flex items-center gap-4">
				{#if t.users.avatar_url}
					<img src={t.users.avatar_url} alt={t.users.full_name} class="w-16 h-16 rounded-full object-cover" />
				{:else}
					<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
						<span class="text-2xl font-bold text-primary-600">
							{t.users.full_name.charAt(0).toUpperCase()}
						</span>
					</div>
				{/if}
				<div>
					<h1 class="text-2xl font-bold text-gray-900">{t.users.full_name}</h1>
					<p class="text-gray-500">{t.users.email}</p>
				</div>
			</div>
		</div>

		<span class="px-4 py-2 rounded-lg border {statusColors[t.vetting_status]}">
			{statusLabels[t.vetting_status]}
		</span>
	</div>

	<!-- Quick Actions -->
	<div class="bg-white rounded-xl shadow-sm p-6">
		<h2 class="font-semibold text-gray-900 mb-4">Acciones Rapidas</h2>
		<div class="flex flex-wrap gap-3">
			{#if t.vetting_status === 'pending'}
				<form method="POST" action="?/approve" use:enhance>
					<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
						Aprobar Terapeuta
					</button>
				</form>
				<button
					type="button"
					onclick={() => (showRejectModal = true)}
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
				>
					Rechazar
				</button>
			{:else if t.vetting_status === 'approved'}
				<button
					type="button"
					onclick={() => (showSuspendModal = true)}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
				>
					Suspender
				</button>
			{:else if t.vetting_status === 'suspended' || t.vetting_status === 'rejected'}
				<form method="POST" action="?/reactivate" use:enhance>
					<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
						Reactivar
					</button>
				</form>
			{/if}

			<button
				type="button"
				onclick={() => (showTierModal = true)}
				class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
			>
				Cambiar Tier
			</button>

			<button
				type="button"
				onclick={() => (showFeaturedModal = true)}
				class="px-4 py-2 {t.is_featured ? 'bg-amber-600' : 'bg-indigo-600'} text-white rounded-lg hover:opacity-90"
			>
				{t.is_featured ? 'Editar Destacado' : 'Destacar'}
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Info -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Profile Info -->
			<div class="bg-white rounded-xl shadow-sm p-6">
				<h2 class="font-semibold text-gray-900 mb-4">Informacion del Perfil</h2>

				<dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<dt class="text-sm text-gray-500">Telefono</dt>
						<dd class="font-medium text-gray-900">{t.users.phone ?? 'No registrado'}</dd>
					</div>
					<div>
						<dt class="text-sm text-gray-500">Anos de Experiencia</dt>
						<dd class="font-medium text-gray-900">{t.years_of_experience ?? 'No especificado'}</dd>
					</div>
					<div>
						<dt class="text-sm text-gray-500">Radio de Servicio</dt>
						<dd class="font-medium text-gray-900">{t.service_radius_km} km</dd>
					</div>
					<div>
						<dt class="text-sm text-gray-500">Zona Horaria</dt>
						<dd class="font-medium text-gray-900">{t.timezone}</dd>
					</div>
					<div>
						<dt class="text-sm text-gray-500">Registro de Usuario</dt>
						<dd class="font-medium text-gray-900">{formatDate(t.users.created_at)}</dd>
					</div>
					<div>
						<dt class="text-sm text-gray-500">Registro como Terapeuta</dt>
						<dd class="font-medium text-gray-900">{formatDate(t.created_at)}</dd>
					</div>
				</dl>

				{#if t.bio}
					<div class="mt-4 pt-4 border-t">
						<dt class="text-sm text-gray-500 mb-1">Biografia</dt>
						<dd class="text-gray-900">{t.bio}</dd>
					</div>
				{/if}
			</div>

			<!-- Services -->
			<div class="bg-white rounded-xl shadow-sm p-6">
				<h2 class="font-semibold text-gray-900 mb-4">Servicios ({t.therapist_services.length})</h2>

				{#if t.therapist_services.length > 0}
					<div class="space-y-3">
						{#each t.therapist_services as service}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg {!service.is_active ? 'opacity-50' : ''}">
								<div>
									<p class="font-medium text-gray-900">{service.services.name_es}</p>
									<p class="text-sm text-gray-500">{service.services.categories.name_es}</p>
								</div>
								<div class="text-right">
									<p class="font-semibold text-gray-900">{formatPrice(service.price_cents)}</p>
									<p class="text-sm text-gray-500">{service.duration_minutes} min</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 text-center py-4">No ha configurado servicios</p>
				{/if}
			</div>

			<!-- Reviews -->
			<div class="bg-white rounded-xl shadow-sm p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-semibold text-gray-900">Resenas Recientes</h2>
					<div class="flex items-center gap-1">
						<svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
						<span class="font-semibold">{t.rating_avg.toFixed(1)}</span>
						<span class="text-gray-500">({t.rating_count} resenas)</span>
					</div>
				</div>

				{#if reviews.length > 0}
					<div class="space-y-4">
						{#each reviews as review}
							<div class="border-b border-gray-100 pb-4 last:border-0">
								<div class="flex items-center justify-between mb-2">
									<span class="font-medium text-gray-900">{review.users.full_name}</span>
									<div class="flex items-center gap-1">
										{#each Array(5) as _, i}
											<svg
												class="w-4 h-4 {i < review.rating ? 'text-amber-400' : 'text-gray-300'}"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
											</svg>
										{/each}
									</div>
								</div>
								{#if review.comment}
									<p class="text-gray-700">{review.comment}</p>
								{/if}
								<p class="text-xs text-gray-400 mt-1">{formatDateTime(review.created_at)}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 text-center py-4">Sin resenas todavia</p>
				{/if}
			</div>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Stats -->
			<div class="bg-white rounded-xl shadow-sm p-6">
				<h2 class="font-semibold text-gray-900 mb-4">Estadisticas</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-gray-500">Reservas Totales</span>
						<span class="font-semibold">{data.stats.totalBookings}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-500">Completadas</span>
						<span class="font-semibold text-green-600">{data.stats.completedBookings}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-500">Canceladas</span>
						<span class="font-semibold text-red-600">{data.stats.cancelledBookings}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-500">Este Mes</span>
						<span class="font-semibold">{t.monthly_booking_count}</span>
					</div>
					<hr />
					<div class="flex items-center justify-between">
						<span class="text-gray-500">GMV Total</span>
						<span class="font-semibold">{formatPrice(data.stats.totalRevenue)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-500">Comisiones</span>
						<span class="font-semibold text-green-600">{formatPrice(data.stats.totalCommission)}</span>
					</div>
				</div>
			</div>

			<!-- Subscription -->
			<div class="bg-white rounded-xl shadow-sm p-6">
				<h2 class="font-semibold text-gray-900 mb-4">Suscripcion</h2>

				<div class="space-y-3">
					<div class="p-3 bg-purple-50 rounded-lg">
						<span class="text-sm text-purple-600">Tier Actual</span>
						<p class="font-bold text-purple-900 text-lg">{tierLabels[t.subscription_tier]}</p>
					</div>

					{#if t.is_featured}
						<div class="p-3 bg-amber-50 rounded-lg">
							<span class="text-sm text-amber-600">Destacado</span>
							<p class="font-medium text-amber-900">
								Hasta {t.featured_until ? formatDate(t.featured_until) : 'Siempre'}
							</p>
						</div>
					{/if}

					<div>
						<span class="text-sm text-gray-500">Wallet ID</span>
						<p class="font-mono text-sm text-gray-900 truncate">
							{t.colectiva_wallet_id ?? 'No configurado'}
						</p>
					</div>
				</div>
			</div>

			<!-- Availability -->
			<div class="bg-white rounded-xl shadow-sm p-6">
				<h2 class="font-semibold text-gray-900 mb-4">Estado</h2>

				<div class="flex items-center gap-3">
					<div class="w-3 h-3 rounded-full {t.is_available ? 'bg-green-500' : 'bg-gray-400'}"></div>
					<span class="text-gray-900">
						{t.is_available ? 'Disponible para reservas' : 'No disponible'}
					</span>
				</div>

				<p class="text-sm text-gray-500 mt-3">
					Ultima actualizacion: {formatDateTime(t.updated_at)}
				</p>
			</div>
		</div>
	</div>
</div>

<!-- Reject Modal -->
{#if showRejectModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
			<h3 class="text-lg font-semibold mb-4">Rechazar Terapeuta</h3>
			<form method="POST" action="?/reject" use:enhance>
				<div class="mb-4">
					<label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
						Razon del rechazo
					</label>
					<textarea
						id="reason"
						name="reason"
						bind:value={rejectionReason}
						rows="3"
						class="w-full border rounded-lg px-3 py-2"
						placeholder="Explica por que se rechaza..."
						required
					></textarea>
				</div>
				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={() => (showRejectModal = false)}
						class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
					>
						Cancelar
					</button>
					<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
						Rechazar
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Suspend Modal -->
{#if showSuspendModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
			<h3 class="text-lg font-semibold mb-4">Suspender Terapeuta</h3>
			<form method="POST" action="?/suspend" use:enhance>
				<div class="mb-4">
					<label for="suspend-reason" class="block text-sm font-medium text-gray-700 mb-1">
						Razon de la suspension
					</label>
					<textarea
						id="suspend-reason"
						name="reason"
						bind:value={suspensionReason}
						rows="3"
						class="w-full border rounded-lg px-3 py-2"
						placeholder="Explica por que se suspende..."
						required
					></textarea>
				</div>
				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={() => (showSuspendModal = false)}
						class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
					>
						Cancelar
					</button>
					<button type="submit" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
						Suspender
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Tier Modal -->
{#if showTierModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
			<h3 class="text-lg font-semibold mb-4">Cambiar Tier de Suscripcion</h3>
			<form method="POST" action="?/updateTier" use:enhance>
				<div class="mb-4 space-y-2">
					{#each ['free', 'pro', 'business', 'enterprise'] as tier}
						<label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {selectedTier === tier ? 'border-purple-500 bg-purple-50' : ''}">
							<input
								type="radio"
								name="tier"
								value={tier}
								bind:group={selectedTier}
								class="text-purple-600"
							/>
							<span class="font-medium">{tierLabels[tier]}</span>
						</label>
					{/each}
				</div>
				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={() => (showTierModal = false)}
						class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
					>
						Cancelar
					</button>
					<button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
						Guardar
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Featured Modal -->
{#if showFeaturedModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
			<h3 class="text-lg font-semibold mb-4">
				{t.is_featured ? 'Editar Destacado' : 'Destacar Terapeuta'}
			</h3>
			<form method="POST" action="?/toggleFeatured" use:enhance>
				<input type="hidden" name="is_featured" value={t.is_featured ? 'false' : 'true'} />

				{#if !t.is_featured}
					<div class="mb-4">
						<label for="days" class="block text-sm font-medium text-gray-700 mb-1">
							Duracion (dias)
						</label>
						<input
							type="number"
							id="days"
							name="days"
							bind:value={featuredDays}
							min="1"
							max="365"
							class="w-full border rounded-lg px-3 py-2"
						/>
					</div>
				{/if}

				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={() => (showFeaturedModal = false)}
						class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-4 py-2 {t.is_featured ? 'bg-gray-600' : 'bg-amber-600'} text-white rounded-lg hover:opacity-90"
					>
						{t.is_featured ? 'Quitar Destacado' : 'Destacar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
