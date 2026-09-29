<script lang="ts">
	import { AnimateActivity, AnimatePresence, motion, updateLayout } from '../motion/index.js';
	import PopResizeChild from './PopResizeChild.svelte';
	let {
		projected = false,
		transaction = false,
		activity = false,
		anchorX = 'left',
		anchorY = 'top',
		direction = 'ltr'
	}: {
		projected?: boolean;
		transaction?: boolean;
		activity?: boolean;
		anchorX?: 'left' | 'right';
		anchorY?: 'top' | 'bottom';
		direction?: 'ltr' | 'rtl';
	} = $props();
	let present = $state(true);
	let width = $state(320);
	let finish = () => {};
	export function resize(next: number) {
		width = next;
	}
	export function toggle() {
		const change = () => {
			present = !present;
			width = present ? 320 : 180;
		};
		if (transaction) updateLayout(change);
		else change();
	}
	export function complete() {
		finish();
	}
</script>

{#snippet content()}
	{#if projected}
		<motion.p
			data-pop-resize-text
			layout="position"
			exit={{ opacity: 0 }}
			transition={{ duration: 1.2, layout: { duration: 0.8, ease: 'linear' } }}
		>
			A paragraph with enough words to wrap across several lines when its containing card narrows
			during the same update that starts its exit.
		</motion.p>
	{:else}
		<PopResizeChild complete={(callback) => (finish = callback)} />
	{/if}
{/snippet}

<button onclick={toggle}>Toggle simultaneous resize</button>
<motion.div
	data-pop-resize-parent
	layout={projected}
	style={{ width, position: 'relative', padding: 16, border: '2px solid', direction }}
	transition={{ layout: { duration: 0.8, ease: 'linear' } }}
>
	<div style="height: 24px">Heading</div>

	{#if activity}
		<AnimateActivity mode={present ? 'visible' : 'hidden'} layoutMode="pop" {anchorX} {anchorY}>
			{@render content()}
		</AnimateActivity>
	{:else}
		<AnimatePresence {present} mode="popLayout" initial={false} {anchorX} {anchorY}>
			{@render content()}
		</AnimatePresence>
	{/if}
	<div data-pop-resize-sibling style="height: 20px">Sibling</div>
</motion.div>

<style>
	:global([data-pop-resize-text]) {
		box-sizing: border-box;
		max-width: 100%;
		margin: 10px 0;
		font: 16px / 24px monospace;
	}
</style>
