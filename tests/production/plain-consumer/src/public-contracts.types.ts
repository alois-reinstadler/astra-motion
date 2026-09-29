import type { Component, ComponentProps } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import {
	AnimateActivity,
	AnimatePresence,
	AnimateView,
	LayoutGroup,
	MotionConfig,
	LazyMotion,
	Reorder,
	motion,
	m,
	motionValue,
	useAnimate,
	useAnimation,
	useAnimationControls,
	useMotionValue,
	useMotionTemplate,
	useMotionValueEvent,
	useTransform,
	useSpring,
	useVelocity,
	useTime,
	useAnimationFrame,
	useInView,
	usePageInView,
	useReducedMotion,
	useScroll,
	useDragControls,
	usePresence,
	useIsPresent,
	usePresenceData,
	useActivity,
	useActivityEffect,
	startViewTransition,
	type MotionValue,
	type MotionGetter,
	type UseSpringOptions,
	type MotionReadable,
	type MotionElementSource,
	type AnimationFrameCallback,
	type AnimationFrameOptions,
	type UseInViewOptions,
	type UseScrollOptions,
	type ScrollMotionValues,
	type PresenceState,
	type ActivityMode,
	type ActivityPhase,
	type ActivityState,
	type ReorderAxis,
	type ReorderGroupProps,
	type ReorderItemProps,
	type MotionCreateOptions,
	type LazyMotionProps,
	type FeatureBundle,
	type Transition,
	type Variants,
	type MotionConfigOptions,
	type ViewTransitionHandle
} from 'astra-motion';
import { useAnimate as useMiniAnimate } from 'astra-motion/mini';
import {
	LazyMotion as IsolatedLazyMotion,
	type LazyMotionProps as IsolatedLazyProps
} from 'astra-motion/lazy';
import { Group, Item, type ReorderAxis as IsolatedAxis } from 'astra-motion/reorder';
import { AnimateView as IsolatedView, startViewTransition as startView } from 'astra-motion/view';
import domAnimation, { domAnimation as namedAnimation } from 'astra-motion/features/dom-animation';
import domMax, { domMax as namedMax } from 'astra-motion/features/dom-max';
import * as lightweight from 'astra-motion/m';

// All public entries except the explicitly Kit-owned routing integrations resolve without Kit.
export * as layout from 'astra-motion/layout';
export * as presence from 'astra-motion/presence';
export * as policy from 'astra-motion/policy';
export * as state from 'astra-motion/state';
export * as values from 'astra-motion/values';
export * as animate from 'astra-motion/animate';
export * as scroll from 'astra-motion/scroll';
export * as lite from 'astra-motion/state/lite';
export * as inView from 'astra-motion/in-view';

export const surface = [
	AnimateActivity,
	AnimatePresence,
	AnimateView,
	LayoutGroup,
	MotionConfig,
	LazyMotion,
	Reorder.Group,
	Reorder.Item,
	IsolatedLazyMotion,
	Group,
	Item,
	IsolatedView,
	motion.svg,
	m.path,
	lightweight.circle,
	domAnimation,
	domMax,
	namedAnimation,
	namedMax
];
export type NamedContracts = [
	MotionGetter<number>,
	UseSpringOptions,
	MotionReadable<boolean>,
	MotionElementSource,
	AnimationFrameCallback,
	AnimationFrameOptions,
	UseInViewOptions,
	UseScrollOptions,
	ScrollMotionValues,
	PresenceState,
	ActivityMode,
	ActivityPhase,
	ActivityState,
	ReorderAxis,
	ReorderGroupProps<string>,
	ReorderItemProps<string>,
	MotionCreateOptions,
	LazyMotionProps,
	IsolatedLazyProps,
	IsolatedAxis,
	FeatureBundle,
	Transition,
	Variants,
	MotionConfigOptions
];

