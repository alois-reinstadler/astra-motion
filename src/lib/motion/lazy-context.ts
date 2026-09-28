import { getContext, setContext } from 'svelte';
import type { MotionBinding, MotionFeatures } from './motion-core.svelte.js';
import type { MotionInput, MotionRenderOptions } from './motion-types.js';

/** Svelte feature bundles share Astra's one DOM engine and native binding contract. */
export interface FeatureBundle {
	readonly features: MotionFeatures;
	create(input: MotionInput, render: MotionRenderOptions, features?: MotionFeatures): MotionBinding;
}
export type LazyFeatureBundle = () => Promise<FeatureBundle>;
export interface LazyMotionScope {
	readonly bundle: FeatureBundle | undefined;
	readonly strict: boolean;
	registerEager(check: () => void): () => void;
}
const key = Symbol('astra-lazy-motion');
export function readLazyMotion(): LazyMotionScope | undefined {
	return getContext<LazyMotionScope>(key);
}
export function provideLazyMotion(scope: LazyMotionScope): void {
	setContext(key, scope);
}

export function validateFeatureBundle(bundle: unknown): asserts bundle is FeatureBundle {
	if (
		!bundle ||
		typeof bundle !== 'object' ||
		!('create' in bundle) ||
		typeof bundle.create !== 'function' ||
		!('features' in bundle) ||
		!bundle.features ||
		typeof bundle.features !== 'object'
	) {
		throw new TypeError(
			'Astra LazyMotion: features must resolve to a feature bundle. Return domAnimation or domMax, not the imported module namespace.'
		);
	}
}

/** Match upstream's development-only diagnostic; eager components call this in setup. */
export function assertLazyMotionUsage(ignoreStrict = false, scope = readLazyMotion()): void {
	if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;
	if (!scope?.strict) return;
	const message =
		'Astra LazyMotion: an eager motion component defeats lazy loading. Import m from astra-motion/m.';
	if (ignoreStrict) console.warn(message);
	else throw new Error(message);
}

/** Eager component setup registers a reactive policy check and owns the returned cleanup. */
export function registerLazyMotionUsage(ignoreStrict: () => boolean = () => false): () => void {
	if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return () => {};
	const scope = readLazyMotion();
	if (!scope) return () => {};
	const check = () => assertLazyMotionUsage(ignoreStrict(), scope);
	check();
	return scope.registerEager(check);
}
