import { flushSync, onDestroy, untrack } from 'svelte';
import {
	attachFollow,
	type FollowValueOptions,
	cancelFrame,
	collectMotionValues,
	frame,
	isMotionValue,
	motionValue,
	transform,
	type AccelerateConfig,
	type MotionValue,
	type MotionValueEventCallbacks,
	type SpringOptions,
	type TransformOptions
} from 'motion-dom';
import { readActivityState } from './activity-scope.js';

/** Pass a getter when an argument can change after component setup. */
export type MotionGetter<T> = T | (() => T);

export function readMotionGetter<T>(input: MotionGetter<T>): T {
	return typeof input === 'function' ? (input as () => T)() : input;
}

/** An engine value owned by the current Svelte component/effect. */
export function useMotionValue<T>(initial: T): MotionValue<T> {
	const value = motionValue(initial);
	onDestroy(() => value.destroy());
	return value;
}

/** Subscribe before mounted effects, and replace subscriptions when a getter changes. */
export function useMotionValueEvent<T, Event extends keyof MotionValueEventCallbacks<T>>(
	input: MotionGetter<MotionValue<T>>,
	event: MotionGetter<Event>,
	callback: MotionValueEventCallbacks<T>[Event]
): void {
	const active = readActivityState();
	function subscribeEvent() {
		if (!active()) return;
		return readMotionGetter(input).on(readMotionGetter(event), callback);
	}
	$effect.pre(subscribeEvent);
}

/** Recollect dependencies after every computation, including conditional .get() calls. */
function deriveValue<T>(compute: () => T, accelerate?: () => AccelerateConfig | undefined) {
	const active = readActivityState();
	const value = useMotionValue(untrack(compute));
	let revision = $state(0);
	let subscriptions: { input: MotionValue; stop: () => void }[] = [];
	let live = false;
	const invalidate = () => {
		if (!live) return;
		// Motion renders immediately after preRender. Flush the tracked computation
		// here so derived DOM values share the sources' frame, while Svelte still
		// recollects reactive/conditional dependencies inside its owning effect.
		flushSync(() => revision++);
	};
	const schedule = () => frame.preRender(invalidate, false, true);
	const cleanup = () => {
		live = false;
		cancelFrame(invalidate);
		for (const { stop } of subscriptions) stop();
		subscriptions = [];
	};
	const update = () => {
		const previous = collectMotionValues.current;
		const inputs: MotionValue[] = [];
		let latest: T;
		try {
			collectMotionValues.current = inputs;
			latest = compute();
		} finally {
			collectMotionValues.current = previous;
		}
		const unique = new Set(inputs);
		subscriptions = subscriptions.filter(({ input, stop }) => {
			if (unique.has(input)) return true;
			stop();
			return false;
		});
		for (const input of unique) {
			if (!subscriptions.some((entry) => entry.input === input))
				subscriptions.push({ input, stop: input.on('change', schedule) });
		}
		value.accelerate = accelerate?.();
		value.set(latest);
	};
	value.accelerate = untrack(() => accelerate?.());
	function recompute() {
		void revision;
		if (live) update();
	}
	function observeInputs() {
		if (!active()) return;
		live = true;
		$effect.pre(recompute);
		return cleanup;
	}
	$effect(observeInputs);
	onDestroy(cleanup);
	return value;
}

type TemplateValue =
	string | number | MotionValue<string> | MotionValue<number> | MotionValue<string | number>;

/** A tagged template whose values may be MotionValues or reactive getters. */
export function useMotionTemplate(
	fragments: TemplateStringsArray,
	...values: MotionGetter<TemplateValue>[]
): MotionValue<string> {
	return deriveValue(() =>
		fragments.reduce((text, fragment, index) => {
			if (index >= values.length) return text + fragment;
			const input = readMotionGetter(values[index]);
			return text + fragment + (isMotionValue(input) ? input.get() : input);
		}, '')
	);
}

