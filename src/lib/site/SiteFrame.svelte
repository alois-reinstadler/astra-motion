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
	.astra-site :global(.fieldwork button) {
		transition:
			color 180ms ease,
			background-color 180ms ease,
			border-color 180ms ease,
			filter 120ms ease;
	}
	.astra-site :global(.fieldwork button:active:not(:disabled)) {
		filter: brightness(0.93);
	}
	@media (prefers-reduced-motion: reduce) {
		.astra-site :global(.fieldwork button) {
			transition: none;
		}
	}

	.astra-site :global(a),
	.astra-site :global(summary) {
		transition:
			color 180ms ease,
			background-color 180ms ease,
			border-color 180ms ease;
	}
	.astra-site :global(input) {
		transition:
			border-color 180ms ease,
			box-shadow 180ms ease;
	}
	.astra-site :global([data-ui-control]) {
		transition:
			color 180ms ease,
			background-color 180ms ease,
			border-color 180ms ease,
			box-shadow 180ms ease,
			translate 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.astra-site :global([data-ui-control]:active:not(:disabled)) {
		translate: 0 1px;
	}
	.astra-site :global(.example-grid > a),
	.astra-site :global(.feature-grid > a) {
		transition:
			translate 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
			box-shadow 220ms ease,
			border-color 180ms ease,
			background-color 180ms ease;
	}
	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		.astra-site :global([data-ui-control]:hover:not(:disabled)) {
			translate: 0 -2px;
		}
		.astra-site :global([data-ui-control]:active:not(:disabled)) {
			translate: 0 1px;
		}
		.astra-site :global(.example-grid > a:hover),
		.astra-site :global(.feature-grid > a:hover) {
			translate: 0 -4px;
			box-shadow: 0 10px 24px #2528210c;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.astra-site :global(a),
		.astra-site :global(summary),
		.astra-site :global(input),
		.astra-site :global([data-ui-control]) {
			transition: none;
		}
		.astra-site :global([data-ui-control]:active:not(:disabled)) {
			translate: none;
		}
	}

	.astra-site {
		--site-bg: #f7f7f0;
		--site-ink: #252821;
		--site-muted: #64695c;
		--site-line: #d9d8d0;
		--site-accent: #c23d22;
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
