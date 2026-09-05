<script lang="ts">
	import { resolve } from '$app/paths';
	import { routeShared } from '$lib/motion/routes.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Astra / Object {data.id}</title></svelte:head>
<main>
	<a href={resolve('/motion-lab/product')} data-testid="collection">← The collection</a>
	<article {@attach routeShared(`background-${data.id}`)}>
		<img
			src="/object.svg"
			alt={`Sculptural arch, object ${data.id}`}
			width="600"
			height="500"
			{@attach routeShared(`image-${data.id}`)}
		/>
		<div>
			<p>FORM STUDY / {data.id}</p>
			<h1 {@attach routeShared(`title-${data.id}`)}>Object No. {data.id}</h1>
			<p class="description">
				A small study in continuity. The image, title and surface keep their identity as the route
				changes around them.
			</p>
			<a href={resolve('/motion-lab/product')}>Return to all objects ↗</a>
		</div>
	</article>
</main>

<style>
	main {
		max-width: 1200px;
		margin: auto;
		padding: 55px 30px;
		font-family: 'Instrument Sans Variable', sans-serif;
		color: #252821;
	}
	a {
		color: inherit;
		text-decoration: none;
		font-size: 13px;
	}
	article {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 45px;
		align-items: center;
		background: #e8ebdf;
		margin-top: 55px;
		padding: 30px;
		border-radius: 12px;
	}
	img {
		display: block;
		width: 100%;
		height: auto;
	}
	h1 {
		font:
			clamp(32px, 5vw, 56px) Georgia,
			serif;
		letter-spacing: -2px;
		margin: 25px 0;
	}
	article p {
		font:
			11px ui-monospace,
			monospace;
		letter-spacing: 1px;
	}
	.description {
		font:
			16px/1.7 'Instrument Sans Variable',
			sans-serif;
		letter-spacing: 0;
		color: #71776a;
	}
	article a {
		display: inline-block;
		margin-top: 30px;
	}
	@media (max-width: 650px) {
		article {
			grid-template-columns: 1fr;
			gap: 20px;
		}
	}
</style>
