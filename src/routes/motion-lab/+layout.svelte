<script lang="ts">
	import SiteHeader from '$lib/site/SiteHeader.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { routeTransitions } from '$lib/motion/routes.js';
	let { children } = $props();
	routeTransitions();
	const guides: Record<string, { slug: string; title: string }> = {
		components: { slug: 'components', title: 'Components' },
		presence: { slug: 'presence', title: 'Presence' },
		state: { slug: 'state', title: 'State' },
		inheritance: { slug: 'state', title: 'State' },
		scroll: { slug: 'scroll', title: 'Scroll' },
		timelines: { slug: 'timelines', title: 'Timelines' },
		product: { slug: 'routes', title: 'Routes' },
		guide: { slug: 'getting-started', title: 'Getting started' }
	};
	const guide = $derived(
		guides[page.route.id?.split('/')[2] ?? ''] ?? { slug: 'layout', title: 'Layout' }
	);
</script>

<SiteHeader compact />
<nav class="lab-navigation" aria-label="Laboratory navigation">
	<div class="lab-context">
		<span>Laboratory <small>Advanced diagnostics</small></span><a href={resolve('/examples')}
			>Examples</a
		>
		<a href={resolve('/docs/[slug]', { slug: guide.slug })}>{guide.title} guide </a>
	</div>
	<p class="lab-description">
		These scenes test integration boundaries and stress cases. Start with the documentation for a
		focused, copyable example.
	</p>
	<div class="lab-topics">
		<a
			href={resolve('/motion-lab')}
			aria-current={page.url.pathname === resolve('/motion-lab') ? 'page' : undefined}>Layout</a
		>
		<a
			href={resolve('/motion-lab/components')}
			aria-current={page.url.pathname.includes('/components') ? 'page' : undefined}>Components</a
		>
		<a
			href={resolve('/motion-lab/presence')}
			aria-current={page.url.pathname.includes('/presence') ? 'page' : undefined}>Presence</a
		>
		<a
			href={resolve('/motion-lab/state')}
			aria-current={page.url.pathname.includes('/state') ? 'page' : undefined}>State</a
		>
		<a
			href={resolve('/motion-lab/scroll')}
			aria-current={page.url.pathname.includes('/scroll') ? 'page' : undefined}>Scroll</a
		>
		<a
			href={resolve('/motion-lab/timelines')}
			aria-current={page.url.pathname.includes('/timelines') ? 'page' : undefined}>Timelines</a
		>
		<a
			href={resolve('/motion-lab/product')}
			aria-current={page.url.pathname.includes('/product') ? 'page' : undefined}>Routes</a
		>
	</div>
</nav>
{@render children()}

<style>
	.lab-description {
		white-space: normal;
		line-height: 1.6;
		margin: 0 0 12px;
	}
	.lab-context {
		flex-wrap: wrap;
	}
	.lab-context small {
		margin-left: 10px;
		color: #64695c;
	}

	.lab-navigation {
		white-space: nowrap;
		padding: 15px 56px;
		background: #f7f7f0;
		border-bottom: 1px solid #d9d8d0;
		font:
			11px 'Instrument Sans Variable',
			sans-serif;
		color: #64695c;
	}
	.lab-context {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding-bottom: 14px;
	}
	.lab-context a:last-child {
		color: #b2321b;
	}
	.lab-topics {
		display: flex;
		gap: 24px;
		align-items: center;
		overflow-x: auto;
		padding: 3px 0;
	}
	.lab-navigation a {
		text-decoration: none;
	}
	.lab-navigation a:hover,
	.lab-navigation a[aria-current] {
		color: #b2321b;
	}
	.lab-navigation a:first-child {
		color: #252821;
	}
	.lab-navigation a:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	@media (max-width: 750px) {
		.lab-navigation {
			padding: 14px 24px;
			gap: 20px;
		}
	}

	:global(::view-transition-group(*)) {
		animation-duration: 360ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
	}
	:global(::view-transition) {
		pointer-events: none;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-group(*)) {
			animation-duration: 0s;
		}
	}
</style>
