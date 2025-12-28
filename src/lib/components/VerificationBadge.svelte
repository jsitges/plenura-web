<script lang="ts">
	import { VERIFICATION_BADGES, type VerificationStatus } from '$lib/types/database.types';

	interface Props {
		status: VerificationStatus;
		size?: 'sm' | 'md' | 'lg';
		showLabel?: boolean;
		showTooltip?: boolean;
	}

	let { status, size = 'md', showLabel = false, showTooltip = true }: Props = $props();

	const badge = $derived(VERIFICATION_BADGES[status]);

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};

	const colorClasses = {
		gray: 'text-gray-400',
		yellow: 'text-yellow-500',
		blue: 'text-blue-500',
		green: 'text-green-500',
		purple: 'text-purple-500'
	};

	const bgClasses = {
		gray: 'bg-gray-100',
		yellow: 'bg-yellow-100',
		blue: 'bg-blue-100',
		green: 'bg-green-100',
		purple: 'bg-purple-100'
	};

	const borderClasses = {
		gray: 'border-gray-200',
		yellow: 'border-yellow-200',
		blue: 'border-blue-200',
		green: 'border-green-200',
		purple: 'border-purple-200'
	};
</script>

<div class="relative group inline-flex items-center gap-1.5">
	<!-- Badge icon -->
	<span
		class="inline-flex items-center justify-center rounded-full p-1 {bgClasses[badge.color]} {colorClasses[badge.color]}"
		aria-label={badge.label}
	>
		{#if badge.icon === 'shield-x'}
			<svg class={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6m0-6l6 6" />
			</svg>
		{:else if badge.icon === 'shield-clock'}
			<svg class={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
			</svg>
		{:else if badge.icon === 'shield-check'}
			<svg class={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
			</svg>
		{:else if badge.icon === 'shield-star'}
			<svg class={sizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 4l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 9.5l3.5-.5L12 6z"/>
			</svg>
		{:else if badge.icon === 'shield-crown'}
			<svg class={sizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z"/>
				<path fill="white" d="M12 6l1 2 2 .3-1.5 1.4.4 2.3-1.9-1-1.9 1 .4-2.3-1.5-1.4 2-.3 1-2z"/>
			</svg>
		{/if}
	</span>

	<!-- Label (optional) -->
	{#if showLabel}
		<span class="text-sm font-medium {colorClasses[badge.color]}">
			{badge.label}
		</span>
	{/if}

	<!-- Tooltip -->
	{#if showTooltip}
		<div
			class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none"
		>
			<div class="font-medium">{badge.label}</div>
			<div class="text-gray-300 mt-0.5">{badge.description}</div>
			<div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
		</div>
	{/if}
</div>