// Type-only call site: these lifecycle functions run only during component setup in applications.
export function setupContracts(
	element: HTMLElement,
	svg: SVGElement,
	custom: Component<{ label: string; ref?: HTMLButtonElement | null }, Record<string, never>, 'ref'>
) {
	const x: MotionValue<number> = useMotionValue(1);
	const y = useMotionValue('20px');
	const sum: MotionValue<number> = useTransform([x, x] as const, ([a, b]) => a + b);
	const getter: MotionValue<number> = useTransform(() => x.get() * 2);
	const mapped: MotionValue<string> = useTransform(
		() => x,
		() => [0, 1],
		() => ['0px', '20px']
	);
	const object = useTransform(x, [0, 1], { opacity: [0, 1], color: ['#000', '#fff'] });
	const opacity: MotionValue<number> = object.opacity;
	const color: MotionValue<string> = object.color;
	const template: MotionValue<string> = useMotionTemplate`translateX(${x}px) ${() => y}`;
	const spring: MotionValue<number> = useSpring(
		() => x,
		() => ({ stiffness: 100, duration: 0.5 })
	);
	const stringSpring: MotionValue<string> = useSpring(y);
	const velocity: MotionValue<number> = useVelocity(() => y);
	useMotionValueEvent(
		() => x,
		() => 'change',
		(latest: number) => latest.toFixed()
	);
	useMotionValueEvent(x, 'animationComplete', () => {});
	useAnimationFrame(
		(time: number, delta: number) => void (time + delta),
		() => ({ enabled: true })
	);
	const clock: MotionValue<number> = useTime();
	const viewport: MotionReadable<boolean> = useInView(
		() => element,
		() => ({ amount: 0.5, initial: true, root: () => element })
	);
	const page: MotionReadable<boolean> = usePageInView();
	const reduced: MotionReadable<boolean | null> = useReducedMotion();
	const scrolled: ScrollMotionValues = useScroll(() => ({
		target: () => element,
		container: () => element,
		offset: ['start end', 'end start'],
		trackContentSize: true
	}));
	const [scope, animate] = useAnimate<HTMLDivElement>();
	const attachment: Attachment<HTMLDivElement> = scope.attach;
	animate(x, 2, { duration: 0.2 });
	animate({ value: 0 }, { value: 2 });
	animate(svg, { r: [2, 10] });
	animate([
		['.item', { opacity: [0, 1] }],
		['.item', { x: 20 }, { at: '<' }]
	]);
	const [miniScope, mini] = useMiniAnimate<SVGElement>();
	mini(svg, { opacity: 1 });
	const drag = useDragControls();
	drag.start({} as PointerEvent, { distanceThreshold: 4, snapToCursor: true });
	drag.stop();
	drag.cancel();
	const controls = useAnimationControls();
	void controls.start({ x: 10 });
	controls.set({ x: 0 });
	controls.stop();
	useAnimation();
	const presence: PresenceState = usePresence();
	const present: MotionReadable<boolean> = useIsPresent();
	const data = usePresenceData<{ direction: number }>();
	const activity: ActivityState = useActivity();
	useActivityEffect(() => () => {});
	const handle: ViewTransitionHandle = startViewTransition(
		async ({ addType, signal }) => {
			addType('forward');
			if (signal.aborted) return;
		},
		{ policy: 'replace', types: ['forward'] }
	);
	startView(() => {});
	handle.cancel();
	const Custom = motion.create(custom);
	const customProps: ComponentProps<typeof Custom> = { label: 'Save', animate: { opacity: 1 } };
	// @ts-expect-error Custom component required props remain required.
	const missing: ComponentProps<typeof Custom> = { animate: { opacity: 1 } };
	// @ts-expect-error MotionValue numbers cannot accept string callbacks.
	useMotionValueEvent(x, 'change', (latest: string) => latest);
	// @ts-expect-error Motion values preserve their inferred output type.
	const wrong: MotionValue<number> = mapped;
	// @ts-expect-error Springs accept numeric or unit-string values.
	useSpring({ x: 1 });
	// @ts-expect-error Unsupported viewport threshold values must be rejected.
	useInView(element, { amount: 'invalid' });
	// @ts-expect-error The mini entry does not provide hybrid object animation.
	mini({ value: 0 }, { value: 2 });
	return {
		sum,
		getter,
		mapped,
		opacity,
		color,
		template,
		spring,
		stringSpring,
		velocity,
		clock,
		viewport,
		page,
		reduced,
		scrolled,
		attachment,
		miniScope,
		presence,
		present,
		data,
		activity,
		customProps,
		Custom,
		missing,
		wrong
	};
}
export const nativeButton: ComponentProps<typeof motion.button> = {
	type: 'submit',
	ref: null,
	onclick(event) {
		const node: HTMLButtonElement = event.currentTarget;
		node.checkValidity();
	}
};
export const svgPath: ComponentProps<typeof motion.path> = {
	d: 'M0 0L10 10',
	pathLength: 1,
	animate: { pathLength: 1 },
	ref: null,
	onclick(event) {
		const path: SVGPathElement = event.currentTarget;
		path.getTotalLength();
	}
};
export const invalidButton: ComponentProps<typeof m.button> = {
	// @ts-expect-error Native button props reject anchor attributes.
	href: '/docs'
};
export const invalidRef: ComponentProps<typeof m.circle> = {
	// @ts-expect-error SVG refs retain their precise native type.
	ref: {} as HTMLInputElement
};
export const invalidActivity: ComponentProps<typeof AnimateActivity> = {
	// @ts-expect-error Activity modes match the documented lifecycle.
	mode: 'removed'
};
// @ts-expect-error Axis names are a closed contract.
export const invalidAxis: ReorderAxis = 'grid';
export const raw = motionValue(0);

