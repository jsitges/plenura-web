<script lang="ts">
	interface Props {
		data: {
			summary: {
				totalBookings: number;
				completedBookings: number;
				thisMonthBookings: number;
				thisWeekBookings: number;
				revenueThisMonth: number;
				revenueLastMonth: number;
				commissionThisMonth: number;
				revenueGrowth: number;
				bookingGrowth: number;
				averageBookingValue: number;
				cancellationRate: number;
			};
			statusBreakdown: {
				completed: number;
				confirmed: number;
				pending: number;
				cancelled: number;
			};
			therapistStats: Array<{
				id: string;
				name: string;
				avatar_url: string | null;
				rating_avg: number;
				rating_count: number;
				totalBookings: number;
				completedBookings: number;
				thisMonthBookings: number;
				thisMonthRevenue: number;
				cancellationRate: number;
			}>;
			weeklyData: Array<{
				week: string;
				bookings: number;
				revenue: number;
			}>;
			teamSize: number;
		};
	}

	let { data }: Props = $props();

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(cents / 100);
	}

	function formatPercent(value: number): string {
		return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
	}

	// Calculate max revenue for chart scaling
	const maxRevenue = $derived(Math.max(...data.weeklyData.map(w => w.revenue), 1));
	const maxBookings = $derived(Math.max(...data.weeklyData.map(w => w.bookings), 1));
</script>

