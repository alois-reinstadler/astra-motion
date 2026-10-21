<script lang="ts">
	import { useCycle, motion, MotionConfig } from '$lib/motion/index.js';
	const destination = useCycle(0, 80, 160);
</script>

<button onclick={() => destination.cycle()}>Next destination</button>
<MotionConfig reducedMotion="user">
	<motion.div animate={{ x: destination.current }}>Marker</motion.div>
</MotionConfig>
