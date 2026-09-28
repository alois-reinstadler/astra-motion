import { onDestroy, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createScopedAnimate } from 'motion';
import {
	AsyncMotionValueAnimation,
	addStyleValue,
	GroupAnimation,
	GroupAnimationWithThen,
	motionValue,
	positionalKeys,
	resolveElements,
	styleSubjectEffect,
	svgSubjectEffect,
	visualElementStore,
	type MotionPath,
	type Transition,
	type TargetAndTransition,
	type VisualElement,
	type AnimationScope,
	type AnimationPlaybackControls,
	type AnimationPlaybackControlsWithThen
} from 'motion-dom';
import { readActivityState } from './activity-scope.js';
import { observeMotionConfig, observeMotionPreference, readMotionConfig } from './config.js';
import { completeMotionPlayback, prepareMotionHandoff } from './motion-compat.js';
import { shouldReduceMotion, type MotionPolicy } from './policy.js';
import { readMotionGetter, type MotionGetter } from './value-hooks.svelte.js';
import { animateMotionPath, isMotionPathAnimation } from './animation.js';
import { animateSequencePaths } from './sequence-path.js';

export type ScopedAnimate = ReturnType<typeof createScopedAnimate>;
export interface UseAnimateScope<T extends Element = Element> {
	readonly current: T | undefined;
	readonly active: number;
	attach: Attachment<T>;
	stop(): void;
}

const svgGeometry = ['r', 'rx', 'ry', 'cx', 'cy'] as const;

/** Adapt the engine's existing DOM effect values to the path's value-owner contract. */
function pathOwner(element: HTMLElement | SVGElement): VisualElement {
	const existing = visualElementStore.get(element);
	if (existing) return existing;
	// MotionPath's arc implementation uses only getValue/latestValues. This
	// adapter shares the same effect state as animateElement, with no extra renderer.
	return {
		latestValues: {},
		getValue(key: string, fallback: unknown) {
			let value =
				element instanceof SVGElement
					? svgSubjectEffect.get(element, key)
					: styleSubjectEffect.get(element, key);
			if (!value) {
				const initial =
					element instanceof SVGElement
						? svgSubjectEffect.read(element, key)
						: styleSubjectEffect.read(element, key);
				value = motionValue(initial ?? fallback ?? 0);
				if (element instanceof SVGElement) {
					const state = svgSubjectEffect.state(element);
					if (key === 'pathRotation' && state) addStyleValue(element, state, key, value);
					else svgSubjectEffect(element, { [key]: value });
				} else styleSubjectEffect(element, { [key]: value });
			}
			return value;
		}
	} as VisualElement;
}

/** The hybrid engine currently bypasses MotionPath; route DOM arcs through its public hook. */
function animatePathElements(
	subject: unknown,
	keyframes: unknown,
	options: Record<string, unknown>,
	scope: AnimationScope<Element | undefined>,
	play: (...args: unknown[]) => AnimationPlaybackControlsWithThen,
	reduce: boolean
): AnimationPlaybackControlsWithThen | undefined {
	const path = options.path as MotionPath | undefined;
	if (!path || !keyframes || typeof keyframes !== 'object' || Array.isArray(keyframes)) return;
	const targets = keyframes as TargetAndTransition;
	if (!('x' in targets || 'y' in targets)) return;
	const elements =
		typeof subject === 'string'
			? resolveElements(subject, scope)
			: subject instanceof Element
				? [subject]
				: Array.isArray(subject) || subject instanceof NodeList || subject instanceof HTMLCollection
					? Array.from(subject)
					: [];
	if (
		!elements.length ||
		!elements.every((element) => element instanceof HTMLElement || element instanceof SVGElement)
	)
		return;
	if ((options.reduceMotion as boolean | undefined) ?? reduce) return;
	const animations: AnimationPlaybackControlsWithThen[] = [];
	const { onComplete, ...transition } = options;
	for (let index = 0; index < elements.length; index++) {
		const element = elements[index] as HTMLElement | SVGElement;
		const values = { ...targets };
		const configuration = {
			...transition,
			delay:
				typeof transition.delay === 'function'
					? transition.delay(index, elements.length)
					: transition.delay
		} as Transition;
		animateMotionPath(pathOwner(element), path, values, configuration, 0, animations);
		if (Object.keys(values).length) animations.push(play(element, values, configuration));
	}
	const controls = new GroupAnimationWithThen(animations);
	if (typeof onComplete === 'function') void controls.finished.then(() => onComplete());
	scope.animations.push(controls);
	return controls;
}

/**
 * Motion 13.4.4 routes these SVG lengths through CSS but omits their numeric
 * units. Firefox/WebKit reject unitless CSS geometry. Keep the same engine
 * values and effect store, replacing only their numeric serialization.
 */
