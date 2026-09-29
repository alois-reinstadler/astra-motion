import {
	createBindingWithFeatures,
	type MotionBinding,
	type MotionOptions
} from './motion-core.svelte.js';
import { captureMotionEnvironment } from './component-context.js';
import type { NativeMotionOptions } from './native-motion.js';
import type { GestureOptions } from './gestures.js';

/** State, native presence, variants and MotionValues without projection/gestures. */
export type LiteMotionOptions = Omit<
	MotionOptions,
	| keyof GestureOptions
	| `layout${string}`
	| `onLayout${string}`
	| 'onBeforeLayoutMeasure'
	| 'automatic'
>;
export interface LiteMotionBinding extends Omit<MotionBinding, 'child'> {
	child(
		input?: LiteMotionOptions | (() => LiteMotionOptions),
		render?: NativeMotionOptions
	): LiteMotionBinding;
}
const features = {};

/**
 * Component-setup native binding without layout, drag or gestures.
 * @param input Static options or a reactive getter for targets, variants and policy.
 * @param render SVG namespace, tag and attribute metadata for server rendering.
 * @example
 * import { motion } from 'astra-motion/state/lite';
 * const panel = motion.bind(() => ({ animate: { opacity: shown ? 1 : 0 } }));
 * // <div {...panel.props}>Native content</div>
 */
function bind(
	input: LiteMotionOptions | (() => LiteMotionOptions) = {},
	render: NativeMotionOptions = {}
): LiteMotionBinding {
	return createBindingWithFeatures(input, features, {
		...render,
		environment: captureMotionEnvironment()
	});
}
export const motion = { bind };
export type { NativeMotionOptions };
export type { MotionTarget } from './motion-core.svelte.js';

if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());
