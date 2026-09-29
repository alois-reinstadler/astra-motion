<!-- Adapted from Motion v13.4.4; see tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { motion, useMotionValue } from '../motion/index.js';

	let { report = () => {} }: { report?: (event: string) => void } = $props();
	const x = useMotionValue(0);

	export function readDrag() {
		return x.get();
	}
</script>

<motion.div
	data-testid="drag"
	initial={{ opacity: 1 }}
	whileHover={{ opacity: 0.5 }}
	transition={{ type: false }}
	onHoverStart={() => report('hover:start')}
	onHoverEnd={() => report('hover:end')}
	drag="x"
	dragMomentum={false}
	style={{ x, width: 80, height: 80 }}
	onDragStart={() => report('drag:start')}
	onDragEnd={() => report('drag:end')}
/>
<motion.div
	data-testid="hover"
	initial={{ opacity: 1 }}
	whileHover={{ opacity: 0.5 }}
	transition={{ type: false }}
	onHoverStart={() => report('hover:start')}
	onHoverEnd={() => report('hover:end')}
	style={{ width: 80, height: 80 }}
/>
