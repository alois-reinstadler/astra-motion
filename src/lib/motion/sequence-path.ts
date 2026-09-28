import {
	AsyncMotionValueAnimation,
	GroupAnimation,
	JSAnimation,
	createGeneratorEasing,
	isGenerator,
	isMotionValue,
	motionValue,
	resolveElements,
	spring,
	type AnimationPlaybackControlsWithThen,
	type AnimationGeneratorType,
	type AnimationScope,
	type MotionPath,
	type TargetAndTransition,
	type Transition,
	type VisualElement
} from 'motion-dom';
import { ownMotionPathPlayback } from './animation.js';
import { createScopedAnimate } from 'motion';

type Options = Record<string, unknown>;
type Pose = { x: number; y: number; pathRotation: number };
type Axis = 'x' | 'y';
type Placement = {
	element: HTMLElement | SVGElement;
	target: TargetAndTransition;
	path?: MotionPath;
	start: number;
	duration: number;
	transition: Transition;
	keys: Axis[];
};
type Sampler = { start: number; end: number; sample(time: number): Pose };
type Play = (...args: unknown[]) => AnimationPlaybackControlsWithThen;

/** Matches the public sequence engine's label/relative-time rules (Motion 13.4.4). */
function nextTime(current: number, at: unknown, previous: number, labels: Map<string, number>) {
	if (typeof at === 'number') return at;
	if (typeof at !== 'string') return current;
	if (at.startsWith('-') || at.startsWith('+')) return Math.max(0, current + parseFloat(at));
	if (at === '<') return previous;
	if (at.startsWith('<')) return Math.max(0, previous + parseFloat(at.slice(1)));
	return labels.get(at) ?? current;
}

/** Resolve timing with the same public generator used by the upstream sequence compiler. */
function valueTiming(frames: unknown, options: Options, defaults: Options, index = 0, count = 1) {
	const values = Array.isArray(frames) ? frames : [frames];
	const delay = typeof options.delay === 'function' ? options.delay(index, count) : options.delay;
	const type = (options.type ?? defaults.type ?? 'keyframes') as AnimationGeneratorType;
	let duration = options.duration as number | undefined;
	let ease = options.ease ?? defaults.ease ?? 'easeOut';
	const generator = isGenerator(type) ? type : type === 'spring' ? spring : undefined;
	if (values.length <= 2 && generator) {
		const delta =
			values.length === 2 && values.every((value) => typeof value === 'number')
				? Math.abs(values[1] - values[0])
				: 100;
		const configuration = { ...defaults, ...options };
		delete configuration.delay;
		delete configuration.repeat;
		delete configuration.repeatType;
		delete configuration.repeatDelay;
		delete configuration.times;
		delete configuration.type;
		delete configuration.ease;
		if (duration !== undefined) configuration.duration = duration * 1000;
		const generated = createGeneratorEasing(configuration, delta, generator);
		duration = generated.duration;
		ease = generated.ease;
	}
	duration ??= (defaults.duration as number) || 0.3;
	// Motion's sequence compiler ignores segment repeats >= 20, including Infinity.
	const repeat = typeof options.repeat === 'number' && options.repeat < 20 ? options.repeat : 0;
	const repeatDelay = typeof options.repeatDelay === 'number' ? options.repeatDelay : 0;
	return {
		delay: (delay as number | undefined) ?? 0,
		duration: duration * (repeat + 1) + repeatDelay * repeat,
		transition: {
			...defaults,
			...options,
			type: 'keyframes',
			duration,
			ease,
			delay: 0,
			repeat,
			repeatDelay
		} as Transition
	};
}

function subjects(subject: unknown, scope: AnimationScope<Element | undefined>) {
	if (typeof subject === 'string') return resolveElements(subject, scope);
	if (subject instanceof Element) return [subject];
	if (Array.isArray(subject) || subject instanceof NodeList || subject instanceof HTMLCollection)
		return Array.from(subject);
	return [];
}

function createSampler(placement: Placement, origin: Pose): Sampler {
	const values = new Map(Object.entries(origin).map(([key, value]) => [key, motionValue(value)]));
	const visual = {
		latestValues: origin,
		getValue(key: string, fallback: number = 0) {
			if (!values.has(key)) values.set(key, motionValue(fallback));
			return values.get(key)!;
		}
	} as unknown as VisualElement;
	const target = { ...placement.target };
	const animations: AnimationPlaybackControlsWithThen[] = [];
	const instant = placement.transition.duration === 0;
	const transition = {
		...placement.transition,
		...(instant ? { duration: 1 } : {}),
		autoplay: false
	};
	// Per-value options have already been resolved. The sampler must not merge
	// them again or dispatch application callbacks while its timeline is built.
	for (const key of ['x', 'y', 'default', 'onPlay', 'onUpdate', 'onComplete', 'onStop', 'onCancel'])
		delete (transition as Options)[key];
	placement.path!.animateVisualElement(visual, target, transition, 0, animations);
	if (!animations.every((animation) => animation instanceof JSAnimation))
		throw new Error(
			'Astra useAnimate: sequence paths require the synchronous arc sampling contract.'
		);
	// Sampling never schedules its own frames. The one upstream sequence clock
	// drives exact engine samples; no curve discretization or parallel renderer.
	for (const animation of animations) animation.stop();
	return {
		start: placement.start,
		end: placement.start + placement.duration,
		sample(time) {
			for (const animation of animations)
				(animation as JSAnimation<number>).sample(instant ? 1000 : Math.max(0, time) * 1000);
			return {
				x: values.get('x')!.get(),
				y: values.get('y')!.get(),
				pathRotation: values.get('pathRotation')!.get()
			};
		}
	};
}

