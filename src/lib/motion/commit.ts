/** Small lifecycle bridge. Presence-only consumers do not import the projection engine. */
export const beforeCommit = new Set<() => void>();
export const layoutBridge: {
	update?: (change: () => void) => void;
	schedule?: (flush: () => void) => void;
	refreshPolicy?: (element: HTMLElement) => void;
} = {};
const mutations = new Set<() => void>();
let scheduled = false;

/** Native transition lifecycle events arrive after the Svelte DOM transaction. */
export function queueLayoutMutation(change: () => void): void {
	mutations.add(change);
	if (scheduled) return;
	scheduled = true;
	const flush = () => {
		scheduled = false;
		const pending = [...mutations];
		mutations.clear();
		const apply = () => {
			for (const mutation of pending) mutation();
		};
		if (layoutBridge.update) layoutBridge.update(apply);
		else apply();
	};
	(layoutBridge.schedule ?? queueMicrotask)(flush);
}

/** Validate a synchronous state transaction without importing layout projection. */
export function synchronousMutation<Result>(
	change: (() => Result) & (Result extends PromiseLike<unknown> ? never : unknown)
): () => void {
	if (change.constructor.name === 'AsyncFunction')
		throw new Error(
			'Astra layout.update requires a synchronous callback. Await data before the transaction.'
		);
	const apply = () => {
		const result: unknown = change();
		if (
			result !== null &&
			(typeof result === 'object' || typeof result === 'function') &&
			'then' in result &&
			typeof result.then === 'function'
		) {
			throw new Error(
				'Astra layout.update callback returned a promise. Async writes are outside the layout transaction.'
			);
		}
	};
	return apply;
}
