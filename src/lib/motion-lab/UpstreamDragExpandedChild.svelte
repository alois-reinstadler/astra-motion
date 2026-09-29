<!-- Motion 13.4.4 @ 33f6e72; attribution: tests/motion-baseline. -->
<script lang="ts">
	import { motion, type MotionValue } from '../motion/index.js';
	let {
		id = 'snap',
		shared = false,
		sharedX
	}: { id?: string; shared?: boolean; sharedX?: MotionValue<number> } = $props();
</script>

<motion.div
	data-testid={id}
	layout
	layoutId={shared ? 'upstream-drag-snap' : undefined}
	drag="x"
	dragSnapToOrigin
	dragMomentum={false}
	initial={{ opacity: 1 }}
	exit={{ opacity: 0, transition: { duration: 0.3, ease: 'linear' } }}
	transition={{ duration: 0.15 }}
	style={{ x: sharedX, width: 80, height: 80, backgroundColor: 'teal' }}
/>
