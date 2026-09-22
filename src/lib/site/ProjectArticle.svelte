<script lang="ts">
	import type { Snippet } from 'svelte';
	import SiteFrame from './SiteFrame.svelte';
	let {
		eyebrow,
		title,
		intro,
		children
	}: { eyebrow: string; title: string; intro: string; children: Snippet } = $props();
</script>

<SiteFrame>
	<main id="site-content" class="project-article">
		<header>
			<p class="eyebrow">{eyebrow}</p>
			<h1>{title}</h1>
			<p class="intro">{intro}</p>
		</header>
		<div class="article-body">{@render children()}</div>
	</main>
</SiteFrame>

<style>
	.project-article {
		max-width: 1120px;
		margin: auto;
		padding: 80px 56px 100px;
	}
	header {
		max-width: 820px;
		padding-bottom: 48px;
	}
	.eyebrow {
		color: var(--site-accent);
		font:
			11px/1.6 ui-monospace,
			monospace;
		letter-spacing: 1.4px;
	}
	h1 {
		margin: 25px 0;
		font-size: clamp(44px, 6vw, 76px);
		font-weight: 500;
		line-height: 1.03;
		letter-spacing: -3px;
		text-wrap: balance;
	}
	.intro {
		max-width: 740px;
		font-size: 20px;
		line-height: 1.65;
		color: var(--site-muted);
	}
	.article-body :global(section) {
		display: grid;
		grid-template-columns: 230px minmax(0, 1fr);
		gap: 48px;
		padding: 34px 0;
		border-top: 1px solid var(--site-line);
		scroll-margin-top: 24px;
	}
	.article-body :global(h2) {
		font-size: 23px;
		font-weight: 500;
		line-height: 1.25;
		letter-spacing: -0.5px;
		margin: 4px 0;
	}
	.article-body :global(h3) {
		font-size: 16px;
		font-weight: 600;
		margin: 24px 0 8px;
	}
	.article-body :global(p),
	.article-body :global(li) {
		color: var(--site-muted);
		font-size: 15px;
		line-height: 1.85;
	}
	.article-body :global(p) {
		margin: 0 0 16px;
	}
	.article-body :global(p:last-child),
	.article-body :global(li:last-child) {
		margin-bottom: 0;
	}
	.article-body :global(p:first-child) {
		margin-top: 0;
	}
	.article-body :global(ul) {
		list-style-type: disc;
		padding-left: 19px;
		margin: 0 0 20px;
	}
	.article-body :global(li) {
		padding-left: 5px;
		margin-bottom: 14px;
	}
	.article-body :global(li::marker) {
		color: var(--site-accent);
	}
	.article-body :global(a) {
		color: var(--site-accent);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 4px;
	}
	.article-body :global(a:hover) {
		text-decoration-thickness: 2px;
	}
	.article-body :global(a:focus-visible) {
		outline: 2px solid var(--site-accent);
		outline-offset: 4px;
	}
	.article-body :global(code) {
		font-size: 0.9em;
		overflow-wrap: anywhere;
	}
	@media (max-width: 750px) {
		.project-article {
			padding: 48px 24px 64px;
		}
		h1 {
			letter-spacing: -2px;
		}
		.intro {
			font-size: 18px;
		}
		.article-body :global(section) {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
</style>
