<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	let { data, form } = $props();

	let startDate = $state('');
	let endDate = $state('');
	let reason = $state('');
	let saving = $state(false);
	let showForm = $state(false);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getDaysDifference(start: string, end: string): number {
		const startDate = new Date(start);
		const endDate = new Date(end);
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
		return diffDays;
	}

	function isActive(period: any): boolean {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endDate = new Date(period.end_date);
		endDate.setHours(0, 0, 0, 0);
		return endDate >= today;
	}

	// Sort periods: active first, then by start date
	const sortedPeriods = $derived(
		[...data.blockedPeriods].sort((a, b) => {
			const aActive = isActive(a);
			const bActive = isActive(b);

			if (aActive && !bActive) return -1;
			if (!aActive && bActive) return 1;

			return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
		})
	);
</script>

<svelte:head>
	<title>Períodos Bloqueados - Plenura</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-start gap-4">
		<a href="/therapist/availability" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-gray-900">Períodos Bloqueados</h1>
			<p class="text-gray-500">Gestiona tus vacaciones y días libres</p>
		</div>
	</div>

	{#if form?.success}
		<div transition:slide class="bg-green-50 border border-green-200 rounded-xl p-4">
			<p class="text-green-800">{form.message || 'Cambios guardados correctamente'}</p>
		</div>
	{/if}

	{#if form?.error}
		<div transition:slide class="bg-red-50 border border-red-200 rounded-xl p-4">
			<p class="text-red-800">{form.error}</p>
		</div>
	{/if}

	<!-- Info Banner -->
	<div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
		<div class="flex items-start gap-3">
			<svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div class="text-sm text-blue-800">
				<p class="font-medium mb-1">¿Cómo funcionan los períodos bloqueados?</p>
				<ul class="space-y-1 text-blue-700">
					<li>• Los clientes no podrán reservar citas en las fechas bloqueadas</li>
					<li>• Útil para vacaciones, días festivos o tiempo personal</li>
					<li>• Puedes bloquear un solo día o varios días consecutivos</li>
					<li>• Puedes eliminar un bloqueo en cualquier momento</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Add New Block Button -->
	{#if !showForm}
		<button
			onclick={() => showForm = true}
			class="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Bloquear nuevo período
		</button>
	{/if}

	<!-- Add Form -->
	{#if showForm}
		<div transition:slide class="bg-white rounded-xl border border-gray-100 p-6">
			<h3 class="font-semibold text-gray-900 mb-4">Bloquear nuevo período</h3>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update();
						saving = false;
						if (form?.success) {
							showForm = false;
							startDate = '';
							endDate = '';
							reason = '';
						}
					};
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="start_date" class="block text-sm font-medium text-gray-700 mb-2">
							Fecha de inicio *
						</label>
						<input
							type="date"
							id="start_date"
							name="start_date"
							bind:value={startDate}
							required
							min={new Date().toISOString().split('T')[0]}
							class="input-wellness w-full"
						/>
					</div>

					<div>
						<label for="end_date" class="block text-sm font-medium text-gray-700 mb-2">
							Fecha de fin *
						</label>
						<input
							type="date"
							id="end_date"
							name="end_date"
							bind:value={endDate}
							required
							min={startDate || new Date().toISOString().split('T')[0]}
							class="input-wellness w-full"
						/>
					</div>
				</div>

				<div>
					<label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
						Motivo (opcional)
					</label>
					<input
						type="text"
						id="reason"
						name="reason"
						bind:value={reason}
						placeholder="Ej: Vacaciones, día personal..."
						class="input-wellness w-full"
					/>
				</div>

				{#if startDate && endDate}
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-sm text-gray-700">
							📅 Bloqueando {getDaysDifference(startDate, endDate)} día(s)
						</p>
					</div>
				{/if}

				<div class="flex items-center gap-3 pt-2">
					<button
						type="submit"
						disabled={saving || !startDate || !endDate}
						class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
					>
						{saving ? 'Guardando...' : 'Bloquear período'}
					</button>
					<button
						type="button"
						onclick={() => {
							showForm = false;
							startDate = '';
							endDate = '';
							reason = '';
						}}
						class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Blocked Periods List -->
	{#if sortedPeriods.length > 0}
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
			<div class="p-4 border-b border-gray-100">
				<h3 class="font-semibold text-gray-900">Períodos bloqueados ({sortedPeriods.length})</h3>
			</div>

			<div class="divide-y divide-gray-100">
				{#each sortedPeriods as period}
					{@const active = isActive(period)}
					{@const days = getDaysDifference(period.start_date, period.end_date)}

					<div class="p-4 flex items-start justify-between gap-4 {!active ? 'opacity-60' : ''}">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<h4 class="font-medium text-gray-900">
									{formatDate(period.start_date)} - {formatDate(period.end_date)}
								</h4>
								<span class="px-2 py-0.5 rounded-full text-xs font-medium {active ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}">
									{active ? 'Activo' : 'Pasado'}
								</span>
							</div>

							<p class="text-sm text-gray-500">{days} día{days !== 1 ? 's' : ''}</p>

							{#if period.reason}
								<p class="text-sm text-gray-600 mt-1">{period.reason}</p>
							{/if}
						</div>

						{#if active}
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									return async ({ update }) => {
										if (confirm('¿Eliminar este período bloqueado?')) {
											await update();
										} else {
											return ({ update }) => {};
										}
									};
								}}
							>
								<input type="hidden" name="period_id" value={period.id} />
								<button
									type="submit"
									class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
									title="Eliminar"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-100 p-12 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Sin períodos bloqueados</h3>
			<p class="text-gray-500">Bloquea fechas cuando necesites tiempo libre</p>
		</div>
	{/if}
</div>
