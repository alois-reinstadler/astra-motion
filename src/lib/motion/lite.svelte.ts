import {
	createMotionWithFeatures,
	type MotionBinding,
	type MotionOptions
} from './motion-core.svelte.js';
import type { GestureOptions } from './gestures.js';

/** State, finite native presence, variants and MotionValues without projection/gestures. */
export type LiteMotionOptions = Omit<
	MotionOptions,
	keyof GestureOptions | 'layout' | 'layoutGroup' | 'layoutTransition' | 'automatic'
>;
export interface LiteMotionBinding extends Omit<MotionBinding, 'child'> {
	child(input?: LiteMotionOptions | (() => LiteMotionOptions)): LiteMotionBinding;
}
const features = {};

/** Same native-element authoring contract with a smaller optional feature set. */
export function createMotion(
	input: LiteMotionOptions | (() => LiteMotionOptions) = {}
): LiteMotionBinding {
	return createMotionWithFeatures(input, features);
}
export type { MotionTarget } from './motion-core.svelte.js';

if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());
