<script lang="ts">
	import VerificationBadge from '$lib/components/VerificationBadge.svelte';
	import type { VerificationStatus } from '$lib/types/database.types';

	interface Props {
		data: {
			practice: {
				id: string;
				name: string;
				verification_status: VerificationStatus;
				rating_avg: number;
				rating_count: number;
				total_bookings: number;
			};
			stats: {
				totalMembers: number;
				activeTherapists: number;
				pendingBookings: number;
				completedThisMonth: number;
				revenueThisMonth: number;
			};
			recentBookings: Array<{
				id: string;
				scheduled_at: string;
				status: string;
				client_name: string;
				therapist_name: string;
				service_name: string;
			}>;
		};
	}

	let { data }: Props = $props();

	const stats = [
		{
			label: 'Miembros del equipo',
			value: data.stats.totalMembers,
			icon: 'users',
			color: 'blue'
		},
		{
			label: 'Terapeutas activos',
			value: data.stats.activeTherapists,
			icon: 'user-check',
			color: 'green'
		},
		{
			label: 'Reservas pendientes',
			value: data.stats.pendingBookings,
			icon: 'calendar',
			color: 'yellow'
		},
		{
			label: 'Completadas este mes',
			value: data.stats.completedThisMonth,
			icon: 'check-circle',
			color: 'purple'
		}
	];

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(cents / 100);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('es-MX', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - {data.practice.name} - Plenura</title>
</svelte:head>

<div class="space-y-8">
	<!-- Welcome header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
			<p class="text-gray-500 mt-1">
				Resumen de actividad de {data.practice.name}
			</p>
		</div>

		{#if data.practice.verification_status !== 'fully_verified'}
			<a
				href="/practice/settings/verification"
				class="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
			>
				<VerificationBadge status={data.practice.verification_status} size="sm" showTooltip={false} />
				<span class="text-sm font-medium">Completar verificación</span>
			</a>
		{/if}
	</div>

	<!-- Stats grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each stats as stat}
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">{stat.label}</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
					</div>
					<div class="w-12 h-12 rounded-full bg-{stat.color}-100 flex items-center justify-center">
						{#if stat.icon === 'users'}
							<svg class="w-6 h-6 text-{stat.color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						{:else if stat.icon === 'user-check'}
							<svg class="w-6 h-6 text-{stat.color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						{:else if stat.icon === 'calendar'}
							<svg class="w-6 h-6 text-{stat.color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						{:else if stat.icon === 'check-circle'}
							<svg class="w-6 h-6 text-{stat.color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Revenue card -->
	<div class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-primary-100">Ingresos este mes</p>
				<p class="text-3xl font-bold mt-1">{formatCurrency(data.stats.revenueThisMonth)}</p>
			</div>
			<a
				href="/practice/analytics"
				class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
			>
				Ver análisis
			</a>
		</div>
	</div>

	<!-- Recent bookings -->
	<div class="bg-white rounded-xl border border-gray-200">
		<div class="p-6 border-b border-gray-100">
			<div class="flex items-center justify-between">
				<h2 class="font-semibold text-gray-900">Reservas recientes</h2>
				<a href="/practice/bookings" class="text-sm text-primary-600 hover:text-primary-700">
					Ver todas
				</a>
			</div>
		</div>

		{#if data.recentBookings.length === 0}
			<div class="p-8 text-center">
				<p class="text-gray-500">No hay reservas recientes</p>
			</div>
		{:else}
			<div class="divide-y divide-gray-100">
				{#each data.recentBookings as booking}
					<div class="p-4 hover:bg-gray-50 transition-colors">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
									<span class="text-gray-600 font-medium">{booking.client_name.charAt(0)}</span>
								</div>
								<div>
									<p class="font-medium text-gray-900">{booking.client_name}</p>
									<p class="text-sm text-gray-500">
										{booking.service_name} con {booking.therapist_name}
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm text-gray-900">{formatDate(booking.scheduled_at)}</p>
								<span
									class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
										{booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
										booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
										booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
										'bg-gray-100 text-gray-700'}"
								>
									{booking.status === 'confirmed' ? 'Confirmada' :
									booking.status === 'pending' ? 'Pendiente' :
									booking.status === 'completed' ? 'Completada' :
									booking.status}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Quick actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<a
			href="/practice/team/invite"
			class="p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
		>
			<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
				<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
				</svg>
			</div>
			<h3 class="font-medium text-gray-900">Invitar miembro</h3>
			<p class="text-sm text-gray-500 mt-1">Agrega terapeutas o personal a tu equipo</p>
		</a>

		<a
			href="/practice/settings"
			class="p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
		>
			<div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary-200 transition-colors">
				<svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
			<h3 class="font-medium text-gray-900">Configuración</h3>
			<p class="text-sm text-gray-500 mt-1">Horarios, servicios y preferencias</p>
		</a>

		<a
			href="/practice/analytics"
			class="p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
		>
			<div class="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent-200 transition-colors">
				<svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
			</div>
			<h3 class="font-medium text-gray-900">Análisis</h3>
			<p class="text-sm text-gray-500 mt-1">Métricas y reportes del negocio</p>
		</a>
	</div>
</div>
