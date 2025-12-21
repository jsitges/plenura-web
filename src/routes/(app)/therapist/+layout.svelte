<script lang="ts">
	import { page } from '$app/stores';

	let { children, data } = $props();

	const navItems = [
		{ href: '/therapist', label: 'Dashboard', icon: 'home' },
		{ href: '/therapist/bookings', label: 'Citas', icon: 'calendar' },
		{ href: '/therapist/availability', label: 'Disponibilidad', icon: 'clock' },
		{ href: '/therapist/services', label: 'Servicios', icon: 'briefcase' },
		{ href: '/therapist/earnings', label: 'Ganancias', icon: 'dollar' },
		{ href: '/therapist/featured', label: 'Destacar', icon: 'sparkle' },
		{ href: '/therapist/subscription', label: 'Mi Plan', icon: 'star' },
		{ href: '/therapist/profile', label: 'Mi Perfil', icon: 'user' }
	];

	function isActive(href: string): boolean {
		if (href === '/therapist') {
			return $page.url.pathname === '/therapist';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="flex flex-col lg:flex-row gap-6">
	<!-- Sidebar Navigation -->
	<aside class="lg:w-64 flex-shrink-0">
		<div class="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
			<!-- Therapist Status -->
			<div class="mb-6 pb-4 border-b border-gray-100">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
						<span class="text-primary-700 font-medium">
							{(data.userProfile?.full_name ?? '?')[0].toUpperCase()}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-gray-900 truncate">
							{data.userProfile?.full_name ?? 'Terapeuta'}
						</p>
						<div class="flex items-center gap-1.5">
							{#if data.therapistProfile?.vetting_status === 'approved'}
								<span class="w-2 h-2 bg-green-500 rounded-full"></span>
								<span class="text-xs text-green-600">Verificado</span>
							{:else if data.therapistProfile?.vetting_status === 'pending'}
								<span class="w-2 h-2 bg-amber-500 rounded-full"></span>
								<span class="text-xs text-amber-600">Pendiente</span>
							{:else}
								<span class="w-2 h-2 bg-red-500 rounded-full"></span>
								<span class="text-xs text-red-600">Rechazado</span>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Navigation -->
			<nav class="space-y-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}"
					>
						{#if item.icon === 'home'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
							</svg>
						{:else if item.icon === 'calendar'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						{:else if item.icon === 'clock'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						{:else if item.icon === 'briefcase'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						{:else if item.icon === 'dollar'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						{:else if item.icon === 'sparkle'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
							</svg>
						{:else if item.icon === 'star'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
							</svg>
						{:else if item.icon === 'user'}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						{/if}
						<span class="font-medium">{item.label}</span>
					</a>
				{/each}
			</nav>

			<!-- Quick Toggle -->
			<div class="mt-6 pt-4 border-t border-gray-100">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Disponible</span>
					<button
						type="button"
						class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {data.therapistProfile?.is_available ? 'bg-primary-600' : 'bg-gray-200'}"
						role="switch"
						aria-checked={data.therapistProfile?.is_available}
						aria-label="Cambiar disponibilidad"
					>
						<span
							class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {data.therapistProfile?.is_available ? 'translate-x-5' : 'translate-x-0'}"
						></span>
					</button>
				</div>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 min-w-0">
		{@render children()}
	</main>
</div>
