<script lang="ts">
	import { createLayout } from '../motion/layout.js';
	import { springPresenceSpike } from './state-engine-spike.js';
	let open = $state(true);
	let end = $state(false);
	const layout = createLayout({ transition: { duration: 0.5, ease: 'linear' } });
</script>

<button onclick={() => (open = !open)}>Toggle spike</button>
<button onclick={() => (end = !end)}>Move spike</button>
<div style:justify-content={end ? 'flex-end' : 'flex-start'} class="track">
	{#if open}
		<div
			data-testid="state-node"
			{@attach layout()}
			transition:springPresenceSpike
			class="item"
		></div>
	{/if}
</div>

<style>
	.track {
		display: flex;
		width: 400px;
		height: 100px;
		position: relative;
	}
	.item {
		width: 100px;
		height: 100px;
		background: royalblue;
	}
</style>
