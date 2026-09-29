<script lang="ts">
	import { motion, type MotionOptions } from '$lib/motion/index.js';
	let { initial = false }: { initial?: false | { opacity: number } } = $props();
	let shown = $state(true);
	const options = (): MotionOptions => ({
		initial,
		animate: {
			opacity: [0.6, 1],
			transition: { duration: 0.12, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }
		},
		exit: { opacity: 0, transition: { duration: 0.6, ease: 'linear' } },
		whileHover: { scale: 1.1, transition: { duration: 0.05 } },
		reducedMotion: 'never'
	});
	const binding = motion.bind(options);
	const reveal = binding.transition;
	export function show(value: boolean) {
		shown = value;
	}
</script>

{#if shown}
	<div data-infinite-reentry="native" {...binding.props} transition:reveal|global>
		Native infinite playback
	</div>
	<motion.div data-infinite-reentry="component" {...options()}
		>Component infinite playback</motion.div
	>
{/if}
