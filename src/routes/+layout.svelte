<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Plenura - Bienestar a tu alcance</title>
</svelte:head>

{@render children()}
