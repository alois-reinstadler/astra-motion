<!-- Adapted from Motion v13.4.4 scenarios; see tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { motion, useAnimationControls, useMotionValue } from '../motion/index.js';
	const controls = useAnimationControls();
	const first = useMotionValue(0);
	const second = useMotionValue(0);
	export const getControls = () => controls;
	export const values = () => [first, second];
	const variants = {
		position: { x: 40 },
		paint: { x: 80, opacity: 0.5 }
	};
</script>

<motion.div
	data-upstream-control="first"
	animate={controls}
	custom={1}
	style={{ x: first }}
	{variants}
/>
<motion.div
	data-upstream-control="second"
	animate={controls}
	custom={2}
	style={{ x: second }}
	{variants}
/>
