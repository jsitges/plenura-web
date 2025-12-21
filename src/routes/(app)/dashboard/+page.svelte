<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();

	const user = data.userProfile;
	const isTherapist = user?.role === 'therapist';

	// Quick stats (placeholder data)
	const clientStats = [
		{ label: 'Citas completadas', value: 0, icon: '✅' },
		{ label: 'Próxima cita', value: 'Sin agendar', icon: '📅' },
		{ label: 'Favoritos', value: 0, icon: '❤️' },
		{ label: 'Ahorro total', value: '$0', icon: '💰' }
	];

	const therapistStats = [
		{ label: 'Citas hoy', value: 0, icon: '📅' },
		{ label: 'Esta semana', value: 0, icon: '📊' },
		{ label: 'Rating', value: '-', icon: '⭐' },
		{ label: 'Ganancias (mes)', value: '$0', icon: '💰' }
	];

	const stats = isTherapist ? therapistStats : clientStats;
</script>

<svelte:head>
	<title>Dashboard - Plenura</title>
</svelte:head>

<div class="space-y-8">
	<!-- Welcome Header -->
	<div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
		<h1 class="text-2xl font-bold mb-2">
			¡Hola, {user?.full_name?.split(' ')[0] || 'Usuario'}!
		</h1>
		<p class="text-primary-100">
			{#if isTherapist}
				Gestiona tus citas y haz crecer tu negocio de bienestar.
			{:else}
				Encuentra el bienestar que mereces. Tu siguiente sesión está a un clic.
			{/if}
		</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		{#each stats as stat}
			<div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
				<div class="flex items-center gap-3">
					<span class="text-2xl">{stat.icon}</span>
					<div>
						<p class="text-sm text-gray-500">{stat.label}</p>
						<p class="text-lg font-semibold text-gray-900">{stat.value}</p>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Quick Actions -->
	<div class="grid md:grid-cols-2 gap-6">
		{#if isTherapist}
			<!-- Therapist Quick Actions -->
			<a href="/calendar" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-xl">
					📅
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Mi Calendario</h3>
					<p class="text-sm text-gray-500">Gestiona tu disponibilidad y citas</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a href="/services" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center text-xl">
					💆
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Mis Servicios</h3>
					<p class="text-sm text-gray-500">Configura precios y servicios</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a href="/earnings" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">
					💰
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Mis Ganancias</h3>
					<p class="text-sm text-gray-500">Revisa tus ingresos y retiros</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a href="/profile/edit" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">
					👤
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Mi Perfil Público</h3>
					<p class="text-sm text-gray-500">Edita cómo te ven los clientes</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

		{:else}
			<!-- Client Quick Actions -->
			<a href="/therapists" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-xl">
					🔍
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Buscar Terapeutas</h3>
					<p class="text-sm text-gray-500">Encuentra al especialista ideal para ti</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a href="/bookings" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center text-xl">
					📅
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Mis Citas</h3>
					<p class="text-sm text-gray-500">Próximas sesiones y historial</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a href="/favorites" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">
					❤️
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Mis Favoritos</h3>
					<p class="text-sm text-gray-500">Terapeutas que te gustan</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a href="/referrals" class="card-wellness flex items-center gap-4 hover:border-primary-200">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">
					🎁
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">Invita y Gana</h3>
					<p class="text-sm text-gray-500">$100 MXN por cada amigo</p>
				</div>
				<svg class="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		{/if}
	</div>

	<!-- Upcoming Bookings Section -->
	<div class="bg-white rounded-2xl border border-gray-100 shadow-sm">
		<div class="p-6 border-b border-gray-100">
			<h2 class="text-lg font-semibold text-gray-900">
				{isTherapist ? 'Próximas Citas' : 'Tus Próximas Sesiones'}
			</h2>
		</div>
		<div class="p-6">
			<div class="text-center py-8">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<p class="text-gray-500 mb-4">No tienes citas programadas</p>
				{#if !isTherapist}
					<a href="/therapists" class="btn-primary-gradient inline-block">
						Buscar Terapeuta
					</a>
				{/if}
			</div>
		</div>
	</div>
</div>
