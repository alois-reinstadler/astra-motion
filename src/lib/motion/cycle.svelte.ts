import { untrack } from 'svelte';

export type Cycle = (next?: number) => void;
export interface CycleState<T> {
	readonly current: T;
	cycle: Cycle;
}
export type CycleItemsGetter<T> = () => readonly T[];

/** Reactive object form. A single function argument reads a live, nonempty list. */
export function useCycle<T>(items: CycleItemsGetter<T>): CycleState<T>;
export function useCycle<T>(...items: T[]): CycleState<T>;
export function useCycle<T>(...items: T[] | [CycleItemsGetter<T>]): CycleState<T> {
	const read =
		items.length === 1 && typeof items[0] === 'function'
			? (items[0] as CycleItemsGetter<T>)
			: () => items as T[];
	const list = () => {
		const values = read();
		if (!values.length) throw new Error('useCycle requires at least one item');
		return values;
	};
	untrack(list);
	let index = $state(0);
	return {
		get current() {
			const values = list();
			return values[Math.max(0, Math.min(index, values.length - 1))];
		},
		cycle(next) {
			if (next !== undefined && !Number.isSafeInteger(next))
				throw new Error('Cycle index must be a finite safe integer');
			const count = list().length;
			index = next === undefined ? (((index + 1) % count) + count) % count : next;
		}
	};
}
