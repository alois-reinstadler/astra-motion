import { settled } from 'svelte';
import { getViewAnimationLayerInfo } from 'motion-dom';
import { shouldReduceMotion } from './policy.js';
import { animateViewChanges, type ViewLayerAnimation } from './view-animation.js';
import { captureViewResources, waitForViewResources } from './view-resources.js';
import {
	applyViewNames,
	classifyViewChanges,
	snapshotViews,
	type ViewChange,
	type ViewSnapshot
} from './view-registry.js';
import type {
	ViewTransitionHandle,
	ViewTransitionOptions,
	ViewTransitionOutcome,
	ViewUpdate
} from './view-types.js';

interface Deferred<T> {
	promise: Promise<T>;
	resolve(value: T): void;
	reject(error: unknown): void;
}
function deferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	// Consumers still observe rejection by awaiting these promises, without global unhandled noise.
	void promise.catch(() => {});
	return { promise, resolve, reject };
}
/** Internal extension point: fluent and declarative views share this document transaction. */
export interface ViewTransactionParticipant {
	readonly owner: symbol;
	/** Fluent requests configure a whole capture and therefore retain FIFO transaction boundaries. */
	readonly exclusive?: boolean;
	ownsRoot?(): boolean;
	before(document: Document): void;
	after(document: Document): void;
	animate(document: Document): ViewLayerAnimation;
	cleanup(): void;
}
interface Request {
	participant?: ViewTransactionParticipant;
	update: ViewUpdate;
	options: ViewTransitionOptions;
	controller: AbortController;
	types: Set<string>;
	ready: Deferred<void>;
	updated: Deferred<void>;
	finished: Deferred<ViewTransitionOutcome>;
	skipped: boolean;
	error?: unknown;
	failed: boolean;
	session?: Session;
}
interface DocumentState {
	active?: Session;
	queued: Request[];
	scheduled: boolean;
}
interface Session {
	document?: Document;
	state?: DocumentState;
	requests: Request[];
	transition?: ViewTransition;
	before: Map<string, ViewSnapshot>;
	after: Map<string, ViewSnapshot>;
	layers: Map<symbol, ViewLayerAnimation[]>;
	phase: 'capturing' | 'updating' | 'animating';
	updates?: Promise<void>;
	restoreNames: () => void;
	removeStyles: () => void;
	removeLifecycle: () => void;
	released: boolean;
	skipped: boolean;
}
const documents = new WeakMap<Document, DocumentState>();
const noop = () => {};

function diagnostic(session: Session, message: string) {
	for (const request of session.requests) {
		try {
			request.options.onDiagnostic?.(message);
		} catch {
			// Logging must never change whether application mutations run.
		}
	}
}

function runUpdates(session: Session): Promise<void> {
	if (session.updates) return session.updates;
	session.phase = 'updating';
	const completion = deferred<void>();
	session.updates = completion.promise;
	void (async () => {
		for (const request of session.requests) {
			try {
				await request.update({
					signal: request.controller.signal,
					addType(type) {
						if (!type)
							throw new Error('Astra view transitions: a transition type must be nonempty.');
						request.types.add(type);
						session.transition?.types?.add(type);
					}
				});
			} catch (error) {
				request.error = error;
				request.failed = true;
			}
		}
		try {
			await settled();
		} catch (error) {
			for (const request of session.requests) {
				if (!request.failed) {
					request.error = error;
					request.failed = true;
				}
			}
		}
		for (const request of session.requests) {
			if (request.failed) request.updated.reject(request.error);
			else request.updated.resolve();
		}
		const failed = session.requests.find((request) => request.failed);
		if (failed) throw failed.error;
	})().then(completion.resolve, completion.reject);
	return session.updates;
}

function schedule(document: Document, state: DocumentState) {
	if (state.scheduled || state.active || !state.queued.length) return;
	state.scheduled = true;
	queueMicrotask(() => {
		state.scheduled = false;
		if (state.active || !state.queued.length) return;
		const firstExclusive = state.queued.findIndex((request) => request.participant?.exclusive);
		const count =
			firstExclusive === 0 ? 1 : firstExclusive < 0 ? state.queued.length : firstExclusive;
		startSession(document, state.queued.splice(0, count), state);
	});
}

function release(session: Session, outcome: ViewTransitionOutcome) {
	if (session.released) return;
	session.released = true;
	session.restoreNames();
	for (const request of session.requests) request.participant?.cleanup();
	session.removeStyles();
	session.removeLifecycle();
	for (const layers of session.layers.values()) for (const layer of layers) layer.cancel();
	session.layers.clear();
	// Releasing snapshot ownership does not pretend a pending application promise has finished.
	void runUpdates(session)
		.catch(noop)
		.then(() => {
			for (const request of session.requests) {
				if (request.failed) request.finished.reject(request.error);
				else request.finished.resolve(outcome);
			}
		});
	if (session.state?.active === session) {
		session.state.active = undefined;
		schedule(session.document!, session.state);
	}
}