function positionTimeline(placements: Placement[], origin: Pose, duration: number) {
	const values = { x: motionValue(origin.x), y: motionValue(origin.y) };
	const sequence: unknown[] = [];
	for (const placement of placements)
		for (const key of placement.keys) {
			const raw = placement.target[key];
			const frames = placement.path && Array.isArray(raw) ? [raw[0], raw.at(-1)] : raw;
			sequence.push([
				values[key],
				frames ?? [null, null],
				{ ...placement.transition, at: placement.start }
			]);
		}
	// The compiler normalizes all offsets against the full original duration,
	// including gaps and longer independent paint/callback segments.
	sequence.push([
		motionValue(0),
		[0, duration],
		{ at: 0, duration, type: 'keyframes', ease: 'linear' }
	]);
	const play = createScopedAnimate() as Play;
	const controls = play(sequence, { autoplay: false });
	const drivers = (['x', 'y'] as const).map((key) => {
		const animation = values[key].animation;
		const driver = animation instanceof AsyncMotionValueAnimation ? animation.animation : animation;
		if (driver && !(driver instanceof JSAnimation))
			throw new Error('Astra useAnimate: expected numeric sequence sampling controls.');
		return [key, driver] as const;
	});
	controls.stop();
	return (time: number): Pose => {
		for (const [, driver] of drivers) driver?.sample(Math.max(0, time) * 1000);
		return { x: values.x.get(), y: values.y.get(), pathRotation: 0 };
	};
}

/**
 * Adapt documented arc segments before delegating the timeline to Motion.
 * Ordinary properties/callbacks remain one upstream sequence. Its own clock
 * supplies global duration, repeat, speed, seek, pause and completion semantics.
 */