export const smil: ComponentProps<typeof motion.animate> = {
	attributeName: 'cx',
	values: '5;10;5',
	dur: '1s'
};

export const CreatedButton = motion.create('button');
export const CreatedPath = motion.create('path');
export const CreatedSVGAnchor = m.create('a', { namespace: 'svg' });
export const factoryButton: ComponentProps<typeof CreatedButton> = {
	type: 'submit',
	ref: {} as HTMLButtonElement,
	onclick(event) {
		const button: HTMLButtonElement = event.currentTarget;
		button.checkValidity();
	}
};
export const factoryPath: ComponentProps<typeof CreatedPath> = {
	d: 'M0 0L10 10',
	pathLength: 1,
	ref: {} as SVGPathElement,
	onclick(event) {
		const path: SVGPathElement = event.currentTarget;
		path.getTotalLength();
	}
};
export const factorySVGAnchor: ComponentProps<typeof CreatedSVGAnchor> = {
	href: '#shape',
	ref: {} as SVGAElement,
	onclick(event) {
		const anchor: SVGAElement = event.currentTarget;
		anchor.getBBox();
	}
};
export const invalidFactoryButton: ComponentProps<typeof CreatedButton> = {
	// @ts-expect-error A known button factory retains native button attributes.
	href: '/docs'
};
export const invalidFactoryButtonRef: ComponentProps<typeof CreatedButton> = {
	// @ts-expect-error A known button factory does not broaden its ref to any element.
	ref: {} as HTMLInputElement
};
export const invalidFactoryPathRef: ComponentProps<typeof CreatedPath> = {
	// @ts-expect-error A known SVG path factory retains its precise native ref.
	ref: {} as HTMLDivElement
};
export const invalidFactoryAnchorRef: ComponentProps<typeof CreatedSVGAnchor> = {
	// @ts-expect-error Explicit SVG namespace selects an SVG anchor, not HTMLAnchorElement.
	ref: {} as HTMLAnchorElement
};
export function customSVGContracts(
	component: Component<
		{ label: string; ref?: SVGCircleElement | null },
		Record<string, never>,
		'ref'
	>
) {
	const Eager = motion.create(component);
	const Deferred = m.create(component);
	const eager: ComponentProps<typeof Eager> = { label: 'Dot', ref: {} as SVGCircleElement };
	const deferred: ComponentProps<typeof Deferred> = { label: 'Dot', ref: {} as SVGCircleElement };
	const invalid: ComponentProps<typeof Eager> = {
		label: 'Dot',
		// @ts-expect-error Wrapping a custom SVG component preserves the authored ref type.
		ref: {} as HTMLButtonElement
	};
	// @ts-expect-error Lazy custom components also preserve required application props.
	const missing: ComponentProps<typeof Deferred> = { animate: { opacity: 1 } };
	return { Eager, Deferred, eager, deferred, invalid, missing };
}

// Managed scalar springs retain the ordinary shared-engine MotionValue methods.
export function scalarSpringContract() {
	const x: MotionValue<number> = useSpring(0, () => ({ duration: 0.2, bounce: 0 }));
	const unit: MotionValue<string> = useSpring('0px');
	x.set(100);
	x.jump(50);
	x.stop();
	unit.set('100px');
	unit.jump('50px');
	unit.stop();
	// @ts-expect-error Numeric spring methods do not accept unit strings.
	x.set('100px');
	// @ts-expect-error String spring methods do not accept numbers.
	unit.jump(50);
	const [, animate] = useAnimate();
	animate('div', { x: 100 }, { reduceMotion: false });
	animate([['div', { x: 100 }]], { reduceMotion: false });
	return { x, unit };
}

