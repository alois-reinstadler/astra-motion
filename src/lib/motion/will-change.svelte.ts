import { onDestroy } from 'svelte';
import { acceleratedValues, MotionValue, transformProps, type WillChange } from 'motion-dom';

/** Pinned Motion 13.4.4 hint semantics: eligible targets opt into a transform layer. */
export class WillChangeMotionValue extends MotionValue<string> implements WillChange {
	add(name: string): void {
		if (transformProps.has(name) || acceleratedValues.has(name)) this.set('transform');
	}
}

/**
 * Creates a component-owned will-change MotionValue, initially `auto`.
 * Pass it directly in animated styles: `style={{ willChange: useWillChange() }}`.
 * Motion adds eligible targets automatically. `add('x')` can prewarm a layer.
 * The hint remains enabled for this value's lifetime, matching Motion 13.4.4.
 */
export function useWillChange(): WillChange {
	const value = new WillChangeMotionValue('auto');
	onDestroy(() => value.destroy());
	return value;
}
