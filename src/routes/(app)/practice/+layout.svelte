<script lang="ts">
	import { page } from '$app/stores';
	import VerificationBadge from '$lib/components/VerificationBadge.svelte';
	import type { VerificationStatus } from '$lib/types/database.types';

	interface Props {
		data: {
			membership: {
				id: string;
				role: string;
				practice_id: string;
				practices: {
					id: string;
					name: string;
					slug: string | null;
					logo_url: string | null;
					verification_status: string;
					subscription_tier: string;
				};
			};
		};
		children: any;
	}

	let { data, children }: Props = $props();

	const practice = $derived(data.membership.practices);
	const userRole = $derived(data.membership.role);

	const navItems = [
		{ href: '/practice', label: 'Dashboard', icon: 'home' },
		{ href: '/practice/team', label: 'Equipo', icon: 'users' },
		{ href: '/practice/bookings', label: 'Reservas', icon: 'calendar' },
		{ href: '/practice/analytics', label: 'Análisis', icon: 'chart' },
		{ href: '/practice/settings', label: 'Configuración', icon: 'settings' }
	];

	function isActive(href: string): boolean {
		if (href === '/practice') {
			return $page.url.pathname === '/practice';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<!-- Practice branding -->
				<div class="flex items-center gap-3">
					{#if practice.logo_url}
						<img src={practice.logo_url} alt={practice.name} class="w-10 h-10 rounded-lg object-cover" />
					{:else}
						<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
							<span class="text-primary-600 font-bold text-lg">{practice.name.charAt(0)}</span>
						</div>
					{/if}
					<div>
						<div class="flex items-center gap-2">
							<h1 class="font-semibold text-gray-900">{practice.name}</h1>
							<VerificationBadge status={practice.verification_status as VerificationStatus} size="sm" />
						</div>
						<p class="text-xs text-gray-500 capitalize">{userRole}</p>
					</div>
				</div>

				<!-- Right side -->
				<div class="flex items-center gap-4">
					<a
						href="/therapist"
						class="text-sm text-gray-500 hover:text-gray-700"
					>
						Mi perfil de terapeuta
					</a>
				</div>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="border-t border-gray-100">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex gap-6 overflow-x-auto">
					{#each navItems as item}
						<a
							href={item.href}
							class="py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
								{isActive(item.href)
									? 'border-primary-500 text-primary-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
		</nav>
	</header>

	<!-- Main content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>
</div>
