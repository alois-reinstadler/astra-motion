import { untrack } from 'svelte';

export interface InViewOptions {
	/** Value before the target's first measurement. Defaults to false. */
	initial?: boolean;
	/** Keep true after the target first enters. A replacement target starts fresh. */
	once?: boolean;
	/** Scroll container; omitted or null uses the browser viewport. */
	root?: Element | Document | null;
	/** IntersectionObserver root margin, in pixels or percentages. */
	margin?: string;
	/** Required visible proportion, from 0 to 1. Defaults to 'some'. */
	amount?: 'some' | 'all' | number;
}

/** Component-scoped, reactive viewport visibility. Safe to initialize during SSR. */
export function createInView(
	target: () => Element | null | undefined,
	input: InViewOptions | (() => InViewOptions) = {}
) {
	const readOptions = () => (typeof input === 'function' ? input() : input);
	let current = $state(untrack(() => readOptions().initial ?? false));
	let previousTarget: Element | null | undefined;
	let entered = false;

	$effect(() => {
		const element = target();
		const { initial = false, once = false, root, margin, amount = 'some' } = readOptions();
		const threshold = amount === 'all' ? 1 : amount === 'some' ? 0 : amount;
		if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
			throw new RangeError('Astra in-view: amount must be between 0 and 1.');
		}
		if (element !== previousTarget) {
			previousTarget = element;
			entered = false;
			current = initial;
		}
		if (!element) return;
		if (once && entered) {
			current = true;
			return;
		}
		if (typeof IntersectionObserver === 'undefined') return;

		let active = true;
		// Motion's callback helper omits the first outside observation. Reading the
		// native entry also resolves initial:true and initial partial intersections.
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!active || entry.target !== element) continue;
					current = entry.isIntersecting && entry.intersectionRatio >= threshold;
					if (current) {
						entered = true;
						if (once) {
							active = false;
							observer.disconnect();
						}
					}
				}
			},
			{ root, rootMargin: margin, threshold }
		);
		observer.observe(element);
		return () => {
			active = false;
			observer.disconnect();
		};
	});

	return {
		get current() {
			return current;
		}
	};
}
