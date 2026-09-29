<script lang="ts">
	import Tilt from '../motion/Tilt.svelte';
	import MotionConfig from '../motion/MotionConfig.svelte';
	import AnimateActivity from '../motion/AnimateActivity.svelte';
	import { motion } from '../motion/index.js';
	import type { ReducedMotion } from '../motion/policy.js';
	import type { TiltOptions } from '../motion/tilt-controller.svelte.js';

	let { composed = false }: { composed?: boolean } = $props();
	let options = $state<TiltOptions>({});
	let policy = $state<ReducedMotion>('user');
	let hidden = $state(false);
	let width = $state(200);
	let clicks = $state(0);

	export function configure(value: TiltOptions) {
		options = value;
	}
	export function reduce(value: ReducedMotion) {
		policy = value;
	}
	export function hide(value: boolean) {
		hidden = value;
	}
	export function resize(value: number) {
		width = value;
	}
</script>

{#snippet body()}
	<Tilt {...options} style="width: {width}px">
		<div style="height: 120px">
			<button onclick={() => clicks++}>Clicked {clicks}</button>
			<input aria-label="Native input" />
		</div>
	</Tilt>
{/snippet}

<MotionConfig reducedMotion={policy}>
	<AnimateActivity mode={hidden ? 'hidden' : 'visible'}>
		{#if composed}
			<motion.div
				data-tilt-outer
				layout
				initial={false}
				animate={{ x: 20, scale: 1.2 }}
				transition={{ duration: 0 }}
				style="width: fit-content; transform-origin: top left"
			>
				{@render body()}
			</motion.div>
		{:else}
			<div
				style="transform: translateX(20px) scale(1.2); transform-origin: top left; width: fit-content"
			>
				{@render body()}
			</div>
		{/if}
	</AnimateActivity>
</MotionConfig>
