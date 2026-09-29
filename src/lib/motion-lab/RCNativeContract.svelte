<script lang="ts">
	import { motion } from '$lib/index.js';
	let shown = $state(true);
	let reduced = $state<'never' | 'always'>('never');
	let target = $state({ x: 80, opacity: 1 });
	let completed = $state({ native: 0, component: 0 });
	const options = () => ({
		initial: { x: 0, opacity: 0.2 },
		animate: target,
		exit: { opacity: 0 },
		transition: { duration: 0.18 },
		reducedMotion: reduced
	});
	const panel = motion.bind(() => ({
		...options(),
		onAnimationComplete: () => completed.native++
	}));
	const panelTransition = panel.transition;
	const parent = motion.bind({ initial: false, animate: 'shown' });
	const child = parent.child({ variants: { shown: { x: 35, opacity: 0.7 } } });
	export function setTarget(x: number) {
		target.x = x;
	}
	export function setShown(value: boolean) {
		shown = value;
	}
	export function reduce() {
		reduced = 'always';
		target.x = 160;
	}
	export function counts() {
		return completed;
	}
</script>

{#if shown}
	<div data-rc-native {...panel.props} transition:panelTransition|global>Native</div>
	<motion.div data-rc-component {...options()} onAnimationComplete={() => completed.component++}
		>Component</motion.div
	>
{/if}
<div {...parent.props}>
	<div data-rc-native-child {...child.props}>Native child</div>
</div>
<motion.div initial={false} animate="shown">
	<motion.div data-rc-component-child variants={{ shown: { x: 35, opacity: 0.7 } }}
		>Component child</motion.div
	>
</motion.div>
