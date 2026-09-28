<script lang="ts">
	import { untrack } from 'svelte';
	import type { MotionValue } from 'motion-dom';
	import {
		useMotionValue,
		useMotionTemplate,
		useMotionValueEvent,
		useTransform,
		useSpring,
		useVelocity,
		type UseSpringOptions
	} from '../motion/value-hooks.svelte.js';
	import {
		useAnimationFrame,
		useTime,
		usePageInView,
		useReducedMotion,
		useInView
	} from '../motion/helper-hooks.svelte.js';
	import { useScroll } from '../motion/scroll-hooks.svelte.js';
	import { useAnimate } from '../motion/use-animate.svelte.js';
	import { useAnimateMini } from '../motion/use-animate-mini.svelte.js';
	import { motionStore } from '../motion/values.js';
	import { provideActivityState } from '../motion/activity-scope.js';
	import * as motion from '../motion/elements/index.js';

	let {
		source,
		onCreate
	}: {
		source?: MotionValue<number>;
		onCreate?: (api: ReturnType<typeof getApi>) => void;
	} = $props();
	let visible = $state(true);
	provideActivityState(() => visible);
	const owned = useMotionValue(2);
	const alternate = useMotionValue(10);
	let selected = $state.raw(untrack(() => source ?? owned));
	let factor = $state(3);
	let chooseAlternate = $state(false);
	let clamp = $state(true);
	let maximum = $state(10);
	let suffix = $state('px');
	let enabled = $state(true);
	let trackContentSize = $state(false);
	let showScroller = $state(true);
	let springOptions = $state<UseSpringOptions>({ stiffness: 300, damping: 30 });
	let scroller = $state<HTMLDivElement>();
	let target = $state<HTMLDivElement>();
	let offset = $state<number[] | undefined>();
	let reduce = $state<'always' | 'never'>('never');
	const changes: number[] = [];
	const frames: [number, number][] = [];
	useMotionValueEvent(
		() => selected,
		'change',
		(latest) => changes.push(latest)
	);
	const derived = useTransform(() => selected.get() * factor);
	const conditional = useTransform(() => (chooseAlternate ? alternate.get() : selected.get()));
	const tuple = useTransform([owned, alternate] as const, ([a, b]) => a + b);
	const mapped = useTransform(
		() => selected,
		() => [0, maximum],
		[0, 1],
		() => ({ clamp })
	);
	const multiple = useTransform(owned, [0, 10], { opacity: [0, 1], color: ['#000', '#fff'] });
	const template = useMotionTemplate`translate(${derived}${() => suffix}) ${0}`;
	const smooth = useSpring(
		() => selected,
		() => springOptions
	);
	const directSpring = useSpring(0);
	const units = useMotionValue('10px');
	const unitSpring = useSpring(units, { skipInitialAnimation: true, stiffness: 500, damping: 50 });
	const velocity = useVelocity(() => selected);
	const acceleration = useVelocity(velocity);
	const time = useTime();
	const page = usePageInView();
	const reduced = useReducedMotion();
	useAnimationFrame(
		(elapsed, delta) => frames.push([elapsed, delta]),
		() => ({ enabled: enabled && page.current })
	);
	useAnimationFrame(undefined);
	const scroll = useScroll(() => ({ container: () => scroller, offset, trackContentSize }));
	const inView = useInView(() => target, { root: () => scroller, initial: true });
	const [scope, animate] = useAnimate<HTMLDivElement>(() => ({ reducedMotion: reduce }));
	const [miniScope, animateMini] = useAnimateMini<HTMLDivElement>();
	const text = motionStore(template);
	function attachScroller(node: HTMLDivElement) {
		scroller = node;
		return () => {
			scroller = undefined;
		};
	}
	function attachTarget(node: HTMLDivElement) {
		target = node;
		return () => {
			target = undefined;
		};
	}

	export function getApi() {
		return {
			owned,
			alternate,
			derived,
			conditional,
			tuple,
			mapped,
			multiple,
			template,
			smooth,
			directSpring,
			units,
			unitSpring,
			velocity,
			acceleration,
			time,
			page,
			reduced,
			inView,
			scroll,
			scope,
			animate,
			miniScope,
			animateMini,
			frames,
			changes,
			get scroller() {
				return scroller;
			},
			get target() {
				return target;
			}
		};
	}
	export function select(value: MotionValue<number>) {
		selected = value;
	}
	export function configure(options: {
		factor?: number;
		alternate?: boolean;
		clamp?: boolean;
		maximum?: number;
		suffix?: string;
		enabled?: boolean;
		visible?: boolean;
		trackContentSize?: boolean;
		showScroller?: boolean;
		spring?: UseSpringOptions;
		offset?: number[];
		reduce?: 'always' | 'never';
	}) {
		if (options.factor !== undefined) factor = options.factor;
		if (options.alternate !== undefined) chooseAlternate = options.alternate;
		if (options.clamp !== undefined) clamp = options.clamp;
		if (options.maximum !== undefined) maximum = options.maximum;
		if (options.suffix !== undefined) suffix = options.suffix;
		if (options.enabled !== undefined) enabled = options.enabled;
		if (options.visible !== undefined) visible = options.visible;
		if (options.trackContentSize !== undefined) trackContentSize = options.trackContentSize;
		if (options.showScroller !== undefined) showScroller = options.showScroller;
		if (options.spring !== undefined) springOptions = options.spring;
		if (options.offset !== undefined) offset = options.offset;
		if (options.reduce !== undefined) reduce = options.reduce;
	}
	untrack(() => onCreate?.(getApi()));
</script>

<div {@attach scope.attach} data-testid="parity-scope">
	<div class="subject" style="width:20px;height:20px;opacity:1">Subject</div>
	<motion.div class="motion-subject" style={{ x: derived, width: 20, height: 20 }}>Value</motion.div
	>
	<svg width="40" height="40" aria-label="Animated circle"><circle cx="20" cy="20" r="10" /></svg>
</div>
<div {@attach miniScope.attach}>
	<div class="mini-subject" style="opacity:1">Mini subject</div>
	<svg width="40" height="40" aria-label="Mini animated circle"
		><circle cx="20" cy="20" r="10" /></svg
	>
</div>
<motion.div class="scroll-linked" style={{ opacity: scroll.scrollYProgress }}
	>Scroll linked</motion.div
>
{#if showScroller}
	<div
		{@attach attachScroller}
		data-testid="parity-scroll"
		style="width:100px;height:100px;overflow:scroll;position:relative"
	>
		<div {@attach attachTarget} style="width:500px;height:500px">Scroll content</div>
	</div>
{/if}
<output data-testid="parity-template">{$text}</output>
<output data-testid="parity-ssr"
	>{`${time.get()}/${page.current}/${reduced.current}/${scroll.scrollY.get()}`}</output
>
