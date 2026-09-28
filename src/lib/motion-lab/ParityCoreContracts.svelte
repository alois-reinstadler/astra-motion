<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AnimatePresence,
		LayoutGroup,
		MotionConfig,
		motion,
		useAnimationControls,
		type MotionOptions
	} from '../motion/index.js';
	let { onMeasure, onStart }: { onMeasure?: () => void; onStart?: (definition: unknown) => void } =
		$props();
	const first = useAnimationControls();
	const second = useAnimationControls();
	let selected = $state(false);
	let reduced = $state<'always' | 'never'>('never');
	let moved = $state(false);
	let measure = $state(true);
	let custom = $state(0);
	let raw = $state<MotionOptions['animate']>({ transform: 'rotate(30deg)', x: 50 });
	onMount(() => {
		void first.start('shown');
	});
	export const control = (which: 'first' | 'second') => (which === 'first' ? first : second);
	export function swapControls() {
		selected = true;
	}
	export function changePolicy() {
		reduced = 'always';
		moved = true;
	}
	export function invalidate(enabled: boolean) {
		measure = enabled;
		custom++;
	}
	export function releaseRaw() {
		raw = { x: 75 };
	}
	export function clearRaw() {
		raw = { transform: '', x: 75 };
	}
</script>

<motion.div
	data-controls
	animate={selected ? second : first}
	initial="hidden"
	variants={{ hidden: { x: 0 }, shown: { x: 40 }, more: { x: 80 } }}
	transition={{ duration: 0.06 }}
	onAnimationStart={onStart}
>
	<motion.span
		data-controls-child
		variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 }, more: { opacity: 0.5 } }}
		>Child</motion.span
	>
</motion.div>
<motion.div data-raw initial={false} animate={raw} transition={{ duration: 0 }} />
<motion.div
	data-priority
	initial={false}
	animate={{ x: 0 }}
	whileHover={{ x: 30 }}
	whileTap={{ x: 60 }}
	transition={{ duration: 0 }}
/>
<MotionConfig reducedMotion={reduced} transition={{ duration: 0.25, ease: 'linear' }}>
	<motion.div
		data-policy
		initial={false}
		animate={{ x: moved ? 100 : 0, opacity: moved ? 0.3 : 1 }}
	/>
</MotionConfig>
<LayoutGroup>
	<AnimatePresence {custom} presenceAffectsLayout={measure}>
		<motion.div
			data-measure
			layout
			onLayoutMeasure={onMeasure}
			style={{ width: '30px', height: '30px' }}
		/>
	</AnimatePresence>
</LayoutGroup>
