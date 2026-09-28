<script lang="ts">
	import { motion, useAnimationControls, type MotionValue } from '../motion/index.js';
	let { x }: { x: MotionValue<number> } = $props();
	const controls = useAnimationControls();
	export function claim() {
		return controls.start({ x: 1000 }, { duration: 0.5, ease: 'linear' });
	}
</script>

<motion.div data-borrowed-hidden style={{ x }} animate={controls} />
