<script lang="ts">
	import './layout.css';
	import SiteSeo from '$lib/site/SiteSeo.svelte';

	const { children } = $props();
</script>

<SiteSeo />
{@render children()}
