<script lang="ts">
	import { motion, motionValue, MotionConfig, LayoutGroup } from '../motion/index.js';
	const cx = motionValue(25);
	let expanded = $state(false);
	let visible = $state(true);
	let shape = $state<SVGCircleElement | null>();
	let starts = $state(0);
	let completions = $state(0);
</script>

<section aria-label="Core parity fixture">
	<button onclick={() => (expanded = !expanded)}>Change SVG target</button>
	<button onclick={() => cx.set(cx.get() === 25 ? 75 : 25)}>Change SVG value</button>
	<button onclick={() => (visible = !visible)}>Toggle SVG</button>
	<output data-testid="svg-events">{starts}:{completions}</output>
	<output data-testid="svg-ref">{shape?.tagName ?? 'none'}</output>
	<MotionConfig transition={{ duration: 0.15, ease: 'linear' }}>
		<motion.svg aria-label="Animated SVG" viewBox="0 0 200 120" width="400" height="240">
			{#if visible}
				<motion.circle
					data-testid="svg-circle"
					bind:ref={shape}
					{cx}
					cy={35}
					r={10}
					initial={{ opacity: 0.2, r: 10 }}
					animate={{ opacity: 1, r: expanded ? 25 : 15 }}
					exit={{ opacity: 0 }}
					fill="currentColor"
					onAnimationStart={() => starts++}
					onAnimationComplete={() => completions++}
				/>
			{/if}
			<motion.path
				data-testid="svg-path"
				d="M10 80 L190 80"
				fill="none"
				stroke="currentColor"
				initial={{ pathLength: 0 }}
				animate={{ pathLength: expanded ? 1 : 0.5 }}
			/>
			<motion.rect
				data-testid="svg-transform"
				width={20}
				height={20}
				attrX={130}
				attrY={20}
				initial={false}
				animate={{ rotate: expanded ? 90 : 0 }}
			/>
		</motion.svg>
	</MotionConfig>
	<LayoutGroup id="core-parity">
		<motion.div
			data-testid="layout-direct"
			layout="position"
			layoutAnchor={{ x: 0.5, y: 0.5 }}
			style={{ width: expanded ? '200px' : '100px', height: '40px', backgroundColor: '#7058df' }}
		/>
	</LayoutGroup>
</section>
