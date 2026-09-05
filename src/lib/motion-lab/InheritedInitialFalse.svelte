<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	const panel = createMotion({ initial: false, animate: 'visible' });
	const child = panel.child({
		variants: { visible: { x: [-100, 0], opacity: [0, 1] } },
		transition: { duration: 0.35 }
	});
	const transition = child.transition;
</script>

<div {...panel.props}>
	<p data-inherited {...child.props} transition:transition>Visible immediately</p>
</div>
