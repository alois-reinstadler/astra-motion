import { onNavigate } from '$app/navigation';
import { onDestroy } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { shouldReduceMotion, type MotionPolicy } from './policy.js';
import { observeMotionConfig, observeMotionPreference, readMotionConfig } from './config.js';
import { checkpointRouteActivity, registerRouteActivity } from './route-activity.svelte.js';

export interface RouteTransitionOptions extends MotionPolicy {
	/** Called when animation is skipped because names conflict or the browser rejects it. */
	onDiagnostic?: (message: string) => void;
}

export interface RouteSharedOptions {
	scope?: string;
}

interface SavedName {
	value: string;
	priority: string;
	assigned: string;
}

interface Session {
	transition?: ViewTransition;
	release: () => void;
	cancel: () => void;
	cancelled: Promise<void>;
	names: Map<HTMLElement, SavedName>;
	sources: Map<HTMLElement, Set<Element>>;
}

const participants = new Map<string, Set<HTMLElement>>();
const identities = new WeakSet<HTMLElement>();
const activeBranches = new WeakMap<HTMLElement, () => boolean>();
const owners = new WeakMap<Document, symbol>();

/** Injective UTF-16 encoding: no hash collisions or ambiguous scope separators. */
function sharedName(id: string, scope: string): string {
	const input = JSON.stringify([scope, id]);
	let name = 'astra_';
	for (let index = 0; index < input.length; index++) {
		name += input.charCodeAt(index).toString(16).padStart(4, '0');
	}
	return name;
}

function restore(session: Session): void {
	for (const [node, saved] of session.names) {
		if (node.style.getPropertyValue('view-transition-name') !== saved.assigned) continue;
		if (saved.value) {
			node.style.setProperty('view-transition-name', saved.value, saved.priority);
		} else {
			node.style.removeProperty('view-transition-name');
		}
	}
	session.names.clear();
}

function diagnose(options: RouteTransitionOptions, message: string): void {
	// A diagnostic is advisory: a consumer's logger must never prevent navigation.
	try {
		options.onDiagnostic?.(message);
	} catch {
		// Navigation ownership remains with Kit even when reporting fails.
	}
}

function inertRoots(node: HTMLElement): Set<Element> {
	const roots = new Set<Element>();
	for (let ancestor: HTMLElement | null = node; ancestor; ancestor = ancestor.parentElement)
		if (ancestor.inert) roots.add(ancestor);
	return roots;
}

function assignNames(
	session: Session,
	options: RouteTransitionOptions,
	owner: Document,
	isOutgoing: (node: HTMLElement) => boolean,
	markOutgoing: (root: Element) => void,
	captureSources: boolean
): void {
	restore(session);
	for (const [name, nodes] of participants) {
		let connected = [...nodes].filter(
			(node) =>
				node.isConnected &&
				node.ownerDocument === owner &&
				activeBranches.get(node)?.() !== false &&
				!isOutgoing(node)
		);
		// Svelte sets inert synchronously, but its outrostart waits for a WAAPI
		// finish event. View Transition capture suppresses frames, so waiting for
		// that event deadlocks. Only disambiguate a previously captured source
		// that acquired an inert ancestor when a fresh, non-inert replacement exists.
		if (
			!captureSources &&
			connected.some((node) => !session.sources.has(node) && inertRoots(node).size === 0)
		) {
			connected = connected.filter((node) => {
				const previous = session.sources.get(node);
				if (!previous) return true;
				const changed = [...inertRoots(node)].filter((root) => !previous.has(root));
				for (const root of changed) markOutgoing(root);
				return changed.length === 0;
			});
		}
		if (connected.length !== 1) {
			if (connected.length > 1) {
				diagnose(options, 'Duplicate routeShared ID in one scope; this pair was skipped.');
			}
			continue;
		}
		const node = connected[0];
		if (captureSources) session.sources.set(node, inertRoots(node));
		session.names.set(node, {
			value: node.style.getPropertyValue('view-transition-name'),
			priority: node.style.getPropertyPriority('view-transition-name'),
			assigned: name
		});
		// Temporary ownership must also win over an authored !important stylesheet rule.
		node.style.setProperty('view-transition-name', name, 'important');
	}
}

/** Register a route identity. CSS names are assigned only while navigation is captured. */
export function routeShared(id: string, options: RouteSharedOptions = {}): Attachment<HTMLElement> {
	const name = sharedName(id, options.scope ?? '');
	return (node) => {
		if (identities.has(node)) throw new Error('An element can have only one routeShared identity.');
		identities.add(node);
		activeBranches.set(node, registerRouteActivity(node));
		let registered = true;
		let nodes = participants.get(name);
		if (!nodes) participants.set(name, (nodes = new Set()));
		nodes.add(node);
		return () => {
			if (!registered) return;
			registered = false;
			identities.delete(node);
			activeBranches.delete(node);
			nodes.delete(node);
			if (nodes.size === 0) participants.delete(name);
		};
	};
}

