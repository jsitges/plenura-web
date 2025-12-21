<script lang="ts">
	const team = [
		{
			name: 'Red Broom Software',
			role: 'Desarrollo & Tecnología',
			description: 'Equipo de desarrollo especializado en soluciones digitales para el bienestar'
		}
	];

	const values = [
		{
			icon: 'heart',
			title: 'Bienestar Integral',
			description: 'Creemos en el cuidado holístico del cuerpo y la mente como base para una vida plena.'
		},
		{
			icon: 'shield',
			title: 'Confianza y Seguridad',
			description: 'Todos nuestros terapeutas pasan por un riguroso proceso de verificación.'
		},
		{
			icon: 'users',
			title: 'Comunidad',
			description: 'Construimos puentes entre profesionales del bienestar y quienes buscan mejorar su calidad de vida.'
		},
		{
			icon: 'sparkle',
			title: 'Calidad',
			description: 'Nos comprometemos a ofrecer experiencias de bienestar excepcionales.'
		}
	];

	const stats = [
		{ value: '500+', label: 'Terapeutas verificados' },
		{ value: '10,000+', label: 'Sesiones completadas' },
		{ value: '4.8', label: 'Calificación promedio' },
		{ value: '15+', label: 'Ciudades en México' }
	];
</script>

<svelte:head>
	<title>Sobre Nosotros - Plenura</title>
	<meta name="description" content="Conoce la historia y misión de Plenura, la plataforma líder en servicios de bienestar en México." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
			<div class="max-w-3xl">
				<a href="/" class="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-8 transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Volver al inicio
				</a>
				<h1 class="text-4xl sm:text-5xl font-bold mb-6">
					Conectando bienestar con quienes más lo necesitan
				</h1>
				<p class="text-xl text-primary-100 leading-relaxed">
					Plenura nació con una misión clara: democratizar el acceso a servicios de bienestar de calidad,
					conectando a profesionales certificados con personas que buscan mejorar su calidad de vida.
				</p>
			</div>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="py-12 bg-white border-b border-gray-100">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
				{#each stats as stat}
					<div class="text-center">
						<p class="text-3xl sm:text-4xl font-bold text-primary-600">{stat.value}</p>
						<p class="text-gray-600 mt-1">{stat.label}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Mission Section -->
	<section class="py-16 sm:py-24">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div>
					<h2 class="text-3xl font-bold text-gray-900 mb-6">Nuestra Misión</h2>
					<p class="text-lg text-gray-600 mb-6">
						En Plenura, creemos que el bienestar no debería ser un lujo. Por eso creamos una plataforma
						que hace fácil encontrar y reservar servicios de masajes, terapias y tratamientos de
						bienestar con profesionales verificados, todo desde tu celular.
					</p>
					<p class="text-lg text-gray-600 mb-6">
						Para los terapeutas, ofrecemos las herramientas para hacer crecer su práctica: desde
						gestión de citas hasta procesamiento de pagos seguros, todo en un solo lugar.
					</p>
					<div class="flex flex-wrap gap-4">
						<a href="/therapists" class="btn-primary-gradient px-6 py-3">
							Buscar Terapeutas
						</a>
						<a href="/become-therapist" class="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
							Soy Terapeuta
						</a>
					</div>
				</div>
				<div class="bg-gradient-to-br from-primary-100 to-green-100 rounded-2xl p-8 sm:p-12">
					<div class="grid grid-cols-2 gap-6">
						<div class="bg-white rounded-xl p-6 shadow-sm">
							<div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
								<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<h3 class="font-semibold text-gray-900">Verificados</h3>
							<p class="text-sm text-gray-600 mt-1">Todos los terapeutas pasan verificación</p>
						</div>
						<div class="bg-white rounded-xl p-6 shadow-sm">
							<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
								<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 class="font-semibold text-gray-900">Pago Seguro</h3>
							<p class="text-sm text-gray-600 mt-1">Transacciones protegidas</p>
						</div>
						<div class="bg-white rounded-xl p-6 shadow-sm">
							<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
								<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
							<h3 class="font-semibold text-gray-900">Fácil Reserva</h3>
							<p class="text-sm text-gray-600 mt-1">Agenda en segundos</p>
						</div>
						<div class="bg-white rounded-xl p-6 shadow-sm">
							<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
								<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
							<h3 class="font-semibold text-gray-900">A Domicilio</h3>
							<p class="text-sm text-gray-600 mt-1">El bienestar va a ti</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Values Section -->
	<section class="py-16 sm:py-24 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Nuestros Valores</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					Estos principios guían cada decisión que tomamos y cada funcionalidad que construimos.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each values as value}
					<div class="text-center">
						<div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
							{#if value.icon === 'heart'}
								<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
								</svg>
							{:else if value.icon === 'shield'}
								<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							{:else if value.icon === 'users'}
								<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							{:else}
								<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
								</svg>
							{/if}
						</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
						<p class="text-gray-600">{value.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-16 sm:py-24 bg-gradient-to-br from-primary-600 to-primary-700">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
				¿Listo para experimentar el bienestar?
			</h2>
			<p class="text-xl text-primary-100 mb-8">
				Únete a miles de personas que ya descubrieron una mejor manera de cuidarse.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/register" class="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
					Crear cuenta gratis
				</a>
				<a href="/therapists" class="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
					Explorar terapeutas
				</a>
			</div>
		</div>
	</section>

	<!-- Footer Contact -->
	<section class="py-12 bg-gray-900 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col md:flex-row justify-between items-center gap-6">
				<div>
					<p class="text-gray-400">¿Tienes preguntas?</p>
					<p class="text-lg font-semibold">Estamos aquí para ayudarte</p>
				</div>
				<div class="flex gap-4">
					<a href="/support" class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
						Centro de Ayuda
					</a>
					<a href="/contact" class="px-6 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors">
						Contacto
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
