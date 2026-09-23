import type { OnNavigate } from '@sveltejs/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lifecycle = vi.hoisted(() => ({
	navigate: undefined as ((navigation: OnNavigate) => unknown) | undefined,
	destroy: [] as Array<() => void>,
	config: {} as { reducedMotion?: 'always' | 'never' | 'user' }
}));
const configReader = vi.hoisted(() => () => lifecycle.config);
const retained = vi.hoisted(() => new WeakSet<HTMLElement>());

vi.mock('./route-activity.svelte.js', () => ({
	registerRouteActivity: (node: HTMLElement) => () => !retained.has(node),
	checkpointRouteActivity: () => {}
}));

vi.mock('$app/navigation', () => ({
	onNavigate: (callback: (navigation: OnNavigate) => unknown) => (lifecycle.navigate = callback)
}));
vi.mock('svelte', () => ({
	onDestroy: (callback: () => void) => lifecycle.destroy.push(callback),
	getContext: () => configReader
}));

import { routeShared, routeTransitions } from './routes.js';
import { notifyMotionConfig } from './config.js';

function stubDocument(properties: Record<string, unknown>) {
	vi.stubGlobal('document', {
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		...properties
	});
}

function deferred() {
	let resolve = () => {};
	let reject: (reason: unknown) => void = () => {};
	const promise = new Promise<void>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
}

function element() {
	const values = new Map<string, { value: string; priority: string }>();
	return {
		isConnected: true,
		ownerDocument: typeof document === 'undefined' ? undefined : document,
		style: {
			getPropertyValue: (key: string) => values.get(key)?.value ?? '',
			getPropertyPriority: (key: string) => values.get(key)?.priority ?? '',
			setProperty: (key: string, value: string, priority = '') =>
				values.set(key, { value, priority }),
			removeProperty: (key: string) => values.delete(key)
		}
	} as unknown as HTMLElement;
}

function browserTransition() {
	const ready = deferred();
	const finished = deferred();
	const updated = deferred();
	let update: (() => Promise<void>) | undefined;
	const transition = {
		ready: ready.promise,
		finished: finished.promise,
		updateCallbackDone: updated.promise,
		skipTransition: vi.fn()
	};
	return {
		ready,
		finished,
		updated,
		transition,
		start: vi.fn((callback: () => Promise<void>) => {
			update = callback;
			return transition;
		}),
		update: async () => {
			try {
				await update?.();
				updated.resolve();
			} catch (error) {
				updated.reject(error);
			}
		}
	};
}

function navigate(complete: Promise<void>) {
	return lifecycle.navigate?.({ complete } as OnNavigate);
}

const cleanups: Array<() => void> = [];
function shared(id: string, node: HTMLElement, scope?: string) {
	const cleanup = routeShared(id, { scope })(node);
	if (cleanup) cleanups.push(cleanup);
	return cleanup;
}

beforeEach(() => {
	lifecycle.navigate = undefined;
	lifecycle.destroy.length = 0;
	lifecycle.config = {};
});

afterEach(() => {
	lifecycle.destroy.forEach((destroy) => destroy());
	cleanups.splice(0).forEach((cleanup) => cleanup());
	vi.unstubAllGlobals();
});

