<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { createMotion } from 'astra-motion/state';
	import { createLayout } from 'astra-motion/layout';
	import { routeShared } from 'astra-motion/routes';
	let moved = $state(false);
	let ready = $state(false);
	let counter = $state(0);
	const layout = createLayout();
	const tile = createMotion(() => ({
		initial: false,
		animate: { x: moved ? 120 : 0 },
		transition: { duration: 0.8 }
	}));
	onMount(() => {
		ready = true;
	});
</script>

<h1>Real document cache restoration</h1>
<p>
	Use the outside link for a browser document navigation, then browser Back. SPA navigation alone is
	not a BFCache test.
</p>
<button
	disabled={!ready}
	onclick={() => {
		moved = !moved;
		counter += 1;
	}}>Move before leaving</button
>
<output data-testid="cache-count">{counter}</output>
<div class="track">
	<div class="tile" data-testid="cache-tile" {...tile.props}>Retained heap</div>
</div>
<div class="shared" data-testid="shared-source" {@attach routeShared('lifecycle-photo')}>
	Shared photograph
</div>
<div class="layout-stage" class:moved {@attach layout()}>
	<div {@attach layout({ mode: 'position' })}>Layout registration survives</div>
</div>
<p>
	<a href={resolve('/lifecycle/streamed?mode=late')} data-testid="streamed-late-link"
		>Open late shared content</a
	>
</p>
<p>
	<a href={resolve('/lifecycle/streamed?mode=reserved')} data-testid="streamed-reserved-link"
		>Open reserved shared host</a
	>
</p>
<p>
	<a href={resolve('/lifecycle/ready')} data-testid="ready-link">Open awaited shared content</a>
</p>
<p>
	<a href={resolve('/lifecycle/outside')} data-sveltekit-reload data-testid="leave-document"
		>Leave this document</a
	>
</p>

<style>
	.track {
		height: 100px;
		max-width: 420px;
		background: #e3e7d4;
		margin: 20px 0;
		padding: 15px;
	}
	.tile {
		display: grid;
		place-items: center;
		width: 150px;
		height: 70px;
		background: #b8ca8d;
	}
	.shared {
		width: 180px;
		height: 120px;
		background: #cf7356;
		display: grid;
		place-items: center;
	}
	.layout-stage {
		width: 240px;
		padding: 15px;
		margin-top: 20px;
		background: #d8dfcf;
		display: flex;
		justify-content: flex-start;
	}
	.layout-stage.moved {
		width: 360px;
		justify-content: flex-end;
	}
</style>
