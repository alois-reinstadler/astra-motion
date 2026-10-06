import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './ParityPresence.svelte';
import Nested from './ParityPresenceNested.svelte';
import { layoutBridge } from '../motion/commit.js';

const node = (id: string) => document.querySelector<HTMLElement>(`[data-presence-item="${id}"]`);
const delay = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));

function captureRemovalBatches() {
	const previous = { schedule: layoutBridge.schedule, update: layoutBridge.update };
	const frames: (() => void)[] = [];
	let transactions = 0;
	layoutBridge.schedule = (flush) => frames.push(flush);
	layoutBridge.update = (change) => {
		transactions++;
		flushSync(change);
	};
	return {
		frames,
		get transactions() {
			return transactions;
		},
		flush() {
			frames.shift()?.();
		},
		restore() {
			while (frames.length) frames.shift()!();
			Object.assign(layoutBridge, previous);
		}
	};
}

it('removes independently completed records together in one layout transaction', async () => {
	const complete = vi.fn();
	const screen = render(Fixture, {
		initialItems: ['a', 'b', 'c'],
		hold: null,
		onExitComplete: complete
	});
	const batches = captureRemovalBatches();
	try {
		await tick();
		const survivor = node('c');
		flushSync(() => screen.component.select(['c']));
		screen.component.release('a');
		await tick();
		screen.component.release('b');
		await tick();
		expect(batches.frames).toHaveLength(1);
		expect(node('a')).not.toBeNull();
		expect(node('b')).not.toBeNull();
		expect(complete).not.toHaveBeenCalled();
		batches.flush();
		expect(node('a')).toBeNull();
		expect(node('b')).toBeNull();
		expect(node('c')).toBe(survivor);
		expect(batches.transactions).toBe(1);
		expect(complete).toHaveBeenCalledTimes(1);
	} finally {
		await screen.unmount();
		batches.restore();
	}
});

it('does not apply a queued completion to a revived record that exits again', async () => {
	const complete = vi.fn();
	const screen = render(Fixture, { hold: null, onExitComplete: complete });
	const batches = captureRemovalBatches();
	try {
		await tick();
		const original = node('a');
		flushSync(() => screen.component.select([]));
		screen.component.release('a');
		await tick();
		expect(batches.frames).toHaveLength(1);
		flushSync(() => screen.component.select(['a']));
		flushSync(() => screen.component.select([]));
		batches.flush();
		expect(node('a')).toBe(original);
		expect(complete).not.toHaveBeenCalled();
		screen.component.release('a');
		await tick();
		batches.flush();
		expect(node('a')).toBeNull();
		expect(complete).toHaveBeenCalledTimes(1);
	} finally {
		await screen.unmount();
		batches.restore();
	}
});

it('preserves a pending revival when presence runs without the layout engine', async () => {
	const complete = vi.fn();
	const screen = render(Fixture, { hold: null, onExitComplete: complete });
	const batches = captureRemovalBatches();
	layoutBridge.update = undefined;
	try {
		await tick();
		const original = node('a');
		flushSync(() => screen.component.select([]));
		screen.component.release('a');
		await tick();
		expect(batches.frames).toHaveLength(1);
		// No layout transaction is available to flush the requested revival before
		// removal runs. Reconciliation must consult the latest requested input.
		screen.component.select(['a']);
		batches.flush();
		await tick();
		expect(node('a')).toBe(original);
		expect(complete).not.toHaveBeenCalled();
	} finally {
		await screen.unmount();
		batches.restore();
	}
});

it('discards a queued removal when its boundary is destroyed', async () => {
	const complete = vi.fn();
	const screen = render(Fixture, { hold: null, onExitComplete: complete });
	const batches = captureRemovalBatches();
	try {
		await tick();
		flushSync(() => screen.component.select([]));
		screen.component.release('a');
		await tick();
		expect(batches.frames).toHaveLength(1);
		await screen.unmount();
		batches.flush();
		expect(node('a')).toBeNull();
		expect(complete).not.toHaveBeenCalled();
	} finally {
		batches.restore();
	}
});

it('defaults to sync, retains outgoing data and keeps surviving keyed inputs on list changes', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, {
		initialItems: ['a', 'b', 'c'],
		onExitComplete: complete
	});
	await tick();
	const a = node('a');
	const b = node('b');
	const input = a!.querySelector('input')!;
	input.value = 'draft';
	flushSync(() => component.select(['d', 'a', 'c']));
	expect(node('d')).not.toBeNull();
	expect(node('a')).toBe(a);
	expect(node('b')).toBe(b);
	expect(node('b')?.querySelector('[data-present]')?.textContent).toBe('false');
	expect(input.value).toBe('draft');
	await expect.poll(() => node('b')).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});

