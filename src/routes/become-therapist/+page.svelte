<script lang="ts">
	const benefits = [
		{
			icon: 'calendar',
			title: 'Gestión de Citas',
			description: 'Calendario inteligente, recordatorios automáticos y sincronización con tu agenda personal.'
		},
		{
			icon: 'dollar',
			title: 'Pagos Seguros',
			description: 'Recibe pagos directos a tu cuenta. Propinas 100% para ti sin comisión.'
		},
		{
			icon: 'chart',
			title: 'Crece tu Negocio',
			description: 'Herramientas de marketing, programa de referidos y posicionamiento destacado.'
		},
		{
			icon: 'shield',
			title: 'Perfil Verificado',
			description: 'Insignia de verificación que genera confianza en tus clientes potenciales.'
		},
		{
			icon: 'phone',
			title: 'App Móvil',
			description: 'Gestiona todo desde tu celular: citas, mensajes, pagos y disponibilidad.'
		},
		{
			icon: 'support',
			title: 'Soporte Dedicado',
			description: 'Equipo de soporte listo para ayudarte a crecer tu práctica.'
		}
	];

	const plans = [
		{
			name: 'Gratis',
			price: '$0',
			period: '/mes',
			description: 'Perfecto para empezar',
			features: [
				'5 reservas por mes',
				'Perfil básico verificado',
				'Procesamiento de pagos',
				'Soporte por email',
				'10% comisión por reserva'
			],
			cta: 'Empezar gratis',
			highlighted: false
		},
		{
			name: 'Profesional',
			price: '$299',
			period: '/mes',
			description: 'Para terapeutas establecidos',
			features: [
				'Reservas ilimitadas',
				'Perfil destacado',
				'Analytics avanzados',
				'Soporte prioritario',
				'5% comisión por reserva'
			],
			cta: 'Elegir Profesional',
			highlighted: true
		},
		{
			name: 'Business',
			price: '$699',
			period: '/mes',
			description: 'Máxima visibilidad',
			features: [
				'Todo en Profesional',
				'Notificaciones WhatsApp',
				'API de integración',
				'Soporte 24/7',
				'3% comisión por reserva'
			],
			cta: 'Elegir Business',
			highlighted: false
		}
	];

	const steps = [
		{
			step: 1,
			title: 'Crea tu cuenta',
			description: 'Regístrate con tu email y completa tu perfil profesional.'
		},
		{
			step: 2,
			title: 'Verificación',
			description: 'Sube tu identificación y credenciales. Verificamos en 24-48 horas.'
		},
		{
			step: 3,
			title: 'Configura servicios',
			description: 'Define tus servicios, precios y horarios de disponibilidad.'
		},
		{
			step: 4,
			title: 'Recibe clientes',
			description: '¡Listo! Comienza a recibir reservas de clientes en tu zona.'
		}
	];

	const testimonials = [
		{
			name: 'María García',
			role: 'Masajista Profesional',
			location: 'CDMX',
			quote: 'Plenura me ayudó a duplicar mis clientes en solo 3 meses. La plataforma es muy fácil de usar.',
			rating: 5
		},
		{
			name: 'Carlos Mendoza',
			role: 'Fisioterapeuta',
			location: 'Guadalajara',
			quote: 'Los pagos llegan rápido y el sistema de reservas me ahorra mucho tiempo administrativo.',
			rating: 5
		},
		{
			name: 'Ana Lucía Pérez',
			role: 'Terapeuta Holística',
			location: 'Monterrey',
			quote: 'El programa de referidos me genera ingresos extra cada mes. ¡Lo recomiendo totalmente!',
			rating: 5
		}
	];
</script>

