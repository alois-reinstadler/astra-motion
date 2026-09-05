import { readable, type Writable } from 'svelte/store';
import type { MotionValue } from 'motion-dom';

export { motionValue, springValue, transformValue, mapValue, stagger } from 'motion-dom';
export type { MotionValue, SpringOptions, StaggerOptions } from 'motion-dom';

/**
 * A Svelte store view of an existing MotionValue. `$store` subscriptions observe
 * Motion updates; `set` and `update` write back to the same value. The caller
 * retains ownership of the MotionValue and any derived values it creates.
 */
export function motionStore<T>(value: MotionValue<T>): Writable<T> {
	const store = readable<T>(value.get(), (set) => {
		const stop = value.on('change', set);
		set(value.get());
		return stop;
	});
	return {
		subscribe: store.subscribe,
		set: (next) => value.set(next),
		update: (update) => value.set(update(value.get()))
	};
}
