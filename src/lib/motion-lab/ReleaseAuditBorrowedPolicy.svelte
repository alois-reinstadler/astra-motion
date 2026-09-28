<script lang="ts">
	import { MotionConfig, motion, type MotionValue } from '../motion/index.js';
	let { x }: { x: MotionValue<number> } = $props();
	let reducedMotion = $state<'never' | 'always'>('never');
	export function reduce() {
		reducedMotion = 'always';
	}
</script>

<motion.div style={{ x }} data-audit-external />
<MotionConfig {reducedMotion}>
	<motion.div style={{ x }} data-audit-borrowed />
	<motion.div
		initial={{ y: 0 }}
		animate={{ y: 100 }}
		transition={{ duration: 10, ease: 'linear' }}
		data-audit-owned
	/>
</MotionConfig>