function skip(session: Session) {
	if (session.released) return;
	session.skipped = true;
	const reason = new DOMException(
		'The view animation was skipped; its state update still runs.',
		'AbortError'
	);
	for (const request of session.requests) {
		request.controller.abort(reason);
		request.ready.reject(reason);
	}
	try {
		session.transition?.skipTransition();
	} catch {
		// A browser that has already released the transition needs no further cancellation.
	}
	// Start any not-yet-invoked updates before allowing a replacement transaction to capture.
	void runUpdates(session).catch(noop);
	release(session, 'skipped');
}

function installStyles(session: Session) {
	const document = session.document!;
	const style = document.createElement('style');
	style.setAttribute('data-astra-view-reset', '');
	const nonce =
		session.requests.find((request) => request.options.nonce)?.options.nonce ??
		[...session.before.values()].find((snapshot) => snapshot.options.nonce)?.options.nonce;
	if (nonce) style.nonce = nonce;
	style.textContent = `
::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation-timing-function:linear!important}
${session.requests.some((request) => request.participant?.ownsRoot?.()) ? '' : '::view-transition-old(root),::view-transition-new(root){animation:none!important}'}
`;
	document.head.appendChild(style);
	session.removeStyles = () => style.remove();
}

function startSession(document: Document | undefined, requests: Request[], state?: DocumentState) {
	const session: Session = {
		document,
		state,
		requests,
		before: new Map(),
		after: new Map(),
		layers: new Map(),
		phase: 'capturing',
		restoreNames: noop,
		removeStyles: noop,
		removeLifecycle: noop,
		released: false,
		skipped: requests.some((request) => request.skipped)
	};
	for (const request of requests) request.session = session;
	if (state) state.active = session;
	const unsupported = !document?.startViewTransition;
	if (
		unsupported ||
		session.skipped ||
		requests.some(
			(request) =>
				request.options.reducedMotion !== undefined && shouldReduceMotion(request.options)
		)
	) {
		void runUpdates(session).then(
			() => {
				for (const request of requests) request.ready.resolve();
				release(session, unsupported ? 'unsupported' : 'skipped');
			},
			(error) => {
				for (const request of requests) request.ready.reject(error);
				release(session, unsupported ? 'unsupported' : 'skipped');
			}
		);
		return;
	}
	const pagehide = () => skip(session);
	document.defaultView?.addEventListener('pagehide', pagehide);
	session.removeLifecycle = () => document.defaultView?.removeEventListener('pagehide', pagehide);
	try {
		for (const request of requests) request.participant?.before(document);
		session.before = snapshotViews(document, (message) => diagnostic(session, message));
		installStyles(session);
		session.restoreNames = applyViewNames(session.before);
		const transition = document.startViewTransition(async () => {
			session.restoreNames();
			const resources = captureViewResources(document);
			await runUpdates(session);
			if (session.released) return;
			await waitForViewResources(document, resources, requests[0].controller.signal);
			if (session.released) return;
			try {
				for (const request of requests) request.participant?.after(document);
			} catch (error) {
				for (const request of requests) {
					request.failed = true;
					request.error = error;
				}
				throw error;
			}
			session.after = snapshotViews(document, (message) => diagnostic(session, message));
			session.restoreNames = applyViewNames(session.after);
		});
		session.transition = transition;
		for (const request of requests) for (const type of request.types) transition.types?.add(type);
		void transition.updateCallbackDone.catch(noop);
		void transition.ready
			.then(() => {
				if (session.released) return;
				session.phase = 'animating';
				session.restoreNames();
				const types = [...new Set(requests.flatMap((request) => [...request.types]))];
				const changes = classifyViewChanges(session.before, session.after);
				const changedNames = new Set(changes.map((change) => change.name));
				for (const animation of document.getAnimations()) {
					const pseudo = (animation.effect as KeyframeEffect | null)?.pseudoElement;
					const name = pseudo && getViewAnimationLayerInfo(pseudo)?.layer;
					if (
						name &&
						!changedNames.has(name) &&
						(session.before.has(name) || session.after.has(name))
					)
						animation.cancel();
				}
				const groups = new Map<symbol, Map<string, ViewChange[]>>();
				for (const change of changes) {
					const owner = change.snapshot.participant.owner;
					let group = groups.get(owner);
					if (!group) groups.set(owner, (group = new Map()));
					const entries = group.get(change.type) ?? [];
					entries.push(change);
					group.set(change.type, entries);
				}
				try {
					for (const request of requests) {
						if (request.participant)
							session.layers.set(request.participant.owner, [
								request.participant.animate(document)
							]);
					}
					for (const [owner, group] of groups) {
						const layers: ViewLayerAnimation[] = [];
						session.layers.set(owner, layers);
						for (const entries of group.values())
							layers.push(animateViewChanges(document, entries, types));
					}
				} catch (error) {
					for (const request of requests) {
						request.error = error;
						request.failed = true;
					}
					throw error;
				}
				for (const request of requests) request.ready.resolve();
			})
			.catch((error) => {
				for (const request of requests) request.ready.reject(error);
				if (!session.released) {
					diagnostic(
						session,
						'The browser skipped the view animation. The state update still runs.'
					);
					skip(session);
				}
			});
		void transition.finished
			.then(async () => {
				if (session.released) return;
				try {
					await Promise.all(
						[...session.layers.values()].flatMap((layers) => layers.map((layer) => layer.finished))
					);
				} catch (error) {
					for (const request of requests) {
						request.error = error;
						request.failed = true;
					}
				}
				release(session, session.skipped ? 'skipped' : 'finished');
			})
			.catch(() => {
				if (!session.released) skip(session);
			});
	} catch (error) {
		if (requests.some((request) => request.participant)) {
			for (const request of requests) {
				request.failed = true;
				request.error = error;
			}
		}
		diagnostic(
			session,
			'The browser could not start the view animation. The state update still runs.'
		);
		skip(session);
	}
}

