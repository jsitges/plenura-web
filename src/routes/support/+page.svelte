<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let selectedCategory = $state<string | null>(null);
	let expandedFaq = $state<number | null>(null);
	let isSubmitting = $state(false);
	let showSuccess = $state(false);

	const categories = [
		{ id: 'booking', label: 'Reservas', icon: 'calendar', description: 'Ayuda con citas y reservaciones' },
		{ id: 'payment', label: 'Pagos', icon: 'credit-card', description: 'Facturación, reembolsos y propinas' },
		{ id: 'account', label: 'Mi Cuenta', icon: 'user', description: 'Perfil, contraseña y configuración' },
		{ id: 'therapist', label: 'Terapeutas', icon: 'briefcase', description: 'Registro y gestión de terapeutas' },
		{ id: 'technical', label: 'Técnico', icon: 'code', description: 'Errores y problemas técnicos' },
		{ id: 'feedback', label: 'Sugerencias', icon: 'lightbulb', description: 'Ideas y mejoras' },
		{ id: 'other', label: 'Otro', icon: 'help', description: 'Otras consultas' }
	];

	const filteredFaqs = $derived(
		selectedCategory
			? data.faqs.filter((faq: { category: string }) => faq.category === selectedCategory)
			: data.faqs
	);

	function toggleFaq(index: number) {
		expandedFaq = expandedFaq === index ? null : index;
	}

	$effect(() => {
		if (form?.success) {
			showSuccess = true;
		}
	});
</script>