type InputValues<Inputs extends readonly MotionValue[]> = {
	[Key in keyof Inputs]: Inputs[Key] extends MotionValue<infer Value> ? Value : never;
};
type OutputMap = Record<string, readonly unknown[]>;
type MappedValues<Map extends OutputMap> = {
	[Key in keyof Map]: MotionValue<Map[Key][number]>;
};

export function useTransform<Output>(compute: () => Output): MotionValue<Output>;
export function useTransform<Input, Output>(
	input: MotionGetter<MotionValue<Input>>,
	compute: (value: Input) => Output
): MotionValue<Output>;
export function useTransform<Inputs extends readonly MotionValue[], Output>(
	input: MotionGetter<Inputs>,
	compute: (values: InputValues<Inputs>) => Output
): MotionValue<Output>;
export function useTransform<Output>(
	input: MotionGetter<MotionValue<number>>,
	inputRange: MotionGetter<readonly number[]>,
	outputRange: MotionGetter<readonly Output[]>,
	options?: MotionGetter<TransformOptions<Output>>
): MotionValue<Output>;
export function useTransform<Map extends OutputMap>(
	input: MotionGetter<MotionValue<number>>,
	inputRange: MotionGetter<readonly number[]>,
	outputMap: Map,
	options?: MotionGetter<TransformOptions<Map[keyof Map][number]>>
): MappedValues<Map>;
export function useTransform(
	input: MotionGetter<MotionValue | readonly MotionValue[] | unknown>,
	inputRangeOrCompute?: MotionGetter<readonly number[]> | ((value: never) => unknown),
	output?: MotionGetter<readonly unknown[]> | OutputMap,
	options: MotionGetter<TransformOptions<unknown>> = {}
): MotionValue | MappedValues<OutputMap> {
	if (inputRangeOrCompute === undefined) return deriveValue(input as () => unknown);
	if (output === undefined) {
		return deriveValue(() => {
			const source = readMotionGetter(input) as MotionValue | readonly MotionValue[];
			const latest = Array.isArray(source)
				? source.map((value) => value.get())
				: (source as MotionValue).get();
			return (inputRangeOrCompute as (value: unknown) => unknown)(latest);
		});
	}
	const range = inputRangeOrCompute as MotionGetter<readonly number[]>;
	const deriveRange = (getOutput: () => readonly unknown[]) => {
		const source = () => readMotionGetter(input) as MotionValue<number>;
		const map = () =>
			transform([...readMotionGetter(range)], [...getOutput()], readMotionGetter(options));
		return deriveValue(
			() => map()(source().get()),
			() => {
				const config = source().accelerate;
				const settings = readMotionGetter(options);
				if (!config || config.isTransformed || settings.clamp === false || settings.mixer)
					return undefined;
				return {
					...config,
					times: [...readMotionGetter(range)],
					keyframes: [...getOutput()],
					isTransformed: true,
					...(settings.ease ? { ease: settings.ease } : {})
				};
			}
		);
	};
	if (typeof output === 'function' || Array.isArray(output))
		return deriveRange(() => readMotionGetter(output as MotionGetter<readonly unknown[]>));
	return Object.fromEntries(
		Object.keys(output).map((key) => [key, deriveRange(() => (output as OutputMap)[key])])
	);
}

export interface UseSpringOptions extends SpringOptions {
	/** Jump on the first update from a source MotionValue. Defaults to false. */
	skipInitialAnimation?: boolean;
}

/** Spring follower with reactive source/settings; see useFollowValue for other transitions. */
export function useSpring(
	input: MotionGetter<number | MotionValue<number>>,
	options?: MotionGetter<UseSpringOptions>
): MotionValue<number>;
export function useSpring(
	input: MotionGetter<string | MotionValue<string>>,
	options?: MotionGetter<UseSpringOptions>
): MotionValue<string>;
export function useSpring<T extends number | string>(
	input: MotionGetter<T | MotionValue<T>>,
	options: MotionGetter<UseSpringOptions> = {}
): MotionValue<T> {
	return createFollower(input, () => ({
		type: 'spring',
		...readMotionGetter(options)
	}));
}

