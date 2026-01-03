<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { initAnalytics, trackPageView } from '$lib/analytics';
	import SEO from '$lib/components/SEO.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import { InstallPrompt } from '$lib/components/pwa';

	let { children } = $props();

	// Initialize analytics on mount
	onMount(() => {
		initAnalytics();
	});

	// Track page views on navigation
	$effect(() => {
		trackPageView($page.url.pathname);
	});
</script>

<SEO />

{@render children()}

<CookieConsent />
<InstallPrompt />
