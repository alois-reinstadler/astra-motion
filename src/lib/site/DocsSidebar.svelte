<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { docGroups, docs } from './docs.js';
	let query = $state('');
	const filtered = $derived(
		docs.filter((doc) =>
			`${doc.title} ${doc.summary} ${doc.sections.map((section) => section.title).join(' ')}`
				.toLowerCase()
				.includes(query.trim().toLowerCase())
		)
	);
	const current = $derived(page.params.slug ?? '');
</script>

{#snippet navigation(id: string)}
	<div class="navigation-content">
		<div class="search">
			<label for={id}>Find a guide</label><input
				{id}
				type="search"
				bind:value={query}
				placeholder="Filter topics…"
				autocomplete="off"
			/>
		</div>
		<nav aria-label="Documentation">
			{#each docGroups as group (group)}
				{@const pages = filtered.filter((doc) => doc.group === group)}
				{#if pages.length}<div class="nav-group">
						<p>{group}</p>
						{#each pages as doc (doc.slug)}<a
								href={doc.slug ? resolve('/docs/[slug]', { slug: doc.slug }) : resolve('/docs')}
								aria-current={current === doc.slug ? 'page' : undefined}
								onclick={(event) => {
									event.currentTarget.closest('details')?.removeAttribute('open');
									query = '';
								}}
								><span>{doc.title}</span>{#if current === doc.slug}<span aria-hidden="true">↗</span
									>{/if}</a
							>{/each}
					</div>{/if}
			{/each}
			{#if !filtered.length}<p class="empty" role="status">
					No guide matches “{query}”. Try layout, exit or scroll.
				</p>{/if}
		</nav>
		<a class="examples-link" href={resolve('/examples')}
			>Explore the examples <span aria-hidden="true">↗</span></a
		>
	</div>
{/snippet}

<aside class="sidebar">
	<div class="desktop-navigation">{@render navigation('docs-search-desktop')}</div>
	<details class="mobile-navigation">
		<summary
			><span>Documentation</span><span
				>Contents <span class="expand-icon" aria-hidden="true">+</span></span
			></summary
		>
		{@render navigation('docs-search-mobile')}
	</details>
</aside>

<style>
	.sidebar {
		align-self: start;
		position: sticky;
		top: 30px;
		min-width: 0;
		max-height: calc(100dvh - 60px);
		overflow-y: auto;
		padding-right: 18px;
	}
	.mobile-navigation {
		display: none;
	}
	.search {
		margin-bottom: 30px;
	}
	label {
		display: block;
		margin-bottom: 9px;
		font-size: 10px;
		text-transform: uppercase;
		font-weight: 650;
		letter-spacing: 1.3px;
		color: var(--site-muted);
	}
	input {
		width: 100%;
		min-width: 0;
		border: 1px solid var(--site-line);
		background: transparent;
		border-radius: 4px;
		padding: 10px 11px;
		color: var(--site-ink);
		font: inherit;
		font-size: 12px;
	}
	.nav-group {
		margin-bottom: 25px;
	}
	.nav-group p {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 1.1px;
		font-weight: 650;
		color: var(--site-muted);
		margin: 0 0 9px 9px;
	}
	.nav-group a {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		text-decoration: none;
		color: var(--site-muted);
		font-size: 12px;
		padding: 9px;
		border-radius: 3px;
		line-height: 1.4;
	}
	.nav-group a:hover {
		color: var(--site-ink);
		background: var(--site-panel);
	}
	.nav-group a[aria-current='page'] {
		color: var(--site-accent);
		background: #d3412309;
		font-weight: 600;
	}
	.examples-link {
		border-top: 1px solid var(--site-line);
		padding: 20px 9px 0;
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font-size: 11px;
		text-decoration: none;
		color: var(--site-ink);
	}
	.empty {
		font-size: 12px;
		line-height: 1.7;
		color: var(--site-muted);
		padding: 10px 0 25px;
	}
	:focus-visible {
		outline: 2px solid var(--site-accent);
		outline-offset: 3px;
	}
	@media (max-width: 800px) {
		.sidebar {
			position: static;
			max-height: none;
			padding: 0;
			border-bottom: 1px solid var(--site-line);
		}
		.desktop-navigation {
			display: none;
		}
		.mobile-navigation {
			display: block;
		}
		summary {
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: none;
			border: 0;
			padding: 16px 0;
			font: inherit;
			font-size: 12px;
			cursor: pointer;
			color: var(--site-ink);
		}
		summary > span:last-child {
			font-size: 11px;
			color: var(--site-muted);
		}
		.navigation-content {
			padding: 15px 0 24px;
		}
		summary::-webkit-details-marker {
			display: none;
		}
		.expand-icon {
			display: inline-block;
			margin-left: 4px;
		}
		details[open] .expand-icon {
			transform: rotate(45deg);
		}
		nav {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0 18px;
		}
		.search {
			max-width: 400px;
		}
	}
</style>
