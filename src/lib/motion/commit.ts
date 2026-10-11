/** Small lifecycle bridge. Presence-only consumers do not import the projection engine. */
export const beforeCommit = new Set<() => void>();
let presenceSnapshotOwner: symbol | undefined;

/** Internal ownership shared by nested synchronous layout updates. */
export function beginPresenceSnapshot(): () => void {
	if (presenceSnapshotOwner) return () => {};
	const owner = Symbol('presence snapshot');
	presenceSnapshotOwner = owner;
	return () => {
		// A stale closer must never release a subsequent transaction's origin.
		if (presenceSnapshotOwner === owner) presenceSnapshotOwner = undefined;
	};
}

export function currentPresenceSnapshot(): symbol | undefined {
	return presenceSnapshotOwner;
}
export const layoutBridge: {
	update?: (change: () => void) => void;
	updateAfterRender?: (change: () => void) => void;
	schedule?: (flush: () => void) => void;
	refreshPolicy?: (element: HTMLElement) => void;
	presence?: (element: HTMLElement, present: boolean) => void;
	invalidate?: (roots: Iterable<Element>) => void;
} = {};
const mutations = new Set<() => void>();
let scheduled = false;
let beforePaintScheduled = false;
let scheduleVersion = 0;
let flushPending: (() => void) | undefined;

/** Include managed pop writes in an explicit transaction before projection commits. */
export function flushLayoutMutations(): void {
	if (beforePaintScheduled) flushPending?.();
}

/** Batch flow changes outside Svelte's flush; managed exits cannot wait for a frame read. */
export function queueLayoutMutation(change: () => void, beforePaint = false): void {
	mutations.add(change);
	if (scheduled && (!beforePaint || beforePaintScheduled)) return;
	scheduled = true;
	beforePaintScheduled = beforePaint;
	const version = ++scheduleVersion;
	const flush = () => {
		// A managed exit can advance an already queued frame batch to this microtask.
		if (!scheduled || version !== scheduleVersion) return;
		scheduled = false;
		flushPending = undefined;
		beforePaintScheduled = false;
		const pending = [...mutations];
		mutations.clear();
		const apply = () => {
			const errors: unknown[] = [];
			for (const mutation of pending) {
				try {
					mutation();
				} catch (error) {
					// One boundary's callback must not discard another boundary's removal.
					errors.push(error);
				}
			}
			if (errors.length === 1) throw errors[0];
			if (errors.length > 1) throw new AggregateError(errors, 'Astra layout mutations failed.');
		};
		const update = beforePaint
			? (layoutBridge.updateAfterRender ?? layoutBridge.update)
			: layoutBridge.update;
		if (update) update(apply);
		else apply();
	};
	flushPending = flush;
	(beforePaint ? queueMicrotask : (layoutBridge.schedule ?? queueMicrotask))(flush);
}

/** Validate a synchronous state transaction without importing layout projection. */
export function synchronousMutation<Result>(
	change: (() => Result) &
		([Result] extends [never] ? unknown : Result extends PromiseLike<unknown> ? never : unknown)
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
