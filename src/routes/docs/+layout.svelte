<script lang="ts">
	import type { Snippet } from 'svelte';
	import SiteFrame from '$lib/site/SiteFrame.svelte';
	import DocsSidebar from '$lib/site/DocsSidebar.svelte';
	let { children }: { children: Snippet } = $props();
</script>

<SiteFrame
	><main id="site-content" class="docs-layout">
		<DocsSidebar />
		<div class="document">{@render children()}</div>
	</main></SiteFrame
>

<style>
	.docs-layout {
		display: grid;
		grid-template-columns: 218px minmax(0, 1fr);
		gap: 50px;
		max-width: 1440px;
		margin: auto;
		padding: 45px 56px 90px;
	}
	.document {
		min-width: 0;
	}
	@media (max-width: 1050px) {
		.docs-layout {
			grid-template-columns: 195px minmax(0, 1fr);
			gap: 34px;
			padding-inline: 32px;
		}
	}
	@media (max-width: 800px) {
		.docs-layout {
			display: block;
			padding: 0 24px 60px;
		}
		.document {
			padding-top: 32px;
		}
	}
</style>
