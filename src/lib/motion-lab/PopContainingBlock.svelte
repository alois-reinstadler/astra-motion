<script lang="ts">
	import { AnimatePresence, MotionConfig, motion } from '../motion/index.js';
	let {
		anchorX = 'left',
		anchorY = 'top',
		direction = 'ltr',
		projectedChild = true,
		exitDuration = 0.4
	}: {
		anchorX?: 'left' | 'right';
		anchorY?: 'top' | 'bottom';
		direction?: 'ltr' | 'rtl';
		projectedChild?: boolean;
		exitDuration?: number;
	} = $props();
	let expanded = $state(true);
</script>

<MotionConfig transition={{ layout: { duration: 0.16, ease: 'linear' } }}>
	<motion.section class="pop-shell" layout style={{ width: expanded ? 360 : 260 }} dir={direction}>
		<div class="heading">Heading</div>
		<motion.div class="pop-body" layout="position">
			<div class="prefix">Content before the outgoing child</div>
			<div class="unrelated">Absolute sibling</div>
			<AnimatePresence present={expanded} mode="popLayout" {anchorX} {anchorY}>
				<motion.p
					class="outgoing"
					layout={projectedChild ? 'position' : false}
					initial={false}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ opacity: { duration: exitDuration } }}
					>Room 2 · Coastal light — afternoons with nowhere else to be.</motion.p
				>
			</AnimatePresence>
		</motion.div>
		<button onclick={() => (expanded = !expanded)}>Toggle</button>
	</motion.section>
</MotionConfig>

<style>
	:global(.pop-shell) {
		position: relative;
		padding: 20px;
		border: 3px solid;
		box-sizing: border-box;
	}
	.heading {
		height: 30px;
	}
	:global(.pop-body) {
		padding: 4px 6px;
		border: 2px solid;
	}
	.prefix {
		height: 30px;
		white-space: nowrap;
	}
	.unrelated {
		position: absolute;
		top: 2px;
		right: 2px;
		font-size: 8px;
	}
	:global(.outgoing) {
		margin: 12px 0 0;
		font-size: 14px;
		line-height: 20px;
	}
	button {
		margin-top: 14px;
	}
</style>
