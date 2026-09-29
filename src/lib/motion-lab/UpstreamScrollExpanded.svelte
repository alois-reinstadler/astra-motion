<!-- Motion 13.4.4 @ 33f6e72; source mappings and MIT attribution: tests/motion-baseline. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import {
		motion,
		useScroll,
		useTransform,
		createScroll,
		useMotionValueEvent,
		type UseScrollOptions
	} from '../motion/index.js';
	let {
		mode = 'container',
		offset,
		delay = 0,
		ease,
		initialScroll = 0,
		targetTop = 400,
		targetHeight = 200,
		contentHeight = 1800,
		contentWidth = 1800
	}: {
		mode?: string;
		offset?: UseScrollOptions['offset'];
		delay?: number;
		ease?: 'linear' | 'easeOut';
		initialScroll?: number;
		targetTop?: number;
		targetHeight?: number;
		contentHeight?: number;
		contentWidth?: number;
	} = $props();
	let outer = $state<HTMLElement>();
	let svgRoot = $state<SVGSVGElement>();
	let shownProgress = $state(0);
	let container = $state<HTMLDivElement>();
	let target = $state<HTMLElement | SVGElement>();
	let second = $state<HTMLElement>();
	let third = $state<HTMLElement>();
	let shown = $state(false);
	let generation = $state(0);
	let height = $state(untrack(() => contentHeight));
	const documentMode = $derived(
		[
			'document',
			'target',
			'native',
			'nested-native',
			'svg',
			'svg-root',
			'late',
			'parallax'
		].includes(mode)
	);
	const targeted = $derived(
		['target', 'native', 'nested-native', 'svg', 'svg-root', 'late', 'parallax'].includes(mode)
	);
	const options = () => ({
		container: documentMode ? undefined : () => container,
		target: targeted ? () => (mode === 'svg-root' ? svgRoot : target) : undefined,
		offset,
		trackContentSize: true
	});
	const values = useScroll(options);
	const outerValues = useScroll(() => ({
		target: () => outer,
		offset: ['start end', 'start 0.3']
	}));
	const outerScale = useTransform(outerValues.scrollYProgress, [0, 1], [0.95, 1]);
	const outerClip = useTransform(
		outerValues.scrollYProgress,
		[0, 1],
		['inset(8% 12% round 24px)', 'inset(0% 0% round 0px)']
	);
	const opacity = useTransform(values.scrollYProgress, [0, 1], [0, 1]);
	useMotionValueEvent(opacity, 'change', (value) => (shownProgress = value));
	const color = useTransform(values.scrollYProgress, [0, 1], ['rgb(0, 0, 0)', 'rgb(200, 100, 0)']);
	const x = useTransform(values.scrollYProgress, [0, 1], [0, 100]);
	const secondValues = useScroll(() => ({
		target: () => second,
		offset: ['start end', 'end start']
	}));
	const thirdValues = useScroll(() => ({
		target: () => third,
		offset: ['start end', 'end start']
	}));
	const secondY = useTransform(secondValues.scrollYProgress, [0, 1], [0, -200]);
	const thirdY = useTransform(thirdValues.scrollYProgress, [0, 1], [0, -200]);
	const link = createScroll(() => ({ container: documentMode ? undefined : container, offset }));
	export function read() {
		return {
			x: values.scrollX.get(),
			y: values.scrollY.get(),
			px: values.scrollXProgress.get(),
			py: values.scrollYProgress.get(),
			second: secondValues.scrollYProgress.get(),
			third: thirdValues.scrollYProgress.get()
		};
	}
	export function grow() {
		height = 2800;
	}
	export function reveal() {
		shown = true;
	}
	export function replace() {
		generation++;
	}
	function initialize(node: HTMLDivElement) {
		node.scrollTop = initialScroll;
	}
	function attachContainer(element: HTMLDivElement) {
		container = element;
		return () => {
			container = undefined;
		};
	}
	function attachTarget(element: HTMLElement | SVGElement) {
		target = element;
		return () => {
			target = undefined;
		};
	}
	function attachSecond(element: HTMLElement) {
		second = element;
		return () => {
			second = undefined;
		};
	}
	function attachThird(element: HTMLElement) {
		third = element;
		return () => {
			third = undefined;
		};
	}
	function attachSvgroot(element: SVGSVGElement) {
		svgRoot = element;
		return () => {
			svgRoot = undefined;
		};
	}
	function attachOuter(element: HTMLElement) {
		outer = element;
		return () => {
			outer = undefined;
		};
	}
