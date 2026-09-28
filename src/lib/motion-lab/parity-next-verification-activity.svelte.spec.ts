import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Activity from './ParityNextVerificationActivity.svelte';

const node = (name: string) => document.querySelector<HTMLElement>(`[data-verification-${name}]`)!;
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async (count: number) => {
	for (let index = 0; index < count; index++) await frame();
};
const clock = () => Number(node('clock="tab"').textContent);

it('accepts an ordinary Tab component, waits for staggered motion descendants, and retains local state', async () => {
	const lifecycle = vi.fn();
	const complete = vi.fn();
	const screen = render(Activity, { onLifecycle: lifecycle, onExitComplete: complete });
	await screen.getByRole('button', { name: 'Increment tab: 0' }).click();
	const input = document.querySelector<HTMLInputElement>('[aria-label="tab draft"]')!;
	await screen.getByRole('textbox', { name: 'tab draft' }).fill('Retained draft');
	const original = node('tab="tab"');
	const siblingTop = node('sibling').getBoundingClientRect().top;
	flushSync(() => screen.component.hide());
	expect(node('outer').dataset.astraActivity).toBe('exiting');
	expect(node('sibling').getBoundingClientRect().top).toBeCloseTo(siblingTop, 1);
	expect(lifecycle.mock.calls.map(([event]) => event)).not.toContain('tab:cleanup');
	await expect.poll(() => node('outer').dataset.astraActivity).toBe('hidden');
	const exits = lifecycle.mock.calls.filter(([event]) => /^tab:exit-/.test(event));
	expect(exits.map(([event]) => event)).toEqual(['tab:exit-0', 'tab:exit-1', 'tab:exit-2']);
	expect(exits[2][1] - exits[0][1]).toBeGreaterThan(100);
	expect(lifecycle.mock.calls.map(([event]) => event)).toEqual([
		'tab:mount',
		'tab:setup',
		'tab:exit-0',
		'tab:exit-1',
		'tab:exit-2',
		'tab:cleanup'
	]);
	expect(complete).toHaveBeenCalledTimes(1);
	expect(getComputedStyle(node('outer')).display).toBe('none');
	expect(node('sibling').getBoundingClientRect().top).toBeCloseTo(siblingTop - 150, 1);
	const stopped = clock();
	await frames(4);
	expect(clock()).toBe(stopped);
	flushSync(() => screen.component.show());
	expect(node('tab="tab"')).toBe(original);
	expect(document.querySelector('[aria-label="tab draft"]')).toBe(input);
	expect(input.value).toBe('Retained draft');
	expect(original.querySelector('button')?.textContent).toBe('Increment tab: 1');
	await expect.poll(clock).toBeGreaterThan(stopped);
	expect(lifecycle.mock.calls.filter(([event]) => event === 'tab:mount')).toHaveLength(1);
	expect(lifecycle.mock.calls.filter(([event]) => event === 'tab:setup')).toHaveLength(2);
});

it('waits for nested visible Activity descendants and respects the inner local mode after reveal', async () => {
	const lifecycle = vi.fn();
	const { component } = render(Activity, { nested: true, onLifecycle: lifecycle });
	await frames(2);
	flushSync(() => component.hide());
	await tick();
	expect(node('outer').dataset.astraActivity).toBe('exiting');
	expect(node('inner').dataset.astraActivity).toBe('exiting');
	expect(node('outer').inert).toBe(true);
	await expect.poll(() => node('outer').dataset.astraActivity).toBe('hidden');
	expect(node('inner').dataset.astraActivity).toBe('hidden');
	expect(lifecycle.mock.calls.filter(([event]) => /^tab:exit-/.test(event))).toHaveLength(3);
	flushSync(() => component.hideInner());
	flushSync(() => component.show());
	expect(node('outer').dataset.astraActivity).toBe('visible');
	expect(node('inner').dataset.astraActivity).toBe('hidden');
	expect(node('locally-hidden').dataset.astraActivity).toBe('hidden');
	expect(lifecycle.mock.calls.filter(([event]) => event === 'locally-hidden:setup')).toHaveLength(
		0
	);
	const held = clock();
	await frames(3);
	expect(clock()).toBe(held);
	flushSync(() => component.showInner());
	await expect.poll(clock).toBeGreaterThan(held);
	expect(lifecycle.mock.calls.filter(([event]) => event === 'tab:mount')).toHaveLength(1);
});

it.each([
	{ nested: false, wrapped: false },
	{ nested: true, wrapped: false },
	{ nested: false, wrapped: true }
])(
	'pops the ordinary component root, then reverses without stale styles or stealing focus (nested=$nested, wrapped=$wrapped)',
	async ({ nested, wrapped }) => {
		const lifecycle = vi.fn();
		const complete = vi.fn();
		const screen = render(Activity, {
			nested,
			wrapped,
			layoutMode: 'pop',
			onLifecycle: lifecycle,
			onExitComplete: complete
		});
		await screen.getByRole('textbox', { name: 'tab draft' }).fill('Keep my draft');
		const input = document.querySelector<HTMLInputElement>('[aria-label="tab draft"]')!;
		const original = node('tab="tab"');
		const popped = wrapped ? node('wrapper') : original;
		const before = popped.getBoundingClientRect();
		const popStyles = () =>
			[...document.querySelectorAll('style')].filter((style) =>
				style.textContent?.includes('[data-astra-presence-pop=')
			);
		const previousStyles = popStyles();
		const siblingTop = node('sibling').getBoundingClientRect().top;
		flushSync(() => screen.component.hide());
		await tick();
		expect(node('outer').dataset.astraActivity).toBe('exiting');
		expect(getComputedStyle(popped).position).toBe('absolute');
		expect(node('sibling').getBoundingClientRect().top).toBeCloseTo(siblingTop - before.height, 1);
		expect(popped.getBoundingClientRect().top).toBeCloseTo(before.top, 1);
		expect(popped.getBoundingClientRect().width).toBeCloseTo(before.width, 1);
		await screen.getByRole('button', { name: 'Outside focus target' }).click();
		flushSync(() => screen.component.show());
		await frames(20);
		expect(node('outer').dataset.astraActivity).toBe('visible');
		expect(node('tab="tab"')).toBe(original);
		expect(input.value).toBe('Keep my draft');
		expect(node('outer').inert).toBe(false);
		expect(getComputedStyle(popped).position).toBe('static');
		expect(node('sibling').getBoundingClientRect().top).toBeCloseTo(siblingTop, 1);
		expect(document.activeElement).toBe(node('outside'));
		expect(document.querySelector('[data-astra-presence-pop]')).toBeNull();
		expect(popStyles()).toEqual(previousStyles);
		expect(complete).not.toHaveBeenCalled();
		expect(lifecycle.mock.calls.filter(([event]) => event === 'tab:cleanup')).toHaveLength(0);
	}
);
