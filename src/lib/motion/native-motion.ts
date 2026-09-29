import { captureMotionEnvironment } from './component-context.js';
import {
	createBindingWithFeatures,
	type MotionBinding,
	type MotionOptions
} from './motion-core.svelte.js';
import { createLayout, updateLayout } from './layout.js';
import { attachMotionGestures } from './gestures.js';
import type { MotionRenderOptions } from './motion-types.js';
const features = {
	drag: true,
	layout: { create: createLayout, update: updateLayout },
	gestures: attachMotionGestures
};

/** Native rendering information needed to serialize SVG attributes during SSR. */
export type NativeMotionOptions = Pick<MotionRenderOptions, 'namespace' | 'tag' | 'attributes'>;

/**
 * Component-setup binding with the same animation contract as motion.div.
 * @param input Static options, or a getter for changing targets, variants and policy.
 * @param render SVG namespace/tag/attribute metadata when binding native SVG markup.
 * @example
 * const panel = motion.bind(() => ({ animate: { x: distance }, exit: { opacity: 0 } }));
 * const exit = panel.transition;
 * // <div {...panel.props} transition:exit|global />
 * // props includes the attachment and SSR styles; do not attach it twice.
 * @remarks Native descendants use panel.child(options) for explicit SSR ancestry.
 * The creating component determines configuration context.
 */
export function bind(
	input: MotionOptions | (() => MotionOptions) = {},
	render: NativeMotionOptions = {}
): MotionBinding {
	return createBindingWithFeatures(input, features, {
		...render,
		environment: captureMotionEnvironment()
	});
}
