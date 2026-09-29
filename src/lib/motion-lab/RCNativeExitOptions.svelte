<script lang="ts">
	import { motion, type MotionOptions } from '$lib/motion/index.js';
	let { scenario }: { scenario: 'variables' | 'repeat' | 'keyframes' } = $props();
	let shown = $state(true);
	let completed = $state({ native: false, component: false });
	const options = (): MotionOptions => ({
		initial: false,
		animate: { x: 0, opacity: 1, backgroundColor: '#112233' },
		exit:
			scenario === 'variables'
				? {
						x: 'var(--exit-x)',
						opacity: 'var(--exit-opacity)',
						backgroundColor: 'var(--exit-color)'
					}
				: scenario === 'keyframes'
					? { opacity: [0.3, 0] }
					: { x: 40, opacity: 0 },
		transition: {
			duration: 0.3,
			ease: 'linear',
			...(scenario === 'repeat' ? { repeat: 2, repeatDelay: 0.05 } : {})
		},
		style: { '--exit-x': '40px', '--exit-opacity': '0', '--exit-color': '#ff0000' },
		reducedMotion: 'never'
	});
	const binding = motion.bind(() => ({
		...options(),
		onAnimationComplete: () => {
			if (!shown) completed.native = true;
		}
	}));
	const reveal = binding.transition;
	export function close() {
		shown = false;
	}
	export function exits() {
		return completed;
	}
</script>

{#if shown}
	<div data-exit-options="native" {...binding.props} transition:reveal|global>Native exit</div>
	<motion.div
		data-exit-options="component"
		{...options()}
		onAnimationComplete={() => {
			if (!shown) completed.component = true;
		}}>Component exit</motion.div
	>
{/if}
