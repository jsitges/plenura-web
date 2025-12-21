<script lang="ts">
	import { goto } from '$app/navigation';

	let searchQuery = $state('');
	let location = $state('');

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (location) params.set('location', location);
		goto(`/therapists?${params.toString()}`);
	}

	const categories = [
		{ name: 'Masajes', icon: '💆', slug: 'massage' },
		{ name: 'Fisioterapia', icon: '🏃', slug: 'physiotherapy' },
		{ name: 'Psicología', icon: '🧠', slug: 'psychology' },
		{ name: 'Nutrición', icon: '🥗', slug: 'nutrition' },
		{ name: 'Yoga', icon: '🧘', slug: 'yoga' },
		{ name: 'Spa', icon: '🛁', slug: 'spa' }
	];

	const featuredTherapists = [
		{
			id: '1',
			name: 'María García',
			specialty: 'Masaje Terapéutico',
			rating: 4.9,
			reviews: 127,
			price: 800,
			image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face'
		},
		{
			id: '2',
			name: 'Carlos López',
			specialty: 'Fisioterapia Deportiva',
			rating: 4.8,
			reviews: 89,
			price: 900,
			image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face'
		},
		{
			id: '3',
			name: 'Ana Martínez',
			specialty: 'Psicología Clínica',
			rating: 5.0,
			reviews: 156,
			price: 1000,
			image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=face'
		}
	];
</script>

