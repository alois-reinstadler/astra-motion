<script lang="ts">
	import { flushSync, untrack } from 'svelte';
	import { AnimatePresence, MotionConfig, motion, createLayoutState } from '@astra/index.js';
	import { initial, change } from './model.mjs';
	let {
		count,
		staged = false,
		unstaged = false
	}: { count: number; staged?: boolean; unstaged?: boolean } = $props();
	let requested = $state.raw(untrack(() => initial(count)));
	const scene = createLayoutState(untrack(() => requested));
	const state = $derived(staged ? scene.current : requested);
	export function request(next: ReturnType<typeof initial>) {
		requested = next;
		if (staged) scene.set(next);
	}
	export function mutate(workload: string) {
		flushSync(() => {
			request(change(state, workload));
		});
	}
	export function expected() {
		return [...state.items];
	}
</script>

<MotionConfig reducedMotion="never">
	<div
		class="grid"
		style:grid-template-columns={`repeat(${unstaged ? requested.columns : state.columns},minmax(0,1fr))`}
	>
		<AnimatePresence items={state.items} key={(id) => id} initial={false} mode="popLayout">
			{#snippet children(id)}
				<motion.div
					class="cell"
					data-cell={id}
					layout="position"
					initial={false}
					exit={{ opacity: 0 }}
					transition={{
						layout: { duration: 0.35, ease: 'linear' },
						opacity: { duration: 0.18, ease: (t) => 1 - (1 - t) ** 3 }
					}}>{id}</motion.div
				>
			{/snippet}
		</AnimatePresence>
	</div>
</MotionConfig>
