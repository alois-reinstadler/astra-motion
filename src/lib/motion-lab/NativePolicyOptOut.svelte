<script lang="ts">
	import { motion } from '$lib/index.js';
	let reduced = $state<'never' | 'always'>('never');
	const options = () => ({
		initial: { x: 0 },
		animate: { x: 100, transition: { duration: 5, ease: 'linear' as const, reduceMotion: false } },
		layout: true,
		reducedMotion: reduced
	});
	const binding = motion.bind(options);
	export function reduce() {
		reduced = 'always';
	}
</script>

<div data-optout="native" {...binding.props}>Native</div>
<motion.div data-optout="component" {...options()}>Component</motion.div>
