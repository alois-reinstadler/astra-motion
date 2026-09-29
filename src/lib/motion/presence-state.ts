import {
	DOMKeyframesResolver,
	JSAnimation,
	getDefaultTransition,
	getFinalKeyframe,
	getValueTransition,
	isTransitionDefined,
	resolveTransition,
	transformPropOrder,
	positionalKeys,
	type VisualElement,
	type MotionValue,
	type ResolvedValues,
	type TargetAndTransition,
	type Transition,
	type ValueAnimationOptions,
	type ValueTransition
} from 'motion-dom';
import type { TransitionConfig } from 'svelte/transition';
import { prepareMotionHandoff } from './motion-compat.js';

type Value = number | string;
export interface PresenceTimeline extends TransitionConfig {
	/** Last native, linear Svelte progress; pass to the replacement timeline on reversal. */
	readonly progress: number;
	/** Finite Motion trajectory duration, before native reversal normalization. */
	readonly span: number;
	/** Internal: place this trajectory in a coordinated native transition batch. */
	schedule(offset: number, until?: number): void;
	/** Apply the final pose and complete once, including when policy changes during retention. */
	finish(): void;
	/** Settle positional tracks while paint and the native retention clock continue. */
	reduceMotion(): void;
	/** Suppress stale ticks and completion callbacks when replaced or destroyed. */
	cancel(): void;
}
export interface PresenceCallbacks {
	start?: () => void;
	complete?: () => void;
}

const driver = () => ({ start() {}, stop() {}, now: () => 0 });
const clamp = (value: number) => Math.max(0, Math.min(1, value));
function isDOMVisual(
	visual: VisualElement
): visual is VisualElement<HTMLElement | SVGElement> & { current: HTMLElement | SVGElement } {
	return visual.current instanceof HTMLElement || visual.current instanceof SVGElement;
}
function resolved(value: unknown, key: string): Value {
	if (typeof value !== 'number' && typeof value !== 'string')
		throw new Error(`Astra presence: "${key}" requires a resolved number or string.`);
	if (typeof value === 'number' && !Number.isFinite(value))
		throw new Error(`Astra presence: "${key}" must be finite.`);
	return value;
}

/**
 * Motion supplies interpolation and springs; Svelte supplies the only running clock and retention.
 * Call from a deferred native transition for every direction change, with current Motion values.
 */
