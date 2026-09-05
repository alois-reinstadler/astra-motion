import { getContext, setContext, untrack } from 'svelte';
import type { Transition } from 'motion-dom';
import type { MotionPolicy } from './policy.js';

export interface MotionConfigOptions extends MotionPolicy {
	transition?: Transition;
	layoutTransition?: Transition;
	automatic?: boolean;
}
const key = Symbol('astra-motion-config');
type ConfigReader = () => MotionConfigOptions;
const empty: ConfigReader = () => ({});
interface ConfigScope {
	parent?: ConfigReader;
	subscribers: Set<() => void>;
}
const scopes = new WeakMap<ConfigReader, ConfigScope>();
function scopeFor(reader: ConfigReader): ConfigScope {
	let scope = scopes.get(reader);
	if (!scope) {
		scope = { subscribers: new Set() };
		scopes.set(reader, scope);
	}
	return scope;
}
/** Subscribe directly to ancestors so retained outros do not depend on provider effects. */
export function observeMotionConfig(reader: ConfigReader, subscriber: () => void) {
	const subscriptions: Set<() => void>[] = [];
	let current: ConfigReader | undefined = reader;
	while (current) {
		const scope = scopeFor(current);
		scope.subscribers.add(subscriber);
		subscriptions.push(scope.subscribers);
		current = scope.parent;
	}
	return () => {
		for (const subscribers of subscriptions) subscribers.delete(subscriber);
	};
}
export function notifyMotionConfig(reader: ConfigReader) {
	for (const subscriber of [...(scopes.get(reader)?.subscribers ?? [])]) subscriber();
}

/** Context belongs to a component tree, including its individual SSR request. */
export function readMotionConfig(): ConfigReader {
	try {
		return getContext<ConfigReader>(key) ?? empty;
	} catch (error) {
		// Standalone createLayout remains usable in vanilla tests and non-component code.
		if (error instanceof Error && error.message.includes('lifecycle_outside_component'))
			return empty;
		throw error;
	}
}

export function provideMotionConfig(config: ConfigReader): () => void {
	const parent = readMotionConfig();
	const reader = () => ({ ...parent(), ...config() });
	scopes.set(reader, {
		// The empty fallback is not a provider shared by otherwise unrelated trees.
		parent: parent === empty ? undefined : parent,
		subscribers: new Set()
	});
	setContext<ConfigReader>(key, reader);
	return () => {
		Object.values(config());
		untrack(() => notifyMotionConfig(reader));
	};
}

let media: MediaQueryList | undefined;
const subscribers = new Set<() => void>();
const changed = () => {
	for (const subscriber of subscribers) subscriber();
};
/** One OS preference listener, released with the final live binding. */
export function observeMotionPreference(subscriber: () => void) {
	if (typeof matchMedia === 'undefined') return () => {};
	if (!media) {
		media = matchMedia('(prefers-reduced-motion: reduce)');
		media.addEventListener('change', changed);
	}
	subscribers.add(subscriber);
	return () => {
		subscribers.delete(subscriber);
		if (!subscribers.size) {
			media?.removeEventListener('change', changed);
			media = undefined;
		}
	};
}