function correctSVGGeometry(
	subject: unknown,
	keyframes: unknown,
	scope: AnimationScope<Element | undefined>
) {
	if (!keyframes || typeof keyframes !== 'object' || Array.isArray(keyframes)) return;
	const keys = svgGeometry.filter((key) => key in keyframes);
	if (!keys.length) return;
	const elements =
		typeof subject === 'string'
			? resolveElements(subject, scope)
			: subject instanceof Element
				? [subject]
				: Array.isArray(subject) || subject instanceof NodeList || subject instanceof HTMLCollection
					? Array.from(subject)
					: [];
	for (const element of elements) {
		if (!(element instanceof SVGElement)) continue;
		const state = svgSubjectEffect.state(element);
		if (!state) continue;
		for (const key of keys) {
			const value = state.get(key);
			// Values handed to an existing motion component have no effect entry.
			if (!value) continue;
			state.set(key, value, () => {
				const latest = value.get();
				element.style[key] = typeof latest === 'number' ? `${latest}px` : String(latest);
			});
		}
	}
}

/** Finish positional animations while allowing opacity/color animations to continue. */
function finishReduced(playback: AnimationPlaybackControls): void {
	if (isMotionPathAnimation(playback)) {
		// Config notification and reactive reconciliation can observe the same
		// policy change before the final frame. Re-completing JSAnimation would
		// replay it and replace the finished promise that callers already await.
		if (playback.state !== 'finished') completeMotionPlayback(playback);
		return;
	}
	if (playback instanceof GroupAnimation) {
		for (const animation of playback.animations) finishReduced(animation);
		return;
	}
	if (playback instanceof AsyncMotionValueAnimation) {
		finishReduced(playback.animation);
		return;
	}
	const name = (playback as AnimationPlaybackControls & { options?: { name?: string } }).options
		?.name;
	if (
		playback.state !== 'finished' &&
		name &&
		(positionalKeys.has(name) || name === 'transform' || name === 'translate')
	)
		completeMotionPlayback(playback);
}

function visitPlayback(
	playback: AnimationPlaybackControls,
	visit: (playback: AnimationPlaybackControls) => void
) {
	if (playback instanceof GroupAnimation) {
		for (const child of playback.animations) visitPlayback(child, visit);
	} else if (playback instanceof AsyncMotionValueAnimation) {
		visitPlayback(playback.animation, visit);
	} else visit(playback);
}

function playPlayback(playback: AnimationPlaybackControls) {
	visitPlayback(playback, (child) => {
		const finished = child.state === 'finished';
		child.play();
		// NativeAnimation renews finished on replay but retains its finished-time
		// marker. A public seek clears that marker without changing the new time.
		if (finished && child.state === 'finished') {
			const replayTime = child.time;
			child.time = replayTime;
			child.play();
		}
	});
}

