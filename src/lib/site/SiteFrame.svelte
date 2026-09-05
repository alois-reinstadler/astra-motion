<script lang="ts">
	import type { Snippet } from 'svelte';
	import SiteHeader from './SiteHeader.svelte';
	import SiteFooter from './SiteFooter.svelte';
	let { children }: { children: Snippet } = $props();
</script>

<div class="astra-site">
	<a class="site-skip" href="#site-content">Skip to content</a>
	<SiteHeader />
	{@render children()}
	<div class="site-footer-wrap"><SiteFooter /></div>
</div>

<style>
	.astra-site {
		--site-bg: #f7f7f0;
		--site-ink: #252821;
		--site-muted: #64695c;
		--site-line: #d9d8d0;
		--site-accent: #d34123;
		--site-panel: #edeee5;
		min-height: 100vh;
		background: var(--site-bg);
		color: var(--site-ink);
		font-family: 'Instrument Sans Variable', sans-serif;
	}
	.site-footer-wrap {
		padding: 0 56px;
	}
	.site-skip {
		position: fixed;
		top: 8px;
		left: 8px;
		padding: 12px 20px;
		background: #252821;
		color: white;
		z-index: 100;
		transform: translateY(-150%);
	}
	.site-skip:focus {
		transform: translateY(0);
	}
	.astra-site :global(button),
	.astra-site :global(a),
	.astra-site :global(input),
	.astra-site :global(summary) {
		-webkit-tap-highlight-color: transparent;
	}
	.astra-site :global(:focus-visible) {
		outline: 2px solid var(--site-accent);
		outline-offset: 4px;
	}
	.astra-site :global(button) {
		cursor: pointer;
	}
	@media (max-width: 750px) {
		.site-footer-wrap {
			padding: 0 24px;
		}
	}
</style>
