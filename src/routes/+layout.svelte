<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import { initAnalytics, trackPageView } from '$lib/analytics';
	import SEO from '$lib/components/SEO.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import { InstallPrompt } from '$lib/components/pwa';
	import { createClient } from '$lib/supabase/client';

	let { children, data } = $props();

	// Create Supabase client for session sync
	const supabase = createClient();

	// Initialize analytics and session sync on mount
	onMount(() => {
		initAnalytics();

		// Listen for auth state changes to keep session in sync
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			// Invalidate the layout data when auth state changes
			// This ensures server and client stay in sync
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
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
