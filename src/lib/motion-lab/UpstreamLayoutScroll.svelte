<!-- Adapted from Motion v13.4.4; see tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { motion, useScroll } from '../motion/index.js';

	let {
		mode,
		report = () => {}
	}: {
		mode: 'position' | 'size' | 'enter' | 'cross';
		report?: (event: string) => void;
	} = $props();
	let expanded = $state(false);
	let container = $state<HTMLDivElement>();
	let target = $state<HTMLDivElement>();
	const scroll = useScroll(() => ({
		container: () => container,
		target: () => target,
		offset: mode === 'enter' ? ['start end', 'end end'] : ['start end', 'end start']
	}));

	function attachContainer(element: HTMLDivElement) {
		container = element;
		return () => {
			container = undefined;
		};
	}
	function attachTarget(element: HTMLDivElement) {
		target = element;
		return () => {
			target = undefined;
		};
	}

	export function expand() {
		expanded = true;
	}
	export function readScroll() {
		return { position: scroll.scrollY.get(), progress: scroll.scrollYProgress.get() };
	}
</script>

{#if mode === 'position' || mode === 'size'}
	<div style="position: relative; width: 600px; height: 500px;">
		<motion.div
			data-testid="layout-box"
			layout={mode}
			style={{
				position: 'absolute',
				left: expanded ? 200 : 0,
				top: expanded ? 100 : 0,
				width: expanded ? 300 : 100,
				height: expanded ? 300 : 200
			}}
			transition={{ duration: 0.4, ease: (progress) => (progress < 1 ? 0.5 : 1) }}
			onLayoutAnimationStart={() => report('start')}
			onLayoutAnimationComplete={() => report('complete')}
		/>
	</div>
{:else}
	<div
		data-testid="scroll-container"
		{@attach attachContainer}
		style="position: relative; width: 200px; height: 100px; overflow: auto;"
	>
		<div style="height: 200px;"></div>
		<div data-testid="scroll-target" {@attach attachTarget} style="height: 200px;"></div>
		<div style="height: 600px;"></div>
	</div>
{/if}
