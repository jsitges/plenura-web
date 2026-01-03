<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { PUBLIC_APP_URL } from '$env/static/public';

	let { data } = $props();

	// Profile URL for sharing
	const profileUrl = `${PUBLIC_APP_URL}/therapists/${data.therapistProfile?.id}`;

	let savingUser = $state(false);
	let savingTherapist = $state(false);
	let savingCerts = $state(false);
	let savingModalities = $state(false);
	let successMessage = $state('');

	// Form values
	let fullName = $state(data.userProfile?.full_name ?? '');
	let phone = $state(data.userProfile?.phone ?? '');
	let bio = $state(data.therapistProfile?.bio ?? '');
	let yearsOfExperience = $state(data.therapistProfile?.years_of_experience ?? 0);
	let serviceRadiusKm = $state(data.therapistProfile?.service_radius_km ?? 15);

	// Parse certifications
	let certifications = $state(() => {
		const certs = data.therapistProfile?.certification_details;
		if (Array.isArray(certs)) {
			return certs.join(', ');
		}
		return '';
	});

	function showSuccess(message: string) {
		successMessage = message;
		setTimeout(() => {
			successMessage = '';
		}, 3000);
	}
</script>

<svelte:head>
	<title>Mi Perfil - Plenura</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Mi Perfil</h1>
		<p class="text-gray-500">Actualiza tu información personal y profesional</p>
	</div>

	<!-- Success Message -->
	{#if successMessage}
		<div class="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
			<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			<p class="text-green-700">{successMessage}</p>
		</div>
	{/if}

	<!-- Verification Status -->
	{#if data.therapistProfile?.vetting_status !== 'approved'}
		<div
			class="rounded-xl p-4 {data.therapistProfile?.vetting_status === 'pending'
				? 'bg-amber-50 border border-amber-200'
				: 'bg-red-50 border border-red-200'}"
		>
			<div class="flex items-start gap-3">
				{#if data.therapistProfile?.vetting_status === 'pending'}
					<svg class="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div>
						<p class="font-medium text-amber-800">Verificación en proceso</p>
						<p class="text-sm text-amber-600">
							Tu perfil está siendo revisado. Te notificaremos cuando sea aprobado.
						</p>
					</div>
				{:else}
					<svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<div>
						<p class="font-medium text-red-800">Verificación rechazada</p>
						<p class="text-sm text-red-600">
							Por favor, contacta a soporte para más información.
						</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Personal Information -->
	<form
		method="POST"
		action="?/updateUser"
		use:enhance={() => {
			savingUser = true;
			return async ({ result, update }) => {
				savingUser = false;
				if (result.type === 'success') {
					showSuccess('Datos personales actualizados');
					await invalidateAll();
				}
				await update();
			};
		}}
		class="bg-white rounded-xl border border-gray-100"
	>
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Datos Personales</h2>
		</div>
		<div class="p-4 space-y-4">
			<div>
				<label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">
					Nombre completo *
				</label>
				<input
					type="text"
					id="full_name"
					name="full_name"
					bind:value={fullName}
					required
					class="input-wellness"
					placeholder="Tu nombre completo"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
				<input
					type="email"
					id="email"
					value={data.userProfile?.email ?? ''}
					disabled
					class="input-wellness bg-gray-50 text-gray-500"
				/>
				<p class="text-xs text-gray-500 mt-1">El email no puede ser modificado</p>
			</div>

			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1"> Teléfono </label>
				<input
					type="tel"
					id="phone"
					name="phone"
					bind:value={phone}
					class="input-wellness"
					placeholder="+52 55 1234 5678"
				/>
			</div>
		</div>
		<div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
			<button type="submit" disabled={savingUser} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">
				{savingUser ? 'Guardando...' : 'Guardar'}
			</button>
		</div>
	</form>

	<!-- Professional Information -->
	<form
		method="POST"
		action="?/updateTherapist"
		use:enhance={() => {
			savingTherapist = true;
			return async ({ result, update }) => {
				savingTherapist = false;
				if (result.type === 'success') {
					showSuccess('Perfil profesional actualizado');
					await invalidateAll();
				}
				await update();
			};
		}}
		class="bg-white rounded-xl border border-gray-100"
	>
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Perfil Profesional</h2>
		</div>
		<div class="p-4 space-y-4">
			<div>
				<label for="bio" class="block text-sm font-medium text-gray-700 mb-1">
					Biografía / Descripción
				</label>
				<textarea
					id="bio"
					name="bio"
					bind:value={bio}
					rows="4"
					class="input-wellness resize-none"
					placeholder="Cuéntanos sobre ti, tu experiencia y enfoque..."
				></textarea>
				<p class="text-xs text-gray-500 mt-1">
					Esta descripción será visible en tu perfil público
				</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="years_of_experience" class="block text-sm font-medium text-gray-700 mb-1">
						Años de experiencia
					</label>
					<input
						type="number"
						id="years_of_experience"
						name="years_of_experience"
						bind:value={yearsOfExperience}
						min="0"
						max="50"
						class="input-wellness"
					/>
				</div>

				<div>
					<label for="service_radius_km" class="block text-sm font-medium text-gray-700 mb-1">
						Radio de servicio (km)
					</label>
					<input
						type="number"
						id="service_radius_km"
						name="service_radius_km"
						bind:value={serviceRadiusKm}
						min="1"
						max="100"
						class="input-wellness"
					/>
					<p class="text-xs text-gray-500 mt-1">Distancia máxima para atención a domicilio</p>
				</div>
			</div>
		</div>
		<div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
			<button type="submit" disabled={savingTherapist} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">
				{savingTherapist ? 'Guardando...' : 'Guardar'}
			</button>
		</div>
	</form>

	<!-- Certifications -->
	<form
		method="POST"
		action="?/updateCertifications"
		use:enhance={() => {
			savingCerts = true;
			return async ({ result, update }) => {
				savingCerts = false;
				if (result.type === 'success') {
					showSuccess('Certificaciones actualizadas');
					await invalidateAll();
				}
				await update();
			};
		}}
		class="bg-white rounded-xl border border-gray-100"
	>
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Certificaciones</h2>
		</div>
		<div class="p-4 space-y-4">
			<div>
				<label for="certifications" class="block text-sm font-medium text-gray-700 mb-1">
					Tus certificaciones
				</label>
				<textarea
					id="certifications"
					name="certifications"
					value={certifications()}
					rows="3"
					class="input-wellness resize-none"
					placeholder="Ej: Masaje Sueco, Reflexología, Aromaterapia..."
				></textarea>
				<p class="text-xs text-gray-500 mt-1">Separa cada certificación con una coma</p>
			</div>
		</div>
		<div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
			<button type="submit" disabled={savingCerts} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">
				{savingCerts ? 'Guardando...' : 'Guardar'}
			</button>
		</div>
	</form>

	<!-- Service Modalities -->
	<form
		method="POST"
		action="?/updateServiceModalities"
		use:enhance={() => {
			savingModalities = true;
			return async ({ result, update }) => {
				savingModalities = false;
				if (result.type === 'success') {
					showSuccess('Modalidades de servicio actualizadas');
					await invalidateAll();
				}
				await update();
			};
		}}
		class="bg-white rounded-xl border border-gray-100"
	>
		<div class="p-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-900">Modalidades de Servicio</h2>
			<p class="text-sm text-gray-500 mt-1">Define cómo puedes atender a tus clientes</p>
		</div>
		<div class="p-4 space-y-4">
			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					name="offers_home_visit"
					checked={data.therapistProfile?.offers_home_visit ?? true}
					class="checkbox checkbox-primary mt-0.5"
				/>
				<div>
					<span class="font-medium text-gray-900">Visita a Domicilio</span>
					<p class="text-sm text-gray-500">Puedo ir al domicilio del cliente</p>
				</div>
			</label>

			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					name="offers_studio_visit"
					checked={data.therapistProfile?.offers_studio_visit ?? false}
					class="checkbox checkbox-primary mt-0.5"
				/>
				<div>
					<span class="font-medium text-gray-900">Atención en Consultorio</span>
					<p class="text-sm text-gray-500">Tengo un espacio donde puedo recibir clientes</p>
				</div>
			</label>

			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					name="offers_online_video"
					checked={data.therapistProfile?.offers_online_video ?? false}
					class="checkbox checkbox-primary mt-0.5"
				/>
				<div>
					<span class="font-medium text-gray-900">Sesiones por Video</span>
					<p class="text-sm text-gray-500">Ofrezco consultas virtuales por videollamada (ideal para terapia psicológica, coaching, nutrición)</p>
				</div>
			</label>
		</div>
		<div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
			<button type="submit" disabled={savingModalities} class="btn-primary-gradient px-6 py-2 disabled:opacity-50">
				{savingModalities ? 'Guardando...' : 'Guardar'}
			</button>
		</div>
	</form>

	<!-- Stats Summary -->
	<div class="bg-white rounded-xl border border-gray-100 p-4">
		<h2 class="font-semibold text-gray-900 mb-4">Estadísticas</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<div class="text-center p-3 bg-gray-50 rounded-lg">
				<p class="text-2xl font-bold text-primary-600">
					{data.therapistProfile?.rating_avg?.toFixed(1) ?? '0.0'}
				</p>
				<p class="text-sm text-gray-500">Calificación</p>
			</div>
			<div class="text-center p-3 bg-gray-50 rounded-lg">
				<p class="text-2xl font-bold text-primary-600">
					{data.therapistProfile?.rating_count ?? 0}
				</p>
				<p class="text-sm text-gray-500">Reseñas</p>
			</div>
			<div class="text-center p-3 bg-gray-50 rounded-lg">
				<p class="text-2xl font-bold text-primary-600 capitalize">
					{data.therapistProfile?.subscription_tier ?? 'free'}
				</p>
				<p class="text-sm text-gray-500">Plan</p>
			</div>
			<div class="text-center p-3 bg-gray-50 rounded-lg">
				<p class="text-2xl font-bold text-primary-600">
					{data.therapistProfile?.years_of_experience ?? 0}
				</p>
				<p class="text-sm text-gray-500">Años exp.</p>
			</div>
		</div>
	</div>

	<!-- Share Your Profile -->
	<div class="bg-white rounded-xl border border-gray-100 p-4">
		<h2 class="font-semibold text-gray-900 mb-4">Comparte tu Perfil</h2>
		<p class="text-sm text-gray-600 mb-4">
			Comparte tu perfil con clientes potenciales para conseguir más reservas.
		</p>

		<div class="flex flex-col sm:flex-row gap-4">
			<!-- Profile Link -->
			<div class="flex-1">
				<label for="profile-url" class="block text-sm font-medium text-gray-700 mb-1">
					Enlace a tu perfil
				</label>
				<div class="flex gap-2">
					<input
						type="text"
						id="profile-url"
						value={profileUrl}
						readonly
						class="input-wellness bg-gray-50 text-sm flex-1"
					/>
					<ShareButton
						title={data.userProfile?.full_name ?? 'Terapeuta en Plenura'}
						text={`Conoce a ${data.userProfile?.full_name ?? 'este terapeuta'} en Plenura`}
						url={profileUrl}
						variant="button"
					/>
				</div>
			</div>
		</div>

		<!-- QR Code Section -->
		<div class="mt-6 pt-6 border-t border-gray-100">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-medium text-gray-900">Código QR</h3>
					<p class="text-sm text-gray-500">
						Descarga tu código QR para usar en tarjetas de presentación
					</p>
				</div>
				<a
					href="/therapist/qr"
					class="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium"
				>
					Ver y Descargar QR
				</a>
			</div>
		</div>
	</div>

	<!-- Danger Zone -->
	<div class="bg-white rounded-xl border border-red-200">
		<div class="p-4 border-b border-red-100">
			<h2 class="font-semibold text-red-700">Zona de Peligro</h2>
		</div>
		<div class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-gray-900">Pausar mi cuenta</p>
					<p class="text-sm text-gray-500">
						Temporalmente oculta tu perfil de la búsqueda de clientes
					</p>
				</div>
				<button
					type="button"
					class="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
				>
					Pausar
				</button>
			</div>
		</div>
	</div>
</div>
