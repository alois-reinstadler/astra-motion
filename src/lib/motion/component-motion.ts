import { getContext, setContext } from 'svelte';
import { createMotion, type MotionBinding, type MotionOptions } from './motion.svelte.js';

const key = Symbol('astra-motion-component');

/** Component ancestry exists during SSR; native binding.child() owns its DOM contract. */
export function createComponentMotion(
	input: MotionOptions | (() => MotionOptions) = {}
): MotionBinding {
	const parent = getContext<MotionBinding | undefined>(key);
	const binding = parent ? parent.child(input) : createMotion(input);
	setContext(key, binding);
	return binding;
}
