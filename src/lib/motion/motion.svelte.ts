import {
	createMotionWithFeatures,
	type MotionOptions,
	type MotionBinding
} from './motion-core.svelte.js';
import { createLayout, updateLayout } from './layout.js';
import { attachMotionGestures } from './gestures.js';
import type { MotionRenderOptions } from './motion-types.js';

const features = {
	drag: true,
	layout: { create: createLayout, update: updateLayout },
	gestures: attachMotionGestures
};
/** Full native-element binding: state, presence, projection and interaction. */
export function createMotion(
	input: MotionOptions | (() => MotionOptions) = {},
	render: MotionRenderOptions = {}
): MotionBinding {
	return createMotionWithFeatures(input, features, render);
}
export type { MotionOptions, MotionBinding, MotionTarget } from './motion-core.svelte.js';

if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());
