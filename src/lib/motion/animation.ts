import {
	animateTarget,
	calcChildStagger,
	createAnimationState,
	frame,
	setTarget,
	type AnimationDefinition,
	type TargetAndTransition,
	type VisualElement,
	type VisualElementAnimationOptions
} from 'motion-dom';
import { resolveMotionTarget } from './targets.js';
import { prepareMotionHandoff } from './motion-compat.js';

type Versions = Map<string, number>;
const versions = new WeakMap<VisualElement, Versions>();
const epochs = new WeakMap<VisualElement, number>();
const ownershipGuards = new WeakMap<VisualElement, (target: TargetAndTransition) => void>();

/** The visual owner validates inherited targets before Motion writes their first value. */
export function setMotionAnimationGuard(
	visual: VisualElement,
	guard: (target: TargetAndTransition) => void
) {
	ownershipGuards.set(visual, guard);
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
		const target = resolveMotionTarget(visual.getProps(), definition, options.custom, visual);
		const transition = visual.shouldReduceMotion
			? {}
			: (options.transitionOverride ?? target?.transition ?? visual.getDefaultTransition() ?? {});
		const own = async () => {
			if (!current() || !target) return;
			ownershipGuards.get(visual)?.(target);
			const { transitionEnd, ...values } = target;
			// Settle already-finished native effects before Motion replaces targets.
			// Running values remain entirely under Motion's priority/interruption logic.
			visual.values.forEach((value) =>
				prepareMotionHandoff(value.animation, { finishedOnly: !visual.shouldReduceMotion })
			);
			await Promise.all(
				animateTarget(
					visual,
					values,
					visual.shouldReduceMotion
						? { ...options, delay: 0, transitionOverride: { type: false, duration: 0, delay: 0 } }
						: options
				)
			);
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