<svelte:head>
	<title>Soy Terapeuta - Únete a Plenura</title>
	<meta name="description" content="Únete a la red de terapeutas verificados de Plenura. Gestiona tu negocio, recibe pagos seguros y haz crecer tu clientela." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-primary-600 via-primary-700 to-green-700 text-white overflow-hidden">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div>
					<a href="/" class="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-8 transition-colors">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
						Volver al inicio
					</a>
					<h1 class="text-4xl sm:text-5xl font-bold mb-6">
						Haz crecer tu práctica de bienestar
					</h1>
					<p class="text-xl text-primary-100 mb-8">
						Únete a cientos de terapeutas que ya usan Plenura para gestionar su negocio,
						encontrar nuevos clientes y recibir pagos de forma segura.
					</p>
					<div class="flex flex-col sm:flex-row gap-4">
						<a href="/register?role=therapist" class="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-center">
							Registrarme como terapeuta
						</a>
						<a href="#como-funciona" class="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-center">
							¿Cómo funciona?
						</a>
					</div>
					<p class="text-sm text-primary-200 mt-4">
						Registro gratuito. Sin tarjeta de crédito requerida.
					</p>
				</div>
				<div class="hidden lg:block">
					<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
						<div class="grid grid-cols-2 gap-4">
							<div class="bg-white rounded-xl p-4 text-center">
								<p class="text-3xl font-bold text-primary-600">$15,000+</p>
								<p class="text-sm text-gray-600">Ingresos promedio/mes</p>
							</div>
							<div class="bg-white rounded-xl p-4 text-center">
								<p class="text-3xl font-bold text-primary-600">24hrs</p>
								<p class="text-sm text-gray-600">Verificación rápida</p>
							</div>
							<div class="bg-white rounded-xl p-4 text-center">
								<p class="text-3xl font-bold text-primary-600">100%</p>
								<p class="text-sm text-gray-600">Propinas para ti</p>
							</div>
							<div class="bg-white rounded-xl p-4 text-center">
								<p class="text-3xl font-bold text-primary-600">0%</p>
								<p class="text-sm text-gray-600">Cuota de registro</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="py-16 sm:py-24">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Todo lo que necesitas para crecer</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					Herramientas profesionales diseñadas para que te enfoques en lo que mejor haces: ayudar a tus clientes.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each benefits as benefit}
					<div class="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
						<div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
							{#if benefit.icon === 'calendar'}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							{:else if benefit.icon === 'dollar'}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							{:else if benefit.icon === 'chart'}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
								</svg>
							{:else if benefit.icon === 'shield'}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							{:else if benefit.icon === 'phone'}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
							{:else}
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							{/if}
						</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
						<p class="text-gray-600">{benefit.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section id="como-funciona" class="py-16 sm:py-24 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Comienza en 4 simples pasos</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					El proceso de registro es rápido y sencillo. En menos de 48 horas podrías estar recibiendo tus primeros clientes.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each steps as step}
					<div class="relative">
						<div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
							{step.step}
						</div>
						{#if step.step < 4}
							<div class="hidden lg:block absolute top-6 left-12 w-full h-0.5 bg-primary-200"></div>
						{/if}
						<h3 class="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
						<p class="text-gray-600">{step.description}</p>
					</div>
				{/each}
			</div>

			<div class="text-center mt-12">
				<a href="/register?role=therapist" class="inline-flex items-center gap-2 btn-primary-gradient px-8 py-4 text-lg">
					Comenzar ahora
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</a>
			</div>
		</div>
	</section>

	<!-- Pricing Section -->
	<section class="py-16 sm:py-24 bg-gray-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Planes flexibles para cada etapa</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					Empieza gratis y escala cuando estés listo. Sin compromisos a largo plazo.
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
				{#each plans as plan}
					<div class="bg-white rounded-2xl border-2 {plan.highlighted ? 'border-primary-500 shadow-xl' : 'border-gray-100'} p-8 relative">
						{#if plan.highlighted}
							<div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
								<span class="bg-primary-600 text-white text-sm font-medium px-4 py-1 rounded-full">
									Más popular
								</span>
							</div>
						{/if}

						<h3 class="text-xl font-bold text-gray-900">{plan.name}</h3>
						<p class="text-gray-600 mt-1">{plan.description}</p>

						<div class="mt-6 mb-8">
							<span class="text-4xl font-bold text-gray-900">{plan.price}</span>
							<span class="text-gray-600">{plan.period}</span>
						</div>

						<ul class="space-y-3 mb-8">
							{#each plan.features as feature}
								<li class="flex items-start gap-3">
									<svg class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									<span class="text-gray-600">{feature}</span>
								</li>
							{/each}
						</ul>

						<a
							href="/register?role=therapist&plan={plan.name.toLowerCase()}"
							class="block w-full py-3 text-center font-semibold rounded-xl transition-colors {plan.highlighted ? 'btn-primary-gradient text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}"
						>
							{plan.cta}
						</a>
					</div>
				{/each}
			</div>

			<p class="text-center text-gray-500 mt-8">
				¿Tienes un equipo grande? <a href="/contact" class="text-primary-600 hover:underline">Contáctanos para Enterprise</a>
			</p>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-16 sm:py-24 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Lo que dicen nuestros terapeutas</h2>
			</div>

			<div class="grid md:grid-cols-3 gap-8">
				{#each testimonials as testimonial}
					<div class="bg-gray-50 rounded-2xl p-6">
						<div class="flex items-center gap-1 mb-4">
							{#each Array(testimonial.rating) as _}
								<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							{/each}
						</div>
						<p class="text-gray-700 mb-6">"{testimonial.quote}"</p>
						<div>
							<p class="font-semibold text-gray-900">{testimonial.name}</p>
							<p class="text-sm text-gray-600">{testimonial.role} - {testimonial.location}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-16 sm:py-24 bg-gradient-to-br from-primary-600 to-primary-700">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
				Únete a la comunidad de terapeutas de Plenura
			</h2>
			<p class="text-xl text-primary-100 mb-8">
				Empieza gratis hoy y descubre por qué cientos de profesionales ya confían en nosotros.
			</p>
			<a href="/register?role=therapist" class="inline-block px-10 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-lg">
				Crear mi cuenta de terapeuta
			</a>
		</div>
	</section>
</div>
