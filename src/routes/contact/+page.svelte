<script lang="ts">
	let contactForm = $state({
		name: '',
		email: '',
		phone: '',
		subject: '',
		message: '',
		interest: 'general'
	});
	let isSubmitting = $state(false);
	let submitSuccess = $state(false);
	let submitError = $state('');

	const interestOptions = [
		{ value: 'general', label: 'Consulta general' },
		{ value: 'therapist', label: 'Quiero ser terapeuta' },
		{ value: 'enterprise', label: 'Alianza empresarial' },
		{ value: 'support', label: 'Soporte técnico' },
		{ value: 'press', label: 'Prensa/Medios' }
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		submitError = '';

		try {
			const response = await fetch('/api/leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(contactForm)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Error al enviar');
			}

			submitSuccess = true;
			contactForm = {
				name: '',
				email: '',
				phone: '',
				subject: '',
				message: '',
				interest: 'general'
			};
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Error al enviar mensaje';
		} finally {
			isSubmitting = false;
		}
	}

	const contactMethods = [
		{
			icon: 'email',
			title: 'Email',
			description: 'Para consultas generales',
			value: 'hola@plenura.com',
			href: 'mailto:hola@plenura.com'
		},
		{
			icon: 'support',
			title: 'Soporte',
			description: 'Centro de ayuda 24/7',
			value: 'Ver centro de ayuda',
			href: '/support'
		},
		{
			icon: 'whatsapp',
			title: 'WhatsApp',
			description: 'Respuesta rápida',
			value: '+52 55 1234 5678',
			href: 'https://wa.me/5215512345678'
		},
		{
			icon: 'location',
			title: 'Oficina',
			description: 'Visítanos en CDMX',
			value: 'Insurgentes Sur 1602',
			href: 'https://maps.google.com/?q=Insurgentes+Sur+1602+CDMX'
		}
	];

	const departments = [
		{
			name: 'Soporte al Cliente',
			email: 'soporte@plenura.com',
			description: 'Ayuda con reservas, pagos y uso de la plataforma'
		},
		{
			name: 'Onboarding de Terapeutas',
			email: 'terapeutas@plenura.com',
			description: 'Registro, verificación y dudas sobre ser terapeuta'
		},
		{
			name: 'Alianzas y Empresas',
			email: 'empresas@plenura.com',
			description: 'Programas corporativos y alianzas estratégicas'
		},
		{
			name: 'Prensa',
			email: 'prensa@plenura.com',
			description: 'Solicitudes de medios y comunicaciones'
		}
	];
</script>

