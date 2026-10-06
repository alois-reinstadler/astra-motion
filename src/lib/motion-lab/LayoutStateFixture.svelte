<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { createLayoutState } from '../motion/layout-state.svelte.js';
	import { AnimatePresence, MotionConfig, motion } from '../motion/index.js';

	let {
		initialCount = 0,
		initializeCount,
		initializeScene = false,
		mountWrite = false,
		onMountWrite,
		onRender,
		onExitComplete
	}: {
		initialCount?: number;
		initializeCount?: number;
		initializeScene?: boolean;
		mountWrite?: boolean;
		onMountWrite?: (before: number, after: number) => void;
		onRender?: (count: number, columns: number) => void;
		onExitComplete?: () => void;
	} = $props();
	const scene = createLayoutState({ columns: 10, items: Array.from({ length: 30 }, (_, i) => i) });
	const counter = createLayoutState(untrack(() => initialCount));
	untrack(() => {
		if (initializeCount !== undefined) counter.set(initializeCount);
		if (initializeScene)
			scene.update((value) => ({
				columns: 5,
				items: value.items.filter((id) => id !== 0 && id !== 5)
			}));
	});
	let effectRequest = $state(0);
	onMount(() => {
		if (mountWrite) {
			const before = counter.current;
			counter.update((value) => value + 1);
			onMountWrite?.(before, counter.current);
		}
	});
	function applyEffectRequest() {
		if (effectRequest) counter.update((value) => value + 1);
	}
	function observeRender() {
		onRender?.(counter.current, scene.current.columns);
	}
	$effect(applyEffectRequest);
	$effect(observeRender);

	export function states() {
		return { scene, counter };
	}
	export function requestFromEffect() {
		effectRequest++;
	}
</script>

<output data-layout-state-count>{counter.current}</output>
<MotionConfig reducedMotion="never">
	<div
		data-layout-state-grid
		style="position:relative;display:grid;width:600px;gap:4px"
		style:grid-template-columns={`repeat(${scene.current.columns}, minmax(0, 1fr))`}
	>
		<AnimatePresence
			items={scene.current.items}
			key={(item) => item}
			mode="popLayout"
			initial={false}
			{onExitComplete}
		>
			{#snippet children(item)}
				<motion.div
					layout="position"
					data-layout-state-item={item}
					style="height:24px"
					initial={false}
					animate={{ opacity: 1 }}
					transition={{ layout: { duration: 0.35, ease: 'linear' }, opacity: { duration: 0.18 } }}
					exit={{ opacity: 0 }}
				>
					{item}
				</motion.div>
			{/snippet}
		</AnimatePresence>
	</div>
</MotionConfig>
