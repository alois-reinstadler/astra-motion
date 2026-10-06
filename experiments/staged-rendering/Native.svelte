<script lang="ts">
	import { flushSync, untrack } from 'svelte';
	import { createLayout } from '@astra/layout.js';
	import { popLayout, presence } from '@astra/presence.js';
	import { initial, change } from './model.mjs';
	let { count, automatic }: { count: number; automatic: boolean } = $props();
	const layout = createLayout({
		automatic: untrack(() => automatic),
		reducedMotion: 'never',
		transition: { duration: 0.35, ease: 'linear' }
	});
	let state = $state(untrack(() => initial(count)));
	export function mutate(workload: string) {
		const apply = () => {
			state = change(state, workload);
		};
		if (automatic) flushSync(apply);
		else layout.update(apply);
	}
	export function stats() {
		return layout.stats();
	}
	export function expected() {
		return [...state.items];
	}
</script>

<div class="grid" style:grid-template-columns={`repeat(${state.columns},minmax(0,1fr))`}>
	{#each state.items as id (id)}
		<div
			class="cell"
			data-cell={id}
			{@attach layout({ mode: 'position' })}
			{@attach popLayout()}
			out:presence={{ duration: 180 }}
		>
			{id}
		</div>
	{/each}
</div>
