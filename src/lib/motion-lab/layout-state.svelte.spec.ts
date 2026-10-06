import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './LayoutStateFixture.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const item = (id: number) =>
	document.querySelector<HTMLElement>(`[data-layout-state-item="${id}"]`);

it('coalesces replacements and accumulates functional updates against the pending value', async () => {
	const rendered: number[] = [];
	const { component } = render(Fixture, { onRender: (count) => rendered.push(count) });
	await tick();
	const { counter } = component.states();
	counter.set(3);
	counter.update((value) => value + 2);
	counter.update((value) => value * 4);
	expect(counter.current).toBe(0);
	await tick();
	expect(counter.current).toBe(20);
	expect(rendered).toEqual([0, 20]);
	counter.set(99);
	counter.set(20);
	await tick();
	expect(rendered).toEqual([0, 20]);
});

it('publishes multiple state objects in one observable render', async () => {
	const rendered: number[][] = [];
	const { component } = render(Fixture, {
		onRender: (count, columns) => rendered.push([count, columns])
	});
	await tick();
	const { counter, scene } = component.states();
	counter.set(7);
	scene.update((value) => ({ ...value, columns: 5 }));
	await tick();
	expect(rendered).toEqual([
		[0, 10],
		[7, 5]
	]);
});

it('accepts mount and effect writes outside Svelte lifecycle flushing', async () => {
	const { component } = render(Fixture, { mountWrite: true });
	await expect.poll(() => component.states().counter.current).toBe(1);
	flushSync(() => component.requestFromEffect());
	await expect.poll(() => component.states().counter.current).toBe(2);
	expect(document.querySelector('[data-layout-state-count]')?.textContent).toBe('2');
});

it('initialization requests publish before subsequent interaction', async () => {
	const { component } = render(Fixture, { initializeCount: 4 });
	await expect.poll(() => component.states().counter.current).toBe(4);
	component.states().counter.update((value) => value + 1);
	await tick();
	expect(component.states().counter.current).toBe(5);
});

it('cancels pending publication and future updates when the component is disposed', async () => {
	const observed = vi.fn();
	const { component, unmount } = render(Fixture, { onRender: observed });
	await tick();
	const { counter } = component.states();
	const calls = observed.mock.calls.length;
	counter.set(8);
	await unmount();
	await tick();
	counter.update(() => {
		throw new Error('An updater must not run after disposal');
	});
	expect(counter.current).toBe(0);
	expect(observed).toHaveBeenCalledTimes(calls);
	expect(document.querySelector('[data-layout-state-grid]')).toBeNull();
});

it('queues a reentrant effect request after publishing the current batch', async () => {
	const rendered: number[] = [];
	const { component } = render(Fixture, {
		onRender: (count) => {
			rendered.push(count);
			if (count === 1) counter.set(2);
		}
	});
	const { counter } = component.states();
	await tick();
	counter.set(1);
	await expect.poll(() => counter.current).toBe(2);
	expect(rendered).toEqual([0, 1, 2]);
});

it.each([false, true])(
	'captures outgoing geometry before parent reflow (interrupted: %s)',
	async (interrupted) => {
		const complete = vi.fn();
		const { component } = render(Fixture, { onExitComplete: complete });
		await tick();
		await frame();
		await frame();
		if (interrupted) {
			component.states().scene.update((value) => ({ ...value, items: [...value.items].reverse() }));
			await new Promise((resolve) => setTimeout(resolve, 90));
			expect(
				[...document.querySelectorAll<HTMLElement>('[data-layout-state-item]')].some(
					(node) => node.style.transform && node.style.transform !== 'none'
				)
			).toBe(true);
		}
		const outgoing = [0, 5];
		const before = new Map(outgoing.map((id) => [id, item(id)!.getBoundingClientRect()]));
		const errors = new Map<number, number>();
		const observer = new MutationObserver(() => {
			for (const id of outgoing) {
				const node = item(id);
				if (!node || errors.has(id) || getComputedStyle(node).position !== 'absolute') continue;
				const old = before.get(id)!;
				const next = node.getBoundingClientRect();
				errors.set(
					id,
					Math.max(
						...(['x', 'y', 'width', 'height'] as const).map((key) => Math.abs(old[key] - next[key]))
					)
				);
			}
		});
		observer.observe(document.querySelector('[data-layout-state-grid]')!, {
			childList: true,
			attributes: true,
			subtree: true
		});
		try {
			const { scene } = component.states();
			scene.update((value) => ({
				columns: 5,
				items: [...value.items].reverse().filter((id) => !outgoing.includes(id))
			}));
			await expect.poll(() => errors.size).toBe(outgoing.length);
			expect(Math.max(...errors.values())).toBeLessThanOrEqual(0.75);
			await expect.poll(() => outgoing.every((id) => item(id) === null)).toBe(true);
			expect(complete).toHaveBeenCalledTimes(1);
			expect(
				[...document.querySelectorAll<HTMLElement>('[data-layout-state-item]')].map((node) =>
					Number(node.dataset.layoutStateItem)
				)
			).toEqual(scene.current.items);
		} finally {
			observer.disconnect();
		}
	}
);
