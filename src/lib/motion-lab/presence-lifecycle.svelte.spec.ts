import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './PresenceLifecycle.svelte';

const delay = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));
const node = (value: string) => document.querySelector<HTMLElement>(`[data-lifecycle="${value}"]`);

it('wait completes after every nested exit and before mounting the replacement', async () => {
	const observations: (HTMLElement | null)[][] = [];
	const complete = vi.fn(() => observations.push([node('a'), node('b')]));
	const { component } = render(Fixture, { onExitComplete: complete });
	await tick();
	await delay(220);
	expect(complete).not.toHaveBeenCalled();
	flushSync(() => component.select('b'));
	await delay(70);
	expect(node('a')).not.toBeNull();
	expect(node('b')).toBeNull();
	expect(complete).not.toHaveBeenCalled();
	await expect.poll(() => node('b')).not.toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
	expect(observations).toEqual([[null, null]]);
});

it('wait reversal reuses the same node and does not complete a cancelled exit', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { onExitComplete: complete });
	await tick();
	await delay(220);
	const initial = node('a');
	flushSync(() => component.select('b'));
	await delay(50);
	flushSync(() => component.select('a'));
	await delay(250);
	expect(node('a')).toBe(initial);
	expect(complete).not.toHaveBeenCalled();
});

it('uses the latest completion callback and coalesces wait destinations', async () => {
	const first = vi.fn();
	const latest = vi.fn();
	const { component } = render(Fixture, { onExitComplete: first });
	await tick();
	await delay(220);
	flushSync(() => component.select('b'));
	await delay(50);
	flushSync(() => {
		component.select('c');
		component.replaceCallback(latest);
	});
	await expect.poll(() => node('c')).not.toBeNull();
	expect(node('b')).toBeNull();
	expect(first).not.toHaveBeenCalled();
	expect(latest).toHaveBeenCalledTimes(1);
});

it('sync mounts the replacement immediately and notifies after the outgoing group leaves', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { mode: 'sync', onExitComplete: complete });
	await tick();
	await delay(220);
	flushSync(() => component.select('b'));
	expect(node('a')).not.toBeNull();
	expect(node('b')).not.toBeNull();
	await delay(70);
	expect(node('a')).not.toBeNull();
	expect(complete).not.toHaveBeenCalled();
	await expect.poll(() => node('a')).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});

it('sync groups rapid exits and restores a retained keyed node on reversal', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { mode: 'sync', onExitComplete: complete });
	await tick();
	await delay(220);
	const initial = node('a');
	flushSync(() => component.select('b'));
	await delay(40);
	flushSync(() => component.select('c'));
	await delay(40);
	flushSync(() => component.select('a'));
	expect(node('a')).toBe(initial);
	await expect.poll(() => document.querySelectorAll('[data-lifecycle]').length).toBe(1);
	expect(node('a')).toBe(initial);
	expect(complete).toHaveBeenCalledTimes(1);
});

for (const mode of ['wait', 'sync'] as const) {
	it(`${mode} suppresses completion when its parent is disposed during an exit`, async () => {
		const complete = vi.fn();
		const { component, unmount } = render(Fixture, { mode, onExitComplete: complete });
		await tick();
		await delay(220);
		flushSync(() => component.select('b'));
		await unmount();
		await delay(250);
		expect(complete).not.toHaveBeenCalled();
		expect(document.querySelector('[data-lifecycle]')).toBeNull();
	});

	it(`${mode} completes an empty outgoing snippet without waiting for a DOM event`, async () => {
		const complete = vi.fn();
		const { component } = render(Fixture, { mode, empty: true, onExitComplete: complete });
		await tick();
		await delay(220);
		flushSync(() => component.select('b'));
		await expect.poll(() => node('b')).not.toBeNull();
		expect(complete).toHaveBeenCalledTimes(1);
	});
}

it('mode changes reset sequencing without completing abandoned branches', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { onExitComplete: complete });
	await tick();
	await delay(220);
	flushSync(() => component.select('b'));
	await delay(35);
	flushSync(() => component.changeMode('sync'));
	await delay(35);
	flushSync(() => component.changeMode('wait'));
	await delay(260);
	expect(document.querySelectorAll('[data-lifecycle]')).toHaveLength(1);
	expect(node('b')).not.toBeNull();
	expect(complete).not.toHaveBeenCalled();
	flushSync(() => component.select('c'));
	await expect.poll(() => node('c')).not.toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});

it('sync preserves Object.is identity for signed zero selections', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { mode: 'sync', onExitComplete: complete });
	await tick();
	await delay(220);
	flushSync(() => component.select(0));
	await delay(220);
	complete.mockClear();
	const initial = node('0');
	flushSync(() => component.select(-0));
	expect(document.querySelectorAll('[data-lifecycle="0"]')).toHaveLength(2);
	await expect.poll(() => initial?.isConnected).toBe(false);
	expect(node('0')).not.toBe(initial);
	expect(complete).toHaveBeenCalledTimes(1);
});

for (const mode of ['wait', 'sync'] as const) {
	it(`${mode} suppresses completion while its whole component undergoes a retained outro`, async () => {
		const complete = vi.fn();
		const latest = vi.fn();
		const { component } = render(Fixture, { mode, onExitComplete: complete });
		await tick();
		await delay(220);
		flushSync(() => component.hide());
		expect(node('a')).not.toBeNull();
		flushSync(() => component.replaceCallback(latest));
		await expect.poll(() => document.querySelector('[data-lifecycle]')).toBeNull();
		expect(complete).not.toHaveBeenCalled();
		expect(latest).not.toHaveBeenCalled();
	});
}

it('sync calls the latest callback after retained branches complete', async () => {
	const first = vi.fn();
	const latest = vi.fn();
	const { component } = render(Fixture, { mode: 'sync', onExitComplete: first });
	await tick();
	await delay(220);
	flushSync(() => component.select('b'));
	await delay(50);
	flushSync(() => component.replaceCallback(latest));
	await expect.poll(() => node('a')).toBeNull();
	expect(first).not.toHaveBeenCalled();
	expect(latest).toHaveBeenCalledTimes(1);
});

it('wait honors a new destination chosen by the completion callback', async () => {
	const { component } = render(Fixture);
	const complete = vi.fn(() => component.select('c'));
	await tick();
	await delay(220);
	flushSync(() => {
		component.replaceCallback(complete);
		component.select('b');
	});
	await expect.poll(() => node('c')).not.toBeNull();
	expect(node('b')).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});
