import { onDestroy, untrack } from 'svelte';
import { animateMini } from 'motion';
import type { AnimationPlaybackControls, AnimationPlaybackControlsWithThen } from 'motion-dom';
import type { UseAnimateScope } from './use-animate.svelte.js';
import { readActivityState } from './activity-scope.js';

export type MiniScopedAnimate = typeof animateMini;

/** Numeric SVG CSS lengths require explicit units in Firefox and WebKit. */
function nativeKeyframes(keyframes: Parameters<MiniScopedAnimate>[1]) {
	let corrected = keyframes;
	for (const key of ['r', 'rx', 'ry', 'cx', 'cy'] as const) {
		const value = keyframes[key];
		if (
			typeof value !== 'number' &&
			!(Array.isArray(value) && value.some((item) => typeof item === 'number'))
		)
			continue;
		if (corrected === keyframes) corrected = { ...keyframes };
		corrected[key] = Array.isArray(value)
			? value.map((item) => (typeof item === 'number' ? `${item}px` : item))
			: `${value}px`;
	}
	return corrected;
}

function visitPlayback(
	playback: AnimationPlaybackControls,
	visit: (playback: AnimationPlaybackControls) => void
) {
	const children = (
		playback as AnimationPlaybackControls & { animations?: AnimationPlaybackControls[] }
	).animations;
	if (children) {
		for (const child of children) visitPlayback(child, visit);
	} else visit(playback);
}

function completePlayback(playback: AnimationPlaybackControls) {
	visitPlayback(playback, (child) => {
		const native = (child as AnimationPlaybackControls & { animation: Animation }).animation;
		const timing = native.effect?.getTiming();
		const infinite = timing?.iterations === Infinity;
		const frozen = child.speed === 0;
		if (infinite) native.effect?.updateTiming({ iterations: 1 });
		if (frozen) child.speed = 1;
		if (infinite || frozen) {
			void child.finished.then(() => {
				if (infinite) native.effect?.updateTiming({ iterations: timing!.iterations });
				if (frozen) child.speed = 0;
			});
		}
		child.complete();
	});
}

function playPlayback(playback: AnimationPlaybackControls) {
	visitPlayback(playback, (child) => {
		const finished = child.state === 'finished';
		child.play();
		if (finished && child.state === 'finished') {
			const replayTime = child.time;
			child.time = replayTime;
			child.play();
		}
	});
}

