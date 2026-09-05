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
export { default as Motion, type MotionProps, type MotionTag } from './Motion.svelte';
export type { MotionConfigOptions } from './config.js';
export type { GestureOptions } from './gestures.js';
export * from './values.js';
export { createInView, type InViewOptions } from './in-view.svelte.js';

export {
	createAnimate,
	type AnimateScope,
	type ScopedTarget,
	type ScopedSequence
} from './animate.js';
export {
	createScroll,
	type ScrollController,
	type ScrollOptions,
	type ScrollAnimationOptions
} from './scroll.svelte.js';
