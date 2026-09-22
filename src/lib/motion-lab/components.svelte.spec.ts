import { expect, it } from 'vitest';
import '../../routes/layout.css';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Components from '../../routes/motion-lab/components/+page.svelte';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
function node(id: string): HTMLElement {
	const result = document.querySelector<HTMLElement>(`[data-testid="component-${id}"]`);
	if (!result) throw new Error(`Missing component-${id}`);
	return result;
}
async function click(id: string) {
	node(id).click();
	await tick();
}

it('reverses the actual accordion without stretching text or losing expanded state', async () => {
	await render(Components);
	await click('accordion-toggle');
	await expect
		.poll(() => node('accordion-content').getBoundingClientRect().height)
		.toBeGreaterThan(0);
	const content = node('accordion-content');
	expect(content.getBoundingClientRect().height).toBeGreaterThan(0);
	await click('accordion-toggle');
	await wait(30);
	await click('accordion-toggle');
	await wait(350);
	expect(node('accordion-content')).toBe(content);
	expect(node('accordion-trigger').getAttribute('aria-expanded')).toBe('true');
	const text = content.querySelector('p')!;
	expect(new DOMMatrix(getComputedStyle(text).transform).a).toBe(1);
	expect(new DOMMatrix(getComputedStyle(text).transform).d).toBe(1);
	await click('extra');
	expect(node('extra-content').textContent).toContain('extra paragraph');
});

it('reopens the same dialog during exit and cleans up a destroyed owner', async () => {
	await render(Components);
	node('dialog-trigger').focus();
	await click('dialog-trigger');
	await expect.poll(() => Number(getComputedStyle(node('dialog')).opacity)).toBeGreaterThan(0.3);
	const original = node('dialog');
	await click('dialog-close');
	await wait(30);
	await click('dialog-trigger');
	await wait(300);
	expect(node('dialog')).toBe(original);
	await click('dialog-destroy');
	await expect.poll(() => document.querySelector('[data-testid="component-dialog"]')).toBeNull();
	expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull();
	node('dialog-reset').focus();
	expect(document.activeElement).toBe(node('dialog-reset'));
});

it('removes cards from flow during filter exits and restores current keyed cards under reversal', async () => {
	await render(Components);
	await expect.poll(() => Number(getComputedStyle(node('card-2')).opacity)).toBe(1);
	const original = node('card-2');
	await click('filter');
	await expect.poll(() => original.style.position).toBe('absolute');
	expect(node('card-2')).toBe(original);
	expect(original.style.position).toBe('absolute');
	await click('reorder');
	await click('filter');
	await wait(600);
	expect(node('card-2')).toBe(original);
	expect(original.style.position).toBe('');
	expect(document.querySelectorAll('[data-testid^="component-card-"]')).toHaveLength(6);
	const ids = [...node('grid').children].map((element) => element.getAttribute('data-testid'));
	expect(ids).toEqual([6, 5, 4, 3, 2, 1].map((id) => `component-card-${id}`));
});

it('keeps form text unscaled throughout an interrupted dialog resize', async () => {
	await render(Components);
	await click('dialog-trigger');
	await expect.poll(() => Number(getComputedStyle(node('dialog')).opacity)).toBe(1);
	await wait(250);
	let worstScaleError = 0;
	for (let cycle = 0; cycle < 3; cycle++) {
		await click('dialog-expand');
		for (let frame = 0; frame < 7; frame++) {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
			let scaleY = 1;
			for (
				let element: HTMLElement | null = node('dialog-input');
				element;
				element = element.parentElement
			) {
				scaleY *= new DOMMatrix(getComputedStyle(element).transform).d;
			}
			worstScaleError = Math.max(worstScaleError, Math.abs(scaleY - 1));
		}
	}
	expect(worstScaleError).toBeLessThan(0.025);
});
