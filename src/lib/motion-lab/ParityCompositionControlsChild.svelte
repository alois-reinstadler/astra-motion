<script lang="ts">
	import { onMount } from 'svelte';
	import { motion, useAnimationControls, type MotionOptions } from '../motion/index.js';
	let {
		controls,
		ready,
		onStart,
		onComplete,
		onResolve
	}: {
		controls?: ReturnType<typeof useAnimationControls>;
		ready: (controls: ReturnType<typeof useAnimationControls>) => void;
		onStart?: (definition: unknown) => void;
		onComplete?: (definition: unknown) => void;
		onResolve?: (
			custom: unknown,
			current: Record<string, string | number>,
			velocity: Record<string, string | number>
		) => void;
	} = $props();
	const local = useAnimationControls();
	const variants: MotionOptions['variants'] = {
		initial: { x: 0 },
		mounted: { x: 40 },
		first: {
			x: 160,
			transition: { duration: 0.35, ease: 'linear' },
			transitionEnd: { opacity: 0.2 }
		},
		last: { x: 60, transition: { duration: 0.08, ease: 'linear' }, transitionEnd: { opacity: 1 } },
		resolved: (custom, current, velocity) => {
			onResolve?.(custom, current, velocity);
			return { x: Number(custom) + Number(current.x ?? 0), transition: { duration: 0 } };
		}
	};
	onMount(() => {
		ready(local);
	});
</script>

<motion.div
	data-composition-controlled
	initial="initial"
	animate={controls ?? local}
	custom={7}
	{variants}
	transition={{ duration: 0.08 }}
	onAnimationStart={onStart}
	onAnimationComplete={onComplete}
>
	<motion.span
		data-composition-controlled-child
		variants={{
			initial: { opacity: 0 },
			mounted: { opacity: 1 },
			first: { opacity: 0.4 },
			last: { opacity: 1 }
		}}
	/>
</motion.div>
