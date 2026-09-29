<script lang="ts">
	// Motion v13.4.4 (33f6e72); source mapping/MIT: tests/motion-baseline.
	import {
		motion,
		useMotionValue,
		useMotionTemplate,
		useMotionValueEvent,
		useTransform,
		useSpring,
		useAnimationFrame
	} from '../motion/index.js';
	let { mode = 'template' }: { mode?: string } = $props();
	const first = useMotionValue(1),
		second = useMotionValue(2);
	let replacement = $state(false);
	const template = useMotionTemplate`translateX(${() => (replacement ? second : first)}px)`;
	const percent = useSpring('0%', { stiffness: 300, damping: 30 });
	const source = useMotionValue(0);
	const spring = useSpring(source, { stiffness: 500, damping: 40 });
	const events: string[] = [];
	useMotionValueEvent(spring, 'animationStart', () => events.push('start'));
	useMotionValueEvent(spring, 'animationComplete', () => events.push('complete'));
	const x = useMotionValue(0),
		y = useMotionValue(0);
	const sum = useTransform(() => x.get() + y.get());
	const logicalSource = useMotionValue(25);
	const logical = useTransform(logicalSource, [0, 100], [0, 100]);
	const progress = useMotionValue(50);
	let maximum = $state(100);
	let clamp = $state(true);
	const outputs = useTransform(
		progress,
		() => [0, maximum],
		{
			backgroundColor: ['#ff0000', '#0000ff'],
			filter: ['blur(10px)', 'blur(0px)'],
			scale: [0.5, 1],
			opacity: [0.5, 1]
		},
		() => ({ clamp })
	);
	let increment = $state(1);
	let enabled = $state(true);
	const frames: { time: number; value: number }[] = [];
	useAnimationFrame(
		(time) => frames.push({ time, value: (frames.at(-1)?.value ?? 0) + increment }),
		() => ({ enabled: mode === 'frame' && enabled })
	);
	export function values() {
		return {
			first,
			second,
			template,
			percent,
			source,
			spring,
			events,
			x,
			y,
			sum,
			logicalSource,
			progress,
			outputs,
			frames
		};
	}
	export function configure(options: {
		replacement?: boolean;
		maximum?: number;
		clamp?: boolean;
		increment?: number;
		enabled?: boolean;
	}) {
		if (options.replacement !== undefined) replacement = options.replacement;
		if (options.maximum !== undefined) maximum = options.maximum;
		if (options.clamp !== undefined) clamp = options.clamp;
		if (options.increment !== undefined) increment = options.increment;
		if (options.enabled !== undefined) enabled = options.enabled;
	}
</script>

{#if mode === 'template'}
	<motion.div data-case="template" style={{ transform: template }} />
{:else if mode === 'scalar'}
	<motion.div data-case="scalar" style={{ x: percent }} />
{:else if mode === 'spring'}
	<motion.div data-case="spring" style={{ x: spring }} />
{:else if mode === 'sum'}
	<motion.div data-case="sum" style={{ x, y, z: sum }} />
{:else if mode === 'logical'}
	<motion.div
		data-case="logical"
		style={{
			paddingBlock: logical,
			paddingInline: logical,
			marginBlock: logical,
			inset: logical,
			insetBlock: logical,
			insetInline: logical
		}}
	/>
{:else if mode === 'map'}
	<motion.div data-case="map" style={outputs} />
{/if}
