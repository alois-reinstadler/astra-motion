<script lang="ts">
	import { AnimateActivity, motion, type MotionValue } from '../motion/index.js';
	import Child from './ParityBorrowedActivityChild.svelte';
	let { x }: { x: MotionValue<number> } = $props();
	let mode = $state<'visible' | 'hidden'>('visible');
	let child = $state<ReturnType<typeof Child>>();
	export function show() {
		mode = 'visible';
	}
	export function hide() {
		mode = 'hidden';
	}
	export function claim() {
		return child!.claim();
	}
</script>

<motion.div data-borrowed-visible style={{ x }} />
<AnimateActivity {mode} data-borrowed-host>
	<Child {x} bind:this={child} />
</AnimateActivity>
