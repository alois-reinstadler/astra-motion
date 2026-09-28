import type { Snippet } from 'svelte';
import type { MotionValue } from 'motion-dom';
export type MotionChildren =
	| Snippet
	| string
	| number
	| MotionValue<string>
	| MotionValue<number>
	| MotionValue<string | number>;