/** Familiar scoped animation overloads with Svelte attachments and owner cleanup. */
export function useAnimate<T extends Element = HTMLElement>(
	policy: MotionGetter<MotionPolicy> = {}
): [UseAnimateScope<T>, ScopedAnimate] {
	const inherited = readMotionConfig();
	const activity = readActivityState();
	let current = $state.raw<T>();
	let alive = true;
	let generation = 0;
	let activeCount = $state(0);
	type Run = {
		controls: AnimationPlaybackControlsWithThen;
		stop(cancel?: boolean): void;
		activityChanged(visible: boolean): void;
	};
	let owned: Run[] = [];
	const engineScope = {
		get current() {
			return current;
		},
		animations: [] as AnimationPlaybackControlsWithThen[]
	};
	const stop = () => {
		for (const run of [...owned]) run.stop();
		engineScope.animations.length = 0;
	};
	const readConfig = () => ({ ...inherited(), ...readMotionGetter(policy) });
	const reduced = () => shouldReduceMotion({ reducedMotion: 'never', ...readConfig() });
	function observePolicy() {
		if (!activity()) return;
		const settle = () => {
			if (reduced())
				untrack(() => {
					for (const { controls } of owned) finishReduced(controls);
				});
		};
		$effect(settle);
		const cleanups = [observeMotionConfig(inherited, settle), observeMotionPreference(settle)];
		return () => {
			cleanups.forEach((cleanup) => cleanup());
		};
	}
	$effect(observePolicy);
	function observeActivity() {
		const visible = activity();
		untrack(() => {
			for (const run of owned) run.activityChanged(visible);
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
				throw new Error('Astra useAnimate: a scope can attach to one root at a time.');
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
	const animate = ((...args: unknown[]) => {
		if (!alive) throw new Error('Astra useAnimate: this animation owner has been destroyed.');
		if (typeof document === 'undefined')
			throw new Error('Astra useAnimate: start playback after the component mounts.');
		if (!untrack(activity))
			throw new Error(
				'Astra useAnimate: this activity is hidden. Start playback when it is visible.'
			);
		const [subject, keyframes] = args;
		const sequence = Array.isArray(subject) && subject.some(Array.isArray);
		const isSelector = (target: unknown, frames: unknown) =>
			typeof target === 'string' &&
			frames !== null &&
			typeof frames === 'object' &&
			!Array.isArray(frames);
		if (
			!current &&
			(isSelector(subject, keyframes) ||
				(sequence &&
					subject.some((segment) => Array.isArray(segment) && isSelector(segment[0], segment[1]))))
		)
			throw new Error('Astra useAnimate: attach the scope before animating selectors.');
		const configuration = untrack(readConfig);
		// Engine overloads scope selectors only. Explicit elements, values and objects
		// remain valid subjects and share the engine renderer with motion elements.
		const play = createScopedAnimate({ scope: engineScope, reduceMotion: untrack(reduced) });
		const optionIndex = sequence ? 1 : 2;
		const options = (args[optionIndex] ?? {}) as Record<string, unknown>;
		args[optionIndex] = sequence
			? {
					...options,
					defaultTransition: {
						...configuration.transition,
						...(options.defaultTransition as object)
					}
				}
			: { ...configuration.transition, ...options };
		const invoke = play as (...parameters: unknown[]) => AnimationPlaybackControlsWithThen;
		const controls =
			(sequence &&
				animateSequencePaths(
					subject,
					args[optionIndex] as Record<string, unknown>,
					engineScope,
					invoke,
					pathOwner,
					untrack(reduced)
				)) ||
			(!sequence &&
				animatePathElements(
					subject,
					keyframes,
					args[optionIndex] as Record<string, unknown>,
					engineScope,
					invoke,
					untrack(reduced)
				)) ||
			invoke(...args);
		if (sequence) {
			for (const segment of subject) {
				if (Array.isArray(segment)) correctSVGGeometry(segment[0], segment[1], engineScope);
			}
		} else correctSVGGeometry(subject, keyframes, engineScope);
		const runGeneration = generation;
		let stopped = false;
		let revision = 0;
		const resumeOnReveal = [] as AnimationPlaybackControls[];
		let deferredPlay = false;
		let detachTimeline: (() => void) | undefined;
		let timelineObservers: { connect(): void; disconnect(): void }[] = [];
		const release = () => {
			owned = owned.filter((entry) => entry !== run);
			activeCount = owned.length;
			const index = engineScope.animations.indexOf(controls);
			if (index !== -1) engineScope.animations.splice(index, 1);
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
				prepareMotionHandoff(controls, { settleFinished: !cancel });
				detachTimeline?.();
				detachTimeline = undefined;
				if (cancel) controls.cancel();
				else controls.stop();
				release();
			}
		};
		const acquire = () => {
			if (!owned.includes(run)) owned.push(run);
			activeCount = owned.length;
		};
		const observe = () => {
			const version = ++revision;
			acquire();
			void controls.finished.then(() => {
				if (version === revision) release();
			});
		};
		const validate = () => {
			if (!alive || generation !== runGeneration)
				throw new Error('Astra useAnimate: this playback belongs to a detached animation scope.');
			if (stopped) throw new Error('Astra useAnimate: stopped playback cannot restart.');
		};
		observe();
		return new Proxy(controls, {
			get(target, key) {
				const value = Reflect.get(target, key, target);
				if (['play', 'pause', 'complete', 'attachTimeline'].includes(String(key)))
					return (...parameters: unknown[]) => {
						validate();
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
							throw new Error('Astra useAnimate: playback already has an external timeline.');

						if (key === 'attachTimeline') {
							const timeline = parameters[0] as Parameters<
								AnimationPlaybackControls['attachTimeline']
							>[0];
							parameters[0] = {
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
								? completeMotionPlayback(target)
								: key === 'play'
									? playPlayback(target)
									: value.apply(target, parameters);
						if (key === 'attachTimeline') {
							detachTimeline = result;
							return () => run.stop();
						}
						if (key !== 'pause') observe();
						return result;
					};
				if (key === 'stop' || key === 'cancel')
					return () => {
						if (stopped) return;
						validate();
						run.stop(key === 'cancel');
					};
				return typeof value === 'function' ? value.bind(target) : value;
			},
			set(target, key, value) {
				validate();
				acquire();
				return Reflect.set(target, key, value, target);
			}
		});
	}) as ScopedAnimate;
	return [scope, animate];
}