describe('route transition coordinator', () => {
	it('pairs a live destination while an outgoing Svelte branch retains a non-inert source', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const source = element();
		shared('retained', source);
		const onDiagnostic = vi.fn();
		routeTransitions({ reducedMotion: 'never', onDiagnostic });
		const completion = deferred();
		navigate(completion.promise);
		const name = source.style.getPropertyValue('view-transition-name');
		const updating = browser.update();
		retained.add(source);
		const destination = element();
		shared('retained', destination);
		completion.resolve();
		await updating;
		expect(source.isConnected).toBe(true);
		expect(source.style.getPropertyValue('view-transition-name')).toBe('');
		expect(destination.style.getPropertyValue('view-transition-name')).toBe(name);
		expect(onDiagnostic).not.toHaveBeenCalled();
	});

	it('releases navigation after old capture, pairs new nodes and restores authored names', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const oldNode = element();
		oldNode.style.setProperty('view-transition-name', 'authored', 'important');
		const removeOld = shared('product-1', oldNode);
		routeTransitions({ reducedMotion: 'never' });
		const completion = deferred();
		let released = false;
		const proceed = Promise.resolve(navigate(completion.promise)).then(() => (released = true));
		const name = oldNode.style.getPropertyValue('view-transition-name');
		expect(name).toMatch(/^astra_/);
		await Promise.resolve();
		expect(released).toBe(false);
		const updating = browser.update();
		await proceed;
		removeOld?.();
		const newNode = element();
		shared('product-1', newNode);
		completion.resolve();
		await updating;
		expect(newNode.style.getPropertyValue('view-transition-name')).toBe(name);
		expect(oldNode.style.getPropertyValue('view-transition-name')).toBe('authored');
		expect(oldNode.style.getPropertyPriority('view-transition-name')).toBe('important');
		browser.finished.resolve();
		await browser.finished.promise;
		expect(newNode.style.getPropertyValue('view-transition-name')).toBe('');
	});

	it('skips duplicate identities while preserving independent scopes', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const first = element();
		const duplicate = element();
		const otherScope = element();
		shared('title', first, 'a');
		shared('title', duplicate, 'a');
		shared('title', otherScope, 'b');
		const onDiagnostic = vi.fn();
		routeTransitions({ reducedMotion: 'never', onDiagnostic });
		navigate(Promise.resolve());
		await browser.update();
		expect(first.style.getPropertyValue('view-transition-name')).toBe('');
		expect(duplicate.style.getPropertyValue('view-transition-name')).toBe('');
		expect(otherScope.style.getPropertyValue('view-transition-name')).toMatch(/^astra_/);
		expect(onDiagnostic).toHaveBeenCalled();
	});

	it('supersedes a pending transition without waiting for stale navigation completion', async () => {
		const old = browserTransition();
		const next = browserTransition();
		const start = vi.fn().mockImplementationOnce(old.start).mockImplementationOnce(next.start);
		stubDocument({ startViewTransition: start });
		const node = element();
		shared('item', node);
		routeTransitions({ reducedMotion: 'never' });
		const neverComplete = deferred();
		const firstProceed = navigate(neverComplete.promise);
		const staleUpdate = old.update();
		navigate(Promise.resolve());
		await firstProceed;
		await staleUpdate;
		await next.update();
		old.finished.resolve();
		await old.finished.promise;
		expect(old.transition.skipTransition).toHaveBeenCalledOnce();
		expect(node.style.getPropertyValue('view-transition-name')).toMatch(/^astra_/);
	});

	it('lets navigation proceed if starting the native transition throws', async () => {
		stubDocument({
			startViewTransition: () => {
				throw new Error('browser rejected capture');
			}
		});
		const node = element();
		shared('item', node);
		routeTransitions({ reducedMotion: 'never' });
		await navigate(deferred().promise);
		expect(node.style.getPropertyValue('view-transition-name')).toBe('');
	});

	it('falls back immediately for reduced motion or an unsupported browser', () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		routeTransitions({ reducedMotion: 'always' });
		expect(navigate(Promise.resolve())).toBeUndefined();
		expect(browser.start).not.toHaveBeenCalled();
	});

	it('does not register browser lifecycle or access document during SSR', () => {
		vi.stubGlobal('document', undefined);
		routeTransitions();
		expect(lifecycle.navigate).toBeUndefined();
		expect(lifecycle.destroy).toHaveLength(0);
	});

	it('falls back when the browser has no View Transition API', () => {
		stubDocument({});
		routeTransitions({ reducedMotion: 'never' });
		expect(navigate(Promise.resolve())).toBeUndefined();
	});

	it('rejects multiple route identities on one element and permits re-registration after cleanup', () => {
		const node = element();
		const cleanup = shared('first', node);
		expect(() => shared('second', node)).toThrow('only one');
		cleanup?.();
		cleanup?.();
		expect(() => shared('second', node)).not.toThrow();
	});

	it('handles rejected navigation and transition promises without retaining names', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const node = element();
		shared('item', node);
		routeTransitions({ reducedMotion: 'never' });
		const completion = deferred();
		navigate(completion.promise);
		const updating = browser.update();
		completion.reject(new Error('navigation aborted'));
		await updating;
		browser.ready.reject(new Error('transition skipped'));
		browser.finished.reject(new Error('update failed'));
		await browser.finished.promise.catch(() => {});
		expect(node.style.getPropertyValue('view-transition-name')).toBe('');
	});

	it('rejects duplicate coordinators and cancels during root disposal', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const node = element();
		shared('item', node);
		routeTransitions({ reducedMotion: 'never' });
		expect(() => routeTransitions()).toThrow('once');
		const proceed = navigate(deferred().promise);
		lifecycle.destroy[0]();
		await proceed;
		expect(browser.transition.skipTransition).toHaveBeenCalledOnce();
		expect(node.style.getPropertyValue('view-transition-name')).toBe('');
	});

	it('observes navigation rejection even before the browser starts its update callback', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const node = element();
		shared('item', node);
		routeTransitions({ reducedMotion: 'never' });
		const completion = deferred();
		const proceed = navigate(completion.promise);
		completion.reject(new Error('superseded before capture'));
		// A full turn exposes an unhandled rejection if completion is observed too late.
		await new Promise((resolve) => setTimeout(resolve, 0));
		await browser.update();
		await proceed;
		browser.finished.reject(new Error('update rejected'));
		await browser.finished.promise.catch(() => {});
		expect(node.style.getPropertyValue('view-transition-name')).toBe('');
	});

	it('cancels an active capture when the OS switches to reduced motion and removes its listener', async () => {
		const media = new EventTarget();
		const query = Object.assign(media, { matches: false });
		const remove = vi.spyOn(query, 'removeEventListener');
		vi.stubGlobal('matchMedia', () => query);
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const node = element();
		shared('item', node);
		routeTransitions();
		const proceed = navigate(deferred().promise);
		query.matches = true;
		query.dispatchEvent(new Event('change'));
		await proceed;
		expect(browser.transition.skipTransition).toHaveBeenCalledOnce();
		expect(node.style.getPropertyValue('view-transition-name')).toBe('');
		// A skipped transition still invokes its update callback. It must not rename anything.
		await browser.update();
		expect(node.style.getPropertyValue('view-transition-name')).toBe('');
		lifecycle.destroy[0]();
		expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
	});

	it('inherits live MotionConfig policy while allowing an explicit route override', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		routeTransitions();
		const proceed = navigate(deferred().promise);
		lifecycle.config = { reducedMotion: 'always' };
		notifyMotionConfig(configReader);
		await proceed;
		expect(browser.transition.skipTransition).toHaveBeenCalledOnce();
		expect(navigate(Promise.resolve())).toBeUndefined();
		lifecycle.destroy[0]();
		routeTransitions({ reducedMotion: 'never' });
		navigate(Promise.resolve());
		expect(browser.start).toHaveBeenCalledTimes(2);
	});

	it('does not let a throwing diagnostic block navigation or reject a promise handler', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		shared('duplicate', element());
		shared('duplicate', element());
		routeTransitions({
			reducedMotion: 'never',
			onDiagnostic: () => {
				throw new Error('logger failed');
			}
		});
		const proceed = navigate(Promise.resolve());
		await browser.update();
		await proceed;
		browser.ready.reject(new Error('capture rejected'));
		browser.finished.resolve();
		await browser.finished.promise;
		expect(browser.start).toHaveBeenCalledOnce();
	});

	it('isolates shared IDs belonging to a different document', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const local = element();
		const foreign = element();
		Object.defineProperty(foreign, 'ownerDocument', { value: {} });
		shared('same-id', local);
		shared('same-id', foreign);
		routeTransitions({ reducedMotion: 'never' });
		navigate(Promise.resolve());
		await browser.update();
		expect(local.style.getPropertyValue('view-transition-name')).toMatch(/^astra_/);
		expect(foreign.style.getPropertyValue('view-transition-name')).toBe('');
	});

	it('preserves an application name change made during the transition', async () => {
		const browser = browserTransition();
		stubDocument({ startViewTransition: browser.start });
		const node = element();
		shared('item', node);
		routeTransitions({ reducedMotion: 'never' });
		navigate(Promise.resolve());
		await browser.update();
		node.style.setProperty('view-transition-name', 'changed', 'important');
		browser.finished.resolve();
		await browser.finished.promise;
		expect(node.style.getPropertyValue('view-transition-name')).toBe('changed');
		expect(node.style.getPropertyPriority('view-transition-name')).toBe('important');
	});
});