/** Coordinates arbitrary Svelte state changes; does not import SvelteKit or React. */
export function startViewTransition(
	update: ViewUpdate,
	options: ViewTransitionOptions = {}
): ViewTransitionHandle {
	return startManagedViewTransition(update, options);
}

/** Internal; no second document scheduler is introduced for fluent animations. */
export function startManagedViewTransition(
	update: ViewUpdate,
	options: ViewTransitionOptions,
	participant?: ViewTransactionParticipant
): ViewTransitionHandle {
	if (typeof update !== 'function')
		throw new TypeError('Astra startViewTransition requires an update callback.');
	const document =
		options.document ??
		(typeof globalThis.document === 'undefined' ? undefined : globalThis.document);
	const request: Request = {
		participant,
		update,
		options,
		controller: new AbortController(),
		types: new Set(options.types),
		ready: deferred<void>(),
		updated: deferred<void>(),
		finished: deferred<ViewTransitionOutcome>(),
		skipped: false,
		failed: false
	};
	const cancel = () => {
		request.skipped = true;
		if (request.session) skip(request.session);
		else {
			request.controller.abort(
				new DOMException('The queued view animation was skipped.', 'AbortError')
			);
			const state = document && documents.get(document);
			const index = state?.queued.indexOf(request) ?? -1;
			if (participant?.exclusive && state && index !== -1) {
				state.queued.splice(index, 1);
				// Cancellation must not await a paused predecessor. No capture is acquired;
				// the cancelled update deliberately runs ahead of still-queued transactions.
				queueMicrotask(() => startSession(document, [request]));
			}
		}
	};
	if (!document) queueMicrotask(() => startSession(undefined, [request]));
	else {
		let state = documents.get(document);
		if (!state) documents.set(document, (state = { queued: [], scheduled: false }));
		if (options.policy === 'replace' && state.active) skip(state.active);
		if (participant?.exclusive && options.policy === 'replace') state.queued.unshift(request);
		else state.queued.push(request);
		schedule(document, state);
	}
	return {
		ready: request.ready.promise,
		updateCallbackDone: request.updated.promise,
		finished: request.finished.promise,
		get types() {
			return [...request.types];
		},
		skipTransition: cancel,
		cancel
	};
}

/** An active snapshot is document-wide: a live reduced-motion change releases that capture. */
export function skipViewTransitions(document: Document): void {
	const state = documents.get(document);
	if (state?.active) skip(state.active);
}

/** Natural removal during an update must retain its exit snapshot; later owner disposal cancels its layers. */
export function releaseViewOwner(document: Document, owner: symbol): void {
	const session = documents.get(document)?.active;
	if (session?.phase !== 'animating') return;
	for (const layer of session.layers.get(owner) ?? []) layer.cancel();
	session.layers.delete(owner);
}

export type {
	ViewTransitionHandle,
	ViewTransitionOptions,
	ViewTransitionOutcome,
	ViewUpdate,
	ViewUpdateContext
} from './view-types.js';
