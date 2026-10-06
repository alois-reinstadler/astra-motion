import { onDestroy, onMount, untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { updateLayout } from './layout.js';

const pending = new SvelteSet<() => void>();
let scheduled = false;

export interface LayoutState<T> {
	/** Committed render state. Treat nested values as immutable too. */
	readonly current: T;
	/** Replace the pending value; publication is coalesced before the next paint. */
	set(value: T): void;
	/** Receives the latest pending value, including earlier updates in this batch. */
	update(change: (value: T) => T): void;
}

/**
 * Create during component initialization. All related geometry expressions must
 * read current, including parent styles and presence membership. Independent
 * state, external DOM writes and async rendering are outside this transaction.
 */
export function createLayoutState<T>(initial: T): LayoutState<T> {
	let current = $state.raw(initial);
	let requested = initial;
	let alive = true;
	let mounted = false;
	onMount(() => {
		mounted = true;
	});
	const publish = () => {
		if (alive) current = requested;
	};
	onDestroy(() => {
		alive = false;
		pending.delete(publish);
	});
	function set(value: T) {
		untrack(() => {
			if (!alive || Object.is(requested, value)) return;
			requested = value;
			// Initialization must render the same value on the server and during
			// hydration. There is no previous mounted layout to snapshot yet.
			if (!mounted) {
				publish();
				return;
			}
			if (Object.is(current, value)) pending.delete(publish);
			else pending.add(publish);
			if (scheduled || !pending.size) return;
			scheduled = true;
			queueMicrotask(() => {
				scheduled = false;
				const changes = [...pending];
				pending.clear();
				if (changes.length) updateLayout(() => changes.forEach((change) => change()));
			});
		});
	}
	return {
		get current() {
			return current;
		},
		set,
		update(change) {
			if (alive) set(untrack(() => change(requested)));
		}
	};
}
