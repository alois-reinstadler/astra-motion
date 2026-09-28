import { expect, it, vi } from 'vitest';
import { startViewTransition } from '../motion/view-transitions.js';
import { classifyViewChanges, viewName, type ViewSnapshot } from '../motion/view-registry.js';

function deferred() {
	let resolve!: () => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<void>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	void promise.catch(() => {});
	return { promise, resolve, reject };
}

function nativeDocument() {
	const sessions: {
		run(): Promise<void>;
		finish(): void;
		rejectReady(error: unknown): void;
		transition: ViewTransition;
	}[] = [];
	const styles: object[] = [];
	const document = {
		head: { appendChild: (style: object) => styles.push(style) },
		createElement: () => ({ remove: vi.fn(), setAttribute: vi.fn(), textContent: '', nonce: '' }),
		getAnimations: () => [],
		images: [],
		fonts: { status: 'loaded' },
		startViewTransition: vi.fn((update: () => Promise<void>) => {
			const ready = deferred();
			const updated = deferred();
			const finished = deferred();
			const transition = {
				ready: ready.promise,
				updateCallbackDone: updated.promise,
				finished: finished.promise,
				types: new Set<string>(),
				skipTransition: vi.fn(() => {
					ready.reject(new DOMException('skip', 'AbortError'));
					finished.resolve();
				})
			} as unknown as ViewTransition;
			sessions.push({
				transition,
				async run() {
					try {
						await update();
						updated.resolve();
						ready.resolve();
					} catch (error) {
						updated.reject(error);
						ready.reject(error);
						finished.reject(error);
					}
				},
				finish: finished.resolve,
				rejectReady: ready.reject
			});
			return transition;
		})
	} as unknown as Document;
	return { document, sessions, styles };
}

async function microtasks() {
	for (let i = 0; i < 8; i++) await Promise.resolve();
}

it('runs fallback updates exactly once, awaits asynchronous changes and exposes transition types', async () => {
	const changed: string[] = [];
	const update = vi.fn(async ({ addType }: { addType(type: string): void }) => {
		changed.push('first');
		await Promise.resolve();
		addType('loaded');
		changed.push('second');
	});
	const handle = startViewTransition(update, { document: {} as Document, types: ['next'] });
	await expect(handle.finished).resolves.toBe('unsupported');
	await expect(handle.updateCallbackDone).resolves.toBeUndefined();
	expect(update).toHaveBeenCalledTimes(1);
	expect(changed).toEqual(['first', 'second']);
	expect(handle.types).toEqual(['next', 'loaded']);
});

it('surfaces callback rejection on both completion promises without hiding the error', async () => {
	const error = new Error('failed content');
	const handle = startViewTransition(
		() => {
			throw error;
		},
		{ document: {} as Document }
	);
	await expect(handle.updateCallbackDone).rejects.toBe(error);
	await expect(handle.ready).rejects.toBe(error);
	await expect(handle.finished).rejects.toBe(error);
});

it('serializes captures and coalesces queued updates without losing any mutation', async () => {
	const { document, sessions } = nativeDocument();
	const changes: string[] = [];
	const first = startViewTransition(
		() => {
			changes.push('a');
		},
		{ document, reducedMotion: 'never' }
	);
	await microtasks();
	expect(sessions).toHaveLength(1);
	expect(changes).toEqual([]);
	await sessions[0].run();
	await first.ready;
	const second = startViewTransition(
		() => {
			changes.push('b');
		},
		{ document, reducedMotion: 'never' }
	);
	const third = startViewTransition(
		() => {
			changes.push('c');
		},
		{ document, reducedMotion: 'never' }
	);
	await microtasks();
	expect(sessions).toHaveLength(1);
	sessions[0].finish();
	await first.finished;
	await microtasks();
	expect(sessions).toHaveLength(2);
	await sessions[1].run();
	sessions[1].finish();
	await Promise.all([second.finished, third.finished]);
	expect(changes).toEqual(['a', 'b', 'c']);
});

