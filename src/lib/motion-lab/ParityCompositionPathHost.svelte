<script lang="ts">
	import { AnimateActivity, MotionConfig } from '../motion/index.js';
	import Path from './ParityCompositionPath.svelte';
	let { reduced = false }: { reduced?: boolean } = $props();
	let hidden = $state(false);
	let child = $state<ReturnType<typeof Path>>();
	export function target() {
		return child!;
	}
	export function hide() {
		hidden = true;
	}
	export function show() {
		hidden = false;
	}
	export function reduceMotion() {
		reduced = true;
	}
</script>

<MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
	<AnimateActivity mode={hidden ? 'hidden' : 'visible'} data-composition-path-host>
		<Path bind:this={child} />
	</AnimateActivity>
</MotionConfig>
