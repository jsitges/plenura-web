<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			reviews: Array<{
				id: string;
				rating: number;
				comment: string | null;
				is_public: boolean;
				is_flagged: boolean;
				created_at: string;
				client: {
					id: string;
					full_name: string;
					avatar_url: string | null;
				};
				therapist: {
					id: string;
					full_name: string;
				};
				service: string;
			}>;
			totalCount: number;
			currentPage: number;
			totalPages: number;
			stats: {
				total: number;
				averageRating: number;
				publicCount: number;
				flaggedCount: number;
				ratingDistribution: Record<number, number>;
			};
			filters: {
				rating: string;
				visibility: string;
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
			day: 'numeric'
		});
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedRating !== 'all') params.set('rating', selectedRating);
		if (selectedVisibility !== 'all') params.set('visibility', selectedVisibility);
		goto(`/admin/reviews?${params.toString()}`);
	}

	let selectedRating = $state(data.filters.rating);
	let selectedVisibility = $state(data.filters.visibility);
</script>

<svelte:head>
	<title>Reseñas - Admin Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Reseñas</h1>
			<p class="text-gray-500 mt-1">{data.totalCount} reseñas en total</p>
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
			<p class="text-sm text-gray-500">Calificación promedio</p>
			<div class="flex items-center gap-2 mt-1">
				<span class="text-2xl font-bold text-gray-900">{data.stats.averageRating}</span>
				<svg class="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
			</div>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Total de reseñas</p>
			<p class="text-2xl font-bold text-gray-900 mt-1">{data.stats.total}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Reseñas públicas</p>
			<p class="text-2xl font-bold text-green-600 mt-1">{data.stats.publicCount}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Reseñas marcadas</p>
			<p class="text-2xl font-bold text-red-600 mt-1">{data.stats.flaggedCount}</p>
		</div>
	</div>

	<!-- Rating Distribution -->
	<div class="bg-white rounded-xl border border-gray-200 p-4">
		<h3 class="font-medium text-gray-900 mb-3">Distribución de calificaciones</h3>
		<div class="space-y-2">
			{#each [5, 4, 3, 2, 1] as stars}
				{@const count = data.stats.ratingDistribution[stars]}
				{@const percent = data.stats.total > 0 ? (count / data.stats.total) * 100 : 0}
				<div class="flex items-center gap-3">
					<span class="w-8 text-sm text-gray-600">{stars}</span>
					<svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
					</svg>
					<div class="flex-1 bg-gray-100 rounded-full h-2">
						<div class="bg-amber-400 h-2 rounded-full" style="width: {percent}%"></div>
					</div>
					<span class="w-12 text-sm text-gray-500 text-right">{count}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-4">
		<div class="flex flex-wrap gap-4 items-end">
			<div>
				<label for="rating" class="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
				<select
					id="rating"
					bind:value={selectedRating}
					onchange={applyFilters}
					class="border rounded-lg px-3 py-2"
				>
					<option value="all">Todas</option>
					<option value="5">5 estrellas</option>
					<option value="4">4 estrellas</option>
					<option value="3">3 estrellas</option>
					<option value="2">2 estrellas</option>
					<option value="1">1 estrella</option>
				</select>
			</div>
			<div>
				<label for="visibility" class="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
				<select
					id="visibility"
					bind:value={selectedVisibility}
					onchange={applyFilters}
					class="border rounded-lg px-3 py-2"
				>
					<option value="all">Todas</option>
					<option value="public">Públicas</option>
					<option value="private">Privadas</option>
					<option value="flagged">Marcadas</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Reviews List -->
	<div class="space-y-4">
		{#each data.reviews as review}
			<div class="bg-white rounded-xl border border-gray-200 p-6 {review.is_flagged ? 'border-red-300 bg-red-50' : ''}">
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-start gap-4">
						{#if review.client.avatar_url}
							<img src={review.client.avatar_url} alt="" class="w-12 h-12 rounded-full object-cover" />
						{:else}
							<div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
								<span class="text-gray-600 font-medium">{review.client.full_name.charAt(0)}</span>
							</div>
						{/if}
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="font-medium text-gray-900">{review.client.full_name}</span>
								<span class="text-gray-400">→</span>
								<span class="text-gray-700">{review.therapist.full_name}</span>
							</div>
							<div class="flex items-center gap-2 mb-2">
								<div class="flex">
									{#each [1, 2, 3, 4, 5] as star}
										<svg
											class="w-4 h-4 {star <= review.rating ? 'text-amber-400' : 'text-gray-300'}"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									{/each}
								</div>
								<span class="text-sm text-gray-500">{review.service}</span>
								<span class="text-sm text-gray-400">·</span>
								<span class="text-sm text-gray-500">{formatDate(review.created_at)}</span>
							</div>
							{#if review.comment}
								<p class="text-gray-700">{review.comment}</p>
							{:else}
								<p class="text-gray-400 italic">Sin comentario</p>
							{/if}
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex gap-2">
							{#if review.is_public}
								<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Pública</span>
							{:else}
								<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Privada</span>
							{/if}
							{#if review.is_flagged}
								<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Marcada</span>
							{/if}
						</div>
						<div class="flex gap-2">
							<form method="POST" action="?/toggleVisibility" use:enhance>
								<input type="hidden" name="reviewId" value={review.id} />
								<input type="hidden" name="isPublic" value={review.is_public.toString()} />
								<button type="submit" class="text-xs text-blue-600 hover:text-blue-700">
									{review.is_public ? 'Ocultar' : 'Publicar'}
								</button>
							</form>
							<form method="POST" action="?/toggleFlag" use:enhance>
								<input type="hidden" name="reviewId" value={review.id} />
								<input type="hidden" name="isFlagged" value={review.is_flagged.toString()} />
								<button type="submit" class="text-xs text-amber-600 hover:text-amber-700">
									{review.is_flagged ? 'Desmarcar' : 'Marcar'}
								</button>
							</form>
							<form method="POST" action="?/deleteReview" use:enhance>
								<input type="hidden" name="reviewId" value={review.id} />
								<button type="submit" class="text-xs text-red-600 hover:text-red-700">
									Eliminar
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		{/each}

		{#if data.reviews.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
				No se encontraron reseñas
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
						href="/admin/reviews?page={data.currentPage - 1}&rating={data.filters.rating}&visibility={data.filters.visibility}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Anterior
					</a>
				{/if}
				{#if data.currentPage < data.totalPages}
					<a
						href="/admin/reviews?page={data.currentPage + 1}&rating={data.filters.rating}&visibility={data.filters.visibility}"
						class="px-3 py-1 border rounded hover:bg-gray-50"
					>
						Siguiente
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
