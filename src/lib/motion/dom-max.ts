import { createBindingWithFeatures } from './motion-core.svelte.js';
import { createLayout, updateLayout } from './layout.js';
import { attachMotionGestures } from './gestures.js';
import type { FeatureBundle } from './lazy-context.js';

/** All DOM animation features, including pan/drag and layout projection. */
export const domMax: FeatureBundle = {
	features: {
		gestures: attachMotionGestures,
		drag: true,
		layout: { create: createLayout, update: updateLayout }
	},
	create(input, render, features = domMax.features) {
		return createBindingWithFeatures(input, features, render);
	}
};
export default domMax;
