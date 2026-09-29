import { captureMotionEnvironment } from './component-context.js';
import { createMotion, type MotionBinding, type MotionOptions } from './motion.svelte.js';
import type { MotionRenderOptions } from './motion-types.js';

/** Native rendering information needed to serialize SVG attributes during SSR. */
export type NativeMotionOptions = Pick<MotionRenderOptions, 'namespace' | 'tag' | 'attributes'>;

/**
 * Component-setup binding with the same animation contract as motion.div.
 * @param input Static options, or a getter for changing targets, variants and policy.
 * @param render SVG namespace/tag/attribute metadata when binding native SVG markup.
 * @example
 * const panel = motion.bind(() => ({ animate: { x: distance }, exit: { opacity: 0 } }));
 * // <div {...panel.props} transition:panel.transition|global />
 * // props includes the attachment and SSR styles; do not attach it twice.
 * @remarks Native descendants use panel.child(options) for explicit SSR ancestry.
 * The creating component determines configuration context. createMotion retains
 * its historical defaults for compatibility.
 */
export function bind(
	input: MotionOptions | (() => MotionOptions) = {},
	render: NativeMotionOptions = {}
): MotionBinding {
	return createMotion(input, {
		...render,
		component: true,
		defaultReducedMotion: 'never',
		environment: captureMotionEnvironment()
	});
}