it('keeps item identity on new data with the same key', async () => {
	const { component } = render(Fixture);
	await tick();
	const original = node('a');
	flushSync(() => component.rename('a', 'Renamed'));
	expect(node('a')).toBe(original);
	expect(node('a')?.querySelector('label')?.textContent).toBe('Renamed');
});

it('wait coalesces pending selections and uses the latest custom data inside an exiting record', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { mode: 'wait', hold: null, onExitComplete: complete });
	await tick();
	flushSync(() => {
		component.select(['b']);
		component.setCustom(-1);
	});
	expect(node('a')).not.toBeNull();
	expect(node('b')).toBeNull();
	expect(node('a')?.querySelector('[data-custom]')?.textContent).toBe('-1');
	flushSync(() => {
		component.select(['c']);
		component.setCustom(2);
	});
	expect(node('a')?.querySelector('[data-custom]')?.textContent).toBe('2');
	component.release('a');
	await expect.poll(() => node('c')).not.toBeNull();
	expect(node('a')).toBeNull();
	expect(node('b')).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});

it('reuses a reversed record and an old safeToRemove cannot release its next exit', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { hold: null, onExitComplete: complete });
	await tick();
	const original = node('a');
	flushSync(() => component.select([]));
	const stale = component.removal('a');
	flushSync(() => component.select(['a']));
	expect(node('a')).toBe(original);
	flushSync(() => component.select([]));
	stale();
	await tick();
	expect(node('a')).toBe(original);
	expect(complete).not.toHaveBeenCalled();
	component.release('a');
	await expect.poll(() => node('a')).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});

it('waits for all simultaneous manual exits and suppresses completion after owner disposal', async () => {
	const complete = vi.fn();
	const { component, unmount } = render(Fixture, {
		initialItems: ['a', 'b'],
		hold: null,
		onExitComplete: complete
	});
	await tick();
	flushSync(() => component.select([]));
	component.release('a');
	await tick();
	expect(complete).not.toHaveBeenCalled();
	expect(node('b')).not.toBeNull();
	const stale = component.removal('b');
	await unmount();
	stale();
	await tick();
	expect(node('a')).toBeNull();
	expect(node('b')).toBeNull();
	expect(complete).not.toHaveBeenCalled();
});

it('shields nested exits by default and propagates them only when requested', async () => {
	const exits = vi.fn();
	const first = render(Nested, { onExit: exits });
	await tick();
	flushSync(() => first.component.hide());
	await expect.poll(() => node('outer')).toBeNull();
	expect(exits.mock.calls.map(([id]) => id)).toEqual(['outer']);
	await first.unmount();
	exits.mockClear();
	const complete = vi.fn();
	const second = render(Nested, { propagate: true, onExit: exits, onExitComplete: complete });
	await tick();
	flushSync(() => second.component.hide());
	await delay(45);
	expect(node('outer')).not.toBeNull();
	expect(node('inner')?.querySelector('[data-present]')?.textContent).toBe('false');
	expect(exits.mock.calls.map(([id]) => id).sort()).toEqual(['inner', 'outer']);
	expect(complete).not.toHaveBeenCalled();
	second.component.release();
	await expect.poll(() => node('outer')).toBeNull();
	expect(node('inner')).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});

it('pops plain forwarded roots out of layout and restores authored styles on reversal', async () => {
	const { component } = render(Fixture, {
		initialItems: ['a', 'b'],
		mode: 'popLayout',
		hold: null
	});
	await tick();
	const a = node('a')!;
	const originalStyle = a.getAttribute('style');
	const before = a.getBoundingClientRect();
	const beforeB = node('b')!.getBoundingClientRect();
	flushSync(() => component.select(['b']));
	await expect.poll(() => getComputedStyle(a).position).toBe('absolute');
	const popped = a.getBoundingClientRect();
	expect(Math.abs(popped.left - before.left)).toBeLessThan(0.1);
	expect(Math.abs(popped.top - before.top)).toBeLessThan(0.1);
	expect(node('b')!.getBoundingClientRect().top).toBeLessThan(beforeB.top);
	flushSync(() => component.select(['a', 'b']));
	await tick();
	expect(node('a')).toBe(a);
	expect(getComputedStyle(a).position).not.toBe('absolute');
	expect(a.getAttribute('style')).toBe(originalStyle);
	expect(a.hasAttribute('data-astra-presence-pop')).toBe(false);
});
