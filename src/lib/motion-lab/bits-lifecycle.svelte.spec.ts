import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import BitsLifecycle from './BitsLifecycle.svelte';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const node = (id: string) => document.querySelector<HTMLElement>(`[data-testid="bits-${id}"]`)!;
async function click(id: string) {
	node(id).click();
	await tick();
}
async function open() {
	node('trigger').focus();
	await click('trigger');
	await expect.poll(() => document.activeElement).toBe(node('first'));
	await expect.poll(() => Number(getComputedStyle(node('content')).opacity)).toBeGreaterThan(0.2);
}

it('keeps native dialog and overlay exits while restoring focus at logical close', async () => {
	await render(BitsLifecycle);
	await open();
	const original = node('content');
	expect(document.activeElement).toBe(node('first'));
	await click('close');
	expect(node('content')).toBe(original);
	expect(node('overlay')).not.toBeNull();
	expect(document.activeElement).toBe(node('trigger'));
	expect(node('closes').textContent).toBe('1');
	await expect.poll(() => node('content'), { timeout: 3000 }).toBeNull();
	await expect.poll(() => node('overlay'), { timeout: 3000 }).toBeNull();
});

it('reverses the retained dialog and reacquires focus without duplicating a scope', async () => {
	await render(BitsLifecycle);
	await open();
	const original = node('content');
	await click('close');
	await wait(50);
	await click('reopen');
	await expect.poll(() => document.activeElement).toBe(node('first'));
	expect(node('content')).toBe(original);
	expect(document.activeElement).toBe(node('first'));
	expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
	expect(node('closes').textContent).toBe('1');
});

it('keeps Escape handling in Bits and restores focus while exit is retained', async () => {
	await render(BitsLifecycle);
	await open();
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
	await tick();
	expect(node('trigger').getAttribute('aria-expanded')).toBe('false');
	expect(document.activeElement).toBe(node('trigger'));
	await expect.poll(() => node('content'), { timeout: 3000 }).toBeNull();
});

it('uses forceMount to avoid hidden cutting off accordion outro and reverses its node', async () => {
	await render(BitsLifecycle);
	await click('accordion-trigger');
	await expect.poll(() => Number(getComputedStyle(node('accordion')).opacity)).toBeGreaterThan(0.2);
	const original = node('accordion');
	await click('accordion-trigger');
	expect(node('accordion')).toBe(original);
	expect(original.hidden).toBe(false);
	await click('accordion-trigger');
	await expect.poll(() => Number(getComputedStyle(node('accordion')).opacity)).toBe(1);
	expect(node('accordion')).toBe(original);
	expect(node('accordion-trigger').getAttribute('aria-expanded')).toBe('true');
});

it('destroys an active owner without a stale portalled dialog or focus scope', async () => {
	await render(BitsLifecycle);
	await open();
	await click('owner');
	await expect.poll(() => node('content'), { timeout: 3000 }).toBeNull();
	await expect.poll(() => node('overlay'), { timeout: 3000 }).toBeNull();
	node('reopen').focus();
	expect(document.activeElement).toBe(node('reopen'));
});
