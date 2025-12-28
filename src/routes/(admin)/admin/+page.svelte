<script lang="ts">
	let { data } = $props();

	const formatPrice = (cents: number) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);

	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('es-MX', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

	const statusColors: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-800',
		confirmed: 'bg-blue-100 text-blue-800',
		completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800',
		cancelled_by_client: 'bg-red-100 text-red-800',
		cancelled_by_therapist: 'bg-red-100 text-red-800'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Pendiente',
		confirmed: 'Confirmada',
		completed: 'Completada',
		cancelled: 'Cancelada',
		cancelled_by_client: 'Cancelada',
		cancelled_by_therapist: 'Cancelada'
	};
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<div class="bg-white rounded-xl shadow-sm p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Total Usuarios</p>
					<p class="text-3xl font-bold text-gray-900">{data.stats.totalUsers}</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Terapeutas Activos</p>
					<p class="text-3xl font-bold text-gray-900">{data.stats.totalTherapists}</p>
				</div>
				<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Aprobaciones Pendientes</p>
					<p class="text-3xl font-bold text-amber-600">{data.stats.pendingApprovals}</p>
				</div>
				<div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
			{#if data.stats.pendingApprovals > 0}
				<a href="/admin/therapists?status=pending" class="text-sm text-amber-600 hover:underline mt-2 inline-block">
					Ver solicitudes →
				</a>
			{/if}
		</div>

		<div class="bg-white rounded-xl shadow-sm p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Reservas Totales</p>
					<p class="text-3xl font-bold text-gray-900">{data.stats.totalBookings}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Disputas Abiertas</p>
					<p class="text-3xl font-bold {data.stats.openDisputes > 0 ? 'text-red-600' : 'text-gray-900'}">{data.stats.openDisputes}</p>
				</div>
				<div class="w-12 h-12 {data.stats.openDisputes > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 {data.stats.openDisputes > 0 ? 'text-red-600' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
			</div>
			{#if data.stats.openDisputes > 0}
				<a href="/admin/disputes" class="text-sm text-red-600 hover:underline mt-2 inline-block">
					Revisar disputas →
				</a>
			{/if}
		</div>

		<div class="bg-white rounded-xl shadow-sm p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">GMV Este Mes</p>
					<p class="text-3xl font-bold text-gray-900">{formatPrice(data.stats.monthlyGMV)}</p>
				</div>
				<div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Comisiones Este Mes</p>
					<p class="text-3xl font-bold text-green-600">{formatPrice(data.stats.monthlyRevenue)}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Recent Bookings -->
		<div class="bg-white rounded-xl shadow-sm">
			<div class="px-6 py-4 border-b border-gray-100">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Reservas Recientes</h2>
					<a href="/admin/bookings" class="text-sm text-primary-600 hover:underline">Ver todas</a>
				</div>
			</div>
			<div class="divide-y divide-gray-100">
				{#each data.recentBookings as booking}
					{@const b = booking as {
						id: string;
						status: string;
						price_cents: number;
						scheduled_at: string;
						users: { full_name: string };
						therapists: { users: { full_name: string } };
					}}
					<div class="px-6 py-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-gray-900">{b.users.full_name}</p>
								<p class="text-sm text-gray-500">con {b.therapists.users.full_name}</p>
							</div>
							<div class="text-right">
								<span class="px-2 py-1 text-xs rounded-full {statusColors[b.status] ?? 'bg-gray-100 text-gray-800'}">
									{statusLabels[b.status] ?? b.status}
								</span>
								<p class="text-sm text-gray-500 mt-1">{formatPrice(b.price_cents)}</p>
							</div>
						</div>
						<p class="text-xs text-gray-400 mt-1">{formatDate(b.scheduled_at)}</p>
					</div>
				{:else}
					<div class="px-6 py-8 text-center text-gray-500">
						No hay reservas recientes
					</div>
				{/each}
			</div>
		</div>

		<!-- Pending Therapist Approvals -->
		<div class="bg-white rounded-xl shadow-sm">
			<div class="px-6 py-4 border-b border-gray-100">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Solicitudes Pendientes</h2>
					<a href="/admin/therapists?status=pending" class="text-sm text-primary-600 hover:underline">Ver todas</a>
				</div>
			</div>
			<div class="divide-y divide-gray-100">
				{#each data.pendingTherapists as therapist}
					{@const t = therapist as {
						id: string;
						created_at: string;
						users: { full_name: string; email: string };
					}}
					<div class="px-6 py-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-gray-900">{t.users.full_name}</p>
								<p class="text-sm text-gray-500">{t.users.email}</p>
							</div>
							<a
								href="/admin/therapists/{t.id}"
								class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
							>
								Revisar
							</a>
						</div>
						<p class="text-xs text-gray-400 mt-1">Solicitud: {formatDate(t.created_at)}</p>
					</div>
				{:else}
					<div class="px-6 py-8 text-center text-gray-500">
						No hay solicitudes pendientes
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