<svelte:head>
	<title>Análisis - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Análisis</h1>
		<p class="text-gray-500 mt-1">Métricas y rendimiento de tu equipo</p>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Revenue This Month -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Ingresos del mes</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.summary.revenueThisMonth)}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
			{#if data.summary.revenueLastMonth > 0}
				<p class="text-sm mt-2 {data.summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
					{formatPercent(data.summary.revenueGrowth)} vs mes anterior
				</p>
			{/if}
		</div>

		<!-- Commission This Month -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Comisión del mes</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.summary.commissionThisMonth)}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
			</div>
			<p class="text-sm text-gray-500 mt-2">Tu parte de las reservas completadas</p>
		</div>

		<!-- Bookings This Month -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Reservas del mes</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">{data.summary.thisMonthBookings}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
			</div>
			{#if data.summary.bookingGrowth !== 0}
				<p class="text-sm mt-2 {data.summary.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
					{formatPercent(data.summary.bookingGrowth)} vs mes anterior
				</p>
			{/if}
		</div>

		<!-- Average Booking Value -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Valor promedio</p>
					<p class="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.summary.averageBookingValue)}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
					<svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
				</div>
			</div>
			<p class="text-sm text-gray-500 mt-2">Por reserva completada</p>
		</div>
	</div>

	<!-- Charts Row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Weekly Revenue Chart -->
		<div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
			<h2 class="font-semibold text-gray-900 mb-4">Ingresos semanales</h2>
			<div class="h-64 flex items-end justify-between gap-2">
				{#each data.weeklyData as week}
					<div class="flex-1 flex flex-col items-center gap-2">
						<div class="w-full flex flex-col items-center gap-1">
							<!-- Revenue bar -->
							<div
								class="w-full bg-primary-500 rounded-t transition-all"
								style="height: {(week.revenue / maxRevenue) * 180}px; min-height: 4px;"
								title="{formatCurrency(week.revenue)}"
							></div>
							<!-- Bookings indicator -->
							<div class="text-xs text-gray-500">{week.bookings}</div>
						</div>
						<span class="text-xs text-gray-500 text-center">{week.week}</span>
					</div>
				{/each}
			</div>
			<div class="flex items-center justify-center gap-6 mt-4 text-sm">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 bg-primary-500 rounded"></div>
					<span class="text-gray-600">Ingresos</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-gray-600">Número = reservas completadas</span>
				</div>
			</div>
		</div>

		<!-- Status Breakdown -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<h2 class="font-semibold text-gray-900 mb-4">Estado de reservas</h2>
			<div class="space-y-4">
				{#each [
					{ label: 'Completadas', value: data.statusBreakdown.completed, color: 'bg-green-500', textColor: 'text-green-600' },
					{ label: 'Confirmadas', value: data.statusBreakdown.confirmed, color: 'bg-blue-500', textColor: 'text-blue-600' },
					{ label: 'Pendientes', value: data.statusBreakdown.pending, color: 'bg-amber-500', textColor: 'text-amber-600' },
					{ label: 'Canceladas', value: data.statusBreakdown.cancelled, color: 'bg-red-500', textColor: 'text-red-600' }
				] as status}
					{@const total = data.summary.totalBookings || 1}
					{@const percent = (status.value / total) * 100}
					<div>
						<div class="flex items-center justify-between mb-1">
							<span class="text-sm text-gray-600">{status.label}</span>
							<span class="text-sm font-medium {status.textColor}">{status.value}</span>
						</div>
						<div class="w-full bg-gray-100 rounded-full h-2">
							<div
								class="{status.color} h-2 rounded-full transition-all"
								style="width: {percent}%"
							></div>
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-6 pt-4 border-t border-gray-100">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Tasa de cancelación</span>
					<span class="text-sm font-medium {data.summary.cancellationRate > 20 ? 'text-red-600' : data.summary.cancellationRate > 10 ? 'text-amber-600' : 'text-green-600'}">
						{data.summary.cancellationRate.toFixed(1)}%
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Therapist Performance Table -->
	<div class="bg-white rounded-xl border border-gray-200">
		<div class="p-6 border-b border-gray-100">
			<div class="flex items-center justify-between">
				<h2 class="font-semibold text-gray-900">Rendimiento por terapeuta</h2>
				<span class="text-sm text-gray-500">{data.teamSize} miembros</span>
			</div>
		</div>

		{#if data.therapistStats.length === 0}
			<div class="p-8 text-center">
				<p class="text-gray-500">No hay datos de terapeutas disponibles</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terapeuta</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calificación</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Este mes</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos del mes</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total completadas</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cancelación</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.therapistStats as therapist, i}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div class="relative">
											{#if therapist.avatar_url}
												<img src={therapist.avatar_url} alt="" class="w-10 h-10 rounded-full object-cover" />
											{:else}
												<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
													<span class="text-sm font-medium text-primary-600">{therapist.name.charAt(0)}</span>
												</div>
											{/if}
											{#if i === 0}
												<div class="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
													<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
														<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
													</svg>
												</div>
											{/if}
										</div>
										<span class="font-medium text-gray-900">{therapist.name}</span>
									</div>
								</td>
								<td class="px-6 py-4">
									{#if therapist.rating_count > 0}
										<div class="flex items-center gap-1">
											<svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
											<span class="text-gray-900">{therapist.rating_avg.toFixed(1)}</span>
											<span class="text-gray-500 text-sm">({therapist.rating_count})</span>
										</div>
									{:else}
										<span class="text-gray-400 text-sm">Sin reseñas</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-right">
									<span class="font-medium text-gray-900">{therapist.thisMonthBookings}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="font-medium text-green-600">{formatCurrency(therapist.thisMonthRevenue)}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="text-gray-900">{therapist.completedBookings}</span>
									<span class="text-gray-500">/ {therapist.totalBookings}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="{therapist.cancellationRate > 20 ? 'text-red-600' : therapist.cancellationRate > 10 ? 'text-amber-600' : 'text-green-600'}">
										{therapist.cancellationRate.toFixed(1)}%
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Quick Stats Row -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{data.summary.thisWeekBookings}</p>
					<p class="text-sm text-gray-500">Reservas esta semana</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{data.summary.completedBookings}</p>
					<p class="text-sm text-gray-500">Total completadas</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{data.teamSize}</p>
					<p class="text-sm text-gray-500">Terapeutas activos</p>
				</div>
			</div>
		</div>
	</div>
</div>
