<script lang="ts">
	import { resolve } from '$app/paths';
	import SiteFrame from '$lib/site/SiteFrame.svelte';
	import DocExample from '$lib/site/DocExample.svelte';
	import { getDoc } from '$lib/site/docs.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<SiteFrame>
	<main id="site-content">
		<a class="back" href={resolve('/examples')}>All examples</a>
		<p class="eyebrow">{data.example.category.toUpperCase()}</p>
		<h1>{data.example.title}</h1>
		<p class="lede">{data.example.description}</p>
		<DocExample example={data.example} />
		<a
			class="related"
			href={resolve(`/docs/[slug]#${data.example.anchor}`, { slug: data.example.guide })}
			>Read {getDoc(data.example.guide)?.title}</a
		>
	</main>
</SiteFrame>

<style>
	main {
		max-width: 1050px;
		padding: 50px 56px 90px;
		margin: auto;
	}
	.back,
	.related {
		font-size: 13px;
		text-underline-offset: 4px;
	}
	.back {
		color: var(--site-muted);
	}
	.eyebrow {
		margin: 40px 0 20px;
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1.5px;
		color: var(--site-muted);
	}
	h1 {
		font-size: clamp(36px, 5vw, 62px);
		line-height: 1.1;
		letter-spacing: -2px;
		font-weight: 450;
		margin: 0;
	}
	.lede {
		font-size: 17px;
		line-height: 1.7;
		color: var(--site-muted);
		margin: 24px 0 35px;
	}
	.related {
		display: inline-block;
		margin-top: 18px;
		color: var(--site-accent);
	}
	@media (max-width: 750px) {
		main {
			padding: 35px 24px 60px;
		}
	}
</style>
