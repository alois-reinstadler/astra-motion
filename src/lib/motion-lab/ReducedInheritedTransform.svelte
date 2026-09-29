<script lang="ts">
	import { motion } from '../motion/motion.svelte.js';
	let { takeover = false }: { takeover?: boolean } = $props();
	const parent = motion.bind({
		initial: false,
		animate: 'shown',
		reducedMotion: 'never',
		transition: { duration: 0 },
		variants: { shown: { opacity: 1 } }
	});
	const child = motion.bind(() => ({
		reducedMotion: takeover ? 'always' : 'never',
		variants: { shown: takeover ? { opacity: 1, x: 12.123456789 } : { opacity: 1 } },
		transition: { duration: 0 }
	}));
</script>

<section {...parent.props}>
	<div {...child.props} data-reduced-inherited-transform>Inherited reduced transform</div>
</section>
