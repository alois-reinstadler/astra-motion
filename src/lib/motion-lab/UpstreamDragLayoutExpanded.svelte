<!-- Motion 13.4.4 @ 33f6e72; attribution: tests/motion-baseline. -->
<script lang="ts">
	import {
		motion,
		AnimatePresence,
		correctParentTransform,
		transformViewBoxPoint,
		useMotionValue,
		type GestureOptions
	} from '../motion/index.js';
	import Child from './UpstreamDragExpandedChild.svelte';
	let {
		mode = 'nested',
		parentLayout = false,
		childLayout = false,
		constrained = false,
		elastic = false,
		opposite = false,
		transform = '',
		axis = true,
		direction = false,
		initialX = 0,
		initialY = 0,
		svgScale = 'normal'
	}: {
		mode?: string;
		parentLayout?: boolean;
		childLayout?: boolean;
		constrained?: boolean;
		elastic?: boolean;
		opposite?: boolean;
		transform?: string;
		axis?: GestureOptions['drag'];
		direction?: boolean;
		initialX?: number | string;
		initialY?: number | string;
		svgScale?: string;
	} = $props();
	let host = $state<HTMLDivElement>();
	let svg = $state<SVGSVGElement>();
	let size = $state(80);
	let revision = $state(0);
	let shown = $state(true);
	let swapped = $state(false);
	const tiles = $derived(swapped ? [1, 0] : [0, 1]);
	const x = useMotionValue(0),
		y = useMotionValue(0),
		parentX = useMotionValue(0),
		parentY = useMotionValue(0);
	export function inspect() {
		return { x: x.get(), y: y.get(), parentX: parentX.get(), parentY: parentY.get(), tiles };
	}
	export function resize() {
		size = 140;
	}
	export function rerender() {
		revision++;
	}
	export function toggle() {
		shown = !shown;
	}
	export function swap() {
		swapped = !swapped;
	}
	function attachHost(element: HTMLDivElement) {
		host = element;
		return () => {
			host = undefined;
		};
	}
	function attachSvg(element: SVGSVGElement) {
		svg = element;
		return () => {
			svg = undefined;
		};
	}
</script>

{#if mode === 'snap-swap'}
	<!-- Upstream React 19 briefly remounts effects during keyed relocation. Svelte keeps
	     keyed nodes mounted; move the same tiles and retain their public MotionValues. -->
	<div data-testid="tiles" style="position:relative;width:200px;height:100px;">
		{#each tiles as tile, index (tile)}
			<motion.div
				data-testid={tile === 0 ? 'target' : 'other-tile'}
				layout
				layoutId={`upstream-drag-snap-${tile}`}
				drag="x"
				dragSnapToOrigin
				dragMomentum={false}
				transition={{ duration: 0.15 }}
				style={{
					x: tile === 0 ? x : parentX,
					position: 'absolute',
					left: index * 100,
					top: 0,
					width: 80,
					height: 80,
					backgroundColor: 'teal'
				}}
			/>
		{/each}
	</div>
{:else if mode === 'snap-presence'}
	<div style="display:flex;position:relative;gap:20px;height:100px;">
		<AnimatePresence mode="popLayout" items={shown ? ['origin'] : []} key={(item) => item}>
			<Child id="target" />
		</AnimatePresence>
	</div>
{:else if mode === 'svg'}
	<svg
		{@attach attachSvg}
		data-testid="svg"
		width="300"
		height="200"
		viewBox={svgScale === 'matching' ? '0 0 300 200' : '0 0 100 100'}
		preserveAspectRatio={svgScale === 'nonuniform' ? 'none' : 'xMidYMid meet'}
	>
		<motion.rect
			data-testid="target"
			x="10"
			y="10"
			width="30"
			height="30"
			fill="teal"
			layout={childLayout}
			drag={axis}
			dragMomentum={false}
			dragElastic={false}
			dragConstraints={constrained ? { left: -5, right: 20, top: -5, bottom: 20 } : undefined}
			transformPagePoint={transformViewBoxPoint(() => svg)}
			style={{ x, y }}
		/>
	</svg>
{:else}
	{#if mode === 'document' || mode === 'window-scroll'}<div style="height:350px;"></div>{/if}
	<div
		{@attach attachHost}
		data-testid="host"
		data-revision={revision}
		style={`position:relative;left:30px;width:400px;height:${mode === 'container-scroll' ? 160 : 320}px;overflow:${mode === 'container-scroll' ? 'auto' : 'visible'};transform:${transform || 'none'};transform-origin:0 0;`}
	>
		<motion.div
			data-testid="parent"
			layout={parentLayout}
			drag={mode === 'nested' ? (opposite ? 'y' : true) : false}
			dragMomentum={false}
			dragConstraints={constrained ? { left: -20, right: 80, top: -20, bottom: 80 } : undefined}
			dragElastic={elastic ? 0.5 : false}
			style={{
				x: parentX,
				y: parentY,
				position: 'relative',
				width: 300,
				height: mode === 'container-scroll' ? 900 : 260,
				padding: 20
			}}
		>
			<motion.div
				data-testid="target"
				layout={childLayout}
				initial={{ x: initialX, y: initialY }}
				drag={opposite ? 'x' : axis}
				dragMomentum={false}
				dragSnapToOrigin={false}
				dragDirectionLock={direction}
				dragElastic={elastic ? 0.5 : false}
				dragConstraints={mode === 'resize' || mode === 'document' || mode === 'rerender'
					? () => host
					: constrained
						? { left: -20, right: 60, top: -20, bottom: 60 }
						: undefined}
				transformPagePoint={transform ? correctParentTransform(() => host) : undefined}
				style={{ x, y, position: 'relative', width: size, height: size, backgroundColor: 'teal' }}
			>
				<span data-testid="descendant" style="display:block;width:10px;height:10px;">A</span>
			</motion.div>
			<motion.div
				data-testid="sibling"
				layout={childLayout}
				drag="x"
				dragMomentum={false}
				style={{ width: 40, height: 40 }}
			/>
		</motion.div>
	</div>
	{#if mode === 'document' || mode === 'window-scroll'}<div style="height:2000px;"></div>{/if}
{/if}
