export {
	createLayout,
	updateLayout,
	type LayoutController,
	type LayoutOptions,
	type LayoutGroupOptions
} from './layout.js';
export { presence, popLayout, type PresenceOptions } from './presence.js';
export { default as Presence } from './Presence.svelte';
export { shouldReduceMotion, type MotionPolicy, type ReducedMotion } from './policy.js';
export {
	createMotion,
	type MotionBinding,
	type MotionOptions,
	type MotionTarget
} from './motion.svelte.js';
export { default as MotionConfig } from './MotionConfig.svelte';
export { default as LayoutGroup } from './LayoutGroup.svelte';
export { default as AnimatePresence, type AnimatePresenceProps } from './AnimatePresence.svelte';
export { default as AnimateView, type AnimateViewProps } from './AnimateView.svelte';
export { startViewTransition } from './view-transitions.js';
export type {
	ViewAnimationType,
	ViewAnimationTarget,
	ViewValueTransition,
	ViewTransition,
	ViewAnimationDefinition,
	ViewAnimationOptions,
	ViewUpdateContext,
	ViewUpdate,
	ViewTransitionOptions,
	ViewTransitionOutcome,
	ViewTransitionHandle
} from './view-types.js';
export { default as AnimateActivity, type AnimateActivityProps } from './AnimateActivity.svelte';
export {
	usePresence,
	useIsPresent,
	usePresenceData,
	presenceRoot,
	type PresenceState
} from './presence-context.svelte.js';
export {
	useActivity,
	useActivityEffect,
	type ActivityMode,
	type ActivityPhase,
	type ActivityState
} from './activity-context.svelte.js';
export type { MotionCreateOptions } from './create-motion.js';
export type { ReorderAxis } from './reorder-context.js';
export type { ReorderGroupProps } from './ReorderGroup.svelte';
export type { ReorderItemProps } from './ReorderItem.svelte';
export {
	animationControls,
	useAnimationControls,
	useAnimation
} from './animation-controls.svelte.js';
export type { LegacyAnimationControls } from 'motion-dom';
export type {
	Transition,
	Variants,
	TargetAndTransition,
	AnimationDefinition,
	AnimationPlaybackControls,
	PanInfo
} from 'motion-dom';
export {
	useMotionValue,
	useMotionTemplate,
	useMotionValueEvent,
	useTransform,
	useSpring,
	useVelocity
} from './value-hooks.svelte.js';
export {
	useAnimationFrame,
	useTime,
	usePageInView,
	useReducedMotion,
	useInView
} from './helper-hooks.svelte.js';
export {
	useScroll,
	type UseScrollOptions,
	type ScrollMotionValues
} from './scroll-hooks.svelte.js';
export type { MotionGetter, UseSpringOptions } from './value-hooks.svelte.js';
export type {
	MotionReadable,
	MotionElementSource,
	AnimationFrameCallback,
	AnimationFrameOptions,
	UseInViewOptions
} from './helper-hooks.svelte.js';
export { useAnimate, type ScopedAnimate, type UseAnimateScope } from './use-animate.svelte.js';
export { useDragControls, DragControls, type DragStartOptions } from './drag-controls.js';
export {
	correctParentTransform,
	transformViewBoxPoint,
	type ElementReference
} from './coordinates.js';
export * as Reorder from './reorder-entry.js';
export { arc, hover, press, spring } from 'motion-dom';
export { default as Motion, type MotionProps, type MotionTag } from './MotionComponent.svelte';
export * as motion from './elements/index.js';
export type {
	MotionElementProps,
	MotionInputProps,
	MotionSelectProps,
	MotionTextareaProps,
	MotionDetailsProps
} from './elements/types.js';
export type {
	MotionSVGElementProps,
	MotionSVGTag,
	MotionAmbiguousElementProps,
	MotionAmbiguousTag
} from './elements/types.js';
export type { MotionConfigOptions } from './config.js';
export type { GestureOptions, DragConstraints, DragElastic } from './gestures.js';
export * from './values.js';
export { createInView, type InViewOptions } from './in-view.svelte.js';

export {
	createAnimate,
	type AnimateScope,
	type ScopedAnimationControls,
	type AnimationSettlement,
	type AnimationCancellationReason,
	type ScopedTarget,
	type ScopedSequence
} from './animate.js';
export {
	createScroll,
	type ScrollController,
	type ScrollOptions,
	type ScrollAnimationOptions
} from './scroll.svelte.js';

export { default as LazyMotion, type LazyMotionProps } from './LazyMotion.svelte';
export * as m from './m/index.js';
export { domAnimation } from './dom-animation.js';
export { domMax } from './dom-max.js';
export type { FeatureBundle, LazyFeatureBundle } from './lazy-context.js';
