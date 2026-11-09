import { untrack } from 'svelte';
import type { Readable } from 'svelte/store';
import { isMotionValue, motionValue, type MotionValue } from 'motion-dom';

export type MotionValueSource<T> = MotionValue<T> | Readable<T> | (() => T);

/**
 * Caller-owned bridge. Destroy newly created values to unsubscribe/stop effects.
 * Existing MotionValues pass through unchanged and retain their original owner.
 * Getters track Svelte runes; use useTransform for derived MotionValue.get() reads.
 * SSR getters produce a snapshot, with no browser effects.
 */
export function toMotionValue<T>(source: MotionValueSource<T>): MotionValue<T> {
	if (isMotionValue(source)) return source as MotionValue<T>;
	let value: MotionValue<T>;
	let stop: () => void;
	if (typeof source === 'function') {
		value = motionValue(untrack(source));
		stop = $effect.root(() => {
			$effect(() => value.set(source()));
		});
	} else {
		let initial!: T;
		let ready = false;
		stop = (source as Readable<T>).subscribe((latest) => {
			if (ready) value.set(latest);
			else initial = latest;
		});
		value = motionValue(initial);
		ready = true;
	}
	const destroy = value.destroy.bind(value);
	let disposed = false;
	value.destroy = () => {
		if (disposed) return;
		disposed = true;
		try {
			stop();
		} finally {
			destroy();
		}
	};
	return value;
}
