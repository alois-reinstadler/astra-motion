import { isMotionValue } from 'motion-dom';
import type { MotionOptions } from './motion-core.svelte.js';

/** Read option records in the owning effect, before Motion consumes them asynchronously. */
export function snapshotMotionOptions(options: MotionOptions): MotionOptions {
	const seen = new WeakMap<object, unknown>();
	function snapshot(value: unknown): unknown {
		if (!value || typeof value !== 'object' || isMotionValue(value)) return value;
		const prototype = Object.getPrototypeOf(value);
		if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return value;
		if (seen.has(value)) return seen.get(value);
		const result: unknown[] | Record<string, unknown> = Array.isArray(value) ? [] : {};
		seen.set(value, result);
		for (const [key, child] of Object.entries(value))
			(result as Record<string, unknown>)[key] = snapshot(child);
		return result;
	}
	// custom is application data, whose identity is part of the variant callback
	// contract. Resolving the selected variants in the effect tracks its consumed reads.
	const { custom, ...records } = options;
	return { ...(snapshot(records) as MotionOptions), custom };
}
