<script lang="ts">
	import { resolve } from '$app/paths';
	import SiteFrame from '$lib/site/SiteFrame.svelte';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<SiteFrame>
	<main id="site-content">
		<header>
			<p class="eyebrow">RECIPES / {data.version}</p>
			<h1>Start with an interaction.</h1>
			<p>
				Small compositions built from Astra’s existing primitives. Each recipe has a runnable
				preview, complete source, and explicit motion and accessibility choices.
			</p>
			<nav aria-label="Recipe resources">
				<a href={resolve('/recipes.json')}>Download source manifest</a>
				<a href={resolve('/docs/coming-from-react#migration-recipes')}>Five migration recipes</a>
			</nav>
		</header>
		<div class="recipes">
			{#each data.recipes as recipe (recipe.id)}
				<article>
					<p class="eyebrow">{recipe.category}</p>
					<h2>{recipe.title}</h2>
					<p>{recipe.description}</p>
					<dl>
						<dt>Interaction and access</dt>
						<dd>{recipe.accessibility}</dd>
						<dt>Motion preference</dt>
						<dd>{recipe.motion}</dd>
						<dt>Dependencies</dt>
						<dd>{recipe.cost}</dd>
					</dl>
					<a href={resolve('/examples/[slug]', { slug: recipe.example })}
						>Try {recipe.title.toLowerCase()} <span aria-hidden="true">↗</span></a
					>
				</article>
			{/each}
		</div>
	</main>
</SiteFrame>

<style>
	main {
		max-width: 1200px;
		margin: auto;
		padding: 64px 32px;
		color: #252821;
	}
	header {
		max-width: 740px;
		margin-bottom: 36px;
	}
	h1 {
		font-size: clamp(32px, 5vw, 56px);
		letter-spacing: -0.04em;
		line-height: 1.1;
		margin: 16px 0;
	}
	h2 {
		font-size: 24px;
		line-height: 1.2;
		margin: 12px 0;
	}
	p,
	dd {
		line-height: 1.6;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 12px 24px;
	}
	a {
		color: inherit;
		text-underline-offset: 4px;
	}
	a:focus-visible {
		outline: 2px solid #b2321b;
		outline-offset: 4px;
	}
	.eyebrow {
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.recipes {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
	}
	article {
		border: 1px solid #d9d8d0;
		border-radius: 14px;
		padding: 28px;
	}
	dt {
		font-size: 12px;
		font-weight: 650;
		margin-top: 18px;
	}
	dd {
		margin: 4px 0 0;
		color: #64695c;
		font-size: 14px;
	}
	article > a {
		display: inline-block;
		padding: 12px 0;
	}
	@media (max-width: 640px) {
		main {
			padding: 36px 20px;
		}
		.recipes {
			grid-template-columns: 1fr;
		}
		article {
			padding: 22px;
		}
	}
</style>
