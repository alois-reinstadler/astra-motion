import { flushSync } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './RCPresence.svelte';
const item = (id = 'a') => document.querySelector<HTMLElement>(`[data-rc-presence="${id}"]`);

it.each(['sync', 'wait', 'popLayout'] as const)(
	'retains outgoing data and latest replacement in %s mode',
	async (mode) => {
		const { component } = render(Fixture, { mode });
		await expect.poll(() => item()?.style.opacity).toBe('1');
		const original = item()!;
		flushSync(() => component.select('b', 'Replacement B'));
		expect(original.isConnected).toBe(true);
		expect(original.textContent).toContain('Original A');
		if (mode === 'wait') expect(item('b')).toBeNull();
		flushSync(() => component.select('c', 'Latest C'));
		expect(original.textContent).toContain('Original A');
		await expect.poll(() => item('c')?.style.opacity).toBe('1');
		await expect.poll(() => original.isConnected).toBe(false);
		await expect.poll(() => item('b')).toBeNull();
		expect(item('c')?.textContent).toContain('Latest C');
	}
);

it('updates equal selector identities and reverses an exit on the original node', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { onComplete: complete });
	await expect.poll(() => item()?.style.opacity).toBe('1');
	const original = item()!;
	flushSync(() => component.select('a', 'Updated A'));
	expect(item()).toBe(original);
	expect(original.textContent).toContain('Updated A');
	flushSync(() => component.clear());
	await expect.poll(() => Number(getComputedStyle(original).opacity)).toBeLessThan(0.99);
	flushSync(() => component.restore());
	expect(item()).toBe(original);
	await expect.poll(() => original.style.opacity).toBe('1');
	expect(complete).not.toHaveBeenCalled();
	flushSync(() => component.clear(true));
	await expect.poll(() => item()).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
	flushSync(() => component.restore());
	await expect.poll(() => item()?.style.opacity).toBe('1');
	expect(item()).not.toBe(original);
});

it('treats undefined as absent and uses object reference identity by default', async () => {
	const { component } = render(Fixture, { keyed: false, empty: true });
	expect(item()).toBeNull();
	flushSync(() => component.restore());
	await expect.poll(() => item()?.style.opacity).toBe('1');
	const original = item()!;
	flushSync(() => component.select('a', 'New reference'));
	expect(document.querySelectorAll('[data-rc-presence="a"]')).toHaveLength(2);
	expect(original.textContent).toContain('Original A');
	await expect.poll(() => original.isConnected).toBe(false);
	expect(item()?.textContent).toContain('New reference');
});