/** Native CSS/SVG style animation. This module does not import the hybrid helper. */
export function useAnimateMini<T extends Element = HTMLElement>(): [
	UseAnimateScope<T>,
	MiniScopedAnimate
] {
	const activity = readActivityState();
	let current = $state.raw<T>();
	let activeCount = $state(0);
	let alive = true;
	let generation = 0;
	type Run = {
		controls: AnimationPlaybackControlsWithThen;
		stop(cancel?: boolean): void;
		activityChanged(visible: boolean): void;
	};
	let runs: Run[] = [];
	function stop() {
		for (const run of [...runs]) run.stop();
	}
	function observeActivity() {
		const visible = activity();
		untrack(() => {
			for (const run of runs) run.activityChanged(visible);
		});
	}
	$effect(observeActivity);
	onDestroy(() => {
		alive = false;
		stop();
	});
	const scope: UseAnimateScope<T> = {
		get current() {
			return current;
		},
		get active() {
			return activeCount;
		},
		attach(node) {
			if (untrack(() => current))
				throw new Error('Astra useAnimateMini: a scope can attach to one root at a time.');
			current = node;
			generation++;
			return () => {
				stop();
				current = undefined;
				generation++;
			};
		},
		stop
	};
	const animate: MiniScopedAnimate = (subject, keyframes, options) => {
		if (!alive || typeof document === 'undefined')
			throw new Error('Astra useAnimateMini: playback needs a mounted owner.');
		if (!untrack(activity)) throw new Error('Astra useAnimateMini: this activity is hidden.');
		if (typeof subject === 'string' && !current)
			throw new Error('Astra useAnimateMini: attach the scope before animating selectors.');
		const controls = animateMini(
			typeof subject === 'string' ? current!.querySelectorAll(subject) : subject,
			nativeKeyframes(keyframes),
			options
		);
		const runGeneration = generation;
		let stopped = false;
		let revision = 0;
		const resumeOnReveal = [] as AnimationPlaybackControls[];
		let deferredPlay = false;
		let detachTimeline: (() => void) | undefined;
		let timelineObservers: { connect(): void; disconnect(): void }[] = [];
		const release = () => {
			runs = runs.filter((entry) => entry !== run);
			activeCount = runs.length;
		};
		const run: Run = {
			controls,
			activityChanged(visible) {
				if (stopped) return;
				if (visible) {
					for (const child of resumeOnReveal) playPlayback(child);
					resumeOnReveal.length = 0;
					for (const observer of timelineObservers) observer.connect();
					if (deferredPlay) {
						deferredPlay = false;
						observe();
					}
				} else {
					for (const observer of timelineObservers) observer.disconnect();
					visitPlayback(controls, (child) => {
						if (child.state !== 'running') return;
						resumeOnReveal.push(child);
						child.pause();
					});
				}
			},
			stop(cancel = false) {
				if (stopped) return;
				stopped = true;
				revision++;
				resumeOnReveal.length = 0;
				detachTimeline?.();
				detachTimeline = undefined;
				if (cancel) controls.cancel();
				else controls.stop();
				release();
			}
		};
		const acquire = () => {
			if (!alive || runGeneration !== generation || stopped)
				throw new Error('Astra useAnimateMini: this playback is stopped or detached.');
			if (!runs.includes(run)) runs.push(run);
			activeCount = runs.length;
		};
		const observe = () => {
			acquire();
			const version = ++revision;
			void controls.finished.then(() => {
				if (version === revision) release();
			});
		};
		observe();
		return new Proxy(controls, {
			get(target, key) {
				const value = Reflect.get(target, key, target);
				if (key === 'stop') return run.stop;
				if (key === 'cancel') return () => run.stop(true);
				if (['play', 'pause', 'complete', 'attachTimeline'].includes(String(key)))
					return (...args: unknown[]) => {
						acquire();
						if (key === 'play' || key === 'pause' || key === 'complete') {
							resumeOnReveal.length = 0;
							deferredPlay = false;
						}
						if (key === 'play' && !untrack(activity)) {
							revision++;
							deferredPlay = true;
							visitPlayback(controls, (child) => resumeOnReveal.push(child));
							return;
						}
						if (key === 'attachTimeline' && detachTimeline)
							throw new Error('Astra useAnimateMini: playback already has an external timeline.');
						if (key === 'attachTimeline') {
							const timeline = args[0] as Parameters<
								AnimationPlaybackControls['attachTimeline']
							>[0];
							args[0] = {
								...timeline,
								observe(animation: AnimationPlaybackControls) {
									let dispose: (() => void) | undefined;
									const observer = {
										connect() {
											if (!dispose) dispose = timeline.observe(animation);
										},
										disconnect() {
											const cleanup = dispose;
											dispose = undefined;
											cleanup?.();
										}
									};
									timelineObservers.push(observer);
									if (untrack(activity)) observer.connect();
									return () => {
										observer.disconnect();
										timelineObservers = timelineObservers.filter((entry) => entry !== observer);
									};
								}
							};
						}
						const result =
							key === 'complete'
								? completePlayback(target)
								: key === 'play'
									? playPlayback(target)
									: value.apply(target, args);
						if (key === 'attachTimeline') {
							detachTimeline = result;
							return () => run.stop();
						}
						if (key === 'play' || key === 'complete') observe();
						return result;
					};
				return typeof value === 'function' ? value.bind(target) : value;
			},
			set(target, key, value) {
				acquire();
				return Reflect.set(target, key, value, target);
			}
		});
	};
	return [scope, animate];
}

/** The dedicated mini entry keeps the familiar hook name. */
export { useAnimateMini as useAnimate };