</script>

{#snippet content()}
	<div style={`position:relative;height:${height}px;width:${contentWidth}px;`}>
		{#if mode === 'svg' || mode === 'svg-root'}
			<svg
				{@attach attachSvgroot}
				data-testid="svg"
				style="position:absolute;top:400px;left:0;"
				width="200"
				height="400"
				viewBox="0 0 200 400"
			>
				<rect
					{@attach attachTarget}
					data-testid="target"
					x="0"
					y="100"
					width="100"
					height="100"
					fill="teal"
				/>
			</svg>
		{:else if mode === 'late'}
			{#if shown}{#key generation}<div
						{@attach attachTarget}
						data-testid="target"
						style={`position:absolute;top:${generation ? 900 : 600}px;height:200px;width:100px;`}
					></div>{/key}{/if}
		{:else if mode === 'nested-native'}
			<div
				{@attach attachOuter}
				data-testid="outer-target"
				style={`position:absolute;top:${targetTop}px;width:300px;`}
			>
				<motion.div
					data-testid="outer-transform"
					style={{ scale: outerScale, clipPath: outerClip }}
				>
					<section>
						<div
							{@attach attachTarget}
							data-testid="target"
							style={`position:relative;height:${targetHeight}px;`}
						>
							<div style="position:sticky;top:0;height:50%;">
								<motion.div
									data-testid="native"
									style={{ opacity, width: 40, height: 40, backgroundColor: 'teal' }}
								/>
							</div>
						</div>
					</section>
				</motion.div>
			</div>
		{:else}
			<div style={`transform:${mode === 'native' ? 'translateX(10px)' : 'none'};`}>
				<div
					{@attach attachTarget}
					data-testid="target"
					style={`position:absolute;top:${targetTop}px;height:${targetHeight}px;width:100px;`}
				>
					<motion.div
						data-testid="native"
						style={{ opacity, width: 40, height: 40, backgroundColor: 'teal' }}
					/>
				</div>
			</div>
		{/if}
		{#if mode === 'parallax'}
			<div
				{@attach attachSecond}
				data-testid="second-target"
				style="position:absolute;top:700px;height:300px;width:100px;"
			>
				<motion.div data-testid="second" style={{ y: secondY, width: 20, height: 20 }} />
			</div>
			<div
				{@attach attachThird}
				data-testid="third-target"
				style="position:absolute;top:1000px;height:400px;width:100px;"
			>
				<motion.div data-testid="third" style={{ y: thirdY, width: 20, height: 20 }} />
			</div>
		{/if}
		<motion.div
			data-testid="values"
			style={{
				position: 'absolute',
				top: 0,
				width: 30,
				height: 30,
				opacity,
				x,
				color,
				backgroundColor: color
			}}
		/>
		<output data-testid="progress">{shownProgress}</output>
		<div
			data-testid="linked"
			style="position:absolute;top:50px;width:20px;height:20px;background:teal;"
			{@attach link.animate({ x: [0, 100] }, { duration: 1, delay, ...(ease ? { ease } : {}) })}
		></div>
		{#each [0, 0.2, 0.4] as itemDelay (itemDelay)}
			<div
				data-delay={itemDelay}
				style="position:absolute;top:80px;width:20px;height:20px;"
				{@attach link.animate({ x: [0, 100] }, { duration: 1, delay: itemDelay, ease: 'linear' })}
			></div>
		{/each}
	</div>
{/snippet}
{#if documentMode}
	<div style="position:absolute;left:0;top:0;">{@render content()}</div>
{:else}
	<div
		{@attach attachContainer}
		data-testid="container"
		{@attach initialize}
		style="position:relative;width:200px;height:200px;overflow:auto;"
	>
		{@render content()}
	</div>
{/if}
