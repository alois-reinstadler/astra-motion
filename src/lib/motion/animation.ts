import {
	animateTarget,
	calcChildStagger,
	createAnimationState,
	frame,
	GroupAnimationWithThen,
	setTarget,
	resolveTransition,
	type AnimationPlaybackControls,
	type AnimationPlaybackControlsWithThen,
	type AnimationDefinition,
	type MotionPath,
	type Transition,
	type TargetAndTransition,
	type VisualElement,
	type VisualElementAnimationOptions
} from 'motion-dom';
import { resolveMotionTarget } from './targets.js';
import { prepareMotionHandoff } from './motion-compat.js';
import { startOwnedMotionAnimations } from './animation-ownership.js';

type Versions = Map<string, number>;
const versions = new WeakMap<VisualElement, Versions>();
const epochs = new WeakMap<VisualElement, number>();
const activityReaders = new WeakMap<VisualElement, () => boolean>();
const pathAnimations = new WeakSet<AnimationPlaybackControls>();

/** Path progress is positional even though the engine's private value has no name. */
export function isMotionPathAnimation(playback: AnimationPlaybackControls): boolean {
	return pathAnimations.has(playback);
}

/** Register one positional driver on both public values without introducing a second renderer. */
export function ownMotionPathPlayback(
	visual: VisualElement,
	playback: AnimationPlaybackControlsWithThen
): void {
	pathAnimations.add(playback);
	for (const key of ['x', 'y']) {
		const value = visual.getValue(key, visual.latestValues[key] ?? 0);
		void value.start((complete) => {
			void playback.finished.then(complete);
			return playback;
		});
	}
}
/** Imperative controls inherit the activity of each visual, including external handles. */
export function setMotionAnimationActivity(visual: VisualElement, reader: () => boolean): void {
	activityReaders.set(visual, reader);
}
export function isMotionAnimationActive(visual: VisualElement): boolean {
	return activityReaders.get(visual)?.() ?? true;
}

/**
 * arc() owns a private progress value upstream. Give its returned playback to
 * the axes it drives, so ordinary value replacement, stop and teardown own it.
 * Geometry and sampling remain the engine's public MotionPath implementation.
 */
export function animateMotionPath(
	visual: VisualElement,
	path: MotionPath,
	target: TargetAndTransition,
	transition: Transition | undefined,
	delay: number,
	animations: AnimationPlaybackControlsWithThen[]
): void {
	if (!('x' in target || 'y' in target)) return;
	const axes = ['x', 'y'].map((key) => visual.getValue(key, visual.latestValues[key] ?? 0));
	for (const value of axes) value.stop();
	const first = animations.length;
	path.animateVisualElement(visual, target, transition, delay, animations);
	const owned = animations.slice(first);
	if (!owned.length) return;
	const playback = owned.length === 1 ? owned[0] : new GroupAnimationWithThen(owned);
	for (const animation of owned) pathAnimations.add(animation);
	ownMotionPathPlayback(visual, playback);
}

function ownedPathTransition(transition: Transition | undefined): Transition | undefined {
	const path = transition?.path;
	if (!path) return transition;
	return {
		...transition,
		path: {
			...path,
			animateVisualElement(visual, target, configuration, delay, animations) {
				// Reduced transforms follow animateTarget's ordinary instant path.
				if (
					(configuration as (Transition & { reduceMotion?: boolean }) | undefined)?.reduceMotion ??
					visual.shouldReduceMotion
				)
					return;
				animateMotionPath(visual, path, target, configuration, delay, animations);
			}
		}
	};
}
type Run = Map<VisualElement, Versions>;

/** Cancel deferred orchestration/transitionEnd, without destroying externally owned values. */
export function cancelMotionSequence(visual: VisualElement) {
	epochs.set(visual, (epochs.get(visual) ?? 0) + 1);
	visual.variantChildren?.forEach(cancelMotionSequence);
}

