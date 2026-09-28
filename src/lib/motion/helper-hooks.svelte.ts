import { cancelFrame, frame, type MotionValue } from 'motion-dom';
import { observeMotionPreference } from './config.js';
import { shouldReduceMotion } from './policy.js';
import { createInView, type InViewOptions } from './in-view.svelte.js';
import { readActivityState } from './activity-scope.js';
import { readMotionGetter, useMotionValue, type MotionGetter } from './value-hooks.svelte.js';

export interface MotionReadable<T> {
	readonly current: T;
}
export type MotionElementSource<T extends Element = Element> =
	MotionGetter<T | null | undefined> | MotionReadable<T | null | undefined>;

export function readMotionElement<T extends Element>(input: MotionElementSource<T>) {
	return input && typeof input === 'object' && 'current' in input
		? input.current
		: readMotionGetter(input as MotionGetter<T | null | undefined>);
}

export type AnimationFrameCallback = (time: number, delta: number) => void;
export interface AnimationFrameOptions {
	/** Disabling cancels frame work. Time still measures elapsed time since the first frame. */
	enabled?: boolean;
}

/** Frame time and delta are milliseconds. The first callback receives time zero. */
export function useAnimationFrame(
	callback: AnimationFrameCallback | undefined,
	options: MotionGetter<AnimationFrameOptions> = {}
): void {
	const active = readActivityState();
	let initialTimestamp: number | undefined;
	function observeFrames() {
		if (!active() || readMotionGetter(options).enabled === false || !callback) return;
		const update = ({ timestamp, delta }: { timestamp: number; delta: number }) => {
			initialTimestamp ??= timestamp;
			callback(timestamp - initialTimestamp, delta);
		};
		frame.update(update, true);
		return () => cancelFrame(update);
	}
	$effect(observeFrames);
}

export function useTime(): MotionValue<number> {
	const value = useMotionValue(0);
	useAnimationFrame((time) => value.set(time));
	return value;
}

export function usePageInView(): MotionReadable<boolean> {
	const active = readActivityState();
	let current = $state(true);
	function observeVisibility() {
		if (!active()) return;
		const update = () => (current = !document.hidden);
		update();
		document.addEventListener('visibilitychange', update);
		return () => document.removeEventListener('visibilitychange', update);
	}
	$effect(observeVisibility);
	return {
		get current() {
			return current;
		}
	};
}

/** Device preference only; MotionConfig's animation policy does not change this value. */
export function useReducedMotion(): MotionReadable<boolean | null> {
	const active = readActivityState();
	let current = $state<boolean | null>(null);
	function observePreference() {
		if (!active()) return;
		const update = () => (current = shouldReduceMotion({ reducedMotion: 'user' }));
		update();
		return observeMotionPreference(update);
	}
	$effect(observePreference);
	return {
		get current() {
			return current;
		}
	};
}

export interface UseInViewOptions extends Omit<InViewOptions, 'root'> {
	root?: MotionGetter<Element | Document | null | undefined>;
}

export function useInView(
	target: MotionElementSource,
	options: MotionGetter<UseInViewOptions> = {}
): MotionReadable<boolean> {
	// createInView owns native observers and preserves measured once/initial semantics.
	const visibility = createInView(
		() => readMotionElement(target),
		() => {
			const { root, ...settings } = readMotionGetter(options);
			return { ...settings, root: root === undefined ? undefined : readMotionGetter(root) };
		}
	);
	return {
		get current() {
			return visibility.current;
		}
	};
}
