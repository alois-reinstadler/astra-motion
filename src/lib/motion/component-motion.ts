import { onDestroy } from 'svelte';
import { registerLazyMotionUsage } from './lazy-context.js';
import { captureMotionEnvironment, provideMotionTree } from './component-context.js';
import type { MotionRenderOptions } from './motion-types.js';
import { createMotion, type MotionBinding, type MotionOptions } from './motion.svelte.js';

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
	render = {
		component: true,
		defaultReducedMotion: 'never',
		environment: captureMotionEnvironment(),
		...render
	};
	const binding = createMotion(input, render);
	provideMotionTree(binding.tree);
	return binding;
}
