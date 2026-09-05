<script lang="ts">
	import { flushSync, untrack } from 'svelte';
	import { createLayout } from '../motion/layout.js';
	let { count, automatic = false }: { count: number; automatic?: boolean } = $props();
	const layout = createLayout({ reducedMotion: 'never', automatic: untrack(() => automatic) });
	let items = $state(untrack(() => Array.from({ length: count }, (_, id) => id)));
	export function reorder() {
		const change = () => {
			items = items.toReversed();
		};
		if (!automatic) layout.update(change);
		else flushSync(change);
	}
	function attach(node: HTMLElement) {
		return layout()(node);
	}
	export function stats() {
		return layout.stats();
	}
</script>

<div class="benchmark-grid">
	{#each items as id (id)}<div {@attach attach}>{id}</div>{/each}
</div>

<style>
	.benchmark-grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		width: 600px;
		gap: 4px;
	}
	.benchmark-grid > div {
		height: 24px;
		background: #e8ebdf;
		font: 12px sans-serif;
	}
</style>