<svelte:head>
	<title>Centro de Ayuda - Plenura</title>
	<meta name="description" content="Obtén ayuda y soporte para usar Plenura" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
			<div class="text-center">
				<a href="/" class="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-8 transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Volver al inicio
				</a>
				<h1 class="text-3xl sm:text-4xl font-bold mb-4">Centro de Ayuda</h1>
				<p class="text-lg text-primary-100 max-w-2xl mx-auto">
					¿Tienes preguntas? Estamos aquí para ayudarte. Explora nuestras preguntas frecuentes o contáctanos directamente.
				</p>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<!-- Category Filter -->
		<div class="mb-12">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">¿Sobre qué tema necesitas ayuda?</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
				<button
					type="button"
					onclick={() => selectedCategory = null}
					class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all {selectedCategory === null ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}"
				>
					<div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
						<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700">Todos</span>
				</button>
				{#each categories as cat}
					<button
						type="button"
						onclick={() => selectedCategory = cat.id}
						class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all {selectedCategory === cat.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}"
					>
						<div class="w-10 h-10 rounded-full {selectedCategory === cat.id ? 'bg-primary-100' : 'bg-gray-100'} flex items-center justify-center">
							{#if cat.icon === 'calendar'}
								<svg class="w-5 h-5 {selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							{:else if cat.icon === 'credit-card'}
								<svg class="w-5 h-5 {selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
								</svg>
							{:else if cat.icon === 'user'}
								<svg class="w-5 h-5 {selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							{:else if cat.icon === 'briefcase'}
								<svg class="w-5 h-5 {selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							{:else if cat.icon === 'code'}
								<svg class="w-5 h-5 {selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
								</svg>
							{:else if cat.icon === 'lightbulb'}
								<svg class="w-5 h-5 {selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
							{:else}
								<svg class="w-5 h-5 {selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							{/if}
						</div>
						<span class="text-sm font-medium text-gray-700">{cat.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="grid lg:grid-cols-2 gap-12">
			<!-- FAQs Section -->
			<div>
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Preguntas Frecuentes</h2>
				{#if filteredFaqs.length === 0}
					<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
						<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-gray-500">No hay preguntas frecuentes para esta categoría.</p>
						<p class="text-sm text-gray-400 mt-2">Usa el formulario de contacto para enviarnos tu pregunta.</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each filteredFaqs as faq, index}
							<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
								<button
									type="button"
									onclick={() => toggleFaq(index)}
									class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
								>
									<span class="font-medium text-gray-900 pr-4">{faq.question}</span>
									<svg
										class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform {expandedFaq === index ? 'rotate-180' : ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{#if expandedFaq === index}
									<div class="px-4 pb-4 text-gray-600 border-t border-gray-100 pt-3">
										{faq.answer}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Contact Form Section -->
			<div>
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Contáctanos</h2>
				{#if showSuccess}
					<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
						<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">¡Mensaje enviado!</h3>
						<p class="text-gray-600 mb-4">
							Hemos recibido tu solicitud. Te responderemos a la brevedad posible.
						</p>
						{#if form?.ticketId}
							<p class="text-sm text-gray-500 mb-6">
								Número de ticket: <span class="font-mono font-medium">{form.ticketId.slice(0, 8).toUpperCase()}</span>
							</p>
						{/if}
						<button
							type="button"
							onclick={() => showSuccess = false}
							class="text-primary-600 hover:text-primary-700 font-medium"
						>
							Enviar otro mensaje
						</button>
					</div>
				{:else}
					<form
						method="POST"
						action="?/submit"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ update }) => {
								await update();
								isSubmitting = false;
							};
						}}
						class="bg-white rounded-xl border border-gray-200 p-6"
					>
						{#if form?.error}
							<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
								{form.error}
							</div>
						{/if}

						<div class="space-y-4">
							<!-- Name -->
							<div>
								<label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
								<input
									type="text"
									id="name"
									name="name"
									value={form?.values?.name ?? data.userProfile?.full_name ?? ''}
									required
									class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
									placeholder="Tu nombre"
								/>
							</div>

							<!-- Email -->
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
								<input
									type="email"
									id="email"
									name="email"
									value={form?.values?.email ?? data.user?.email ?? ''}
									required
									class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
									placeholder="tu@email.com"
								/>
							</div>

							<!-- Category -->
							<div>
								<label for="category" class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
								<select
									id="category"
									name="category"
									required
									class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none bg-white"
								>
									<option value="">Selecciona una categoría</option>
									{#each categories as cat}
										<option value={cat.id} selected={form?.values?.category === cat.id || selectedCategory === cat.id}>
											{cat.label} - {cat.description}
										</option>
									{/each}
								</select>
							</div>

							<!-- Subject -->
							<div>
								<label for="subject" class="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
								<input
									type="text"
									id="subject"
									name="subject"
									value={form?.values?.subject ?? ''}
									required
									minlength="5"
									class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
									placeholder="Describe brevemente tu consulta"
								/>
							</div>

							<!-- Description -->
							<div>
								<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
								<textarea
									id="description"
									name="description"
									rows="5"
									required
									minlength="20"
									class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none resize-none"
									placeholder="Cuéntanos más detalles sobre tu consulta..."
								>{form?.values?.description ?? ''}</textarea>
								<p class="text-xs text-gray-500 mt-1">Mínimo 20 caracteres</p>
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								class="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
							>
								{#if isSubmitting}
									<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Enviando...
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									Enviar mensaje
								{/if}
							</button>
						</div>
					</form>
				{/if}

				<!-- Quick Contact -->
				<div class="mt-8 grid sm:grid-cols-2 gap-4">
					<a
						href="mailto:soporte@plenura.com"
						class="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors"
					>
						<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
							<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<div>
							<p class="font-medium text-gray-900">Email</p>
							<p class="text-sm text-gray-500">soporte@plenura.com</p>
						</div>
					</a>

					<a
						href="https://wa.me/5215512345678"
						target="_blank"
						rel="noopener"
						class="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
					>
						<div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
							<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
							</svg>
						</div>
						<div>
							<p class="font-medium text-gray-900">WhatsApp</p>
							<p class="text-sm text-gray-500">+52 55 1234 5678</p>
						</div>
					</a>
				</div>
			</div>
		</div>

		<!-- Legal Links -->
		<div class="mt-16 pt-8 border-t border-gray-200 text-center">
			<div class="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
				<a href="/terms" class="hover:text-primary-600 transition-colors">Términos y Condiciones</a>
				<a href="/privacy" class="hover:text-primary-600 transition-colors">Aviso de Privacidad</a>
			</div>
		</div>
	</div>
</div>