/** Motion owns target animation and stagger calculation; we gate asynchronous handoffs. */
export function animateMotionDefinition(
	visual: VisualElement,
	definition: AnimationDefinition,
	options: VisualElementAnimationOptions = {},
	parentCurrent: () => boolean = () => true,
	run: Run = new Map()
): Promise<void> {
	const type = options.type ?? 'animate';
	let committed = versions.get(visual);
	if (!committed) versions.set(visual, (committed = new Map()));
	let requested = run.get(visual);
	if (!requested) run.set(visual, (requested = new Map()));
	let version = requested.get(type);
	if (version === undefined) {
		version = (committed.get(type) ?? 0) + 1;
		committed.set(type, version);
		requested.set(type, version);
	}
	const epoch = epochs.get(visual) ?? 0;
	const current = () =>
		Boolean(visual.current) &&
		parentCurrent() &&
		committed.get(type) === version &&
		(epochs.get(visual) ?? 0) === epoch;
	if (!current()) return Promise.resolve();
	visual.notify('AnimationStart', definition);
	async function animateResolved() {
		const target = resolveMotionTarget(
			visual.getProps(),
			definition,
			type === 'exit' ? visual.presenceContext?.custom : options.custom,
			visual
		);
		const transition =
			options.transitionOverride ?? target?.transition ?? visual.getDefaultTransition() ?? {};
		const own = async () => {
			if (!current() || !target) return;
			const { transitionEnd, ...values } = target;
			const pathTransition = ownedPathTransition(transition);
			// Settle already-finished native effects before Motion replaces targets.
			// Running values remain entirely under Motion's priority/interruption logic.
			visual.values.forEach((value) =>
				prepareMotionHandoff(value.animation, { finishedOnly: true })
			);
			const ownedTarget = pathTransition?.path ? { ...values, transition: pathTransition } : values;
			const effectiveTransition = ownedTarget.transition
				? resolveTransition(ownedTarget.transition, visual.getDefaultTransition())
				: visual.getDefaultTransition();
			const animations = startOwnedMotionAnimations(
				visual,
				() =>
					animateTarget(
						visual,
						ownedTarget,
						options.transitionOverride && pathTransition?.path
							? { ...options, transitionOverride: pathTransition }
							: options
					),
				effectiveTransition?.reduceMotion
			);
			if (animations.length) await Promise.all(animations);
			else await new Promise<void>((resolve) => frame.update(() => resolve()));

			if (transitionEnd && current())
				await new Promise<void>((resolve) =>
					frame.update(() => {
						if (current()) {
							setTarget(visual, transitionEnd);
							visual.render();
						}
						resolve();
					})
				);
		};
		const children = async (forwardDelay = 0) => {
			if (
				!current() ||
				(typeof definition !== 'string' && !Array.isArray(definition)) ||
				!visual.variantChildren
			)
				return;
			const { delayChildren = 0, staggerChildren, staggerDirection } = transition;
			await Promise.all(
				[...visual.variantChildren].map((child) =>
					animateMotionDefinition(
						child,
						definition,
						{
							...options,
							delay:
								forwardDelay +
								(typeof delayChildren === 'function' ? 0 : delayChildren) +
								calcChildStagger(
									visual.variantChildren!,
									child,
									delayChildren,
									staggerChildren,
									staggerDirection
								)
						},
						current,
						run
					)
				)
			);
		};
		if (transition.when === 'beforeChildren') {
			await own();
			await children();
		} else if (transition.when === 'afterChildren') {
			await children();
			await own();
		} else await Promise.all([own(), children(options.delay)]);
	}
	return animateResolved().then(() => {
		if (current()) visual.notify('AnimationComplete', definition);
	});
}

export function ensureMotionAnimationState(visual: VisualElement) {
	if (visual.animationState) return visual.animationState;
	visual.animationState = createAnimationState(visual);
	visual.animationState.setAnimateFunction(
		(node: VisualElement) =>
			(
				animations: { animation: AnimationDefinition; options?: VisualElementAnimationOptions }[]
			) => {
				const run: Run = new Map();
				// Motion emits one request per label. Merge requests of the same type
				// before starting values, so overlapping labels cannot cancel their own promises.
				const grouped = new Map<string, typeof animations>();
				for (const request of animations) {
					const type = request.options?.type ?? 'animate';
					const group = grouped.get(type) ?? [];
					group.push(request);
					grouped.set(type, group);
				}
				return Promise.all(
					[...grouped.values()].flatMap((group) =>
						group.length > 1 && group.every(({ animation }) => typeof animation === 'string')
							? [
									animateMotionDefinition(
										node,
										group.map(({ animation }) => animation as string),
										group[0].options,
										undefined,
										run
									)
								]
							: group.map(({ animation, options }) =>
									animateMotionDefinition(node, animation, options, undefined, run)
								)
					)
				);
			}
	);
	return visual.animationState;
}
