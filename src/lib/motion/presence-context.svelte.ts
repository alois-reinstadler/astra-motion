import { getContext, onDestroy, setContext } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { SvelteSet } from 'svelte/reactivity';

export interface PresenceSnapshot {
	readonly isPresent: boolean;
	readonly initial: false | undefined;
	readonly custom: unknown;
	readonly generation: number;
}

export interface PresenceRegistration {
	complete(generation: number): void;
	unregister(): void;
}

export interface PresenceScope {
	readonly snapshot: PresenceSnapshot;
	register(): PresenceRegistration;
	subscribe(listener: (snapshot: PresenceSnapshot) => void): () => void;
	registerNode(node: HTMLElement | SVGElement): () => void;
}

export interface PresenceController extends PresenceScope {
	readonly nodes: ReadonlySet<HTMLElement | SVGElement>;
	update(isPresent: boolean, custom: unknown): void;
	releaseInitial(): void;
	destroy(): void;
}

const key = Symbol('astra-presence');

export function readPresenceScope(): PresenceScope | undefined {
	try {
		return getContext<PresenceScope | undefined>(key);
	} catch (error) {
		if (error instanceof Error && error.message.includes('lifecycle_outside_component')) return;
		throw error;
	}
}

export function providePresenceScope(scope: PresenceScope): void {
	setContext(key, scope);
}

/** Each retained record owns its registrations independently of the DOM's removal clock. */
export function createPresenceScope(
	initial: Omit<PresenceSnapshot, 'generation'>,
	onComplete: (generation: number) => void
): PresenceController {
	let snapshot = $state.raw<PresenceSnapshot>({ ...initial, generation: 0 });
	const registrations = new SvelteSet<symbol>();
	const pending = new SvelteSet<symbol>();
	const subscribers = new SvelteSet<(snapshot: PresenceSnapshot) => void>();
	const nodes = new SvelteSet<HTMLElement | SVGElement>();
	const nodeOwners = new Map<HTMLElement | SVGElement, number>();
	let alive = true;
	let completed = -1;
	let queued = -1;
	function check() {
		if (!alive || snapshot.isPresent || pending.size || completed === snapshot.generation) return;
		const generation = snapshot.generation;
		if (queued === generation) return;
		queued = generation;
		queueMicrotask(() => {
			if (queued === generation) queued = -1;
			if (!alive || snapshot.isPresent || snapshot.generation !== generation || pending.size)
				return;
			if (completed === generation) return;
			completed = generation;
			onComplete(generation);
		});
	}
	return {
		get snapshot() {
			return snapshot;
		},
		nodes,
		register() {
			const token = Symbol();
			if (alive) {
				registrations.add(token);
				if (!snapshot.isPresent) pending.add(token);
			}
			return {
				complete(generation) {
					if (!alive || snapshot.isPresent || snapshot.generation !== generation) return;
					pending.delete(token);
					check();
				},
				unregister() {
					registrations.delete(token);
					pending.delete(token);
					check();
				}
			};
		},
		subscribe(listener) {
			if (!alive) return () => {};
			subscribers.add(listener);
			listener(snapshot);
			return () => subscribers.delete(listener);
		},
		registerNode(node) {
			if (alive) {
				nodeOwners.set(node, (nodeOwners.get(node) ?? 0) + 1);
				nodes.add(node);
			}
			let registered = alive;
			return () => {
				if (!registered) return;
				registered = false;
				const remaining = (nodeOwners.get(node) ?? 1) - 1;
				if (remaining) nodeOwners.set(node, remaining);
				else {
					nodeOwners.delete(node);
					nodes.delete(node);
				}
			};
		},
		update(isPresent, custom) {
			if (!alive) return;
			const changed = isPresent !== snapshot.isPresent;
			if (!changed && Object.is(custom, snapshot.custom)) return;
			if (changed) {
				pending.clear();
				if (!isPresent) for (const token of registrations) pending.add(token);
			}
			snapshot = {
				isPresent,
				custom,
				initial: snapshot.initial,
				generation: snapshot.generation + Number(changed)
			};
			for (const listener of [...subscribers]) listener(snapshot);
			if (changed) check();
		},
		releaseInitial() {
			if (!alive || snapshot.initial !== false) return;
			snapshot = { ...snapshot, initial: undefined };
			for (const listener of [...subscribers]) listener(snapshot);
		},
		destroy() {
			alive = false;
			registrations.clear();
			pending.clear();
			subscribers.clear();
			nodes.clear();
			nodeOwners.clear();
		}
	};
}

export interface PresenceState {
	readonly isPresent: boolean;
	/** Read this callback when scheduling the current exit; stale callbacks cannot remove a later exit. */
	readonly safeToRemove: () => void;
}

/** Registers application-owned exit work; destruction always releases the registration. */
export function usePresence(): PresenceState {
	const scope = readPresenceScope();
	const registration = scope?.register();
	if (registration) onDestroy(registration.unregister);
	return {
		get isPresent() {
			return scope?.snapshot.isPresent ?? true;
		},
		get safeToRemove() {
			const generation = scope?.snapshot.generation;
			return () => {
				if (generation !== undefined) registration?.complete(generation);
			};
		}
	};
}

export function useIsPresent(): { readonly current: boolean } {
	const scope = readPresenceScope();
	return {
		get current() {
			return scope?.snapshot.isPresent ?? true;
		}
	};
}

export function usePresenceData<T = unknown>(): { readonly current: T | undefined } {
	const scope = readPresenceScope();
	return {
		get current() {
			return scope?.snapshot.custom as T | undefined;
		}
	};
}

/** Forward to the actual root of a plain/custom child when using popLayout. */
export function presenceRoot(): Attachment<HTMLElement | SVGElement> {
	const scope = readPresenceScope();
	return (node) => scope?.registerNode(node);
}
