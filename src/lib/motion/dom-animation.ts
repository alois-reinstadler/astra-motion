import { createBindingWithFeatures } from './motion-core.svelte.js';
import { attachBaseGestures } from './base-gestures.js';
import type { FeatureBundle } from './lazy-context.js';

/** Animation, variants, exits, hover, tap, focus and viewport, without drag/projection. */
export const domAnimation: FeatureBundle = {
	features: { gestures: attachBaseGestures },
	create(input, render, features = domAnimation.features) {
		return createBindingWithFeatures(input, features, render);
	}
};
export default domAnimation;
