<script lang="ts">
	import { onMount, flushSync, tick } from 'svelte';
	import PerformanceGrid from './PerformanceGrid.svelte';
	let { data }: { data: { count: number; mode: 'automatic' | 'explicit' | 'instant' } } = $props();
	let mounted = $state(true);
	let scene = $state.raw<ReturnType<typeof PerformanceGrid>>();
	let ready = $state(false);
	let lastDisposedStats: { participants: number; active: number } | undefined;

	async function setMounted(value: boolean) {
		const old = scene;
		flushSync(() => {
			mounted = value;
		});
		await tick();
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		if (!value && old) lastDisposedStats = old.stats();
		return { mounted, lastDisposedStats };
	}

	onMount(() => {
		const api = {
			mutate: (kind: Parameters<NonNullable<typeof scene>['mutate']>[0]) => scene?.mutate(kind),
			setMounted,
			stats: () => scene?.stats() ?? { participants: 0, active: 0 },
			verify: () =>
				scene?.verify() ?? {
					domCount: document.querySelectorAll('[data-cell]').length,
					mounted: false,
					lastDisposedStats
				},
			identity: { count: data.count, mode: data.mode, production: !import.meta.env.DEV }
		};
		const host = window as Window & { __motionPerf?: typeof api };
		host.__motionPerf = api;
		ready = true;
		return () => {
			if (host.__motionPerf === api) delete host.__motionPerf;
		};
	});
</script>

<svelte:head><title>Production layout qualification</title></svelte:head>
<main>
	<header>
		<div>
			<p>PACKED PACKAGE / PRODUCTION</p>
			<h1>{data.count} participants · {data.mode}</h1>
		</div>
		<nav aria-label="Benchmark controls">
			<button disabled={!ready || !mounted} onclick={() => scene?.mutate('reverse')}>Reverse</button
			>
			<button disabled={!ready || !mounted} onclick={() => scene?.mutate('resize')}
				>Resize grid</button
			>
			<button disabled={!ready || !mounted} onclick={() => scene?.mutate('remove')}
				>Remove 20%</button
			>
			<button disabled={!ready || !mounted} onclick={() => scene?.mutate('undo')}>Undo</button>
			<button disabled={!ready} onclick={() => setMounted(!mounted)}
				>{mounted ? 'Destroy' : 'Remount'}</button
			>
		</nav>
	</header>
	<div class="stage">
		{#if mounted}<PerformanceGrid count={data.count} mode={data.mode} bind:this={scene} />{/if}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f5f4ed;
		color: #253221;
	}
	main {
		padding: 24px 32px;
	}
	header {
		display: flex;
		gap: 24px;
		justify-content: space-between;
		align-items: center;
		width: 1120px;
		margin-bottom: 24px;
	}
	p {
		font: 10px monospace;
		letter-spacing: 0.09em;
	}
	h1 {
		font:
			23px Georgia,
			serif;
		margin: 8px 0;
	}
	nav {
		display: flex;
		gap: 8px;
	}
	button {
		background: transparent;
		border: 1px solid #9aa58c;
		padding: 9px 12px;
		cursor: pointer;
	}
	.stage {
		min-height: 820px;
	}
</style>
