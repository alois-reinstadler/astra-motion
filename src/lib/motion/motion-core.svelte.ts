import { flushSync, untrack } from 'svelte';
import { createAttachmentKey, type Attachment } from 'svelte/attachments';
import {
	buildHTMLStyles,
	getVariantContext,
	camelToDash,
	resolveMotionValue,
	setTarget,
	transformProps,
	type HTMLVisualElement,
	type HTMLRenderState,
	type MotionNodeOptions,
	type MotionStyle,
	type ResolvedValues,
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
import {
	assertMotionTransformOwnership,
	ensureMotionVisual,
	registerMotionVisual,
	scheduleMotionState
} from './visual.js';
import { createPresenceTimeline, type PresenceTimeline } from './presence-state.js';
import type { attachMotionGestures, GestureOptions } from './gestures.js';
import { resolveMotionTarget } from './targets.js';
import { coordinatePresence } from './presence-batch.js';
import { claimMotionOwnership } from './ownership.js';
import { prepareMotionHandoff } from './motion-compat.js';
import { renderedMotionStyle } from './rendered-style.js';
import { snapshotMotionOptions } from './options-snapshot.js';
import {
	ensureMotionAnimationState,
	animateMotionDefinition,
	cancelMotionSequence
} from './animation.js';

export type MotionTarget = TargetAndTransition | VariantLabels;
export interface MotionOptions extends MotionConfigOptions, GestureOptions {
	initial?: MotionTarget | false;
	animate?: MotionTarget;
	exit?: MotionTarget;
	variants?: Variants;
	custom?: unknown;
	style?: MotionStyle;
	layout?: boolean | LayoutOptions;
	layoutGroup?: LayoutController;
	onAnimationStart?: MotionNodeOptions['onAnimationStart'];
	onAnimationComplete?: MotionNodeOptions['onAnimationComplete'];
	onUpdate?: MotionNodeOptions['onUpdate'];
}

function resolved(
	options: MotionOptions,
	definition: MotionTarget | undefined,
	visual?: HTMLVisualElement
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

function initialValues(options: MotionOptions): ResolvedValues {
	const values: ResolvedValues = {};
	for (const [key, value] of Object.entries(options.style ?? {})) {
		const latest = resolveMotionValue(value);
		if (typeof latest === 'number' || typeof latest === 'string') values[key] = latest;
	}
	const immediate = options.initial === false || options.reducedMotion === 'always';
	const target = resolved(
		options,
		immediate
			? options.animate
			: ((options.initial === false ? undefined : options.initial) ?? options.animate)
	);
	for (const [key, value] of Object.entries(target)) {
		if (key === 'transition' || key === 'transitionEnd') continue;
		const frame = Array.isArray(value) ? value[immediate ? value.length - 1 : 0] : value;
		if (typeof frame === 'number' || typeof frame === 'string') values[key] = frame;
	}
	for (const [key, value] of Object.entries(target.transitionEnd ?? {})) {
		if (typeof value === 'number' || typeof value === 'string') values[key] = value;
	}
	return values;
}

function assertTransformOwnership(
	config: MotionOptions,
	visual?: HTMLVisualElement,
	additional?: MotionTarget
) {
	const definitions = [
		config.animate,
		config.exit,
		config.initial === false ? undefined : config.initial,
		config.whileHover,
		config.whileTap,
		config.whileFocus,
		config.whileDrag,
		config.whileInView,
		additional
	];
	let raw = false;
	let decomposed = false;
	const collect = (values: object) => {
		for (const [key, value] of Object.entries(values)) {
			if (value === undefined || value === null) continue;
			if (key === 'transform') raw = true;
			else if (transformProps.has(key)) decomposed = true;
		}
	};
	collect(config.style ?? {});
	collect(visual?.latestValues ?? {});
	for (const definition of definitions) {
		const target = resolved(config, definition, visual);
		collect(target);
		collect(target.transitionEnd ?? {});
	}
	if (raw && (config.layout || decomposed)) {
		throw new Error(
			'Astra motion: raw transform cannot compose with layout or x/y/rotate/scale values on the same binding. Use individual Motion values in style and targets instead.'
		);
	}
}

function inlineStyle(values: ResolvedValues): string {
	const state: HTMLRenderState = { style: {}, vars: {}, transform: {}, transformOrigin: {} };
	buildHTMLStyles(state, values);
	return Object.entries({ ...state.style, ...state.vars })
		.map(([key, value]) => `${key.startsWith('--') ? key : camelToDash(key)}:${value}`)
		.join(';');
}

export interface MotionBinding {
	props: { style: string; [key: symbol]: Attachment<HTMLElement> };
	readonly reducedMotion: boolean;
	transition(node: HTMLElement): (options?: { direction: 'in' | 'out' }) => PresenceTimeline;
	animate(target: MotionTarget, transition?: Transition): Promise<void>;
	stop(): void;
	update: typeof updateLayout;
	/** A native descendant binding with SSR-safe variant label inheritance. */
	child(input?: MotionOptions | (() => MotionOptions)): MotionBinding;
}
type VariantSource = {
	initial?: VariantLabels | false;
	animate?: VariantLabels;
	exit?: VariantLabels;
};
const label = (value: unknown): value is VariantLabels =>
	typeof value === 'string' || Array.isArray(value);

/** A single native-element binding. Spread props for matching SSR/client initial styles. */
export interface MotionFeatures {
	layout?: { create: typeof createLayout; update: typeof updateLayout };
	gestures?: typeof attachMotionGestures;
}

/** Internal construction boundary: entrypoints select features without global registration. */
export function createMotionWithFeatures(
	input: MotionOptions | (() => MotionOptions),
	features: MotionFeatures
): MotionBinding {
	return createBinding(input, features);
}
function createBinding(
	input: MotionOptions | (() => MotionOptions),
	features: MotionFeatures,
	parentSource: () => VariantSource = () => ({}),
	parentElement?: () => HTMLElement | undefined
): MotionBinding {
	const inherited = readMotionConfig();
	const options = (): MotionOptions => ({
		...inherited(),
		...(typeof input === 'function' ? input() : input)
	});
	const source = (): VariantSource => {
		const config = options();
		const parent = parentSource();
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
			initial: config.initial ?? inherited.initial,
			animate: config.animate ?? inherited.animate
		};
	};
	const first = untrack(initialOptions);
	assertFeatures(first);
	assertTransformOwnership(first);
	function assertFeatures(config: MotionOptions) {
		if (!features.layout && (config.layout || config.layoutGroup))
			throw new Error(
				'Astra motion: layout requires createMotion from astra-motion/state. The lite entry supports state and presence.'
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
				'Astra motion: gestures require createMotion from astra-motion/state. The lite entry supports state and presence.'
			);
	}
	let initial = initialValues(first);
	let style = inlineStyle(initial);
	let element: HTMLElement | undefined;
	let retainedNode: HTMLElement | undefined;
	let visual: HTMLVisualElement | undefined;
	let timeline: PresenceTimeline | undefined;
	let transitioning = false;
	let introTarget: unknown[] = [];
	let presenceDirection: 'in' | 'out' = 'in';
	let disposed = false;
	let preferenceVersion = $state(0);
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
		if (!element || !features.layout) return;
		const layout = typeof config.layout === 'object' ? config.layout : {};
		const keys: unknown[] = [
			Boolean(config.layout),
			config.layoutGroup,
			layout.id,
			layout.mode,
			layout.scroll,
			layout.root
		];
		for (const [key, value] of Object.entries(layout.style ?? {}).sort(([a], [b]) =>
			a.localeCompare(b)
		))
			keys.push(key, value);
		if (
			keys.length === layoutKeys.length &&
			keys.every((key, i) => Object.is(key, layoutKeys[i]))
		) {
			if (config.layout) layoutBridge.refreshPolicy?.(element);
			return;
		}
		layoutKeys = keys;
		removeLayout?.();
		removeLayout = config.layout
			? (config.layoutGroup ?? getDefaultLayout())(layout)(element)
			: undefined;
	}
	let removeGestures: void | (() => void);
	let gestureKeys: unknown[] = [];
	function pauseGestures() {
		removeGestures?.();
		removeGestures = undefined;
		gestureKeys = [];
	}
	function syncGestures(config: MotionOptions) {
		if (!element || !visual || !features.gestures || presenceDirection === 'out') return;
		const keys = [
			Boolean(config.whileHover || config.onHoverStart || config.onHoverEnd),
			Boolean(config.whileTap || config.onTap || config.onTapStart || config.onTapCancel),
			Boolean(config.whileFocus),
			Boolean(config.whileInView || config.onViewportEnter || config.onViewportLeave),
			config.viewport?.root?.current,
			config.viewport?.margin,
			config.viewport?.amount,
			config.viewport?.once,
			config.drag,
			Boolean(config.onPan || config.onPanStart || config.onPanEnd || config.onPanSessionStart),
			config.disabled
		];
		if (
			keys.length === gestureKeys.length &&
			keys.every((key, i) => Object.is(key, gestureKeys[i]))
		)
			return;
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
				get transition() {
					return options().layoutTransition ?? options().transition;
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
			...config,
			layout: Boolean(config.layout),
			style: config.style ?? {},
			initial: config.initial ?? (source().initial === false ? false : undefined),
			animate: config.animate
		} as MotionNodeOptions;
	}
	function refresh(config: MotionOptions) {
		if (!visual || disposed) return;
		assertFeatures(config);
		assertTransformOwnership(config, visual);
		if (element) assertMotionTransformOwnership(element, props(config));
		syncLayout(config);
		visual.update(
			{
				...visual.getProps(),
				...props(config),
				transformTemplate: visual.getProps().transformTemplate
			},
			null
		);
		const policyChanged = visual.shouldReduceMotion !== shouldReduceMotion(config);
		visual.shouldReduceMotion = shouldReduceMotion(config);
		ensureMotionAnimationState(visual);
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
		if (visual.shouldReduceMotion) {
			cancelMotionSequence(visual);
			timeline?.finish();
			visual.values.forEach((value) => {
				prepareMotionHandoff(value.animation);
				value.stop();
			});
			setTarget(
				visual,
				resolved(
					config,
					presenceDirection === 'out'
						? (config.exit ??
								getVariantContext(visual.parent)?.exit ??
								(config.initial === false ? undefined : config.initial))
						: (config.animate ?? getVariantContext(visual.parent)?.animate),
					visual
				)
			);
			visual.projection?.finishAnimation();
			visual.render();
		}
		if (!transitioning && presenceDirection === 'in') {
			// Motion must still dispatch inherited variants. Each visual applies its
			// own policy; an explicitly non-reduced child keeps its animation.
			scheduleMotionState(visual, policyChanged || retargeted);
		}
		syncGestures(config);
	}
	const attach: Attachment<HTMLElement> = (node) => {
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
				() => !disposed && !transitioning && presenceDirection === 'in',
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
		queueMicrotask(() => {
			if (disposed || generation !== version) return;
			withBoundary(() => {
				visual = ensureMotionVisual(node)!;
				refresh(options());
			});
		});
		return () => {
			if (generation !== version || disposed) return;
			disposed = true;
			element = undefined;
			retainedNode = node;
			pauseGestures();
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
	};
	// The binding's component owns reactivity. Effects inside an attachment pause
	// during its native outro, which would miss changed policy/targets while retained.
	let revision = 0;
	function observeStateTargets() {
		void preferenceVersion;
		// Lexical variant followers must observe their parent's labels even when a
		// reduced parent settles directly instead of dispatching Motion animation state.
		parentSource();
		const current = snapshotMotionOptions(options());
		// Variant functions can themselves read reactive custom data or state.
		assertFeatures(current);
		assertTransformOwnership(current, visual);
		const latest = ++revision;
		const version = generation;
		queueMicrotask(() => {
			if (!element || disposed || generation !== version || latest !== revision) return;
			withBoundary(() => {
				visual = ensureMotionVisual(element!)!;
				refresh(current);
			});
		});
	}
	$effect(observeStateTargets);
	const bindingProps = {
		get style() {
			if (element && visual) return renderedMotionStyle(element, visual);
			// New mounts resolve current targets; mounted nodes expose their owned
			// inline styles above only when Svelte recomposes author props.
			if (!element) {
				const config = untrack(initialOptions);
				assertFeatures(config);
				assertTransformOwnership(config);
				initial = initialValues(config);
				style = inlineStyle(initial);
			}
			return style;
		},
		[createAttachmentKey()]: attach
	};
	return {
		props: bindingProps,
		child(input = {}) {
			return createBinding(input, features, source, () => element);
		},
		get reducedMotion() {
			void preferenceVersion;
			return shouldReduceMotion(options());
		},
		/** Native Svelte retains the real element while Motion supplies the sampled trajectory. */
		transition(node: HTMLElement) {
			return ({ direction }: { direction: 'in' | 'out' } = { direction: 'in' }) => {
				visual = ensureMotionVisual(node);
				if (!visual)
					throw new Error(
						'Astra motion: spread binding.props on the element using its transition.'
					);
				const config = options();
				assertTransformOwnership(config, visual);
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
					shouldReduceMotion(config) ||
					(direction === 'in' &&
						(config.initial ?? source().initial) === false &&
						!previousTimeline);
				if (immediate) target = { ...target, transition: { duration: 0 } };
				const transition: Transition = immediate
					? { duration: 0 }
					: (config.transition ?? { type: 'spring', stiffness: 420, damping: 38 });
				const trajectory = createPresenceTimeline(
					visual,
					{ ...visual.latestValues },
					target,
					transition,
					direction,
					{
						complete() {
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
			try {
				assertTransformOwnership(options(), visual, target);
				if (element)
					assertMotionTransformOwnership(element, props(), resolved(options(), target, visual));
			} catch (error) {
				return Promise.reject(error);
			}
			timeline?.cancel();
			transitioning = false;
			if (shouldReduceMotion(options())) {
				visual.values.forEach((value) => {
					prepareMotionHandoff(value.animation);
					value.stop();
				});
				setTarget(visual, resolved(options(), target, visual));
				visual.render();
				return Promise.resolve();
			}
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
