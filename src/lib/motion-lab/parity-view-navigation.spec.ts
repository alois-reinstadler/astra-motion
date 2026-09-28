import { afterEach, expect, it, vi } from 'vitest';
import type { ViewTransitionOptions, ViewUpdate } from '../motion/view-types.js';

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	destroy: vi.fn(),
	start: vi.fn(),
	config: { reducedMotion: 'always' } as { reducedMotion: 'always' | 'never' }
}));
vi.mock('$app/navigation', () => ({ onNavigate: mocks.navigate }));
vi.mock('svelte', () => ({ onDestroy: mocks.destroy }));
vi.mock('../motion/config.js', () => ({ readMotionConfig: () => () => mocks.config }));
vi.mock('../motion/view-transitions.js', () => ({ startViewTransition: mocks.start }));
import { viewTransitionsForNavigation } from '../motion/view-navigation.js';

afterEach(() => {
	for (const [destroy] of mocks.destroy.mock.calls) destroy();
	vi.unstubAllGlobals();
	vi.clearAllMocks();
	mocks.config.reducedMotion = 'always';
});

it('does not register browser navigation hooks during SSR', () => {
	viewTransitionsForNavigation();
	expect(mocks.navigate).not.toHaveBeenCalled();
	expect(mocks.destroy).not.toHaveBeenCalled();
});

it('releases SvelteKit inside capture, awaits navigation, inherits live config, and cancels on teardown', async () => {
	vi.stubGlobal('document', {});
	const cancel = vi.fn();
	let update!: ViewUpdate;
	let options!: ViewTransitionOptions;
	mocks.start.mockImplementation((next: ViewUpdate, nextOptions: ViewTransitionOptions) => {
		update = next;
		options = nextOptions;
		return { cancel };
	});
	viewTransitionsForNavigation({ types: ['navigation'] });
	mocks.config.reducedMotion = 'never';
	let finish!: () => void;
	const complete = new Promise<void>((resolve) => {
		finish = resolve;
	});
	const proceed = mocks.navigate.mock.calls[0][0]({ complete });
	expect(options).toMatchObject({
		policy: 'replace',
		types: ['navigation'],
		reducedMotion: 'never'
	});
	let committed = false;
	void proceed.then(() => {
		committed = true;
	});
	await Promise.resolve();
	expect(committed).toBe(false);
	const updated = update({ signal: new AbortController().signal, addType: vi.fn() });
	await proceed;
	expect(committed).toBe(true);
	finish();
	await updated;
	mocks.destroy.mock.calls[0][0]();
	expect(cancel).toHaveBeenCalledTimes(1);
});

it('rejects duplicate layout coordinators and releases an aborted navigation wait', async () => {
	vi.stubGlobal('document', {});
	let update!: ViewUpdate;
	mocks.start.mockImplementation((next: ViewUpdate) => {
		update = next;
		return { cancel: vi.fn() };
	});
	viewTransitionsForNavigation();
	expect(() => viewTransitionsForNavigation()).toThrow('installed once');
	const proceed = mocks.navigate.mock.calls[0][0]({ complete: new Promise(() => {}) });
	const controller = new AbortController();
	const waiting = update({ signal: controller.signal, addType: vi.fn() });
	await proceed;
	controller.abort();
	await expect(waiting).resolves.toBeUndefined();
});