<div class="min-h-screen bg-base-100">
	<!-- Navigation -->
	<nav class="navbar bg-base-100/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
		<div class="container-app flex justify-between items-center py-2">
			<a href="/" class="text-xl md:text-2xl font-bold text-primary">Plenura</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex gap-4 items-center">
				<a href="/therapists" class="btn btn-ghost">Buscar Terapeutas</a>
				<a href="/login" class="btn btn-outline btn-primary">Iniciar Sesion</a>
				<a href="/register" class="btn btn-primary">Registrarse</a>
			</div>

			<!-- Mobile Navigation -->
			<div class="flex md:hidden gap-2 items-center">
				<a href="/therapists" class="btn btn-ghost btn-sm px-2" aria-label="Buscar terapeutas">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</a>
				<a href="/login" class="btn btn-outline btn-primary btn-sm">Entrar</a>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 section-padding overflow-hidden">
		<div class="container-app">
			<div class="max-w-3xl mx-auto text-center px-4">
				<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 animate-fade-in">
					Tu bienestar, a un clic de distancia
				</h1>
				<p class="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 animate-slide-up">
					Conectamos a los mejores terapeutas de Mexico contigo. Masajes, fisioterapia, psicologia y mas, en la comodidad de tu hogar.
				</p>

				<!-- Search Box -->
				<div class="card bg-white shadow-xl p-4 md:p-6 max-w-2xl mx-auto animate-slide-up">
					<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex flex-col gap-3 md:flex-row md:gap-4">
						<div class="flex-1">
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Que servicio buscas?"
								class="input-wellness"
							/>
						</div>
						<div class="flex-1">
							<input
								type="text"
								bind:value={location}
								placeholder="Tu ubicacion"
								class="input-wellness"
							/>
						</div>
						<button type="submit" class="btn btn-primary w-full md:w-auto">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							Buscar
						</button>
					</form>
				</div>
			</div>
		</div>

		<!-- Decorative shapes (hidden on small screens for performance) -->
		<div class="hidden sm:block absolute top-20 left-10 w-48 md:w-64 h-48 md:h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
		<div class="hidden sm:block absolute bottom-20 right-10 w-48 md:w-64 h-48 md:h-64 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
	</section>

	<!-- Categories Section -->
	<section class="section-padding bg-white">
		<div class="container-app px-4">
			<h2 class="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-12">
				Explora por categoria
			</h2>
			<div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-6">
				{#each categories as category}
					<a href={`/therapists?category=${category.slug}`} class="card-wellness text-center group cursor-pointer">
						<div class="text-4xl mb-4 group-hover:scale-110 transition-transform">{category.icon}</div>
						<h3 class="font-semibold text-gray-900">{category.name}</h3>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- Featured Therapists -->
	<section class="section-padding bg-base-200">
		<div class="container-app px-4">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
				<h2 class="text-2xl md:text-3xl font-bold text-gray-900">Terapeutas destacados</h2>
				<a href="/therapists" class="btn btn-ghost btn-primary btn-sm sm:btn-md">Ver todos</a>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
				{#each featuredTherapists as therapist}
					<a href={`/therapists/${therapist.id}`} class="card bg-white shadow-lg hover:shadow-xl transition-shadow">
						<figure class="px-4 pt-4">
							<img
								src={therapist.image}
								alt={therapist.name}
								class="rounded-xl h-48 w-full object-cover"
							/>
						</figure>
						<div class="card-body">
							<h3 class="card-title">{therapist.name}</h3>
							<p class="text-gray-600">{therapist.specialty}</p>
							<div class="flex items-center gap-2 mt-2">
								<div class="badge badge-primary gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
									{therapist.rating}
								</div>
								<span class="text-sm text-gray-500">({therapist.reviews} reseñas)</span>
							</div>
							<div class="card-actions justify-between items-center mt-4">
								<span class="text-xl font-bold text-primary">${therapist.price} MXN</span>
								<button class="btn btn-primary btn-sm">Reservar</button>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- How it Works -->
	<section class="section-padding bg-white">
		<div class="container-app">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
				¿Cómo funciona?
			</h2>
			<div class="grid md:grid-cols-3 gap-8">
				<div class="text-center">
					<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<span class="text-2xl">🔍</span>
					</div>
					<h3 class="text-xl font-semibold mb-2">1. Busca</h3>
					<p class="text-gray-600">Encuentra al terapeuta ideal cerca de ti filtrando por servicio, ubicación y disponibilidad.</p>
				</div>
				<div class="text-center">
					<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<span class="text-2xl">📅</span>
					</div>
					<h3 class="text-xl font-semibold mb-2">2. Reserva</h3>
					<p class="text-gray-600">Elige fecha, hora y confirma tu cita. El pago se retiene hasta que el servicio se complete.</p>
				</div>
				<div class="text-center">
					<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<span class="text-2xl">✨</span>
					</div>
					<h3 class="text-xl font-semibold mb-2">3. Disfruta</h3>
					<p class="text-gray-600">Recibe tu sesión en casa o en el estudio del terapeuta. Califícalo y ayuda a otros usuarios.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA for Therapists -->
	<section class="section-padding bg-gradient-to-r from-primary-600 to-primary-700">
		<div class="container-app text-center">
			<h2 class="text-3xl font-bold text-white mb-4">
				¿Eres terapeuta?
			</h2>
			<p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
				Únete a Plenura y llega a miles de clientes. Gestiona tu agenda, recibe pagos seguros y haz crecer tu negocio.
			</p>
			<a href="/become-therapist" class="btn btn-lg bg-white text-primary hover:bg-gray-100">
				Empieza gratis hoy
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="footer p-6 md:p-10 bg-neutral text-neutral-content">
		<div class="container-app grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 px-4">
			<nav>
				<h6 class="footer-title text-sm md:text-base">Servicios</h6>
				<a href="/therapists?category=massage" class="link link-hover text-sm">Masajes</a>
				<a href="/therapists?category=physiotherapy" class="link link-hover text-sm">Fisioterapia</a>
				<a href="/therapists?category=psychology" class="link link-hover text-sm">Psicologia</a>
				<a href="/therapists?category=nutrition" class="link link-hover text-sm">Nutricion</a>
			</nav>
			<nav>
				<h6 class="footer-title text-sm md:text-base">Empresa</h6>
				<a href="/about" class="link link-hover text-sm">Sobre nosotros</a>
				<a href="/become-therapist" class="link link-hover text-sm">Ser terapeuta</a>
				<a href="/contact" class="link link-hover text-sm">Contacto</a>
			</nav>
			<nav>
				<h6 class="footer-title text-sm md:text-base">Legal</h6>
				<a href="/terms" class="link link-hover text-sm">Términos de uso</a>
				<a href="/privacy" class="link link-hover text-sm">Privacidad</a>
				<a href="/support" class="link link-hover text-sm">Soporte</a>
			</nav>
			<nav aria-label="Redes sociales">
				<h6 class="footer-title text-sm md:text-base">Redes sociales</h6>
				<div class="grid grid-flow-col gap-4">
					<a href="https://twitter.com/plenura" aria-label="Twitter" class="hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
					<a href="https://instagram.com/plenura" aria-label="Instagram" class="hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
				</div>
			</nav>
		</div>
		<div class="container-app border-t border-gray-700 mt-6 md:mt-8 pt-6 md:pt-8 px-4">
			<p class="text-center text-gray-400 text-xs md:text-sm">{new Date().getFullYear()} Plenura. Todos los derechos reservados. Un producto de Red Broom Software S.A.S.</p>
		</div>
	</footer>
</div>