/**
 * Component setup helper: owns a value that follows a target with spring (default), tween or inertia.
 * @param input Initial number/unit string, borrowed MotionValue, or reactive getter returning either.
 * @param options Transition settings or reactive getter. Durations use seconds; repeats are excluded.
 * @returns Stable owned MotionValue; `.set()` animates, `.jump()` sets immediately, `.stop()` retains position.
 * @example const x = useFollowValue(() => target, () => ({ type: 'tween', duration }));
 * Source and option changes preserve output identity. Hidden Activity detaches clocks/subscriptions,
 * retains direct targets, and reconnects to the latest borrowed source when shown.
 */
export function useFollowValue(
	input: MotionGetter<number | MotionValue<number>>,
	options?: MotionGetter<FollowValueOptions>
): MotionValue<number>;
export function useFollowValue(
	input: MotionGetter<string | MotionValue<string>>,
	options?: MotionGetter<FollowValueOptions>
): MotionValue<string>;
export function useFollowValue<T extends number | string>(
	input: MotionGetter<T | MotionValue<T>>,
	options: MotionGetter<FollowValueOptions> = {}
): MotionValue<T> {
	return createFollower(input, options);
}

function createFollower<T extends number | string>(
	input: MotionGetter<T | MotionValue<T>>,
	options: MotionGetter<FollowValueOptions>
): MotionValue<T> {
	const active = readActivityState();
	const initial = untrack(() => readMotionGetter(input));
	const value = useMotionValue<T>(isMotionValue(initial) ? initial.get() : initial);
	let target = value.get();
	let previousSource = initial;
	let alive = true;
	const setValue = value.set.bind(value);
	const jumpValue = value.jump.bind(value);
	const stopValue = value.stop.bind(value);
	// These methods belong to this owned value only. The borrowed source and
	// engine prototypes are untouched. Hidden sets retain intent without clocks.
	value.set = (latest) => {
		target = latest;
		if (alive && untrack(active)) setValue(latest);
	};
	value.jump = (latest, endAnimation) => {
		target = latest;
		jumpValue(latest, endAnimation);
	};
	value.stop = () => {
		stopValue();
		target = value.get();
	};
	onDestroy(() => {
		alive = false;
	});
	function followSource() {
		if (!active()) return;
		const source = readMotionGetter(input);
		const { skipInitialAnimation = false, ...settings } = readMotionGetter(options);
		// Own the source subscription to preserve units on the initial jump and
		// reconnect changing Svelte source identities without replacing the output.
		const detach = attachFollow(
			value,
			untrack(() => value.get()),
			{
				...settings,
				// The follower engine takes milliseconds; public transitions use seconds.
				...(settings.duration === undefined ? {} : { duration: settings.duration * 1000 })
			}
		);
		let skip = skipInitialAnimation;
		const set = (latest: T) => {
			if (skip) {
				skip = false;
				value.jump(latest);
			} else value.set(latest);
		};
		if (typeof source === 'object') target = source.get();
		else if (!Object.is(source, previousSource)) target = source;
		previousSource = source;
		if (target !== untrack(() => value.get())) set(target);
		const stop = isMotionValue(source) ? source.on('change', set) : undefined;
		return () => {
			stop?.();
			detach();
			stopValue();
		};
	}
	$effect.pre(followSource);
	return value;
}

/** Numerical unit strings are supported by the engine as well as numbers. */
export function useVelocity<Value extends number | string>(
	input: MotionGetter<MotionValue<Value>>
): MotionValue<number> {
	const active = readActivityState();
	const velocity = useMotionValue(untrack(() => readMotionGetter(input).getVelocity()));
	function observeVelocity() {
		if (!active()) return;
		const source = readMotionGetter(input);
		let live = true;
		const update = () => {
			if (!live) return;
			const latest = source.getVelocity();
			velocity.set(latest);
			if (latest) frame.update(update);
		};
		const schedule = () => frame.update(update, false, true);
		update();
		const stop = source.on('change', schedule);
		return () => {
			live = false;
			stop();
			cancelFrame(update);
		};
	}
	$effect.pre(observeVelocity);
	return velocity;
}
