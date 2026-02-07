<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_APP_URL } from '$env/static/public';

	interface Props {
		title?: string;
		description?: string;
		image?: string;
		type?: 'website' | 'article' | 'profile';
		noindex?: boolean;
	}

	let {
		title = 'Plenura - Bienestar a tu alcance',
		description = 'Encuentra y reserva servicios de masajes, terapias y bienestar con profesionales verificados. La plataforma líder en México.',
		image = '/og-image.png',
		type = 'website',
		noindex = false
	}: Props = $props();

	const siteName = 'Plenura';
	const twitterHandle = '@plenura';

	const fullTitle = $derived(
		title === siteName ? title : `${title} - ${siteName}`
	);

	const canonicalUrl = $derived(
		`${PUBLIC_APP_URL}${$page.url.pathname}`
	);

	const imageUrl = $derived(
		image.startsWith('http') ? image : `${PUBLIC_APP_URL}${image}`
	);

	// Structured data for SEO
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "SoftwareApplication",
				"@id": "https://plenura.redbroomsoftware.com/#application",
				"name": "Plenura",
				"alternateName": ["Plenura Wellness", "RBS Wellness"],
				"description": "Plataforma de bienestar y terapias en México. Encuentra masajistas, terapeutas y profesionales de bienestar verificados.",
				"url": "https://plenura.redbroomsoftware.com",
				"applicationCategory": "HealthApplication",
				"operatingSystem": "Web",
				"author": { "@type": "Organization", "@id": "https://redbroomsoftware.com/#organization" },
				"publisher": { "@type": "Organization", "@id": "https://redbroomsoftware.com/#organization" },
				"featureList": ["Therapist Discovery", "Online Booking", "Verified Professionals", "Reviews & Ratings"],
				"inLanguage": ["es-MX"]
			},
			{
				"@type": "Organization",
				"@id": "https://redbroomsoftware.com/#organization",
				"name": "Red Broom Software",
				"alternateName": ["RBS", "RedBroom"],
				"url": "https://redbroomsoftware.com"
			},
			{
				"@type": "WebSite",
				"@id": "https://plenura.redbroomsoftware.com/#website",
				"url": "https://plenura.redbroomsoftware.com",
				"name": "Plenura",
				"publisher": { "@type": "Organization", "@id": "https://redbroomsoftware.com/#organization" },
				"isPartOf": { "@type": "WebSite", "@id": "https://redbroomsoftware.com/#website" }
			}
		]
	};
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{fullTitle}</title>
	<meta name="title" content={fullTitle} />
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content="es_MX" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={canonicalUrl} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:site" content={twitterHandle} />
	<meta name="twitter:creator" content={twitterHandle} />

	<!-- Additional Meta -->
	<meta name="theme-color" content="#16a34a" />
	<meta name="apple-mobile-web-app-title" content={siteName} />
	<meta name="application-name" content={siteName} />

	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
</svelte:head>
