<script lang="ts">
	import { updateLayout, type LayoutOptions } from '$lib/motion/layout.js';
	import Surface from '$lib/motion-lab/LayoutDiagnosticSurface.svelte';
	let method = $state<'automatic' | 'explicit' | 'static'>('automatic');
	let mode = $state<LayoutOptions['mode']>('both');
	let nested = $state(true);
	let compact = $state(false);
	let expanded = $state(false);
	let narrow = $state(false);
	function change(mutate: () => void) {
		if (method === 'explicit') updateLayout(mutate);
		else mutate();
	}
</script>

<svelte:head><title>Layout diagnostics — Astra Motion</title></svelte:head>

<h1>Layout measurement and rasterization controls</h1>
<p>Diagnostic fixture. Position-only and static controls deliberately change animation behavior.</p>
<div class="controls">
	<label
		>Method <select bind:value={method}
			><option>automatic</option><option>explicit</option><option>static</option></select
		></label
	>
	<label
		>Projection <select bind:value={mode}><option>both</option><option>position</option></select
		></label
	>
	<label><input type="checkbox" bind:checked={nested} /> Nested correction</label>
	<button
		data-action="resize"
		onclick={() =>
			change(() => {
				compact = !compact;
			})}>Resize surface</button
	>
	<button
		data-action="accordion"
		onclick={() =>
			change(() => {
				expanded = !expanded;
			})}>Toggle accordion</button
	>
	<button
		data-action="parent"
		onclick={() =>
			change(() => {
				narrow = !narrow;
			})}>Reflow parent</button
	>
</div>
<div class="parent" class:narrow data-probe="parent">
	{#key `${method}:${mode}:${nested}`}
		<Surface {method} {mode} {nested} {compact} {expanded} />
	{/key}
</div>

<style>
	h1,
	p,
	.controls {
		margin: 18px 28px;
	}
	.controls {
		display: flex;
		gap: 14px;
		align-items: center;
		flex-wrap: wrap;
	}
	button,
	select {
		font: inherit;
		border: 1px solid #aaa;
		padding: 5px;
	}
	.parent {
		margin: 27.375px 0 60px 40.375px;
		width: 1017.25px;
	}
	.parent.narrow {
		width: 541.375px;
	}
</style>
