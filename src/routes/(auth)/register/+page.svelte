<script lang="ts">
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { validateReferralCode } from '$lib/services/referral.service';

	type UserRole = 'client' | 'therapist';

	// Get referral code from URL if present
	const urlReferralCode = $page.url.searchParams.get('ref') ?? '';

	let step = $state(1);
	let role = $state<UserRole>('client');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let fullName = $state('');
	let phone = $state('');
	let referralCode = $state(urlReferralCode);
	let referralCodeId = $state<string | null>(null);
	let referralValid = $state<boolean | null>(urlReferralCode ? null : true);
	let acceptTerms = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPassword = $state(false);
	let checkingReferral = $state(false);

	const supabase = createClient();

	// Validate referral code on input
	async function checkReferralCode() {
		if (!referralCode.trim()) {
			referralValid = true;
			referralCodeId = null;
			return;
		}

		checkingReferral = true;
		const result = await validateReferralCode(supabase, referralCode.trim());
		referralValid = result.valid;
		referralCodeId = result.codeId ?? null;
		checkingReferral = false;
	}

	function validatePassword(): string | null {
		if (password.length < 8) {
			return 'La contraseña debe tener al menos 8 caracteres';
		}
		if (password !== confirmPassword) {
			return 'Las contraseñas no coinciden';
		}
		return null;
	}

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = null;

		const passwordError = validatePassword();
		if (passwordError) {
			error = passwordError;
			return;
		}

		if (!acceptTerms) {
			error = 'Debes aceptar los términos y condiciones';
			return;
		}

		loading = true;

		try {
			const { data, error: authError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: fullName,
						phone,
						role,
						referral_code_id: referralCodeId
					},
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (authError) {
				if (authError.message.includes('already registered')) {
					error = 'Este correo ya está registrado. ¿Quieres iniciar sesión?';
				} else {
					error = authError.message;
				}
				return;
			}

			if (data.user) {
				// Check if email confirmation is required
				if (data.user.identities?.length === 0) {
					error = 'Este correo ya está registrado';
					return;
				}

				// Redirect to confirmation page or dashboard
				goto('/register/confirm?email=' + encodeURIComponent(email));
			}
		} catch (err) {
			error = 'Error al crear la cuenta. Intenta de nuevo.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignUp() {
		const { error: authError } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
				queryParams: {
					access_type: 'offline',
					prompt: 'consent'
				}
			}
		});

		if (authError) {
			error = authError.message;
		}
	}
</script>

