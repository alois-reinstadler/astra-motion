import { diagnoseMotionOptions, diagnoseInfiniteExit } from './diagnostics.js';
import { flushSync, untrack } from 'svelte';
import { createAttachmentKey, type Attachment } from 'svelte/attachments';
import {
	isMotionValue,
	isAnimationControls,
	getVariantContext,
	getValueTransition,
	resolveTransition,
	camelToDash,
	setTarget,
	cancelFrame,
	frame,
	positionalKeys,
	type MotionNodeOptions,
	type MotionStyle,
	type TargetAndTransition,
	type VariantLabels,
	type Variants,
	type Transition
} from 'motion-dom';
import type { createLayout, updateLayout, LayoutController, LayoutOptions } from './layout.js';
import { layoutBridge, synchronousMutation } from './commit.js';
import {
	readMotionConfig,
	observeMotionPreference,
	observeMotionConfig,
	type MotionConfigOptions
} from './config.js';
import { shouldReduceMotion } from './policy.js';
import { ensureMotionVisual, registerMotionVisual, scheduleMotionState } from './visual.js';
import { createPresenceTimeline, type PresenceTimeline } from './presence-state.js';
import type { attachMotionGestures, GestureOptions } from './gestures.js';
import { resolveMotionTarget } from './targets.js';
import { coordinatePresence } from './presence-batch.js';
import { claimMotionOwnership } from './ownership.js';
import { pauseMotionPlayback, prepareMotionHandoff } from './motion-compat.js';
import { ownsMotionAnimation, allowsMotionReduction } from './animation-ownership.js';
import { renderedMotionStyle } from './rendered-style.js';
import { snapshotMotionOptions } from './options-snapshot.js';
import {
	isSVGElement,
	type MotionElement,
	type MotionVisual,
	type MotionRenderOptions,
	type MotionTree,
	type VariantSource
} from './motion-types.js';
import { svgRenderState, svgAttributeName } from './svg.js';
import {
	styleValues,
	resolveInitialMotionValues,
	inlineMotionStyle as inlineStyle
} from './initial-render.js';
import { readLayoutScope } from './layout-context.js';
import {
	readPresenceScope,
	type PresenceSnapshot,
	type PresenceRegistration
} from './presence-context.svelte.js';
import { readActivityState } from './activity-scope.js';
import { resolveElement } from './coordinates.js';
import {
	ensureMotionAnimationState,
	animateMotionDefinition,
	cancelMotionSequence,
	setMotionAnimationActivity
} from './animation.js';

export type MotionTarget = TargetAndTransition | VariantLabels;
export interface MotionOptions extends MotionConfigOptions, GestureOptions {
	ignoreStrict?: boolean;
	initial?: MotionTarget | false;
	animate?: MotionNodeOptions['animate'];
	exit?: MotionTarget;
	variants?: Variants;
	inherit?: boolean;
	transformTemplate?: MotionNodeOptions['transformTemplate'];
	custom?: unknown;
	style?: MotionStyle;
	layout?: boolean | 'position' | 'size' | 'preserve-aspect' | 'x' | 'y' | LayoutOptions;
	layoutId?: string;
	layoutDependency?: unknown;
	layoutScroll?: boolean;
	layoutRoot?: boolean;
	layoutAnchor?: MotionNodeOptions['layoutAnchor'];
	layoutCrossfade?: boolean;
	onBeforeLayoutMeasure?: MotionNodeOptions['onBeforeLayoutMeasure'];
	onLayoutMeasure?: MotionNodeOptions['onLayoutMeasure'];
	onLayoutAnimationStart?: MotionNodeOptions['onLayoutAnimationStart'];
	onLayoutAnimationComplete?: MotionNodeOptions['onLayoutAnimationComplete'];
	layoutGroup?: LayoutController;
	onAnimationStart?: MotionNodeOptions['onAnimationStart'];
	onAnimationComplete?: MotionNodeOptions['onAnimationComplete'];
	onUpdate?: MotionNodeOptions['onUpdate'];
}

function resolved(
	options: MotionOptions,
	definition: MotionOptions['animate'],
	visual?: MotionVisual
): TargetAndTransition {
	return resolveMotionTarget(options as MotionNodeOptions, definition, options.custom, visual);
}

// Snapshot resolved values, including keyframes and transitionEnd. Options getters
// commonly create fresh objects, so reference identity cannot detect retargeting.
function targetSnapshot(target: TargetAndTransition): unknown[] {
	const snapshot: unknown[] = [];
	for (const values of [target, target.transitionEnd ?? {}]) {
		const entries = Object.entries(values)
			.filter(([key]) => key !== 'transition' && key !== 'transitionEnd')
			.sort(([a], [b]) => a.localeCompare(b));
		snapshot.push(entries.length);
		for (const [key, value] of entries) {
			snapshot.push(key, ...(Array.isArray(value) ? [value.length, ...value] : [value]));
		}
	}
	return snapshot;
}