export function animateSequencePaths(
	sequence: unknown[],
	options: Options,
	scope: AnimationScope<Element | undefined>,
	play: Play,
	owner: (element: HTMLElement | SVGElement) => VisualElement,
	reduced: boolean
): AnimationPlaybackControlsWithThen | undefined {
	if (
		((options.reduceMotion as boolean | undefined) ?? reduced) ||
		options.skipAnimations ||
		options.duration === 0
	)
		return;
	const defaults = (options.defaultTransition ?? {}) as Options;
	const curved = new Set<HTMLElement | SVGElement>();
	for (const segment of sequence) {
		if (!Array.isArray(segment) || !(segment[2]?.path ?? defaults.path)) continue;
		if (!segment[1] || typeof segment[1] !== 'object' || !('x' in segment[1] || 'y' in segment[1]))
			continue;
		for (const element of subjects(segment[0], scope))
			if (element instanceof HTMLElement || element instanceof SVGElement) curved.add(element);
	}
	if (!curved.size) return;
	const placements: Placement[] = [];
	const rewritten: unknown[] = [];
	const labels = new Map<string, number>();
	let current = 0;
	let previous = 0;
	let duration = 0;
	for (const entry of sequence) {
		if (typeof entry === 'string') {
			labels.set(entry, current);
			continue;
		}
		if (!Array.isArray(entry)) {
			const label = entry as { name: string; at: unknown };
			labels.set(label.name, nextTime(current, label.at, previous, labels));
			continue;
		}
		const [subject, rawFrames, rawOptions] = entry;
		const callback = typeof subject === 'function';
		const frames = callback && entry.length < 3 ? [0, 1] : rawFrames;
		const configuration = ((callback && entry.length === 2 ? rawFrames : rawOptions) ??
			{}) as Options;
		const start = nextTime(current, configuration.at, previous, labels);
		let extent = 0;
		const elements =
			!Array.isArray(frames) && frames && typeof frames === 'object'
				? subjects(subject, scope)
				: [];
		if (!elements.length) {
			const keys =
				callback || isMotionValue(subject) || Array.isArray(frames)
					? { default: frames }
					: (frames as Options);
			for (const [key, values] of Object.entries(keys ?? {})) {
				const timing = valueTiming(
					values,
					{ ...configuration, ...(configuration[key] as object) },
					defaults
				);
				extent = Math.max(extent, timing.delay + timing.duration);
			}
			rewritten.push([subject, frames, { ...configuration, at: start }]);
		} else {
			for (let index = 0; index < elements.length; index++) {
				const element = elements[index];
				const target = { ...(frames as TargetAndTransition) };
				const remaining = { ...target };
				const perElement: Options = { ...configuration, at: start };
				const path = (configuration.path ?? defaults.path) as MotionPath | undefined;
				const handled = curved.has(element as HTMLElement | SVGElement);
				let pathAdded = false;
				for (const [key, values] of Object.entries(target)) {
					const valueOptions = { ...configuration, ...(configuration[key] as object) };
					const positional = key === 'x' || key === 'y';
					if (handled && path && positional && pathAdded) continue;
					const timing = valueTiming(
						handled && path && positional ? [0, 1000] : values,
						handled && path && positional
							? { ...configuration, ...(configuration.x as object) }
							: valueOptions,
						defaults,
						index,
						elements.length
					);
					extent = Math.max(extent, timing.delay + timing.duration);
					if (handled && positional) {
						placements.push({
							element: element as HTMLElement | SVGElement,
							target: path
								? { x: target.x, y: target.y }
								: key === 'x'
									? { x: target.x }
									: { y: target.y },
							path,
							start: start + timing.delay,
							duration: timing.duration,
							transition: timing.transition,
							keys: path ? ['x', 'y'] : [key]
						});
						if (path) {
							delete remaining.x;
							delete remaining.y;
							pathAdded = true;
						} else delete remaining[key];
					} else perElement[key] = { ...valueOptions, delay: timing.delay };
				}
				if (Object.keys(remaining).length) rewritten.push([element, remaining, perElement]);
			}
		}
		previous = start;
		current = start + extent;
		duration = Math.max(duration, current);
	}
	if (duration === 0) return;
	const tracks = [...curved].map((element) => {
		const visual = owner(element);
		const origin: Pose = {
			x: Number(visual.getValue('x', 0).get()),
			y: Number(visual.getValue('y', 0).get()),
			pathRotation: 0
		};
		const steps = placements
			.filter((entry) => entry.element === element)
			.sort((a, b) => a.start - b.start);
		const baseline = positionTimeline(steps, origin, duration);
		const samplers: Sampler[] = [];
		for (let index = 0; index < steps.length; index++) {
			const placement = steps[index];
			if (!placement.path) continue;
			const preceding = samplers.findLast(
				(entry) => placement.start >= entry.start && placement.start <= entry.end
			);
			const origin = preceding
				? preceding.sample(placement.start - preceding.start)
				: baseline(placement.start);
			const sampler = createSampler(placement, origin);
			// A later positional segment replaces this arc. Subsequent coordinates
			// follow the source-compiled timeline, including preserved old endpoints.
			sampler.end = Math.min(sampler.end, steps[index + 1]?.start ?? Infinity);
			samplers.push(sampler);
		}
		for (const key of ['x', 'y']) visual.getValue(key, 0).stop();
		return { visual, baseline, samplers };
	});
	// One clock per element preserves independent value ownership. All clocks
	// still belong to the same upstream group/timeline, so seeking and group
	// cleanup are coordinated while replacing one element leaves its peers live.
	const clocks = tracks.map(({ visual, baseline, samplers }) => {
		const clock = motionValue(0);
		const render = (time: number) => {
			const sampler = samplers.findLast((entry) => time >= entry.start && time < entry.end);
			const pose = sampler ? sampler.sample(time - sampler.start) : baseline(time);
			for (const key of ['x', 'y', 'pathRotation'] as const) visual.getValue(key, 0).set(pose[key]);
		};
		const unsubscribe = clock.on('change', render);
		rewritten.push([clock, [0, duration], { at: 0, duration, type: 'keyframes', ease: 'linear' }]);
		return { visual, clock, render, unsubscribe };
	});
	const controls = play(rewritten, options);
	for (const { visual, clock, render, unsubscribe } of clocks) {
		const driver = clock.animation;
		if (!(driver instanceof AsyncMotionValueAnimation || driver instanceof JSAnimation))
			throw new Error(
				'Astra useAnimate: the sequence clock did not create engine playback controls.'
			);
		const ownedDriver = new Proxy(driver, {
			get(target, key) {
				if (key === 'complete')
					return () => {
						if (target.state !== 'finished') target.complete();
					};
				if (key === 'play')
					return () => {
						if (target.state !== 'running') target.play();
					};
				if (key === 'stop' || key === 'cancel')
					return () => {
						target[key]();
						unsubscribe();
						visual.getValue('pathRotation', 0).set(0);
					};
				const value = Reflect.get(target, key, target);
				return typeof value === 'function' ? value.bind(target) : value;
			},
			set(target, key, value) {
				return Reflect.set(target, key, value, target);
			}
		});
		if (controls instanceof GroupAnimation) {
			const index = controls.animations.indexOf(driver);
			if (index !== -1) controls.animations[index] = ownedDriver;
		}
		ownMotionPathPlayback(visual, ownedDriver);
		render(0);
	}
	return controls;
}