<svelte:head>
	<title>Crear Cuenta - Plenura</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold text-gray-900 text-center mb-2">
		Crea tu cuenta
	</h1>
	<p class="text-gray-500 text-center mb-8">
		Únete a la comunidad de bienestar
	</p>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
			{error}
			{#if error.includes('iniciar sesión')}
				<a href="/login" class="underline ml-1">Ir a login</a>
			{/if}
		</div>
	{/if}

	{#if step === 1}
		<!-- Step 1: Choose role -->
		<div class="space-y-4">
			<p class="text-sm text-gray-600 text-center mb-4">
				¿Cómo quieres usar Plenura?
			</p>

			<button
				type="button"
				onclick={() => { role = 'client'; step = 2; }}
				class="w-full p-4 border-2 rounded-xl text-left transition-all hover:border-primary-500 hover:bg-primary-50 {role === 'client' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}"
			>
				<div class="flex items-start gap-4">
					<div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
						🧘
					</div>
					<div>
						<h3 class="font-semibold text-gray-900">Busco servicios de bienestar</h3>
						<p class="text-sm text-gray-500 mt-1">
							Encuentra terapeutas, reserva citas y cuida tu salud
						</p>
					</div>
				</div>
			</button>

			<button
				type="button"
				onclick={() => { role = 'therapist'; step = 2; }}
				class="w-full p-4 border-2 rounded-xl text-left transition-all hover:border-secondary-500 hover:bg-secondary-50 {role === 'therapist' ? 'border-secondary-500 bg-secondary-50' : 'border-gray-200'}"
			>
				<div class="flex items-start gap-4">
					<div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center text-2xl">
						💆
					</div>
					<div>
						<h3 class="font-semibold text-gray-900">Soy terapeuta o profesional</h3>
						<p class="text-sm text-gray-500 mt-1">
							Ofrece tus servicios y haz crecer tu negocio
						</p>
					</div>
				</div>
			</button>
		</div>

		<div class="relative my-6">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-200"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="px-4 bg-white text-gray-500">o regístrate con</span>
			</div>
		</div>

		<button
			type="button"
			onclick={handleGoogleSignUp}
			class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			<span class="text-gray-700 font-medium">Google</span>
		</button>

	{:else}
		<!-- Step 2: Registration form -->
		<form onsubmit={handleRegister} class="space-y-4">
			<div class="flex items-center gap-2 mb-4">
				<button
					type="button"
					onclick={() => step = 1}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Volver al paso anterior"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<span class="text-sm text-gray-500">
					Registrándote como {role === 'client' ? 'cliente' : 'terapeuta'}
				</span>
			</div>

			<div>
				<label for="fullName" class="block text-sm font-medium text-gray-700 mb-1.5">
					Nombre completo
				</label>
				<input
					type="text"
					id="fullName"
					bind:value={fullName}
					required
					placeholder="Tu nombre"
					class="input-wellness"
					disabled={loading}
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
					Correo electrónico
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					placeholder="tu@email.com"
					class="input-wellness"
					disabled={loading}
				/>
			</div>

			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1.5">
					Teléfono (opcional)
				</label>
				<input
					type="tel"
					id="phone"
					bind:value={phone}
					placeholder="+52 55 1234 5678"
					class="input-wellness"
					disabled={loading}
				/>
			</div>

			<div>
				<label for="referralCode" class="block text-sm font-medium text-gray-700 mb-1.5">
					Código de referido (opcional)
				</label>
				<div class="relative">
					<input
						type="text"
						id="referralCode"
						bind:value={referralCode}
						onblur={checkReferralCode}
						placeholder="Ej: ABC12345"
						class="input-wellness uppercase {referralValid === false ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : referralValid && referralCode ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}"
						disabled={loading}
					/>
					{#if checkingReferral}
						<div class="absolute right-3 top-1/2 -translate-y-1/2">
							<svg class="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
						</div>
					{:else if referralCode && referralValid}
						<div class="absolute right-3 top-1/2 -translate-y-1/2">
							<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						</div>
					{:else if referralCode && referralValid === false}
						<div class="absolute right-3 top-1/2 -translate-y-1/2">
							<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
					{/if}
				</div>
				{#if referralCode && referralValid === false}
					<p class="text-xs text-red-500 mt-1">Código no válido o expirado</p>
				{:else if referralCode && referralValid}
					<p class="text-xs text-green-600 mt-1">¡Código válido! Recibirás beneficios al registrarte</p>
				{/if}
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
					Contraseña
				</label>
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						bind:value={password}
						required
						placeholder="Mínimo 8 caracteres"
						class="input-wellness pr-10"
						disabled={loading}
					/>
					<button
						type="button"
						onclick={() => showPassword = !showPassword}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
					>
						{#if showPassword}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">
					Confirmar contraseña
				</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					required
					placeholder="Repite tu contraseña"
					class="input-wellness"
					disabled={loading}
				/>
			</div>

			<div class="flex items-start gap-3 pt-2">
				<input
					type="checkbox"
					id="terms"
					bind:checked={acceptTerms}
					class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
				/>
				<label for="terms" class="text-sm text-gray-600">
					Acepto los <a href="/terms" class="text-primary-600 hover:underline">términos y condiciones</a>
					y la <a href="/privacy" class="text-primary-600 hover:underline">política de privacidad</a>
				</label>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full btn-primary-gradient py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<span class="inline-flex items-center gap-2">
						<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Creando cuenta...
					</span>
				{:else}
					Crear cuenta
				{/if}
			</button>
		</form>
	{/if}

	<p class="text-center text-sm text-gray-500 mt-8">
		¿Ya tienes cuenta?
		<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">
			Inicia sesión
		</a>
	</p>
</div>