export interface MotionBinding {
	readonly tree: MotionTree;
	readonly attach: Attachment<MotionElement>;
	props: { style: string; [key: symbol]: Attachment<MotionElement> };
	readonly reducedMotion: boolean;
	transition(node: MotionElement): (options?: { direction: 'in' | 'out' }) => PresenceTimeline;
	animate(target: MotionTarget, transition?: Transition): Promise<void>;
	stop(): void;
	update: typeof updateLayout;
	/** A native descendant binding with SSR-safe variant label inheritance. */
	child(input?: MotionOptions | (() => MotionOptions), render?: MotionRenderOptions): MotionBinding;
}
const label = (value: unknown): value is VariantLabels =>
	typeof value === 'string' || Array.isArray(value);

/** A single native-element binding. Spread props for matching SSR/client initial styles. */
export interface MotionFeatures {
	layout?: { create: typeof createLayout; update: typeof updateLayout };
	gestures?: typeof attachMotionGestures;
	drag?: boolean;
}

/** Internal construction boundary: entrypoints select features without global registration. */
export function createBindingWithFeatures(
	input: MotionOptions | (() => MotionOptions),
	features: MotionFeatures,
	render: MotionRenderOptions = {}
): MotionBinding {
	return createBinding(
		input,
		features,
		render.environment?.parent?.source,
		render.environment?.parent?.element,
		render
	);
}
function createBinding(
	input: MotionOptions | (() => MotionOptions),
	features: MotionFeatures,
	parentSource: () => VariantSource = () => ({}),
	parentElement?: () => MotionElement | undefined,
	render: MotionRenderOptions = {}
): MotionBinding {
	const inherited = render.environment?.config ?? readMotionConfig();
	const layoutScope = render.environment ? render.environment.layout : readLayoutScope();
	const presence = render.environment ? render.environment.presence : readPresenceScope();
	const isActivityActive = render.environment?.activity ?? readActivityState();
	const options = (): MotionOptions => ({
		reducedMotion: 'never',
		layoutGroup: layoutScope?.controller,
		...inherited(),
		...(typeof input === 'function' ? input() : input)
	});
	const source = (): VariantSource => {
		const config = options();
		const parent = config.inherit === false ? {} : parentSource();
		return {
			initial: config.initial === false || label(config.initial) ? config.initial : parent.initial,
			animate: label(config.animate) ? config.animate : parent.animate,
			exit: label(config.exit) ? config.exit : parent.exit
		};
	};
	const initialOptions = () => {
		const config = options();
		const inherited = source();
		return {
			...config,
			initial: presence?.snapshot.initial === false ? false : (config.initial ?? inherited.initial),
			animate: config.animate ?? inherited.animate
		};
	};
	const first = untrack(initialOptions);
	assertFeatures(first);
	function assertFeatures(config: MotionOptions) {
		if (
			render.lazy &&
			!features.drag &&
			(config.drag ||
				config.dragControls ||
				config.onPan ||
				config.onPanStart ||
				config.onPanEnd ||
				config.onPanSessionStart)
		)
			throw new Error('Astra LazyMotion: drag and pan require the domMax feature bundle.');
		if (
			!features.layout &&
			(config.layout || config.layoutId || config.layoutScroll || config.layoutRoot)
		)
			throw new Error(
				render.lazy
					? 'Astra LazyMotion: layout requires the domMax feature bundle.'
					: 'Astra motion: layout requires motion.bind from astra-motion/state. The lite entry supports state and presence.'
			);
		if (
			!features.gestures &&
			Object.entries(config).some(
				([key, value]) =>
					value !== undefined &&
					value !== false &&
					(key.startsWith('while') ||
						key.startsWith('drag') ||
						key.startsWith('onHover') ||
						key.startsWith('onTap') ||
						key.startsWith('onPan') ||
						key.startsWith('onDrag') ||
						key.startsWith('onViewport') ||
						key === 'viewport')
			)
		)
			throw new Error(
				'Astra motion: gestures require motion.bind from astra-motion/state. The lite entry supports state and presence.'
			);
	}
	const readInitial = (config: MotionOptions) => resolveInitialMotionValues(config, render);
	let initial = render.initialValues ?? readInitial(first);
	let style = inlineStyle({ ...styleValues(first, false), ...initial }, first.transformTemplate);
	let element: MotionElement | undefined;
	let retainedNode: MotionElement | undefined;
	let visual: MotionVisual | undefined;
	let reducedMotionPolicy = shouldReduceMotion(first);
	let timeline: PresenceTimeline | undefined;
	let transitioning = false;
	let nativeTransitionVersion = 0;
	let introTarget: unknown[] = [];
	let presenceDirection: 'in' | 'out' = 'in';
	let disposed = false;
	let presenceRegistration: PresenceRegistration | undefined;
	let presenceGeneration = -1;
	let presenceExitVersion = 0;
	let releaseProjectionExit: (() => void) | undefined;
	let managedExitComplete = false;
	let activityActive = untrack(isActivityActive);
	let pausedAnimations: { isPaused(): boolean; resume(): void }[] = [];
	function presenceContext() {
		const snapshot = presence?.snapshot;
		return snapshot ? { ...snapshot, id: 'astra-presence', register: () => () => {} } : null;
	}
	function syncPresence(snapshot: PresenceSnapshot) {
		if (!visual || disposed) return;
		visual.update(props(), presenceContext());
		if (snapshot.generation === presenceGeneration) return;
		const previous = presenceGeneration;
		presenceGeneration = snapshot.generation;
		const current = snapshot.generation;
		const exitVersion = ++presenceExitVersion;
		releaseProjectionExit?.();
		if (element && !isSVGElement(element)) layoutBridge.presence?.(element, snapshot.isPresent);
		if (snapshot.isPresent && previous === -1) return;
		if (!snapshot.isPresent && previous === -1 && !isActivityActive()) {
			// Consume the suppressed initial pass so the first later reveal is a real
			// entry, even though no animation/frame work ran while initially hidden.
			void ensureMotionAnimationState(visual).animateChanges();
			managedExitComplete = true;
			presenceRegistration?.complete(current);
			return;
		}
		timeline?.cancel();
		transitioning = false;
		presenceDirection = snapshot.isPresent ? 'in' : 'out';
		const state = ensureMotionAnimationState(visual);
		if (snapshot.isPresent) {
			if (managedExitComplete) {
				const config = options();
				if (config.initial) setTarget(visual, resolved(config, config.initial, visual));
				visual.blockInitialAnimation = false;
				state.reset();
				scheduleMotionState(visual, true);
			} else void state.setActive('exit', false);
			managedExitComplete = false;
			syncGestures(options());
		} else {
			pauseGestures();
			// Presence publishes to every registered descendant synchronously. Start after
			// publication so propagated variants resolve the same current boundary custom.
			void Promise.resolve().then(async () => {
				if (disposed || presenceExitVersion !== exitVersion) return;
				const projection = visual!.projection;
				const projectedExit = projection?.options.layoutId
					? new Promise<void>((resolve) => {
							const previous = projection.options.onExitComplete;
							const layoutId = projection.options.layoutId;
							let settled = false;
							const finish = () => {
								if (settled) return;
								settled = true;
								removeComplete();
								cancelFrame(checkIdle);
								if (projection.options.onExitComplete === complete)
									projection.options.onExitComplete = previous;
								if (releaseProjectionExit === finish) releaseProjectionExit = undefined;
								resolve();
							};
							const complete = () => {
								previous?.();
								finish();
							};
							const removeComplete = projection.addEventListener('animationComplete', finish);
							const checkIdle = () => {
								// Match MeasureLayout's idle release and include already-completed
								// instant/reduced-motion shared leads. Keep watching because an exiting
								// follower can detach its layout binding without unmounting its visual.
								const lead = projection.getLead();
								if (
									disposed ||
									presenceExitVersion !== exitVersion ||
									visual?.projection !== projection ||
									projection.options.layoutId !== layoutId ||
									(!lead.currentAnimation && !lead.pendingAnimation)
								)
									finish();
							};
							projection.setOptions({ onExitComplete: complete });
							releaseProjectionExit = finish;
							frame.postRender(checkIdle, true);
						})
					: Promise.resolve();
				if (process.env.NODE_ENV !== 'production') {
					const config = options();
					diagnoseInfiniteExit(
						visual!,
						resolved(config, config.exit ?? getVariantContext(visual!.parent)?.exit, visual),
						config.transition
					);
				}
				await Promise.all([state.setActive('exit', true), projectedExit]);
				if (
					disposed ||
					presenceExitVersion !== exitVersion ||
					presence?.snapshot.isPresent ||
					presence?.snapshot.generation !== current
				)
					return;
				managedExitComplete = true;
				presenceRegistration?.complete(current);
			});
		}
	}
	function syncActivity(active: boolean) {
		if (!visual || active === activityActive) return;
		activityActive = active;
		if (active) {
			for (const animation of pausedAnimations) if (animation.isPaused()) animation.resume();
			pausedAnimations = [];
			visual.render();
			refresh(options());
		} else {
			pauseGestures();
			visual.update({ ...props(), onUpdate: undefined }, presenceContext());
			pausedAnimations = [];
			visual.values.forEach((value) => {
				// MotionValue accepts minimal third-party controls too. Only pause controls
				// that expose the engine's public playback methods; never stop borrowed work.
				const animation = value.animation;
				if (
					animation?.state === 'running' &&
					ownsMotionAnimation(visual!, animation) &&
					'pause' in animation &&
					typeof animation.pause === 'function' &&
					'play' in animation &&
					typeof animation.play === 'function'
				) {
					const play = animation.play.bind(animation);
					pauseMotionPlayback(animation);
					pausedAnimations.push({ isPaused: () => animation.state === 'paused', resume: play });
				}
			});
			visual.projection?.finishAnimation();
			cancelFrame(visual.render);
			cancelFrame(visual.notifyUpdate);
		}
	}
	let preferenceVersion = $state(0);
	let styleVersion = $state(0);
	let deferredError = $state.raw<{ error: unknown }>();
	function withBoundary(action: () => void) {
		try {
			action();
		} catch (error) {
			// Work queued after attachment still belongs to this binding's component.
			// Throw from its effect so <svelte:boundary> can recover and dispose it.
			deferredError = { error };
		}
	}
	$effect(() => {
		if (deferredError) throw deferredError.error;
	});
	let generation = 0;
	let removeLayout: void | (() => void);
	let layoutKeys: unknown[] = [];
	function syncLayout(config: MotionOptions) {
		if (!element || !features.layout || isSVGElement(element)) {
			removeLayout?.();
			removeLayout = undefined;
			layoutKeys = [];
			return;
		}
		const layout: LayoutOptions = {
			...(typeof config.layout === 'object' ? config.layout : {}),
			...(typeof config.layout === 'string' ? { mode: config.layout } : {}),
			...(config.layoutId !== undefined ? { id: config.layoutId } : {}),
			...(config.layoutScroll !== undefined ? { scroll: config.layoutScroll } : {}),
			...(config.layoutRoot !== undefined ? { root: config.layoutRoot } : {}),
			...(config.layoutAnchor !== undefined ? { anchor: config.layoutAnchor } : {}),
			...(config.layoutCrossfade !== undefined ? { crossfade: config.layoutCrossfade } : {}),
			...(config.layoutDependency !== undefined ? { dependency: config.layoutDependency } : {}),
			measureOnly: !config.layout && config.layoutId === undefined
		};
		const enabled = Boolean(
			config.layout ||
			config.layoutId !== undefined ||
			config.layoutScroll ||
			config.layoutRoot ||
			config.drag
		);
		const keys: unknown[] = [
			features.layout,
			enabled,
			config.layoutGroup,
			layout.id,
			layout.mode,
			layout.scroll,
			layout.root,
			typeof layout.anchor === 'object' ? layout.anchor.x : layout.anchor,
			typeof layout.anchor === 'object' ? layout.anchor.y : undefined,
			layout.crossfade,
			layout.dependency,
			layout.measureOnly
		];
		for (const [key, value] of Object.entries(layout.style ?? {}).sort(([a], [b]) =>
			a.localeCompare(b)
		))
			keys.push(key, value);
		if (
			keys.length === layoutKeys.length &&
			keys.every((key, i) => Object.is(key, layoutKeys[i]))
		) {
			if (enabled) layoutBridge.refreshPolicy?.(element);
			return;
		}
		layoutKeys = keys;
		removeLayout?.();
		removeLayout = enabled
			? (config.layoutGroup ?? getDefaultLayout())(layout)(element)
			: undefined;
	}
	let removeGestures: void | ReturnType<typeof attachMotionGestures>;
	let gestureKeys: unknown[] = [];
	let subscribedControls: MotionNodeOptions['animate'];
	let unsubscribeControls: (() => void) | undefined;
	function syncControls(config: MotionOptions) {
		const next = isAnimationControls(config.animate) ? config.animate : undefined;
		if (next === subscribedControls) return;
		unsubscribeControls?.();
		subscribedControls = next;
		unsubscribeControls = next && visual ? next.subscribe(visual) : undefined;
	}
	function pauseGestures() {
		removeGestures?.();
		removeGestures = undefined;
		gestureKeys = [];
	}
	function syncGestures(config: MotionOptions) {
		if (
			!element ||
			!visual ||
			!features.gestures ||
			presenceDirection === 'out' ||
			!activityActive
		) {
			pauseGestures();
			return;
		}
		const keys = [
			features.gestures,
			Boolean(config.whileHover || config.onHoverStart || config.onHoverEnd),
			Boolean(config.whileTap || config.onTap || config.onTapStart || config.onTapCancel),
			Boolean(config.whileFocus),
			Boolean(config.whileInView || config.onViewportEnter || config.onViewportLeave),
			resolveElement(config.viewport?.root),
			config.viewport?.margin,
			config.viewport?.amount,
			config.viewport?.once,
			Boolean(config.drag),
			config.dragControls,
			config.dragListener,
			config.dragPropagation,
			config.globalTapTarget,
			config.propagate?.tap,
			Boolean(config.onPan || config.onPanStart || config.onPanEnd || config.onPanSessionStart),
			config.disabled
		];
		if (
			keys.length === gestureKeys.length &&
			keys.every((key, i) => Object.is(key, gestureKeys[i]))
		) {
			removeGestures?.update?.();
			return;
		}
		pauseGestures();
		gestureKeys = keys;
		removeGestures = features.gestures(
			element,
			() => ({
				...options(),
				disabled: options().disabled || presenceDirection === 'out'
			}),
			(name, active) => {
				if (active && transitioning && presenceDirection === 'in') {
					timeline?.cancel();
					transitioning = false;
				}
				if (!disposed) void visual?.animationState?.setActive(name, active);
			},
			visual
		);
	}
	let defaultLayout: LayoutController | undefined;
	function getDefaultLayout(): LayoutController {
		// Construction reads policy getters. The binding's own effect observes these;
		// subscribing the attachment would tear down its native lifecycle on updates.
		return (defaultLayout ??= untrack(() =>
			features.layout!.create({
				id: 'astra-default',
				get transition() {
					return (
						options().layoutTransition ??
						options().transition ?? { duration: 0.45, ease: [0.4, 0, 0.1, 1] }
					);
				},
				get reducedMotion() {
					return options().reducedMotion;
				},
				get automatic() {
					return options().automatic;
				}
			})
		));
	}
	function props(config = options()): MotionNodeOptions {
		return {
			...render.attributes?.(),
			...config,
			layout: Boolean(config.layout),
			style: config.style ?? {},
			initial:
				presence?.snapshot.initial === false
					? false
					: (config.initial ?? (source().initial === false ? false : undefined)),
			animate: config.animate
		} as MotionNodeOptions;
	}
	function refresh(config: MotionOptions) {
		if (!visual || disposed || !activityActive) return;
		assertFeatures(config);
		if (process.env.NODE_ENV !== 'production') diagnoseMotionOptions(visual, props(config));
		syncLayout(config);
		const previousProps = visual.getProps() as MotionNodeOptions & Record<string, unknown>;
		const nextProps = props(config) as MotionNodeOptions & Record<string, unknown>;
		if (render.namespace === 'svg') {
			// Preserve explicit removals when merging with the previous visual props.
			for (const alias of ['attrX', 'attrY', 'attrScale'] as const) {
				if (!(alias in nextProps)) nextProps[alias] = undefined;
			}
		}
		const previousStyle = (previousProps as MotionOptions).style ?? {};
		const nextStyle = config.style ?? {};
		const styleKeys = new Set([...Object.keys(previousStyle), ...Object.keys(nextStyle)]);
		const ownedStyleChanged = [...styleKeys].some(
			(key) =>
				!Object.is(
					previousStyle[key as keyof typeof previousStyle],
					nextStyle[key as keyof typeof nextStyle]
				) &&
				(visual!.hasValue(key) || isMotionValue(nextStyle[key as keyof typeof nextStyle]))
		);
		visual.update(
			{
				...previousProps,
				...nextProps,
				transformTemplate: config.transformTemplate
			},
			presenceContext()
		);
		let svgAliasesChanged = false;
		if (render.namespace === 'svg') {
			// Motion scrapes attribute MotionValues, but scalar aliases are seeded
			// only by our initial renderer. Keep their native prop updates live so
			// the generated binding props cannot overwrite them with an old pose.
			for (const [alias, attribute] of [
				['attrX', 'x'],
				['attrY', 'y'],
				['attrScale', 'scale']
			] as const) {
				const next = nextProps[alias];
				if (Object.is(next, previousProps[alias]) || isMotionValue(next)) continue;
				const value = visual.getValue(alias);
				if (value?.hasAnimated && value.liveStyle !== true) continue;
				if (typeof next === 'number' || typeof next === 'string') {
					if (value) value.set(next);
					else visual.setStaticValue(alias, next);
				} else if (next === undefined) {
					visual.removeValue(alias);
					element?.removeAttribute(attribute);
				} else continue;
				svgAliasesChanged = true;
			}
		}
		syncControls(config);
		if (element && !isSVGElement(element)) layoutBridge.refreshPolicy?.(element);
		if (ownedStyleChanged || svgAliasesChanged) {
			// Replacement/removal can change value ownership without scheduling a frame.
			// Render that handoff, then let Svelte drop declarations Motion no longer owns.
			visual.render();
			styleVersion++;
		}
		const nextReducedMotion = shouldReduceMotion(config);
		const policyChanged = reducedMotionPolicy !== nextReducedMotion;
		reducedMotionPolicy = visual.shouldReduceMotion = nextReducedMotion;
		ensureMotionAnimationState(visual);
		if (policyChanged && visual.shouldReduceMotion) {
			timeline?.reduceMotion();
			// A policy update can leave the animation target unchanged. Finish existing
			// positional playback directly; the state resolver correctly skips unchanged
			// targets and must not restart independent paint animations to apply policy.
			const completed: object[] = [];
			visual.values.forEach((value, key) => {
				const animation = value.animation;
				if (
					positionalKeys.has(key) &&
					animation &&
					allowsMotionReduction(animation) &&
					ownsMotionAnimation(visual!, animation) &&
					!completed.includes(animation) &&
					'complete' in animation &&
					typeof animation.complete === 'function'
				) {
					completed.push(animation);
					animation.complete();
				}
			});
			visual.projection?.finishAnimation();
			visual.render();
		}
		let retargeted = false;
		if (transitioning && presenceDirection === 'in') {
			const nextTarget = targetSnapshot(
				resolved(config, config.animate ?? getVariantContext(visual.parent)?.animate, visual)
			);
			retargeted =
				nextTarget.length !== introTarget.length ||
				nextTarget.some((value, index) => !Object.is(value, introTarget[index]));
			if (retargeted) {
				// Keep the native clock for reversal, but stop its stale pose/completion.
				// Motion continues from the sampled values and their current velocity.
				timeline?.cancel();
				transitioning = false;
			}
		}
		if (!transitioning && presenceDirection === 'in') {
			// Motion must still dispatch inherited variants. Each visual applies its
			// own policy; an explicitly non-reduced child keeps its animation.
			scheduleMotionState(visual, policyChanged || retargeted);
		}
		syncGestures(config);
	}
	const attach: Attachment<MotionElement> = (node) =>
		untrack(() => {
			if (element)
				throw new Error('Astra motion: create a separate binding for each native element.');
			const releaseOwnership = claimMotionOwnership(node, 'state', node);
			// Svelte/custom forwarding can replace an attachment on the same element.
			// Preserve its native transition clock until an actual final disposal.
			if (retainedNode !== node) {
				timeline?.cancel();
				timeline = undefined;
				transitioning = false;
				presenceDirection = 'in';
				visual = undefined;
			}
			retainedNode = undefined;
			element = node;
			disposed = false;
			const version = ++generation;
			let unregister = () => {};
			try {
				unregister = registerMotionVisual(
					node,
					initial,
					props,
					() => options().reducedMotion ?? 'user',
					() => !disposed && !transitioning && presenceDirection === 'in' && activityActive,
					parentElement
				);
				const config = untrack(options);
				syncLayout(config);
			} catch (error) {
				disposed = true;
				element = undefined;
				retainedNode = undefined;
				timeline?.cancel();
				timeline = undefined;
				transitioning = false;
				visual = undefined;
				layoutKeys = [];
				unregister();
				queueMicrotask(releaseOwnership);
				throw error;
			}
			const unobserve = observeMotionPreference(() => {
				preferenceVersion++;
				withBoundary(() => refresh(options()));
			});
			const unconfigure = observeMotionConfig(inherited, () =>
				withBoundary(() => refresh(options()))
			);
			presenceRegistration = presence?.register();
			const unregisterNode = presence?.registerNode(node);
			let unsubscribePresence: (() => void) | undefined;
			let restoreScheduleRender: (() => void) | undefined;
			queueMicrotask(() => {
				if (disposed || generation !== version) return;
				withBoundary(() => {
					visual = ensureMotionVisual(node)!;
					setMotionAnimationActivity(visual, isActivityActive);
					const scheduleRender = visual.scheduleRender;
					const wrapped = () => {
						if (activityActive) scheduleRender();
					};
					const currentVisual = visual;
					visual.scheduleRender = wrapped;
					restoreScheduleRender = () => {
						if (currentVisual.scheduleRender === wrapped)
							currentVisual.scheduleRender = scheduleRender;
					};
					if (presence?.snapshot.initial === false) visual.blockInitialAnimation = true;
					unsubscribePresence = presence?.subscribe(syncPresence);
					refresh(options());
				});
			});
			return () => {
				if (generation !== version || disposed) return;
				disposed = true;
				releaseProjectionExit?.();
				element = undefined;
				retainedNode = node;
				pauseGestures();
				unsubscribeControls?.();
				unsubscribeControls = undefined;
				subscribedControls = undefined;
				unsubscribePresence?.();
				restoreScheduleRender?.();
				presenceRegistration?.unregister();
				presenceRegistration = undefined;
				unregisterNode?.();
				unobserve();
				unconfigure();
				removeLayout?.();
				removeLayout = undefined;
				layoutKeys = [];
				unregister();
				queueMicrotask(() => {
					releaseOwnership();
					if (generation !== version) return;
					timeline?.cancel();
					timeline = undefined;
					transitioning = false;
					visual = undefined;
					retainedNode = undefined;
				});
			};
		});
	// The binding's component owns reactivity. Effects inside an attachment pause
	// during its native outro, which would miss changed policy/targets while retained.
	let revision = 0;
	function observeStateTargets() {
		void preferenceVersion;
		const active = isActivityActive();
		// Lexical variant followers must observe their parent's labels even when a
		// reduced parent settles directly instead of dispatching Motion animation state.
		parentSource();
		const current = snapshotMotionOptions(options());
		// SVG attributes are separate from MotionOptions. Read them in the owner's
		// tracked effect, not only in the deferred VisualElement refresh.
		if (render.namespace === 'svg') render.attributes?.();
		// Getter refs must be resolved while the owner's effect is tracking.
		// The queued refresh then replaces the observer when that root changes.
		resolveElement(current.viewport?.root);
		// Variant functions can themselves read reactive custom data or state.
		assertFeatures(current);
		const latest = ++revision;
		const version = generation;
		queueMicrotask(() => {
			if (!element || disposed || generation !== version || latest !== revision) return;
			withBoundary(() => {
				visual = ensureMotionVisual(element!)!;
				setMotionAnimationActivity(visual, isActivityActive);
				syncActivity(active);
				refresh(current);
			});
		});
	}
	$effect(observeStateTargets);
	// Compare the serialized CSS, so target-only changes do not recompose the
	// element style while the projection scheduler measures a layout update.
	const authorStyle = $derived(inlineStyle(styleValues(options(), false)));
	const bindingProps = {
		get style() {
			void styleVersion;
			// Subscribe on the first render, before the attachment creates the visual.
			// Ordinary CSS updates don't schedule a Motion frame or change styleVersion.
			const authored = authorStyle;
			if (element && visual) {
				// Ordinary CSS belongs to Svelte. Keeping it out of latestValues lets
				// object changes/removal and native CSS strings survive later Motion renders.
				const rendered = renderedMotionStyle(element, visual);
				return authored ? `${authored};${rendered}` : rendered;
			}
			// New mounts resolve current targets; mounted nodes expose their owned
			// inline styles above only when Svelte recomposes author props.
			if (!element) {
				const config = untrack(initialOptions);
				assertFeatures(config);
				initial = render.initialValues ?? readInitial(config);
				style = inlineStyle(
					{ ...styleValues(config, false), ...initial },
					config.transformTemplate
				);
			}
			return style;
		},
		[createAttachmentKey()]: attach
	};
	return {
		tree: { source, element: () => element },
		attach,
		get props() {
			if (render.namespace !== 'svg') return bindingProps;
			const config = initialOptions();
			const state = svgRenderState(
				element && visual ? visual.latestValues : readInitial(config),
				render.tag,
				props(config)
			);
			const attributes = Object.fromEntries(
				Object.entries(state.attrs).map(([key, value]) => [svgAttributeName(key), value])
			);
			const css = Object.entries({ ...state.style, ...state.vars })
				.map(([key, value]) => `${key.startsWith('--') ? key : camelToDash(key)}:${value}`)
				.join(';');
			const authored = authorStyle;
			const rendered = element && visual ? renderedMotionStyle(element, visual) : css;
			return {
				...attributes,
				...bindingProps,
				style: authored ? `${authored};${rendered}` : rendered
			};
		},
		child(input = {}, childRender = {}) {
			return createBinding(input, features, source, () => element, {
				environment: render.environment,
				...childRender
			});
		},
		get reducedMotion() {
			void preferenceVersion;
			return shouldReduceMotion(options());
		},
		/** Native Svelte retains the real element while Motion supplies the sampled trajectory. */
		transition(node: MotionElement) {
			return ({ direction }: { direction: 'in' | 'out' } = { direction: 'in' }) => {
				const transitionVersion = ++nativeTransitionVersion;
				visual = ensureMotionVisual(node);
				if (!visual)
					throw new Error(
						'Astra motion: spread binding.props on the element using its transition.'
					);
				setMotionAnimationActivity(visual, isActivityActive);
				const config = options();
				// Component entry uses Motion's frame loop, including repeats, keyframe resolution
				// and inherited orchestration. Native Svelte still owns conditional removal.
				// A retained native exit must reverse through its sampled trajectory below:
				// the state resolver still remembers the unchanged animate target and would
				// otherwise leave the component frozen at its interrupted exit pose.
				if (
					(direction === 'in' && presenceDirection !== 'out') ||
					(direction === 'out' && managedExitComplete && !presence?.snapshot.isPresent)
				) {
					timeline?.cancel();
					transitioning = false;
					presenceDirection = direction;
					if (direction === 'in')
						queueMicrotask(() => {
							if (!disposed) refresh(options());
						});
					return createPresenceTimeline(visual, {}, {}, { duration: 0 }, direction);
				}
				const previousTimeline = timeline;
				cancelMotionSequence(visual);
				timeline?.cancel();
				if (direction === 'out') pauseGestures();
				transitioning = true;
				presenceDirection = direction;
				let target = resolved(
					config,
					direction === 'in'
						? (config.animate ?? getVariantContext(visual.parent)?.animate)
						: (config.exit ??
								getVariantContext(visual.parent)?.exit ??
								(config.initial === false ? undefined : config.initial)),
					visual
				);
				if (direction === 'in') introTarget = targetSnapshot(target);
				const immediate =
					direction === 'in' && (config.initial ?? source().initial) === false && !previousTimeline;
				if (immediate) target = { ...target, transition: { duration: 0 } };
				const transition: Transition = immediate ? { duration: 0 } : (config.transition ?? {});
				const effectiveTransition = target.transition
					? resolveTransition(target.transition, transition)
					: transition;
				if (effectiveTransition?.reduceMotion ?? shouldReduceMotion(config)) {
					const reduction = Object.fromEntries(
						Object.keys(target)
							.filter((key) => positionalKeys.has(key))
							.map((key) => [key, { type: false }])
					);
					target = { ...target, transition: { ...transition, ...target.transition, ...reduction } };
				}
				if (direction === 'in') {
					const effective = resolveTransition(target.transition, transition) ?? transition;
					const hasInfinitePlayback = Object.entries(target).some(([key, value]) => {
						if (key === 'transition' || key === 'transitionEnd' || value === undefined)
							return false;
						const settings = getValueTransition(effective, key);
						return (
							settings?.repeat === Infinity && !settings.skipAnimations && settings.type !== false
						);
					});
					if (hasInfinitePlayback) {
						// Re-entry ends Svelte's retention clock and returns infinite while-present
						// playback to the existing Motion owner. Invalidate only animate targets;
						// a whole state reset would discard active gesture state/initial semantics.
						transitioning = false;
						timeline = undefined;
						ensureMotionAnimationState(visual).getState().animate.prevResolvedValues = {};
						const version = generation;
						queueMicrotask(() => {
							if (
								disposed ||
								generation !== version ||
								nativeTransitionVersion !== transitionVersion ||
								presenceDirection !== 'in' ||
								!visual
							)
								return;
							withBoundary(() => {
								refresh(options());
								scheduleMotionState(visual!, true);
							});
						});
						return createPresenceTimeline(visual, {}, {}, { duration: 0 }, direction);
					}
				}
				const trajectory = createPresenceTimeline(
					visual,
					{ ...visual.latestValues },
					target,
					transition,
					direction,
					{
						start() {
							visual?.notify('AnimationStart', direction === 'in' ? config.animate : config.exit);
						},
						complete() {
							visual?.notify(
								'AnimationComplete',
								direction === 'in' ? config.animate : config.exit
							);
							transitioning = false;
							if (direction === 'in' && !disposed) withBoundary(() => refresh(options()));
						}
					},
					previousTimeline ? () => previousTimeline.progress : undefined,
					true
				);
				timeline = coordinatePresence(
					visual,
					trajectory,
					immediate ? { duration: 0 } : (target.transition ?? transition),
					direction
				);
				if (direction === 'in') syncGestures(config);
				return timeline;
			};
		},
		animate(target: MotionTarget, transition?: Transition): Promise<void> {
			if (!visual)
				return Promise.reject(new Error('Astra motion: animate() requires a mounted element.'));
			if (presenceDirection === 'out')
				return Promise.reject(
					new Error(
						'Astra motion: animate() cannot replace a retained exit. Change Svelte state to reverse the exit.'
					)
				);
			timeline?.cancel();
			transitioning = false;
			return animateMotionDefinition(visual, target, { transitionOverride: transition });
		},
		stop() {
			if (visual) cancelMotionSequence(visual);
			timeline?.cancel();
			transitioning = false;
			visual?.values.forEach((value) => {
				prepareMotionHandoff(value.animation);
				value.stop();
			});
		},
		/** Explicit transaction remains available for integrations with imperative state. */
		update:
			features.layout?.update ??
			((change) => {
				const apply = synchronousMutation(change);
				if (layoutBridge.update) layoutBridge.update(apply);
				else flushSync(apply);
			})
	};
}

if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());
