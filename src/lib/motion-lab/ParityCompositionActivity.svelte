<script lang="ts">
	import { untrack } from 'svelte';
	import { AnimateActivity, motion } from '../motion/index.js';
	import Work from './ParityCompositionWork.svelte';
	let {
		initialMode = 'visible',
		onStart
	}: { initialMode?: 'visible' | 'hidden'; onStart?: (definition: unknown) => void } = $props();
	let mode = $state<'visible' | 'hidden'>(untrack(() => initialMode));
	let late = $state(false);
	export function show() {
		mode = 'visible';
	}
	export function hide() {
		mode = 'hidden';
	}
	export function introduce() {
		late = true;
	}
</script>

<AnimateActivity {mode} initial={false} data-composition-activity>
	<input aria-label="Retained composition input" />
	<Work />
	<motion.div
		data-composition-first
		initial={{ x: -80 }}
		animate={{ x: 0 }}
		exit={{ opacity: 0 }}
		transition={{ duration: 0.15 }}
		onAnimationStart={onStart}
	/>
	{#if late}
		<motion.div
			data-composition-late
			initial={{ x: -80 }}
			animate={{ x: 0 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.15 }}
			onAnimationStart={onStart}
		/>
	{/if}
</AnimateActivity>
