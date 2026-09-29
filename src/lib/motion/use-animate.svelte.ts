import { onDestroy, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import {
	createScopedAnimate,
	type AnimationSequence,
	type SequenceOptions,
	type ObjectTarget
} from 'motion';
import type {
	AnimationSettlement,
	AnimationCancellationReason,
	ScopedAnimationControls
} from './animate.js';
import {
	AsyncMotionValueAnimation,
	frame,
	cancelFrame,
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
	type MotionValue,
	type UnresolvedValueKeyframe,
	type ValueAnimationTransition,
	type ElementOrSelector,
	type DOMKeyframesDefinition,
	type AnimationOptions,
	type Transition,
	type TargetAndTransition,
	type VisualElement,
	type AnimationScope,
	type AnimationPlaybackControls,
	type AnimationPlaybackControlsWithThen
} from 'motion-dom';
import { readActivityState } from './activity-scope.js';
import { observeMotionConfig, observeMotionPreference, readMotionConfig } from './config.js';
import {
	completeMotionPlayback,
	motionPlaybackDriver,
	resolvedMotionPlaybackDriver,
	pauseMotionPlayback,
	prepareMotionHandoff,
	stopMotionPlayback
} from './motion-compat.js';
import { shouldReduceMotion, type MotionPolicy } from './policy.js';
import { readMotionGetter, type MotionGetter } from './value-hooks.svelte.js';
import { animateMotionPath, isMotionPathAnimation } from './animation.js';
import { animateSequencePaths } from './sequence-path.js';

/** Upstream overloads with additive cancellation-aware settlement. finished/then remain upstream. */
export interface ScopedAnimate {
	(sequence: AnimationSequence, options?: SequenceOptions): ScopedAnimationControls;
	<V extends string | number>(
		value: V | MotionValue<V>,
		keyframes: V | UnresolvedValueKeyframe<V>[],
		options?: ValueAnimationTransition<V>
	): ScopedAnimationControls;
	(
		element: ElementOrSelector,
		keyframes: DOMKeyframesDefinition,
		options?: AnimationOptions
	): ScopedAnimationControls;
	<O extends object>(
		object: O | O[],
		keyframes: ObjectTarget<O>,
		options?: AnimationOptions
	): ScopedAnimationControls;
}
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

/**
 * Scoped animation setup helper. No React call-order rules apply.
 * @param policy Static policy or a getter observed for live reduced-motion changes.
 * @returns [scope, animate]. Spread the scope attachment on one root for scoped selectors.
 * @example
 * const [scope, animate] = useAnimate(() => ({ reducedMotion: preference }));
 * const outcome = await animate('.item', { opacity: 1 }).settled;
 * if (outcome.status === 'finished') advance();
 * @remarks settled resolves for finished, stopped, cancelled, replaced or detached playback.
 * Pause/resume retain the pending result. Replay after completion creates a new result.
 * finished and then retain Motion's completion-only semantics.
 */
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
		reduceMotion?: boolean;
		stop(reason?: AnimationCancellationReason, cancel?: boolean): void;
		finishReduced(): void;
		activityChanged(visible: boolean): void;
	};
	let owned: Run[] = [];
	const engineScope = {
		get current() {
			return current;
		},
		animations: [] as AnimationPlaybackControlsWithThen[]
	};
	const stop = (reason: AnimationCancellationReason = 'stopped') => {
		for (const run of [...owned]) run.stop(reason);
		engineScope.animations.length = 0;
	};
	const readConfig = () => ({ ...inherited(), ...readMotionGetter(policy) });
	const reduced = () => shouldReduceMotion({ reducedMotion: 'never', ...readConfig() });
	function observePolicy() {
		if (!activity()) return;
		const settle = () => {
			if (reduced())
				untrack(() => {
					for (const run of owned) if (run.reduceMotion !== false) run.finishReduced();
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
		stop('detached');
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
				stop('detached');
				current = undefined;
				generation++;
			};
		},
		stop: () => stop()
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
		let replaced = false;
		let replaying = false;
		let cancelCompletionCheck: (() => void) | undefined;
		let settlementPending = true;
		let resolveSettlement: (result: AnimationSettlement) => void;
		let settled = new Promise<AnimationSettlement>((resolve) => {
			resolveSettlement = resolve;
		});
		const settle = (result: AnimationSettlement) => {
			if (!settlementPending) return;
			settlementPending = false;
			resolveSettlement(result);
		};
		const interrupted: AnimationPlaybackControls[] = [];
		const removeStopObservers: (() => void)[] = [];
		// Observe the controls owned by this run, never a consumer's borrowed value.
		// MotionValue replacement invokes its old animation.stop synchronously.
		const observeStops = (playback: AnimationPlaybackControls) => {
			if (playback instanceof GroupAnimation) {
				playback.animations.forEach(observeStops);
				return;
			}
			const driver = motionPlaybackDriver(playback);
			const original = driver.stop;
			const stop = () => {
				try {
					original.call(driver);
				} finally {
					if (!stopped && !interrupted.includes(playback)) {
						interrupted.push(playback);
						const owner = resolvedMotionPlaybackDriver(playback);
						for (const observer of timelineObservers)
							if (observer.owner === owner) observer.disconnect();
						replaced = true;
						settle({ status: 'cancelled', reason: 'replaced' });
						observeRemaining();
					}
				}
			};
			driver.stop = stop;
			removeStopObservers.push(() => {
				if (driver.stop === stop) driver.stop = original;
			});
		};
		// A replaced channel relinquishes ownership independently of its siblings.
		// Keep the untouched channels managed until completion or owner cleanup.
		const visitOwned = (
			playback: AnimationPlaybackControls,
			visit: (child: AnimationPlaybackControls) => void
		) => {
			if (interrupted.includes(playback)) return;
			if (playback instanceof GroupAnimation)
				playback.animations.forEach((child) => visitOwned(child, visit));
			else visit(playback);
		};
		const stopOwned = (cancel: boolean) => {
			visitOwned(controls, (playback) => {
				prepareMotionHandoff(playback, { settleFinished: !cancel });
				if (cancel) playback.cancel();
				else stopMotionPlayback(playback);
			});
		};
		let revision = 0;
		const resumeOnReveal = [] as AnimationPlaybackControls[];
		let detachTimeline: (() => void) | undefined;
		let timelineObservers: {
			owner: AnimationPlaybackControls;
			connect(): void;
			disconnect(): void;
		}[] = [];
		const release = () => {
			cancelCompletionCheck?.();
			cancelCompletionCheck = undefined;
			removeStopObservers.splice(0).forEach((remove) => remove());
			owned = owned.filter((entry) => entry !== run);
			activeCount = owned.length;
			const index = engineScope.animations.indexOf(controls);
			if (index !== -1) engineScope.animations.splice(index, 1);
		};
		const run: Run = {
			controls,
			reduceMotion: (args[optionIndex] as { reduceMotion?: boolean }).reduceMotion,
			finishReduced() {
				visitOwned(controls, finishReduced);
			},
			activityChanged(visible) {
				if (stopped) return;
				if (visible) {
					for (const child of resumeOnReveal) if (!interrupted.includes(child)) playPlayback(child);
					resumeOnReveal.length = 0;
					for (const observer of timelineObservers) observer.connect();
					if (settlementPending) observe();
					else if (replaced) observeRemaining();
				} else {
					revision++;
					cancelCompletionCheck?.();
					cancelCompletionCheck = undefined;
					for (const observer of timelineObservers) observer.disconnect();
					visitOwned(controls, (child) => {
						if (child.state !== 'running') return;
						resumeOnReveal.push(child);
						pauseMotionPlayback(child);
					});
				}
			},
			stop(reason = 'stopped', cancel = false) {
				if (stopped) return;
				stopped = true;
				revision++;
				resumeOnReveal.length = 0;
				try {
					detachTimeline?.();
					detachTimeline = undefined;
					stopOwned(cancel);
				} finally {
					release();
					settle({ status: 'cancelled', reason });
				}
			}
		};
		const acquire = () => {
			if (!owned.includes(run)) {
				observeStops(controls);
				owned.push(run);
			}
			activeCount = owned.length;
		};
		const beginCycle = () => {
			if (settlementPending) return;
			replaying = true;
			settlementPending = true;
			settled = new Promise<AnimationSettlement>((resolve) => {
				resolveSettlement = resolve;
			});
		};
		const watchCompletion = (finished: Promise<unknown>, onComplete: () => void) => {
			cancelCompletionCheck?.();
			cancelCompletionCheck = undefined;
			const version = ++revision;
			void finished.then(() => {
				const complete = () => {
					if (version !== revision || stopped) {
						cancelFrame(complete);
						return;
					}
					// A completed clock can be paused/sought before replay. Motion
					// then retains its already-resolved finished promise. Preserve that
					// upstream promise while settlement waits for the replay's end.
					let finished = true;
					let running = false;
					if (replaying)
						visitOwned(controls, (owned) =>
							visitPlayback(owned, (child) => {
								if (child.state !== 'finished') finished = false;
								if (child.state === 'running') running = true;
							})
						);
					if (!finished) {
						// No stale-promise polling for held or suspended playback.
						// play/reveal observes again when its clock can make progress.
						if (running && untrack(activity)) {
							if (!cancelCompletionCheck) {
								cancelCompletionCheck = () => cancelFrame(complete);
								frame.postRender(complete, true);
							}
						} else {
							cancelCompletionCheck?.();
							cancelCompletionCheck = undefined;
						}
						return;
					}
					onComplete();
				};
				if (version !== revision || stopped) return;
				complete();
			});
		};
		const observeRemaining = () => {
			const remaining: Promise<unknown>[] = [];
			visitOwned(controls, (child) => remaining.push(child.finished));
			watchCompletion(Promise.all(remaining), release);
		};
		const observe = () => {
			acquire();
			watchCompletion(controls.finished, () => {
				release();
				settle({ status: 'finished' });
			});
		};
		const validate = (allowReplaced = false) => {
			if (!alive || generation !== runGeneration)
				throw new Error('Astra useAnimate: this playback belongs to a detached animation scope.');
			if (stopped) throw new Error('Astra useAnimate: stopped playback cannot restart.');
			if (replaced && !allowReplaced)
				throw new Error('Astra useAnimate: replaced playback cannot restart.');
		};
		observe();
		return new Proxy(controls, {
			get(target, key) {
				if (key === 'settled') return settled;
				const value = Reflect.get(target, key, target);
				if (['play', 'pause', 'complete', 'attachTimeline'].includes(String(key)))
					return (...parameters: unknown[]) => {
						validate();
						if (key === 'play' || key === 'attachTimeline') beginCycle();
						if (settlementPending || key === 'play' || key === 'attachTimeline') acquire();
						if (key === 'play' || key === 'pause' || key === 'complete') {
							resumeOnReveal.length = 0;
						}
						if (key === 'play' && !untrack(activity)) {
							revision++;
							visitOwned(controls, (child) => resumeOnReveal.push(child));
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
										owner: resolvedMotionPlaybackDriver(animation),
										connect() {
											const revoked = interrupted.some(
												(playback) => resolvedMotionPlaybackDriver(playback) === observer.owner
											);
											if (!dispose && !stopped && !revoked) dispose = timeline.observe(animation);
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
								? detachTimeline
									? run.stop('cancelled')
									: completeMotionPlayback(target)
								: key === 'play'
									? playPlayback(target)
									: value.apply(target, parameters);
						if (key === 'attachTimeline') {
							detachTimeline = result;
							return () => run.stop('cancelled');
						}
						if (!stopped && settlementPending) observe();
						return result;
					};
				if (key === 'stop' || key === 'cancel')
					return () => {
						if (stopped) return;
						validate(true);
						run.stop(key === 'cancel' ? 'cancelled' : 'stopped', key === 'cancel');
					};
				return typeof value === 'function' ? value.bind(target) : value;
			},
			set(target, key, value) {
				validate();
				const result = Reflect.set(target, key, value, target);
				if (settlementPending) observe();
				else acquire();
				return result;
			}
		});
	}) as ScopedAnimate;
	return [scope, animate];
}
