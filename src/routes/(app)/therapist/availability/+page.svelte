<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

	// Initialize schedule state from data
	let schedule = $state(
		dayNames.map((_, index) => {
			const existing = data.availability.find((a: { day_of_week: number }) => a.day_of_week === index) as { start_time: string; end_time: string } | undefined;
			return {
				active: !!existing,
				start: existing?.start_time ?? '09:00',
				end: existing?.end_time ?? '18:00'
			};
		})
	);

	let isAvailable = $state(data.isAvailable);
	let saving = $state(false);

	function copyToWeekdays(dayIndex: number) {
		const source = schedule[dayIndex];
		// Copy to Monday-Friday (1-5)
		for (let i = 1; i <= 5; i++) {
			schedule[i] = { ...source };
		}
	}

	function copyToAll(dayIndex: number) {
		const source = schedule[dayIndex];
		for (let i = 0; i < 7; i++) {
			schedule[i] = { ...source };
		}
	}

	const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
		const hour = Math.floor(i / 2);
		const minute = (i % 2) * 30;
		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	});
</script>

<svelte:head>
	<title>Disponibilidad - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Disponibilidad</h1>
			<p class="text-gray-500">Configura tu horario de atención</p>
		</div>

		<!-- Available Toggle -->
		<form method="POST" action="?/toggleAvailable" use:enhance={() => {
			return async ({ update }) => {
				isAvailable = !isAvailable;
				await update();
			};
		}}>
			<button
				type="submit"
				class="flex items-center gap-3 px-4 py-2 rounded-lg border {isAvailable ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}"
			>
				<span class="w-3 h-3 rounded-full {isAvailable ? 'bg-green-500' : 'bg-gray-400'}"></span>
				<span class="font-medium {isAvailable ? 'text-green-700' : 'text-gray-600'}">
					{isAvailable ? 'Disponible' : 'No disponible'}
				</span>
			</button>
		</form>
	</div>

	{#if !isAvailable}
		<div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
			<div class="flex items-start gap-3">
				<svg class="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div>
					<p class="font-medium text-amber-800">No estás visible para los clientes</p>
					<p class="text-sm text-amber-600">Activa tu disponibilidad para que los clientes puedan reservar contigo</p>
				</div>
			</div>
		</div>
	{/if}

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
		class="bg-white rounded-xl border border-gray-100"
	>
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Horario Semanal</h2>
			<p class="text-sm text-gray-500">Define los días y horarios en los que estás disponible</p>
		</div>

		<div class="divide-y divide-gray-100">
			{#each dayNames as day, index}
				<div class="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
					<!-- Day Toggle -->
					<div class="flex items-center gap-3 sm:w-40">
						<input
							type="checkbox"
							name="day_{index}_active"
							bind:checked={schedule[index].active}
							class="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
						/>
						<span class="font-medium text-gray-700">{day}</span>
					</div>

					<!-- Time Selection -->
					{#if schedule[index].active}
						<div class="flex items-center gap-3 flex-1">
							<select
								name="day_{index}_start"
								bind:value={schedule[index].start}
								class="input-wellness py-2"
							>
								{#each timeSlots as time}
									<option value={time}>{time}</option>
								{/each}
							</select>
							<span class="text-gray-500">a</span>
							<select
								name="day_{index}_end"
								bind:value={schedule[index].end}
								class="input-wellness py-2"
							>
								{#each timeSlots as time}
									<option value={time}>{time}</option>
								{/each}
							</select>
						</div>

						<!-- Copy Actions -->
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => copyToWeekdays(index)}
								class="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap"
							>
								Copiar a L-V
							</button>
							<span class="text-gray-300">|</span>
							<button
								type="button"
								onclick={() => copyToAll(index)}
								class="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap"
							>
								Copiar a todos
							</button>
						</div>
					{:else}
						<span class="text-sm text-gray-400 italic">No disponible</span>
					{/if}
				</div>
			{/each}
		</div>

		<div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
			<button
				type="submit"
				disabled={saving}
				class="btn-primary-gradient px-6 py-2 disabled:opacity-50"
			>
				{saving ? 'Guardando...' : 'Guardar cambios'}
			</button>
		</div>
	</form>

	<!-- Tips -->
	<div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
		<h3 class="font-medium text-blue-800 mb-2">Consejos</h3>
		<ul class="text-sm text-blue-700 space-y-1">
			<li>• Los clientes solo pueden reservar dentro de tu horario disponible</li>
			<li>• Deja tiempo entre citas para desplazamiento</li>
			<li>• Puedes bloquear días específicos desde tu calendario</li>
		</ul>
	</div>
</div>
