<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { routeShared } from '$lib/motion/routes.js';
	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
</script>

<svelte:head><title>Astra / Objects</title></svelte:head>
<main>
	<a href={resolve('/motion-lab')}> Motion laboratory</a>
	<p>COLLECTION / 001</p>
	<h1>Objects in space.</h1>
	<button
		data-testid="delayed-detail"
		disabled={!hydrated}
		onclick={() => goto(resolve('/motion-lab/product/01?delay=400'))}
		>Open with async data
	</button>
	<div class="collection">
		{#each ['01', '02', '03'] as id (id)}<a
				class="product"
				href={resolve('/motion-lab/product/[id]', { id })}
				data-testid={`product-${id}`}
				{@attach routeShared(`background-${id}`)}
				><img
					src={asset('/object.svg')}
					alt={`Sculptural arch, object ${id}`}
					width="600"
					height="500"
					{@attach routeShared(`image-${id}`)}
				/>
				<h2 {@attach routeShared(`title-${id}`)}>Object No. {id}</h2>
				<span>Explore the form </span></a
			>{/each}
	</div>
</main>

<style>
	main {
		max-width: 1100px;
		margin: auto;
		padding: 55px 30px;
		font-family: 'Instrument Sans Variable', sans-serif;
		color: #252821;
	}
	a {
		color: inherit;
		text-decoration: none;
	}
	main > p {
		font:
			11px ui-monospace,
			monospace;
		letter-spacing: 2px;
		margin: 55px 0 20px;
	}
	h1 {
		font:
			clamp(40px, 6vw, 72px) Georgia,
			serif;
		letter-spacing: -2px;
	}
	button {
		cursor: pointer;
		border: 1px solid #aeb4a3;
		padding: 10px 14px;
		border-radius: 5px;
		margin-top: 20px;
	}
	.collection {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		margin-top: 50px;
	}
	.product {
		background: #e8ebdf;
		padding: 18px;
		border-radius: 12px;
	}
	.product img {
		display: block;
		width: 100%;
		height: auto;
	}
	.product h2 {
		font:
			24px Georgia,
			serif;
		margin: 20px 0 10px;
	}
	.product span {
		font-size: 12px;
		color: #71776a;
	}
	@media (max-width: 650px) {
		.collection {
			grid-template-columns: 1fr;
		}
	}
</style>
