<script lang="ts">
	import { page } from '$app/state';
	const metadata = $derived(
		page.status < 400 && page.data.seo?.pathname === page.url.pathname
			? page.data.seo.metadata
			: undefined
	);
	const canonical = $derived(
		metadata && page.data.seo?.origin ? `${page.data.seo.origin}${page.url.pathname}` : undefined
	);
</script>

<svelte:head>
	<meta name="robots" content={canonical ? 'index, follow' : 'noindex, nofollow'} />
	<meta name="theme-color" content="#f7f7f0" />
	{#if metadata}
		<title>{metadata.title}</title>
		<meta name="description" content={metadata.description} />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Astra Motion" />
		<meta property="og:title" content={metadata.title} />
		<meta property="og:description" content={metadata.description} />
		<meta property="og:locale" content="en_US" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={metadata.title} />
		<meta name="twitter:description" content={metadata.description} />
	{/if}
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
		<meta property="og:image" content={`${page.data.seo?.origin}/social-card.png`} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:alt" content="Astra Motion. Motion’s engine. Svelte’s lifecycle." />
		<meta name="twitter:image" content={`${page.data.seo?.origin}/social-card.png`} />
		<meta name="twitter:image:alt" content="Astra Motion. Motion’s engine. Svelte’s lifecycle." />
	{/if}
</svelte:head>
