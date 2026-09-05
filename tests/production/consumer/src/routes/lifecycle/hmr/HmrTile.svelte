<script lang="ts">
	import { onMount } from 'svelte';
	import { createMotion } from 'astra-motion/state';
	import { createAnimate } from 'astra-motion/animate';
	let moved = $state(false);
	const revision = 'A';
	const tile = createMotion(() => ({
		initial: false,
		animate: { x: moved ? 120 : 0 },
		transition: { duration: 0.3 }
	}));
	const scope = createAnimate();
	onMount(() => {
		document.body.dataset.hmrLive = String(Number(document.body.dataset.hmrLive ?? 0) + 1);
		document.body.dataset.hmrMounts = String(Number(document.body.dataset.hmrMounts ?? 0) + 1);
		return () => {
			document.body.dataset.hmrLive = String(Number(document.body.dataset.hmrLive ?? 0) - 1);
		};
	});
</script>

<div data-testid="hmr-owner" {@attach scope.attach}>
	<p data-testid="hmr-revision">Fixture revision {revision}</p>
	<button
		onclick={() => {
			moved = !moved;
		}}>Retarget after edit</button
	>
	<button onclick={() => scope.animate('.pulse', { opacity: [1, 0.2, 1] }, { duration: 0.8 })}
		>Start scoped playback</button
	>
	<div class="tile" data-testid="hmr-tile" {...tile.props}>HMR content alpha</div>
	<div class="pulse" data-testid="hmr-pulse">Scoped animation target</div>
</div>

<style>
	.tile {
		width: 150px;
		height: 80px;
		background: #a8be79;
		display: grid;
		place-items: center;
		margin: 20px 0;
	}
	.pulse {
		background: #d9ae85;
		width: 200px;
		padding: 20px;
	}
</style>