import type { TargetAndTransition } from 'astra-motion';
import { spring } from 'astra-motion';
import type {
	ViewAnimationDefinition,
	ViewAnimationTarget,
	ViewTransition
} from 'astra-motion/view';
export const target: ViewAnimationTarget = {
	opacity: [0, 1],
	transform: ['translateX(20px)', 'none'],
	filter: 'blur(0px)',
	'--tint': ['red', 'blue'],
	transition: { type: spring, bounce: 0.2, opacity: { duration: 0.2 }, layout: { duration: 0.4 } }
};
export const resolver: ViewAnimationDefinition = (types) => ({
	opacity: types.includes('forward') ? [0, 1] : 1
});
// @ts-expect-error Snapshot targets cannot commit persistent final element styles.
export const end: ViewAnimationTarget = { transitionEnd: { opacity: 0 } };
// @ts-expect-error Element transform aliases are not CSS snapshot keyframes.
export const x: ViewAnimationTarget = { x: 100 };
// @ts-expect-error An SVG drawing attribute is not a CSS snapshot property.
export const path: ViewAnimationTarget = { pathLength: 1 };
// @ts-expect-error Native View animations use the spring generator, not a string engine name.
export const timing: ViewTransition = { type: 'spring' };
const elementTarget: TargetAndTransition = { x: 100 };
// @ts-expect-error Predeclared Motion element targets do not bypass the snapshot contract.
export const widened: ViewAnimationTarget = elementTarget;
export const ordinary: TargetAndTransition = { x: 100, transitionEnd: { display: 'none' } };

import { motion as nativeMotion } from 'astra-motion/state';
import { motion as liteMotion } from 'astra-motion/state/lite';
import * as rootEntry from 'astra-motion';
import * as stateEntry from 'astra-motion/state';
import * as liteEntry from 'astra-motion/state/lite';
/** Type-only setup recipe; native package boundaries retain the same authoring shape. */
export function nativeBindingContracts() {
	const full = nativeMotion.bind(() => ({ initial: false, animate: { x: 20 }, layout: true }));
	const lite = liteMotion.bind(() => ({ initial: { opacity: 0 }, animate: { opacity: 1 } }));
	lite.child({ animate: { pathLength: 1 } }, { namespace: 'svg', tag: 'path' });
	// @ts-expect-error The lite entry does not include layout features.
	liteMotion.bind({ layout: true });
	// @ts-expect-error Shared layout IDs require the full native boundary.
	liteMotion.bind({ layoutId: 'shared' });
	// @ts-expect-error Layout callbacks require the full native boundary.
	liteMotion.bind({ onLayoutAnimationComplete() {} });
	// @ts-expect-error The lite entry does not include gestures.
	liteMotion.bind({ whileHover: { scale: 1.1 } });
	// @ts-expect-error The removed constructor has no compatibility export.
	void rootEntry.createMotion;
	// @ts-expect-error Native full exposes motion.bind only.
	void stateEntry.createMotion;
	// @ts-expect-error Native lite exposes motion.bind only.
	void liteEntry.createMotion;
	return [full, lite];
}

// Per-animation reduction overrides are valid in both authoring paths and controls.
const reductionTransition: import('astra-motion').Transition = { reduceMotion: false, duration: 1 };
const reductionTarget: import('astra-motion').TargetAndTransition = {
	x: 100,
	transition: reductionTransition
};
const reductionVariants: import('astra-motion').Variants = { active: reductionTarget };
const reductionProps: ComponentProps<typeof motion.div> = {
	animate: { x: 100, transition: { reduceMotion: false } },
	whileHover: { scale: 1.1, transition: { reduceMotion: false } },
	variants: reductionVariants,
	transition: reductionTransition
};
void reductionProps;
export function reductionBinding() {
	// @ts-expect-error Projection uses reducedMotion, not a timing override.
	motion.bind({ layoutTransition: { reduceMotion: false } });
	const binding = motion.bind({ animate: reductionTarget, transition: reductionTransition });
	return binding.animate({ x: 200 }, { reduceMotion: false, duration: 1 });
}
