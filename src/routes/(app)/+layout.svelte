<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	const supabase = createClient();
	let menuOpen = $state(false);
	let userMenuOpen = $state(false);

	// Redirect if not authenticated
	onMount(() => {
		if (!data.session) {
			goto('/login?redirect=' + encodeURIComponent($page.url.pathname));
		}
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/');
	}

	function getInitials(name: string | null | undefined): string {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<svelte:head>
	<title>Dashboard - Plenura</title>
</svelte:head>

{#if data.session}
	<div class="min-h-screen bg-gray-50">
		<!-- Navigation -->
		<nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between h-16">
					<!-- Logo -->
					<div class="flex items-center">
						<a href="/" class="flex items-center gap-2">
							<img src="/logo.svg" alt="Plenura" class="w-9 h-9 rounded-lg" />
							<span class="text-xl font-bold text-[#4a7c59]">Plenura</span>
						</a>
					</div>

					<!-- Desktop Navigation -->
					<div class="hidden md:flex items-center gap-6">
						<a
							href="/dashboard"
							class="text-gray-600 hover:text-primary-600 font-medium transition-colors {$page.url.pathname === '/dashboard' ? 'text-primary-600' : ''}"
						>
							Inicio
						</a>
						<a
							href="/bookings"
							class="text-gray-600 hover:text-primary-600 font-medium transition-colors {$page.url.pathname.startsWith('/bookings') ? 'text-primary-600' : ''}"
						>
							Mis Citas
						</a>
						<a
							href="/therapists"
							class="text-gray-600 hover:text-primary-600 font-medium transition-colors {$page.url.pathname.startsWith('/therapists') ? 'text-primary-600' : ''}"
						>
							Buscar
						</a>
						<a
							href="/favorites"
							class="text-gray-600 hover:text-primary-600 font-medium transition-colors {$page.url.pathname.startsWith('/favorites') ? 'text-primary-600' : ''}"
						>
							Favoritos
						</a>
						<a
							href="/referrals"
							class="text-gray-600 hover:text-primary-600 font-medium transition-colors {$page.url.pathname.startsWith('/referrals') ? 'text-primary-600' : ''}"
						>
							Referidos
						</a>
						{#if data.therapistProfile}
							<a
								href="/therapist"
								class="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-primary-100 {$page.url.pathname.startsWith('/therapist') ? 'bg-primary-100' : ''}"
							>
								Mi Consultorio
							</a>
						{/if}
					</div>

					<!-- User Menu -->
					<div class="flex items-center gap-4">
						<div class="relative">
							<button
								type="button"
								onclick={() => userMenuOpen = !userMenuOpen}
								class="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
							>
								<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
									<span class="text-primary-700 text-sm font-medium">
										{getInitials(data.userProfile?.full_name ?? data.user?.email)}
									</span>
								</div>
								<svg class="w-4 h-4 text-gray-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{#if userMenuOpen}
								<div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
									<div class="px-4 py-2 border-b border-gray-100">
										<p class="text-sm font-medium text-gray-900">{data.userProfile?.full_name ?? 'Usuario'}</p>
										<p class="text-xs text-gray-500">{data.user?.email}</p>
									</div>
									<a href="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
										Mi Perfil
									</a>
									<a href="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
										Configuración
									</a>
									<hr class="my-2">
									<button
										type="button"
										onclick={handleLogout}
										class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
									>
										Cerrar Sesión
									</button>
								</div>
							{/if}
						</div>

						<!-- Mobile menu button -->
						<button
							type="button"
							onclick={() => menuOpen = !menuOpen}
							class="md:hidden p-2 rounded-lg hover:bg-gray-100"
						>
							<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if menuOpen}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								{:else}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
								{/if}
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Mobile Navigation -->
			{#if menuOpen}
				<div class="md:hidden border-t border-gray-200 bg-white">
					<div class="px-4 py-3 space-y-1">
						<a
							href="/dashboard"
							class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 {$page.url.pathname === '/dashboard' ? 'bg-primary-50 text-primary-700' : ''}"
						>
							Inicio
						</a>
						<a
							href="/bookings"
							class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 {$page.url.pathname.startsWith('/bookings') ? 'bg-primary-50 text-primary-700' : ''}"
						>
							Mis Citas
						</a>
						<a
							href="/therapists"
							class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 {$page.url.pathname.startsWith('/therapists') ? 'bg-primary-50 text-primary-700' : ''}"
						>
							Buscar Terapeutas
						</a>
						<a
							href="/favorites"
							class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 {$page.url.pathname.startsWith('/favorites') ? 'bg-primary-50 text-primary-700' : ''}"
						>
							Favoritos
						</a>
						<a
							href="/referrals"
							class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 {$page.url.pathname.startsWith('/referrals') ? 'bg-primary-50 text-primary-700' : ''}"
						>
							Referidos
						</a>
						{#if data.therapistProfile}
							<hr class="my-2">
							<a
								href="/therapist"
								class="block px-3 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium {$page.url.pathname.startsWith('/therapist') ? 'bg-primary-100' : ''}"
							>
								Mi Consultorio
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</nav>

		<!-- Main Content -->
		<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="min-h-screen bg-gray-50 flex items-center justify-center">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
	</div>
{/if}
