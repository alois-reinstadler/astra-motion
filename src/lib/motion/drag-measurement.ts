import type { LayoutUpdateData } from 'motion-dom';
type Delta = LayoutUpdateData['delta'];

const compensations = new WeakMap<object, (delta: Delta) => void>();

export function observeResizeDrag(
	projection: object,
	compensate: (delta: Delta) => void
): () => void {
	compensations.set(projection, compensate);
	return () => {
		if (compensations.get(projection) === compensate) compensations.delete(projection);
	};
}

/** Measurement-only resize commits skip Motion's normal drag layout notification. */
export function compensateResizeDrag(projection: object, delta: Delta): void {
	compensations.get(projection)?.(delta);
}
