<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	let { data, form } = $props();

	const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

	type TimeSlot = {
		start: string;
		end: string;
		id?: string; // For tracking in the UI
	};

	type DaySchedule = {
		active: boolean;
		slots: TimeSlot[];
	};

	// Initialize schedule state from data
	let schedule = $state<DaySchedule[]>(
		dayNames.map((_, dayIndex) => {
			const daySlots = data.availability.filter((a: { day_of_week: number }) => a.day_of_week === dayIndex) as { start_time: string; end_time: string }[];

			if (daySlots.length > 0) {
				return {
					active: true,
					slots: daySlots.map(slot => ({
						start: slot.start_time.substring(0, 5),
						end: slot.end_time.substring(0, 5),
						id: crypto.randomUUID()
					}))
				};
			}

			return {
				active: false,
				slots: [{ start: '09:00', end: '18:00', id: crypto.randomUUID() }]
			};
		})
	);

	let isAvailable = $state(data.isAvailable);
	let smartScheduleGrouping = $state(data.smartScheduleGrouping);
	let saving = $state(false);
	let showSuccessMessage = $state(false);

	function addTimeSlot(dayIndex: number) {
		schedule[dayIndex].slots.push({
			start: '09:00',
			end: '18:00',
			id: crypto.randomUUID()
		});
	}

	function removeTimeSlot(dayIndex: number, slotIndex: number) {
		if (schedule[dayIndex].slots.length > 1) {
			schedule[dayIndex].slots.splice(slotIndex, 1);
		}
	}

	function copyToWeekdays(dayIndex: number) {
		const source = schedule[dayIndex];
		// Copy to Monday-Friday (1-5)
		for (let i = 1; i <= 5; i++) {
			schedule[i] = {
				active: source.active,
				slots: source.slots.map(slot => ({ ...slot, id: crypto.randomUUID() }))
			};
		}
	}

	function copyToAll(dayIndex: number) {
		const source = schedule[dayIndex];
		for (let i = 0; i < 7; i++) {
			schedule[i] = {
				active: source.active,
				slots: source.slots.map(slot => ({ ...slot, id: crypto.randomUUID() }))
			};
		}
	}

	const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
		const hour = Math.floor(i / 2);
		const minute = (i % 2) * 30;
		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	});

	// Show success message when form submission succeeds
	$effect(() => {
		if (form?.success) {
			showSuccessMessage = true;
			setTimeout(() => {
				showSuccessMessage = false;
			}, 3000);
		}
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

	<!-- Success Message -->
	{#if showSuccessMessage}
		<div transition:slide class="bg-green-50 border border-green-200 rounded-xl p-4">
			<div class="flex items-start gap-3">
				<svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<div>
					<p class="font-medium text-green-800">Horario guardado correctamente</p>
					<p class="text-sm text-green-600">Tus cambios han sido aplicados</p>
				</div>
			</div>
		</div>
	{/if}

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
			<p class="text-sm text-gray-500">Define los días y horarios en los que estás disponible. Puedes agregar múltiples bloques para manejar pausas de comida.</p>
		</div>

		<div class="divide-y divide-gray-100">
			{#each dayNames as day, dayIndex}
				<div class="p-4">
					<!-- Day Header -->
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								name="day_{dayIndex}_active"
								bind:checked={schedule[dayIndex].active}
								class="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
							/>
							<span class="font-medium text-gray-700">{day}</span>
						</div>

						{#if schedule[dayIndex].active}
							<!-- Copy Actions -->
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={() => copyToWeekdays(dayIndex)}
									class="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap"
								>
									Copiar a L-V
								</button>
								<span class="text-gray-300">|</span>
								<button
									type="button"
									onclick={() => copyToAll(dayIndex)}
									class="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap"
								>
									Copiar a todos
								</button>
							</div>
						{/if}
					</div>

					<!-- Time Slots -->
					{#if schedule[dayIndex].active}
						<div class="space-y-2 pl-8">
							{#each schedule[dayIndex].slots as slot, slotIndex (slot.id)}
								<div class="flex items-center gap-3" transition:slide>
									<!-- Hidden inputs for form submission -->
									<input type="hidden" name="day_{dayIndex}_slot_{slotIndex}_start" value={slot.start} />
									<input type="hidden" name="day_{dayIndex}_slot_{slotIndex}_end" value={slot.end} />

									<select
										bind:value={slot.start}
										class="input-wellness py-2 flex-1"
									>
										{#each timeSlots as time}
											<option value={time}>{time}</option>
										{/each}
									</select>
									<span class="text-gray-500">a</span>
									<select
										bind:value={slot.end}
										class="input-wellness py-2 flex-1"
									>
										{#each timeSlots as time}
											<option value={time}>{time}</option>
										{/each}
									</select>

									<!-- Remove button (only show if more than one slot) -->
									{#if schedule[dayIndex].slots.length > 1}
										<button
											type="button"
											onclick={() => removeTimeSlot(dayIndex, slotIndex)}
											class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="Eliminar horario"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									{/if}
								</div>
							{/each}

							<!-- Add Time Slot Button -->
							<button
								type="button"
								onclick={() => addTimeSlot(dayIndex)}
								class="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 py-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								Agregar otro horario
							</button>
						</div>
					{:else}
						<p class="text-sm text-gray-400 italic pl-8">No disponible</p>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Hidden input with slot count for each day -->
		{#each schedule as day, dayIndex}
			<input type="hidden" name="day_{dayIndex}_slot_count" value={day.active ? day.slots.length : 0} />
		{/each}

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

	<!-- Blocked Periods Link -->
	<a
		href="/therapist/availability/blocked"
		class="block bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors"
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
					</svg>
				</div>
				<div>
					<h3 class="font-medium text-amber-900">Gestionar períodos bloqueados</h3>
					<p class="text-sm text-amber-700">Bloquea días o semanas para vacaciones</p>
				</div>
			</div>
			<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</div>
	</a>

	<!-- Smart Schedule Grouping -->
	<div class="bg-white rounded-xl border border-gray-100 p-4">
		<div class="flex items-start justify-between gap-4">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
				</div>
				<div>
					<h3 class="font-medium text-gray-900">Agrupación inteligente de citas</h3>
					<p class="text-sm text-gray-500 mt-1">
						En bloques con citas existentes, solo se mostrarán horarios adyacentes para evitar huecos.
						Los bloques sin citas mostrarán todos los horarios disponibles.
					</p>
				</div>
			</div>
			<form method="POST" action="?/toggleSmartGrouping" use:enhance={() => {
				return async ({ update }) => {
					smartScheduleGrouping = !smartScheduleGrouping;
					await update();
				};
			}}>
				<button
					type="submit"
					class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 {smartScheduleGrouping ? 'bg-primary-600' : 'bg-gray-200'}"
					role="switch"
					aria-checked={smartScheduleGrouping}
				>
					<span class="sr-only">Activar agrupación inteligente</span>
					<span
						aria-hidden="true"
						class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {smartScheduleGrouping ? 'translate-x-5' : 'translate-x-0'}"
					></span>
				</button>
			</form>
		</div>
	</div>

	<!-- Tips -->
	<div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
		<h3 class="font-medium text-blue-800 mb-2">Consejos</h3>
		<ul class="text-sm text-blue-700 space-y-1">
			<li>• Los clientes solo pueden reservar dentro de tu horario disponible</li>
			<li>• Puedes agregar múltiples bloques de horario para manejar pausas de comida</li>
			<li>• Ejemplo: 10:00-13:00 y 17:00-20:00 para tener pausa de comida de 13:00-17:00</li>
			<li>• Usa "Períodos bloqueados" para bloquear días completos (vacaciones, días festivos, etc.)</li>
			<li>• La "Agrupación inteligente" agrupa citas en bloques ocupados, mientras bloques vacíos muestran todos los horarios</li>
		</ul>
	</div>
</div>
