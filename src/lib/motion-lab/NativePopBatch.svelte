<script lang="ts">
	import { untrack } from 'svelte';
	import { createLayout } from '../motion/layout.js';
	import { popLayout, presence } from '../motion/presence.js';
	let {
		count = 12,
		duration = 1000,
		pop = true,
		automatic = true
	}: { count?: number; duration?: number; pop?: boolean; automatic?: boolean } = $props();
	const layout = createLayout({
		automatic: untrack(() => automatic),
		reducedMotion: 'never',
		transition: { duration: 0.15, ease: 'linear' }
	});
	let items = $state(untrack(() => Array.from({ length: count }, (_, id) => id)));
	let columns = $state(4);
	export function remove() {
		items = items.filter((id) => id % 2 !== 0);
	}
	export function reset() {
		items = Array.from({ length: count }, (_, id) => id);
	}
	export function reorderAndResize() {
		items = items.toReversed();
		columns = columns === 4 ? 2 : 4;
	}
	export function stats() {
		return layout.stats();
	}
</script>

<div
	data-native-batch
	style="position:relative;display:grid;width:400px;gap:8px"
	style:grid-template-columns={`repeat(${columns},minmax(0,1fr))`}
>
	{#each items as id (id)}
		<div
			data-native-cell={id}
			style="height:32px;margin:2px 3.5px"
			{@attach layout({ mode: 'position' })}
			{@attach pop && popLayout()}
			transition:presence={{ duration }}
		>
			{id}
		</div>
	{/each}
</div>
