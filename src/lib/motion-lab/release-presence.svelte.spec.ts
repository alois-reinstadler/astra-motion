import { flushSync, tick } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './ReleasePresenceFixture.svelte';

const node = (id = 'a') => document.querySelector(`[data-release-presence="${id}"]`);
const manualTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
afterEach(() => vi.useRealTimers());

for (const mode of ['sync', 'wait'] as const) {
	it(`initialization-captured safeToRemove completes a ${mode} exit`, async () => {
		manualTimers();
		const { component } = render(Fixture, { mode });
		await tick();
		const original = node();
		flushSync(() => component.select(['b']));
		expect(node()).toBe(original);
		expect(node()?.querySelector('[data-present]')?.textContent).toBe('false');
		expect(Boolean(node('b'))).toBe(mode === 'sync');
		await vi.advanceTimersByTimeAsync(100);
		await tick();
		expect(node()).toBeNull();
		expect(node('b')).not.toBeNull();
		expect(component.completions()).toEqual({ manual: ['a'], exits: 1 });
	});
}

it('cancels the manual timer on reversal before completing the later exit', async () => {
	manualTimers();
	const { component } = render(Fixture);
	await tick();
	const original = node();
	flushSync(() => component.select([]));
	await vi.advanceTimersByTimeAsync(40);
	flushSync(() => component.select(['a']));
	expect(node()).toBe(original);
	expect(component.cancellations()).toEqual(['a']);
	await vi.advanceTimersByTimeAsync(20);
	flushSync(() => component.select([]));
	// The first exit's original deadline passes during this second exit.
	await vi.advanceTimersByTimeAsync(40);
	expect(node()).toBe(original);
	expect(component.completions()).toEqual({ manual: [], exits: 0 });
	await vi.advanceTimersByTimeAsync(60);
	await tick();
	expect(node()).toBeNull();
	expect(component.completions()).toEqual({ manual: ['a'], exits: 1 });
});

it('selects presence and custom fields independently through an active exit', async () => {
	manualTimers();
	const { component } = render(Fixture);
	await tick();
	const initial = component.effects();
	flushSync(() => component.setCustom(2));
	expect(component.effects()).toEqual({ ...initial, data: initial.data + 1 });
	expect(node()?.querySelector('[data-custom]')?.textContent).toBe('2');
	flushSync(() => component.select([]));
	const exiting = component.effects();
	expect(exiting).toEqual({
		presence: initial.presence + 1,
		isPresent: initial.isPresent + 1,
		data: initial.data + 1
	});
	await vi.advanceTimersByTimeAsync(40);
	flushSync(() => component.setCustom(3));
	expect(component.effects()).toEqual({ ...exiting, data: exiting.data + 1 });
	expect(node()?.querySelector('[data-custom]')?.textContent).toBe('3');
	expect(component.cancellations()).toEqual([]);
	// Custom publication must not restart the original 100ms exit timer.
	await vi.advanceTimersByTimeAsync(60);
	await tick();
	expect(node()).toBeNull();
	expect(component.completions()).toEqual({ manual: ['a'], exits: 1 });
});

it('cancels application-owned timers when the boundary is destroyed', async () => {
	manualTimers();
	const { component, unmount } = render(Fixture);
	await tick();
	flushSync(() => component.select([]));
	await unmount();
	await vi.advanceTimersByTimeAsync(100);
	expect(component.cancellations()).toEqual(['a']);
	expect(component.completions()).toEqual({ manual: [], exits: 0 });
	expect(node()).toBeNull();
});
