<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { initAnalytics, trackPageView } from '$lib/analytics';

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

<svelte:head>
	<title>Plenura - Bienestar a tu alcance</title>
</svelte:head>

{@render children()}
