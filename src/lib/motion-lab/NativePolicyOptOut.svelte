<script lang="ts">
	import { motion, arc } from '$lib/index.js';
	let reduced = $state<'never' | 'always'>('never');
	const defaults = $state({ duration: 4, skipAnimations: false });
	const options = () => ({
		initial: { x: 0 },
		animate: { x: 100, transition: { duration: 5, ease: 'linear' as const, reduceMotion: false } },
		layout: true,
		transition: defaults,
		reducedMotion: reduced
	});
	const binding = motion.bind(options);
	export function reduce() {
		reduced = 'always';
	}
	export function skip() {
		defaults.skipAnimations = true;
	}
	export function runPlain(reduceMotion: boolean) {
		return binding.animate({ x: 200 }, { duration: 4, ease: 'linear', reduceMotion });
	}
	export function runPath() {
		return binding.animate(
			{ x: 200, y: 0 },
			{ path: arc(), duration: 4, ease: 'linear', reduceMotion: false }
		);
	}
</script>

<div data-optout="native" {...binding.props}>Native</div>
<motion.div data-optout="component" {...options()}>Component</motion.div>
