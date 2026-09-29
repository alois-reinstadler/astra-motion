<script lang="ts">
	// Adapted from Motion v13.4.4 (33f6e72); see tests/motion-baseline/LICENSE.motion.
	import { onMount } from 'svelte';
	import { motion, Reorder, useMotionValue, type TargetAndTransition } from '../motion/index.js';
	import Child from './UpstreamComponentsExpandedChild.svelte';
	let {
		mode = 'initial',
		explicitTabindex = false
	}: { mode?: string; explicitTabindex?: boolean } = $props();
	const Default = motion.create(Child);
	const Forward = motion.create(Child, { forwardMotionProps: true });
	const Custom = motion.create('upstream-test');
	let initialX = $state(100);
	let expanded = $state(false);
	let replace = $state(false);
	let scalarColor = $state(false);
	let nativeRef = $state<HTMLDivElement>();
	let motionRef = $state<HTMLDivElement | null>();
	let mounted: [Element | undefined, Element | null | undefined] | undefined;
	const x = useMotionValue(1),
		y = useMotionValue(2),
		z = useMotionValue(3);
	const color = useMotionValue('#fff');
	const borrowedY = useMotionValue(200);
	const opacity = useMotionValue(0.5);
	const willChange = useMotionValue('opacity');
	const dynamic = { hidden: (custom: number): TargetAndTransition => ({ x: custom * 10 }) };
	onMount(() => {
		mounted = [nativeRef, motionRef];
	});
	export function inspect() {
		return { mounted, nativeRef, motionRef, x, y, z, color };
	}
	export function configure(options: {
		initialX?: number;
		expanded?: boolean;
		replace?: boolean;
		scalarColor?: boolean;
	}) {
		if (options.initialX !== undefined) initialX = options.initialX;
		if (options.expanded !== undefined) expanded = options.expanded;
		if (options.replace !== undefined) replace = options.replace;
		if (options.scalarColor !== undefined) scalarColor = options.scalarColor;
	}
</script>

{#if mode === 'initial'}
	<motion.div data-case="initial" initial={{ x: initialX }} />
{:else if mode === 'props'}
	<Default
		data-case="default"
		label="Default"
		initial={{ opacity: 0 }}
		animate={{ opacity: 0.5 }}
		transition={{ duration: 0 }}
	/>
	<Forward
		data-case="forward"
		label="Forward"
		initial={{ opacity: 0 }}
		animate={{ opacity: 0.5 }}
		transition={{ duration: 0 }}
	/>
{:else if mode === 'refs'}
	<div
		{@attach (element) => {
			nativeRef = element;
			return () => {
				nativeRef = undefined;
			};
		}}
		data-case="native-ref"
	></div>
	<motion.div bind:ref={motionRef} data-case="motion-ref" />
{:else if mode === 'object'}
	<motion.div data-case="parent" initial={{ opacity: 0.2, y: 50 }}>
		<motion.div data-case="child" />
	</motion.div>
{:else if mode === 'layout'}
	<motion.div layout="size" style={{ width: 'max-content' }}>
		<motion.div
			data-case="layout"
			layout="size"
			style={{ width: expanded ? 200 : 50, height: 40 }}
			transition={{ layout: { duration: 0.8, ease: 'linear' } }}
		/>
	</motion.div>
{:else if mode === 'variants'}
	<motion.div initial="hidden" variants={{ hidden: { opacity: 0.25 } }} data-case="static-parent">
		<motion.div variants={{ hidden: { opacity: 0.4 } }}>
			<motion.div data-case="grandchild" variants={{ hidden: { x: 30 } }} />
		</motion.div>
	</motion.div>
	<motion.div initial="hidden" variants={dynamic} custom={0}>
		<motion.div data-case="custom-one" variants={dynamic} custom={1} />
		<motion.div data-case="custom-two" variants={dynamic} custom={2} />
	</motion.div>
{:else if mode === 'style'}
	<motion.div
		data-case="style"
		style={{
			x: replace ? x : 0,
			y: replace ? 0 : y,
			z: replace ? 0 : z,
			backgroundColor: scalarColor ? '#000' : color
		}}
	/>
{:else if mode === 'ssr'}
	<motion.div data-case="html" initial={{ x: 100 }} animate={{ x: 50 }} style={{ y: borrowedY }} />
	<Custom data-case="custom" initial={{ x: 100 }} animate={{ x: 50 }} style={{ y: borrowedY }} />
	<motion.div data-case="endpoint" initial={false} animate={{ x: [0, 100] }} style={{ x: 200 }} />
{:else if mode === 'tap'}
	<motion.div data-case="tap" onTap={() => {}} tabindex={explicitTabindex ? 2 : undefined} />
	<motion.div
		data-case="tap-start"
		onTapStart={() => {}}
		tabindex={explicitTabindex ? 2 : undefined}
	/>
	<motion.div
		data-case="while-tap"
		whileTap={{ scale: 2 }}
		tabindex={explicitTabindex ? 2 : undefined}
	/>
{:else if mode === 'reorder'}
	<Reorder.Group values={[1]} onReorder={() => {}} data-case="default-group">
		<Reorder.Item value={1} data-case="default-item" />
	</Reorder.Group>
	<Reorder.Group as="div" values={[1]} onReorder={() => {}} data-case="custom-group">
		<Reorder.Item as="div" value={1} dragListener={false} data-case="custom-item" />
	</Reorder.Group>
{:else if mode === 'will-change'}
	<motion.div data-case="automatic" initial={{ x: 100 }} animate={{ x: 200 }} />
	<motion.div data-case="borrowed" style={{ opacity }} />
	<motion.div data-case="empty" />
	<motion.div
		data-case="string"
		initial={{ x: 100 }}
		animate={{ x: 200 }}
		style={{ willChange: 'opacity' }}
	/>
	<motion.div data-case="string-static" style={{ willChange: 'opacity' }} />
	<motion.div data-case="value" initial={{ x: 100 }} animate={{ x: 200 }} style={{ willChange }} />
	<motion.div data-case="value-static" style={{ willChange }} />
{/if}
