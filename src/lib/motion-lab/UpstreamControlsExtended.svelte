<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { motion, useAnimationControls, useMotionValue } from '../motion/index.js';
	const controls = useAnimationControls();
	const tree = useAnimationControls();
	const first = useMotionValue(0),
		second = useMotionValue(0);
	const child = useMotionValue(0),
		grandchild = useMotionValue(0);
	export const api = () => ({ controls, tree, first, second, child, grandchild });
	const variants = { active: { x: 60, opacity: 0.4 } };
</script>

<motion.div
	data-upstream-control="first"
	initial={{ x: 10 }}
	animate={controls}
	style={{ x: first }}
	custom={1}
/>
<motion.div
	data-upstream-control="second"
	initial={{ x: 20 }}
	animate={controls}
	style={{ x: second }}
	custom={2}
/>
<motion.div animate={tree}>
	<motion.div
		data-upstream-control="child"
		style={{ x: child }}
		initial={{ x: 0, opacity: 1 }}
		{variants}
	>
		<motion.div
			data-upstream-control="grandchild"
			style={{ x: grandchild }}
			initial={{ x: 0, opacity: 1 }}
			{variants}
		/>
	</motion.div>
</motion.div>
