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
/** Independent sibling writes can share reads; other mutations are ordering barriers. */
export interface PreparedLayoutMutation {
	element: HTMLElement;
	prepare: () => void;
	apply: () => void;
	validate: () => void;
	rollback: () => void;
}
type LayoutMutation = (() => void) | PreparedLayoutMutation;
const mutations = new Set<LayoutMutation>();
let scheduled = false;
let beforePaintScheduled = false;
let scheduleVersion = 0;
let flushPending: (() => void) | undefined;

/** Include managed pop writes in an explicit transaction before projection commits. */
export function flushLayoutMutations(): void {
	if (beforePaintScheduled) flushPending?.();
}

/** Batch flow changes outside Svelte's flush; managed exits cannot wait for a frame read. */
export function queueLayoutMutation(change: LayoutMutation, beforePaint = false): void {
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
			for (let index = 0; index < pending.length;) {
				const mutation = pending[index++];
				if (typeof mutation === 'function') {
					try {
						mutation();
					} catch (error) {
						errors.push(error);
					}
					continue;
				}
				const parent = mutation.element.parentElement;
				const siblings = [mutation];
				while (index < pending.length) {
					const next = pending[index];
					if (typeof next === 'function' || next.element.parentElement !== parent) break;
					siblings.push(next);
					index++;
				}
				try {
					for (const sibling of siblings) sibling.prepare();
					for (const sibling of siblings) sibling.apply();
					// Relational CSS can change the containing block after sibling writes.
					// Check the entire batch after writing, without interleaving reads/writes.
					for (const sibling of siblings) sibling.validate();
				} catch (error) {
					errors.push(error);
					for (const sibling of siblings.toReversed()) {
						try {
							sibling.rollback();
						} catch (rollbackError) {
							errors.push(rollbackError);
						}
					}
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
