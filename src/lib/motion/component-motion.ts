import { onDestroy } from 'svelte';
import { registerLazyMotionUsage } from './lazy-context.js';
import { provideMotionTree } from './component-context.js';
import type { MotionRenderOptions } from './motion-types.js';
import { bind } from './native-motion.js';
import type { MotionBinding, MotionOptions } from './motion.svelte.js';

/** Component ancestry exists during SSR; native binding.child() owns its DOM contract. */
export function createComponentMotion(
	input: MotionOptions | (() => MotionOptions) = {},
	render: MotionRenderOptions = {}
): MotionBinding {
	onDestroy(
		registerLazyMotionUsage(
			() => (typeof input === 'function' ? input() : input).ignoreStrict ?? false
		)
	);
	const binding = bind(input, render);
	provideMotionTree(binding.tree);
	return binding;
}
