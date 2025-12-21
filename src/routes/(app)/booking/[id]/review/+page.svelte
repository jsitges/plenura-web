<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let rating = $state(5);
	let comment = $state('');
	let isPublic = $state(true);
	let submitting = $state(false);
	let hoverRating = $state(0);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Dejar Reseña - Plenura</title>
</svelte:head>

<div class="max-w-lg mx-auto">
	{#if data.existingReview}
		<!-- Already reviewed -->
		<div class="bg-white rounded-xl border border-gray-100 p-6 text-center">
			<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h1 class="text-xl font-bold text-gray-900 mb-2">Ya dejaste tu reseña</h1>
			<p class="text-gray-500 mb-4">
				Calificaste esta cita con {data.existingReview.rating} estrellas
			</p>

			{#if data.existingReview.comment}
				<div class="bg-gray-50 rounded-lg p-4 text-left mb-4">
					<p class="text-gray-700 italic">"{data.existingReview.comment}"</p>
				</div>
			{/if}

			<a href="/bookings" class="btn-primary-gradient inline-block px-6 py-2"> Ver mis citas </a>
		</div>
	{:else}
		<!-- Leave review -->
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="p-6 border-b border-gray-100 text-center">
				<h1 class="text-xl font-bold text-gray-900 mb-2">Califica tu experiencia</h1>
				<p class="text-gray-500">Tu opinión ayuda a otros clientes</p>
			</div>

			<!-- Therapist info -->
			<div class="p-4 bg-gray-50 border-b border-gray-100">
				<div class="flex items-center gap-4">
					<div
						class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold"
					>
						{#if data.booking.therapists.users.avatar_url}
							<img
								src={data.booking.therapists.users.avatar_url}
								alt={data.booking.therapists.users.full_name}
								class="w-full h-full rounded-full object-cover"
							/>
						{:else}
							{data.booking.therapists.users.full_name[0].toUpperCase()}
						{/if}
					</div>
					<div>
						<p class="font-semibold text-gray-900">
							{data.booking.therapists.users.full_name}
						</p>
						<p class="text-sm text-gray-500">
							{data.booking.therapist_services.services.name_es ||
								data.booking.therapist_services.services.name}
						</p>
						<p class="text-xs text-gray-400">
							{formatDate(data.booking.scheduled_at)}
						</p>
					</div>
				</div>
			</div>

			<!-- Review form -->
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
				class="p-6 space-y-6"
			>
				<input type="hidden" name="therapist_id" value={data.booking.therapist_id} />

				<!-- Star rating -->
				<div class="text-center">
					<p class="text-sm font-medium text-gray-700 mb-3">¿Cómo fue tu experiencia?</p>
					<div class="flex justify-center gap-2">
						{#each [1, 2, 3, 4, 5] as star}
							<button
								type="button"
								onclick={() => (rating = star)}
								onmouseenter={() => (hoverRating = star)}
								onmouseleave={() => (hoverRating = 0)}
								class="p-1 transition-transform hover:scale-110 focus:outline-none"
							>
								<svg
									class="w-10 h-10 {(hoverRating || rating) >= star
										? 'text-amber-400'
										: 'text-gray-300'} transition-colors"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
									/>
								</svg>
							</button>
						{/each}
					</div>
					<input type="hidden" name="rating" value={rating} />
					<p class="text-sm text-gray-500 mt-2">
						{#if rating === 1}
							Muy malo
						{:else if rating === 2}
							Malo
						{:else if rating === 3}
							Regular
						{:else if rating === 4}
							Bueno
						{:else}
							Excelente
						{/if}
					</p>
				</div>

				<!-- Comment -->
				<div>
					<label for="comment" class="block text-sm font-medium text-gray-700 mb-1">
						Cuéntanos más (opcional)
					</label>
					<textarea
						id="comment"
						name="comment"
						bind:value={comment}
						rows="4"
						class="input-wellness resize-none"
						placeholder="¿Qué te gustó? ¿Qué podría mejorar?"
					></textarea>
				</div>

				<!-- Public toggle -->
				<div class="flex items-start gap-3">
					<input
						type="checkbox"
						id="is_public"
						name="is_public"
						bind:checked={isPublic}
						class="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
					/>
					<div>
						<label for="is_public" class="font-medium text-gray-700 cursor-pointer">
							Hacer pública mi reseña
						</label>
						<p class="text-sm text-gray-500">
							Tu reseña será visible para otros clientes en el perfil del terapeuta
						</p>
					</div>
				</div>

				<!-- Submit -->
				<div class="flex gap-3">
					<a
						href="/bookings"
						class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
					>
						Cancelar
					</a>
					<button
						type="submit"
						disabled={submitting}
						class="flex-1 btn-primary-gradient py-3 disabled:opacity-50 font-medium"
					>
						{submitting ? 'Enviando...' : 'Enviar reseña'}
					</button>
				</div>
			</form>
		</div>

		<!-- Tips -->
		<div class="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
			<h3 class="font-medium text-blue-800 mb-2">Consejos para una buena reseña</h3>
			<ul class="text-sm text-blue-700 space-y-1">
				<li>• Sé específico sobre lo que te gustó o no</li>
				<li>• Menciona aspectos como puntualidad, profesionalismo y resultados</li>
				<li>• Sé respetuoso y constructivo en tus comentarios</li>
			</ul>
		</div>
	{/if}
</div>