export function createPresenceTimeline(
	visual: VisualElement,
	from: ResolvedValues,
	target: TargetAndTransition,
	transition: Transition,
	direction: 'in' | 'out',
	callbacks: PresenceCallbacks = {},
	startingProgress?: number | (() => number),
	deferred = false
): PresenceTimeline {
	const { transition: targetTransition, transitionEnd = {}, ...values } = target;
	const inherited = resolveTransition(targetTransition, transition) ?? transition;
	const tracks: {
		key: string;
		reduced?: boolean;
		value: MotionValue<Value>;
		animation: JSAnimation<Value>;
		final: Value;
		duration: number;
	}[] = [];
	let duration = 0;
	let offset = 0;
	let holdUntil = 0;
	const inputs = Object.entries(values).flatMap(([key, destination]) => {
		if (destination === undefined) return [];
		const firstTarget = Array.isArray(destination) ? destination.at(-1) : destination;
		const value = visual.getValue(key, from[key] ?? visual.readValue(key, firstTarget));
		prepareMotionHandoff(value.animation);
		value.stop();
		// Stopping active WAAPI playback is what samples its current velocity.
		const velocity = value.getVelocity();
		const rawSource = value.get() ?? from[key];
		const supplied = Array.isArray(destination) ? destination : [null, destination];
		if (!supplied.length) throw new Error(`Astra presence: "${key}" has no keyframes.`);
		const frames: (Value | null)[] = [];
		frames.push(...supplied);
		frames[0] ??= rawSource;
		// A replacement direction begins at the current pose, including interrupted keyframes.
		const input: {
			key: string;
			destination: typeof destination;
			value: MotionValue<Value>;
			velocity: number;
			frames: (Value | null)[];
			finalKeyframe?: Value;
			resolver?: DOMKeyframesResolver<Value>;
		} = {
			key,
			destination,
			value,
			velocity,
			frames
		};
		if (input.frames.length === 1) input.frames.push(supplied[0] ?? rawSource);
		{
			if (!isDOMVisual(visual))
				throw new Error('Astra presence: DOM keyframes require a mounted element.');
			input.resolver = new DOMKeyframesResolver<Value>(
				input.frames,
				(frames, final) => {
					input.frames = frames;
					input.finalKeyframe = final;
				},
				key,
				value,
				visual
			);
			input.resolver.readKeyframes();
		}
		return [input];
	});
	const measured = inputs.filter((input) => input.resolver?.needsMeasurement);
	if (measured.length) {
		// Batch this element's dimensions together: changing width can change intrinsic
		// height. Never flush the global queue and measure unrelated pending animations.
		const scrollX = window.scrollX;
		const scrollY = window.scrollY;
		const transforms: [MotionValue<Value>, Value][] = [];
		if (measured.some(({ key }) => key === 'bottom' || key === 'right')) {
			for (const key of transformPropOrder) {
				if (key === 'x' || key === 'y' || key === 'z') continue;
				const value = visual.getValue(key);
				const reset = key.startsWith('scale') ? 1 : 0;
				if (value && value.get() !== reset) {
					transforms.push([value, value.get()]);
					value.set(reset);
				}
			}
			if (transforms.length) visual.render();
		}
		try {
			for (const { resolver } of measured) resolver!.measureInitialState();
			visual.render();
			for (const { resolver } of measured) resolver!.measureEndState();
		} finally {
			for (const [value, original] of transforms) value.set(original);
			visual.render();
			if (measured.some(({ resolver }) => resolver!.suspendedScrollY !== undefined))
				window.scrollTo(scrollX, scrollY);
		}
	}
	for (const input of inputs) input.resolver?.complete();
	for (const { key, destination, value, velocity, frames, finalKeyframe } of inputs) {
		const source = resolved(frames[0], key);
		const keyframes: Value[] = [];
		for (const entry of frames) keyframes.push(resolved(entry ?? keyframes.at(-1) ?? source, key));
		const specified: ValueTransition = getValueTransition(inherited, key) ?? {};
		if (
			specified.repeat &&
			!Number.isFinite(specified.repeat) &&
			!specified.skipAnimations &&
			specified.type !== false
		)
			throw new Error(
				'Astra presence: an infinite repeat cannot complete an outro. Use a finite exit repeat; keep infinite repetition on animate while present.'
			);
		// Motion's declaration restricts this default selector to numbers; it only inspects
		// keyframe count and a numeric zero scale target, so strings use a nonzero sentinel.
		const config = isTransitionDefined(specified)
			? specified
			: {
					...getDefaultTransition(key, {
						keyframes: keyframes.map((value) => (typeof value === 'number' ? value : 1))
					}),
					...specified
				};
		if (typeof config.delay === 'function')
			throw new Error('Astra presence: use a numeric delay for a retained element.');
		const delay = config.delay ?? (typeof inherited.delay === 'number' ? inherited.delay : 0);
		if (
			!Number.isFinite(delay) ||
			(config.duration !== undefined && (!Number.isFinite(config.duration) || config.duration < 0))
		)
			throw new Error(
				'Astra presence: duration and delay must be finite, with a non-negative duration.'
			);
		// Match animateTarget: unchanged scalar targets do not retain an otherwise idle element.
		if (!Array.isArray(destination) && source === destination && !(config.velocity ?? velocity))
			continue;
		const instant =
			config.type === false ||
			(config.duration === 0 && !config.repeatDelay) ||
			config.skipAnimations;
		const repeat = !instant ? (config.repeat ?? 0) : 0;
		const repeatDelay = !instant ? (config.repeatDelay ?? 0) * 1000 : 0;
		if (repeat < 0 || !Number.isFinite(repeat) || !Number.isFinite(repeatDelay) || repeatDelay < 0)
			throw new Error(
				'Astra presence: repeat must be a finite non-negative number and repeatDelay a finite non-negative duration.'
			);
		const options: ValueAnimationOptions<Value> = {
			...config,
			repeat,
			repeatDelay,
			keyframes,
			type: instant ? 'keyframes' : config.type,
			duration: instant ? 0 : config.duration === undefined ? undefined : config.duration * 1000,
			delay: config.skipAnimations ? 0 : delay * 1000,
			velocity: config.velocity ?? velocity,
			ease: config.ease ?? 'easeOut',
			autoplay: false,
			driver
		};
		const animation = new JSAnimation(options);
		// JSAnimation exposes one iteration in seconds. Its totalDuration formula
		// includes every iteration and inter-repeat delay; the initial delay applies once.
		const trackDuration = Math.max(
			0,
			animation.duration * 1000 * (repeat + 1) + repeatDelay * repeat + (options.delay ?? 0)
		);
		if (!Number.isFinite(trackDuration)) {
			animation.stop();
			for (const track of tracks) track.animation.stop();
			throw new Error(
				'Astra presence: the spring must settle within Motion’s finite duration limit.'
			);
		}
		tracks.push({
			key,
			value,
			animation,
			// Suppressing playback must not discard reverse/mirror endpoint semantics.
			final: getFinalKeyframe(keyframes, config, finalKeyframe),
			duration: trackDuration
		});
		duration = Math.max(duration, trackDuration);
	}
	const endValues = Object.entries(transitionEnd).map(
		([key, value]) => [key, resolved(value, key)] as const
	);
	const readStartingProgress = () =>
		clamp(
			(typeof startingProgress === 'function' ? startingProgress() : startingProgress) ??
				(direction === 'in' ? 0 : 1)
		);
	let progress = readStartingProgress();
	let nativeStart = progress;
	let firstProgress: number | undefined;
	let easingProgress: number | undefined;
	let active = true;
	let started = false;
	let completed = false;
	let poseEnded = false;
	const endpoint = direction === 'in' ? 1 : 0;
	const distance = Math.abs(endpoint - progress);
	function start() {
		if (started) return;
		started = true;
		callbacks.start?.();
	}
	function applyFinalPose() {
		if (poseEnded) return;
		poseEnded = true;
		for (const track of tracks) {
			track.value.set(track.final);
			track.animation.stop();
		}
		for (const [key, value] of endValues) visual.getValue(key, value).set(value);
		visual.render();
	}
	function finish() {
		if (completed || !active) return;
		completed = true;
		progress = endpoint;
		start();
		applyFinalPose();
		callbacks.complete?.();
	}
	// Native Svelte skips tick entirely at duration zero.
	if (!deferred && (duration === 0 || distance === 0)) {
		start();
		finish();
	}
	return {
		// Svelte reads this again after counterpart.t(), which calls the previous identity
		// easing below. A lazy source therefore observes its exact native clock position.
		get duration() {
			if (firstProgress === undefined && !completed) nativeStart = readStartingProgress();
			const remaining = Math.abs(endpoint - nativeStart);
			return remaining ? Math.max(duration + offset, holdUntil) / remaining : 0;
		},
		get span() {
			return duration;
		},
		schedule(start, until = 0) {
			if (!Number.isFinite(start) || start < 0)
				throw new Error('Astra presence: invalid coordinated delay.');
			offset = start;
			holdUntil = until;
			if (Math.max(duration + offset, holdUntil) === 0 || distance === 0) finish();
		},
		easing(t) {
			easingProgress = t;
			// Even after cancellation, Svelte may consult this old clock during reversal.
			if (!completed) progress = nativeStart + (endpoint - nativeStart) * t;
			return t;
		},
		finish,
		reduceMotion() {
			if (!active || completed || poseEnded || inherited.reduceMotion === false) return;
			for (const track of tracks) {
				if (!positionalKeys.has(track.key)) continue;
				track.reduced = true;
				track.value.set(track.final);
				track.animation.stop();
			}
			visual.render();
		},
		get progress() {
			return progress;
		},
		cancel() {
			active = false;
			for (const track of tracks) track.animation.stop();
		},
		tick(t) {
			if (!active || completed) return;
			start();
			progress = clamp(t);
			if (firstProgress === undefined) {
				// Recover Svelte's exact t1 if its first tick already has elapsed frame time.
				firstProgress =
					easingProgress === undefined || easingProgress === 1
						? progress
						: (progress - endpoint * easingProgress) / (1 - easingProgress);
				nativeStart = firstProgress;
			}
			if (progress === endpoint) {
				finish();
				return;
			}
			const remaining = endpoint - firstProgress;
			const fraction = remaining === 0 ? 1 : clamp((progress - firstProgress) / remaining);
			const elapsed = fraction * Math.max(duration + offset, holdUntil) - offset;
			if (elapsed >= duration) {
				applyFinalPose();
				return;
			}
			if (poseEnded) return;
			for (const track of tracks)
				if (!track.reduced) track.value.set(track.animation.sample(Math.max(0, elapsed)).value);
			visual.render();
		}
	};
}
