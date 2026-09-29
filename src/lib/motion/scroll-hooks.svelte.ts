import { onDestroy, untrack } from 'svelte';
import { scroll, type scrollInfo } from 'motion';
import {
	NativeAnimation,
	type AccelerateConfig,
	type AnimationPlaybackControlsWithThen,
	type MotionValue
} from 'motion-dom';
import { readActivityState } from './activity-scope.js';
import { readMotionElement, type MotionElementSource } from './helper-hooks.svelte.js';
import { readMotionGetter, useMotionValue, type MotionGetter } from './value-hooks.svelte.js';

type EngineScrollOptions = NonNullable<Parameters<typeof scrollInfo>[1]>;
type ScrollInfo = Parameters<Parameters<typeof scrollInfo>[0]>[0];
type TimelineOptions = Parameters<AnimationPlaybackControlsWithThen['attachTimeline']>[0];
export interface UseScrollOptions extends Omit<EngineScrollOptions, 'container' | 'target'> {
	container?: MotionElementSource;
	target?: MotionElementSource;
}
export interface ScrollMotionValues {
	scrollX: MotionValue<number>;
	scrollY: MotionValue<number>;
	scrollXProgress: MotionValue<number>;
	scrollYProgress: MotionValue<number>;
}

/** Native ViewTimeline ranges matching Motion's documented edge presets. */
function viewRange(offset: EngineScrollOptions['offset']) {
	if (!offset) return { rangeStart: 'contain 0%', rangeEnd: 'contain 100%' };
	const edges = { start: 0, end: 1 };
	const pairs = offset.map((entry) => {
		if (Array.isArray(entry)) return entry.join(' ');
		if (typeof entry !== 'string') return '';
		return entry
			.trim()
			.split(/\s+/)
			.map((edge) => edges[edge as keyof typeof edges] ?? edge)
			.join(' ');
	});
	// Crossing ranges preserve the specified edges even for targets larger than
	// the viewport: https://www.w3.org/TR/scroll-animations-1/#view-timelines-ranges
	// The descending Any preset ('1 0,0 1') cannot use forward cover progress;
	// leave it to the MotionValue observer, as with other unmatched offsets.
	const name: Record<string, string> = {
		'0 1,1 1': 'entry-crossing',
		'0 0,1 0': 'exit-crossing',
		'0 0,1 1': 'contain'
	};
	const range = name[pairs.join(',')];
	return range ? { rangeStart: `${range} 0%`, rangeEnd: `${range} 100%` } : undefined;
}

/** Track both scroll axes without retaining the engine's global timeline cache. */
export function useScroll(input: MotionGetter<UseScrollOptions> = {}): ScrollMotionValues {
	const active = readActivityState();
	const values = {
		scrollX: useMotionValue(0),
		scrollY: useMotionValue(0),
		scrollXProgress: useMotionValue(0),
		scrollYProgress: useMotionValue(0)
	};
	let timelines: (() => void)[] = [];
	let destroyed = false;
	const settings = () => {
		const { container, target, ...options } = readMotionGetter(input);
		const containerElement = container === undefined ? undefined : readMotionElement(container);
		const targetElement = target === undefined ? undefined : readMotionElement(target);
		return {
			options: {
				...options,
				container: containerElement ?? undefined,
				target: targetElement ?? undefined
			},
			ready:
				(container === undefined || !!containerElement) && (target === undefined || !!targetElement)
		};
	};
	function observeScroll() {
		if (!active()) return;
		const { options, ready } = settings();
		if (!ready) return;
		return scroll((_progress: number, { x, y }: ScrollInfo) => {
			values.scrollX.set(x.current);
			values.scrollXProgress.set(x.progress);
			values.scrollY.set(y.current);
			values.scrollYProgress.set(y.progress);
		}, options);
	}
	$effect(observeScroll);

	for (const axis of ['x', 'y'] as const) {
		const progress = axis === 'x' ? values.scrollXProgress : values.scrollYProgress;
		const accelerate: AccelerateConfig = {
			times: [0, 1],
			keyframes: [0, 1],
			duration: 1,
			ease: (value) => value,
			factory(animation) {
				if (destroyed) return () => {};
				// VisualElement creates one NativeAnimation for this value binding. Reuse
				// it across reactive options without calling the engine's terminal stop().
				const native =
					animation instanceof NativeAnimation
						? (animation as unknown as { animation: Animation }).animation
						: undefined;
				const duration = animation.iterationDuration;
				const freeze = () => {
					if (native) {
						native.timeline = document.timeline;
						native.effect?.updateTiming({ duration: duration * 1000 });
						const range = native as Animation & { rangeStart: string; rangeEnd: string };
						range.rangeStart = 'normal';
						range.rangeEnd = 'normal';
					}
					animation.pause();
					animation.time = duration * progress.get();
				};
				untrack(freeze);
				const dispose = $effect.root(() => {
					function attachTimeline() {
						if (!active()) return;
						const { options, ready } = settings();
						if (!ready) return;
						return untrack(() => {
							let timeline: TimelineOptions['timeline'];
							let range: ReturnType<typeof viewRange>;
							const browser = window as typeof window & {
								ViewTimeline?: new (options: {
									subject: Element;
									axis: string;
								}) => NonNullable<TimelineOptions['timeline']>;
							};
							if (options.target && browser.ViewTimeline && !options.container) {
								range = viewRange(options.offset);
								if (range)
									timeline = new browser.ViewTimeline({
										subject: options.target,
										axis
									}) as TimelineOptions['timeline'];
							} else if (!options.target && !options.offset && browser.ScrollTimeline) {
								timeline = new browser.ScrollTimeline({
									source: options.container ?? document.scrollingElement!,
									axis
								}) as TimelineOptions['timeline'];
							}
							const detach = animation.attachTimeline({
								timeline,
								...(timeline && range ? range : {}),
								observe(valueAnimation) {
									valueAnimation.pause();
									const seek = (latest: number) => {
										valueAnimation.time = duration * latest;
									};
									seek(progress.get());
									return progress.on('change', seek);
								}
							});
							if (timeline) animation.play();
							return () => {
								detach();
								freeze();
							};
						});
					}
					$effect(attachTimeline);
				});
				const cleanup = () => {
					dispose();
					timelines = timelines.filter((entry) => entry !== cleanup);
				};
				timelines.push(cleanup);
				return cleanup;
			}
		};
		progress.accelerate = accelerate;
	}
	onDestroy(() => {
		destroyed = true;
		for (const cleanup of timelines) cleanup();
	});
	return values;
}