<svelte:head>
	<title>Contacto - Plenura</title>
	<meta name="description" content="Contáctanos. Estamos aquí para ayudarte con cualquier pregunta sobre Plenura." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
			<div class="text-center">
				<a href="/" class="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-8 transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Volver al inicio
				</a>
				<h1 class="text-4xl sm:text-5xl font-bold mb-4">Contáctanos</h1>
				<p class="text-xl text-primary-100 max-w-2xl mx-auto">
					¿Tienes preguntas? Estamos aquí para ayudarte. Elige la forma que te sea más conveniente.
				</p>
			</div>
		</div>
	</section>

	<!-- Contact Methods -->
	<section class="py-12 -mt-8">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each contactMethods as method}
					<a
						href={method.href}
						target={method.href.startsWith('http') ? '_blank' : undefined}
						rel={method.href.startsWith('http') ? 'noopener' : undefined}
						class="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all hover:-translate-y-1"
					>
						<div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
							{#if method.icon === 'email'}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							{:else if method.icon === 'support'}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							{:else if method.icon === 'whatsapp'}
								<svg class="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
								</svg>
							{:else}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							{/if}
						</div>
						<h3 class="font-semibold text-gray-900 mb-1">{method.title}</h3>
						<p class="text-sm text-gray-500 mb-2">{method.description}</p>
						<p class="text-primary-600 font-medium">{method.value}</p>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- Contact Form -->
	<section class="py-16 sm:py-24 bg-white">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Envíanos un mensaje</h2>
				<p class="text-gray-600">Completa el formulario y te responderemos a la brevedad.</p>
			</div>

			{#if submitSuccess}
				<div class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Mensaje Enviado</h3>
					<p class="text-gray-600 mb-6">Gracias por contactarnos. Te responderemos pronto.</p>
					<button
						onclick={() => submitSuccess = false}
						class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
					>
						Enviar otro mensaje
					</button>
				</div>
			{:else}
				<form onsubmit={handleSubmit} class="bg-gray-50 rounded-2xl border border-gray-100 p-8 space-y-6">
					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
							<input
								type="text"
								id="name"
								bind:value={contactForm.name}
								required
								class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								placeholder="Tu nombre"
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
							<input
								type="email"
								id="email"
								bind:value={contactForm.email}
								required
								class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								placeholder="tu@email.com"
							/>
						</div>
					</div>

					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
							<input
								type="tel"
								id="phone"
								bind:value={contactForm.phone}
								class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								placeholder="+52 55 1234 5678"
							/>
						</div>
						<div>
							<label for="interest" class="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
							<select
								id="interest"
								bind:value={contactForm.interest}
								class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							>
								{#each interestOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label for="subject" class="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
						<input
							type="text"
							id="subject"
							bind:value={contactForm.subject}
							class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							placeholder="¿En qué podemos ayudarte?"
						/>
					</div>

					<div>
						<label for="message" class="block text-sm font-medium text-gray-700 mb-2">Mensaje *</label>
						<textarea
							id="message"
							bind:value={contactForm.message}
							required
							rows="5"
							class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
							placeholder="Cuéntanos más..."
						></textarea>
					</div>

					{#if submitError}
						<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
							{submitError}
						</div>
					{/if}

					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if isSubmitting}
							<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Enviando...
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
							Enviar mensaje
						{/if}
					</button>
				</form>
			{/if}
		</div>
	</section>

	<!-- Departments -->
	<section class="py-16 sm:py-24">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="max-w-3xl mx-auto">
				<h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Departamentos</h2>
				<div class="space-y-4">
					{#each departments as dept}
						<div class="bg-white rounded-xl border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<h3 class="font-semibold text-gray-900">{dept.name}</h3>
								<p class="text-sm text-gray-600">{dept.description}</p>
							</div>
							<a
								href="mailto:{dept.email}"
								class="text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
							>
								{dept.email}
							</a>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Map Section -->
	<section class="py-16 sm:py-24 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div>
					<h2 class="text-2xl font-bold text-gray-900 mb-4">Visítanos</h2>
					<p class="text-gray-600 mb-6">
						Nuestras oficinas están ubicadas en el corazón de la Ciudad de México.
						Te invitamos a visitarnos en horario de oficina.
					</p>
					<div class="space-y-4">
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 text-primary-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<div>
								<p class="font-medium text-gray-900">Dirección</p>
								<p class="text-gray-600">Av. Insurgentes Sur 1602</p>
								<p class="text-gray-600">Col. Crédito Constructor</p>
								<p class="text-gray-600">03940 Ciudad de México, CDMX</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 text-primary-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<p class="font-medium text-gray-900">Horario</p>
								<p class="text-gray-600">Lunes a Viernes: 9:00 - 18:00</p>
								<p class="text-gray-600">Sábados: 10:00 - 14:00</p>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-200 rounded-2xl h-80 flex items-center justify-center">
					<div class="text-center text-gray-500">
						<svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
						</svg>
						<p>Mapa interactivo</p>
						<a href="https://maps.google.com/?q=Insurgentes+Sur+1602+CDMX" target="_blank" rel="noopener" class="text-primary-600 hover:underline text-sm">
							Abrir en Google Maps
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-12 bg-primary-50 border-t border-primary-100">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">
				¿Necesitas ayuda inmediata?
			</h2>
			<p class="text-gray-600 mb-6">
				Visita nuestro centro de ayuda para encontrar respuestas rápidas a las preguntas más comunes.
			</p>
			<a href="/support" class="inline-flex items-center gap-2 btn-primary-gradient px-8 py-3">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Ir al Centro de Ayuda
			</a>
		</div>
	</section>
</div>
