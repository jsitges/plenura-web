<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		data: {
			settings: {
				platform_commission_rate: number;
				min_booking_notice_hours: number;
				max_booking_advance_days: number;
				cancellation_window_hours: number;
				maintenance_mode: boolean;
			};
			stats: {
				usersCount: number;
				therapistsCount: number;
				practicesCount: number;
				bookingsCount: number;
				totalRevenue: number;
				totalCommission: number;
			};
		};
		form?: {
			success?: boolean;
			message?: string;
			error?: string;
		};
	}

	let { data, form }: Props = $props();

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(cents / 100);
	}

	let commissionRate = $state(data.settings.platform_commission_rate);
	let minNotice = $state(data.settings.min_booking_notice_hours);
	let maxAdvance = $state(data.settings.max_booking_advance_days);
	let cancellationWindow = $state(data.settings.cancellation_window_hours);
</script>

<svelte:head>
	<title>Configuración - Admin Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Configuración de la Plataforma</h1>
		<p class="text-gray-500 mt-1">Gestiona la configuración global de Plenura</p>
	</div>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
			{form.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{form.error}
		</div>
	{/if}

	<!-- Platform Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Usuarios</p>
			<p class="text-2xl font-bold text-gray-900">{data.stats.usersCount.toLocaleString()}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Terapeutas</p>
			<p class="text-2xl font-bold text-gray-900">{data.stats.therapistsCount.toLocaleString()}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Prácticas</p>
			<p class="text-2xl font-bold text-gray-900">{data.stats.practicesCount.toLocaleString()}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Reservas</p>
			<p class="text-2xl font-bold text-gray-900">{data.stats.bookingsCount.toLocaleString()}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Ingresos totales</p>
			<p class="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.totalRevenue)}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<p class="text-sm text-gray-500">Comisión total</p>
			<p class="text-2xl font-bold text-green-600">{formatCurrency(data.stats.totalCommission)}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Commission Settings -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<h2 class="font-semibold text-gray-900 mb-4">Comisión de la Plataforma</h2>
			<form method="POST" action="?/updateCommission" use:enhance>
				<div class="mb-4">
					<label for="rate" class="block text-sm font-medium text-gray-700 mb-1">
						Porcentaje de comisión
					</label>
					<div class="flex items-center gap-2">
						<input
							type="number"
							id="rate"
							name="rate"
							bind:value={commissionRate}
							min="0"
							max="50"
							step="0.5"
							class="w-24 border rounded-lg px-3 py-2"
						/>
						<span class="text-gray-500">%</span>
					</div>
					<p class="text-sm text-gray-500 mt-1">
						Este porcentaje se aplicará a todas las reservas nuevas
					</p>
				</div>
				<button type="submit" class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
					Guardar
				</button>
			</form>
		</div>

		<!-- Booking Rules -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<h2 class="font-semibold text-gray-900 mb-4">Reglas de Reservas</h2>
			<form method="POST" action="?/updateBookingRules" use:enhance>
				<div class="space-y-4 mb-4">
					<div>
						<label for="minNotice" class="block text-sm font-medium text-gray-700 mb-1">
							Tiempo mínimo de aviso (horas)
						</label>
						<input
							type="number"
							id="minNotice"
							name="minNotice"
							bind:value={minNotice}
							min="0"
							max="168"
							class="w-24 border rounded-lg px-3 py-2"
						/>
					</div>
					<div>
						<label for="maxAdvance" class="block text-sm font-medium text-gray-700 mb-1">
							Máximo días de anticipación
						</label>
						<input
							type="number"
							id="maxAdvance"
							name="maxAdvance"
							bind:value={maxAdvance}
							min="1"
							max="365"
							class="w-24 border rounded-lg px-3 py-2"
						/>
					</div>
					<div>
						<label for="cancellationWindow" class="block text-sm font-medium text-gray-700 mb-1">
							Ventana de cancelación gratuita (horas)
						</label>
						<input
							type="number"
							id="cancellationWindow"
							name="cancellationWindow"
							bind:value={cancellationWindow}
							min="0"
							max="168"
							class="w-24 border rounded-lg px-3 py-2"
						/>
					</div>
				</div>
				<button type="submit" class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
					Guardar
				</button>
			</form>
		</div>
	</div>

	<!-- Maintenance Mode -->
	<div class="bg-white rounded-xl border border-gray-200 p-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="font-semibold text-gray-900">Modo de Mantenimiento</h2>
				<p class="text-sm text-gray-500 mt-1">
					Cuando está activo, los usuarios no pueden hacer nuevas reservas
				</p>
			</div>
			<form method="POST" action="?/toggleMaintenance" use:enhance>
				<input type="hidden" name="enabled" value={(!data.settings.maintenance_mode).toString()} />
				<button
					type="submit"
					class="px-4 py-2 rounded-lg font-medium transition-colors
						{data.settings.maintenance_mode
							? 'bg-green-600 text-white hover:bg-green-700'
							: 'bg-red-600 text-white hover:bg-red-700'}"
				>
					{data.settings.maintenance_mode ? 'Desactivar' : 'Activar'}
				</button>
			</form>
		</div>
		{#if data.settings.maintenance_mode}
			<div class="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
				<div class="flex items-center gap-2">
					<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<span class="text-amber-800 font-medium">El modo de mantenimiento está activo</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Danger Zone -->
	<div class="bg-white rounded-xl border border-red-200 p-6">
		<h2 class="font-semibold text-red-600 mb-4">Zona de Peligro</h2>
		<div class="space-y-4">
			<div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
				<div>
					<p class="font-medium text-gray-900">Regenerar tipos de base de datos</p>
					<p class="text-sm text-gray-500">Sincronizar tipos de TypeScript con el esquema de Supabase</p>
				</div>
				<button
					type="button"
					onclick={() => alert('Ejecuta: npx supabase gen types typescript --local > src/lib/types/database.types.ts')}
					class="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
				>
					Ver comando
				</button>
			</div>
			<div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
				<div>
					<p class="font-medium text-gray-900">Limpiar caché de la aplicación</p>
					<p class="text-sm text-gray-500">Forzar recarga de datos en todos los clientes</p>
				</div>
				<button
					type="button"
					disabled
					class="px-4 py-2 border border-red-300 text-red-600 rounded-lg opacity-50 cursor-not-allowed"
				>
					Próximamente
				</button>
			</div>
		</div>
	</div>
</div>
