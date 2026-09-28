<script lang="ts">
	import {
		MotionConfig,
		motion,
		transformViewBoxPoint,
		useDragControls,
		useMotionValue,
		type DragConstraints
	} from '../motion/index.js';

	type Mode = 'tap' | 'nested' | 'measure' | 'snap' | 'viewport' | 'svg';
	let {
		mode,
		propagate = false,
		outerAxis = 'x',
		once = false,
		replaceBounds = true,
		report = () => {}
	}: {
		mode: Mode;
		propagate?: boolean;
		outerAxis?: 'x' | 'y';
		once?: boolean;
		replaceBounds?: boolean;
		report?: (name: string, data?: unknown) => void;
	} = $props();
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const outerX = useMotionValue(0);
	const outerY = useMotionValue(0);
	const controls = useDragControls();
	let globalTap = $state(true);
	let callbackLabel = $state('initial');
	let bounds = $state<HTMLDivElement>();
	let snapWidth = $state(60);
	let firstRoot = $state<HTMLDivElement>();
	let secondRoot = $state<HTMLDivElement>();
	let useSecondRoot = $state(false);
	let svg = $state<SVGSVGElement>();
	const svgPoint = transformViewBoxPoint(() => svg);
	const root = () => (useSecondRoot ? secondRoot : firstRoot);

	export function configureTap(global: boolean, label = callbackLabel) {
		globalTap = global;
		callbackLabel = label;
	}
	export function resizeSnap(width: number) {
		snapWidth = width;
	}
	export function startSnap(event: PointerEvent) {
		controls.start(event, { snapToCursor: true, distanceThreshold: 10 });
	}
	export function stopDrag() {
		controls.stop();
	}
	export function configureViewport(second: boolean, nextOnce = once) {
		useSecondRoot = second;
		once = nextOnce;
	}
	export function inspect() {
		return { x: x.get(), y: y.get(), outerX: outerX.get(), outerY: outerY.get() };
	}
	function measured(value: DragConstraints) {
		report('measure', { ...value });
		if (replaceBounds) return { left: -20, right: 35, top: 0, bottom: 0 };
	}
	function attachBounds(element: HTMLDivElement) {
		bounds = element;
		return () => {
			bounds = undefined;
		};
	}

	function attachFirstRoot(element: HTMLDivElement) {
		firstRoot = element;
		return () => {
			firstRoot = undefined;
		};
	}

	function attachSecondRoot(element: HTMLDivElement) {
		secondRoot = element;
		return () => {
			secondRoot = undefined;
		};
	}

	function attachSvg(element: SVGSVGElement) {
		svg = element;
		return () => {
			svg = undefined;
		};
	}
</script>

{#if mode === 'tap'}
	<button type="button" data-contract-outside>Outside target</button>
	<motion.div
		data-contract-tap
		globalTapTarget={globalTap}
		whileTap={{ opacity: 0.5 }}
		transition={{ duration: 0 }}
		onTapStart={(_, info) => report(`${callbackLabel}:start`, info)}
		onTap={(_, info) => report(`${callbackLabel}:tap`, info)}
		onTapCancel={(_, info) => report(`${callbackLabel}:cancel`, info)}
		style="width:60px;height:40px;background:teal;"
	/>
{:else if mode === 'nested'}
	<motion.div
		data-contract-outer
		drag={outerAxis}
		dragMomentum={false}
		onDragStart={() => report('outer:start')}
		onDragEnd={() => report('outer:end')}
		style={{ x: outerX, y: outerY, width: 150, height: 120, backgroundColor: 'silver' }}
	>
		<motion.div
			data-contract-inner
			drag="x"
			dragPropagation={propagate}
			dragMomentum={false}
			onDragStart={() => report('inner:start')}
			onDragEnd={() => report('inner:end')}
			style={{ x, y, width: 50, height: 40, backgroundColor: 'teal' }}
		/>
	</motion.div>
{:else if mode === 'measure'}
	<div
		{@attach attachBounds}
		data-contract-bounds
		style="position:fixed;left:40px;top:40px;width:240px;height:100px;"
	>
		<motion.div
			data-contract-measured
			drag
			dragConstraints={() => bounds}
			dragElastic={false}
			dragMomentum={false}
			onMeasureDragConstraints={measured}
			onDrag={() => report('move', { x: x.get(), y: y.get() })}
			style={{ x, y, width: 40, height: 40, backgroundColor: 'teal' }}
		/>
	</div>
{:else if mode === 'snap'}
	<button type="button" data-contract-handle>External handle</button>
	<motion.div
		data-contract-snap
		drag
		dragListener={false}
		dragControls={controls}
		dragMomentum={false}
		onDragStart={() => report('start')}
		onDragEnd={() => report('end')}
		style={{
			x,
			y,
			position: 'fixed',
			left: 100,
			top: 70,
			width: snapWidth,
			height: 40,
			backgroundColor: 'teal'
		}}
	/>
{:else if mode === 'viewport'}
	<div
		{@attach attachFirstRoot}
		data-contract-first-root
		style="position:fixed;left:20px;top:20px;width:160px;height:100px;overflow:auto;"
	>
		<div style="height:400px;">
			<motion.div
				data-contract-viewport
				animate={{ opacity: 0.25 }}
				whileInView={{ opacity: 1 }}
				viewport={{ root, once, amount: 'all', margin: '0px' }}
				transition={{ duration: 0 }}
				onViewportEnter={(entry) => report('enter', entry)}
				onViewportLeave={(entry) => report('leave', entry)}
				style="width:40px;height:40px;background:teal;"
			/>
		</div>
	</div>
	<div
		{@attach attachSecondRoot}
		data-contract-second-root
		style="position:fixed;left:220px;top:20px;width:160px;height:100px;overflow:auto;"
	>
		<div style="height:400px;"></div>
	</div>
{:else}
	<MotionConfig transformPagePoint={svgPoint}>
		<svg
			{@attach attachSvg}
			data-contract-svg
			width="400"
			height="300"
			viewBox="40 20 200 100"
			style="position:fixed;left:20px;top:20px;"
		>
			<motion.rect
				data-contract-svg-drag
				x="60"
				y="40"
				width="20"
				height="20"
				fill="teal"
				drag
				dragMomentum={false}
				onDragStart={(event, info) => report('start', { trusted: event.isTrusted, info })}
				onDrag={(event, info) => report('move', { trusted: event.isTrusted, info })}
				onDragEnd={(event, info) => report('end', { trusted: event.isTrusted, info })}
				style={{ x, y, touchAction: 'none' }}
			/>
			<rect data-contract-svg-destination x="120" y="60" width="20" height="20" fill="silver" />
		</svg>
	</MotionConfig>
{/if}