/**
 * Call once during the persistent root layout's initialization. Kit retains navigation ownership.
 * Inherits MotionConfig's reduced-motion policy; an explicit option overrides that policy.
 */
export function routeTransitions(options: RouteTransitionOptions = {}): void {
	if (typeof document === 'undefined') return;
	const ownerDocument = document;
	const defaults = readMotionConfig();
	const policy = () => ({ ...defaults(), ...options });
	const owner = Symbol('route-transitions');
	if (owners.has(ownerDocument)) {
		throw new Error('routeTransitions must be installed once in the persistent root layout.');
	}
	owners.set(ownerDocument, owner);
	let active: Session | undefined;
	const outgoing = new WeakSet<Element>();
	const intro = (event: Event) => {
		if (event.target instanceof Element) outgoing.delete(event.target);
	};
	const outro = (event: Event) => {
		if (event.target instanceof Element) outgoing.add(event.target);
	};
	const isOutgoing = (node: HTMLElement) => {
		for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement)
			if (outgoing.has(ancestor)) {
				// out: directives reverse without introstart. Svelte restores inert
				// synchronously, so this also clears stale exit metadata on reversal.
				if (ancestor instanceof HTMLElement && ancestor.inert) return true;
				outgoing.delete(ancestor);
			}
		return false;
	};
	// Svelte outro retention keeps sources connected when the incoming route is captured.
	// Capture also observes non-bubbling events on plain ancestors. Keep finished outros
	// excluded until reversal/removal: an outer outro group can retain a finished child.
	ownerDocument.addEventListener('introstart', intro, true);
	ownerDocument.addEventListener('outrostart', outro, true);

	function finish(session: Session): void {
		session.release();
		restore(session);
		session.sources.clear();
		if (active === session) active = undefined;
	}

	function cancel(): void {
		if (!active) return;
		const previous = active;
		previous.cancel();
		previous.transition?.skipTransition();
		finish(previous);
	}

	const preferenceChanged = () => {
		if (shouldReduceMotion(policy())) cancel();
	};
	const stopPreference = observeMotionPreference(preferenceChanged);
	const stopConfig = observeMotionConfig(defaults, preferenceChanged);

	onNavigate((navigation) => {
		cancel();
		if (!ownerDocument.startViewTransition || shouldReduceMotion(policy())) return;

		let release = () => {};
		const proceed = new Promise<void>((resolve) => (release = resolve));
		let cancelSession = () => {};
		const cancelled = new Promise<void>((resolve) => (cancelSession = resolve));
		const session: Session = {
			release,
			cancel: cancelSession,
			cancelled,
			names: new Map(),
			sources: new Map()
		};
		active = session;
		// Observe rejection immediately: a superseding navigation can reject completion
		// before the browser invokes its asynchronous snapshot/update callback.
		const committed = Promise.race([navigation.complete, cancelled]);
		void committed.catch(() => {});

		try {
			checkpointRouteActivity(ownerDocument);
			assignNames(session, options, ownerDocument, isOutgoing, (root) => outgoing.add(root), true);
			const transition = ownerDocument.startViewTransition(async () => {
				// Release Kit only once the old view has been captured.
				release();
				await committed;
				if (active === session) {
					checkpointRouteActivity(ownerDocument);
					assignNames(
						session,
						options,
						ownerDocument,
						isOutgoing,
						(root) => outgoing.add(root),
						false
					);
				}
			});
			session.transition = transition;
			void transition.ready.catch(() => {
				diagnose(options, 'The browser skipped the route animation. Navigation continues.');
			});
			void transition.updateCallbackDone.catch(() => {});
			void transition.finished.then(
				() => finish(session),
				() => finish(session)
			);
		} catch {
			cancelSession();
			finish(session);
			diagnose(options, 'The browser could not start the route animation. Navigation continues.');
		}
		return proceed;
	});

	// BFCache/page disposal must not retain temporary names or snapshot layers.
	ownerDocument.defaultView?.addEventListener('pagehide', cancel);
	onDestroy(() => {
		cancel();
		stopPreference();
		stopConfig();
		ownerDocument.defaultView?.removeEventListener('pagehide', cancel);
		ownerDocument.removeEventListener('introstart', intro, true);
		ownerDocument.removeEventListener('outrostart', outro, true);
		if (owners.get(ownerDocument) === owner) owners.delete(ownerDocument);
	});
}