it('replace releases snapshot ownership and signals a superseded async callback', async () => {
	const { document, sessions } = nativeDocument();
	const gate = deferred();
	const changes: string[] = [];
	const old = startViewTransition(
		async ({ signal }) => {
			await gate.promise;
			if (!signal.aborted) changes.push('stale');
		},
		{ document, reducedMotion: 'never' }
	);
	await microtasks();
	const oldRun = sessions[0].run();
	await microtasks();
	const latest = startViewTransition(
		() => {
			changes.push('latest');
		},
		{ document, reducedMotion: 'never', policy: 'replace' }
	);
	await microtasks();
	expect(sessions).toHaveLength(2);
	await sessions[1].run();
	sessions[1].finish();
	await latest.finished;
	gate.resolve();
	await oldRun;
	await expect(old.finished).resolves.toBe('skipped');
	expect(changes).toEqual(['latest']);
	expect(sessions[0].transition.skipTransition).toHaveBeenCalledTimes(1);
});

it('a startup failure and throwing diagnostics still apply an update once and release styles', async () => {
	const { document, styles } = nativeDocument();
	vi.mocked(document.startViewTransition).mockImplementation(() => {
		throw new Error('unsupported options');
	});
	const change = vi.fn();
	const handle = startViewTransition(change, {
		document,
		reducedMotion: 'never',
		onDiagnostic: () => {
			throw new Error('logger');
		}
	});
	await expect(handle.finished).resolves.toBe('skipped');
	expect(change).toHaveBeenCalledTimes(1);
	expect((styles[0] as { remove: unknown }).remove).toHaveBeenCalledTimes(1);
});

it('cancellation before native update invocation cannot invoke the mutation twice', async () => {
	const { document, sessions } = nativeDocument();
	const change = vi.fn();
	const handle = startViewTransition(change, { document, reducedMotion: 'never' });
	await microtasks();
	handle.cancel();
	await handle.finished;
	await sessions[0].run();
	expect(change).toHaveBeenCalledTimes(1);
	expect(change.mock.calls[0][0].signal.aborted).toBe(true);
});

it('does not run a native capture under reduced motion', async () => {
	const { document, sessions } = nativeDocument();
	const change = vi.fn();
	const handle = startViewTransition(change, { document, reducedMotion: 'always' });
	await expect(handle.finished).resolves.toBe('skipped');
	expect(sessions).toHaveLength(0);
	expect(change).toHaveBeenCalledTimes(1);
});

function snapshot(owner: symbol, fingerprint = 'a', box = [0, 0, 10, 10]): ViewSnapshot {
	return {
		participant: { owner } as ViewSnapshot['participant'],
		name: 'name',
		options: {},
		fingerprint,
		box
	};
}

it('distinguishes enter/exit/update/share and selects entering shared options', () => {
	const same = Symbol();
	const before = new Map([
		['exit', snapshot(Symbol())],
		['update', snapshot(same)],
		['share', snapshot(Symbol())],
		['unchanged', snapshot(same)]
	]);
	const shared = { ...snapshot(Symbol()), options: { name: 'entering' } };
	const after = new Map([
		['enter', snapshot(Symbol())],
		['update', snapshot(same, 'changed')],
		['share', shared],
		['unchanged', snapshot(same)]
	]);
	const changes = classifyViewChanges(before, after);
	expect(changes.map(({ type }) => type)).toEqual(['exit', 'update', 'share', 'enter']);
	expect(changes.find(({ type }) => type === 'share')?.snapshot).toBe(shared);
});

it('treats size/position changes as updates and encodes names without collisions', () => {
	const owner = Symbol();
	const changes = classifyViewChanges(
		new Map([['a', snapshot(owner)]]),
		new Map([['a', snapshot(owner, 'a', [5, 0, 10, 10])]])
	);
	expect(changes[0].type).toBe('update');
	expect(viewName('a:1', 0)).not.toBe(viewName('a', 10));
	expect(viewName('💫', 0)).toMatch(/^astra_view_[a-f0-9]+$/);
});
