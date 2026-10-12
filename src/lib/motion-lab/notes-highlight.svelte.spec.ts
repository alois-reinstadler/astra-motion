import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Notes from '$lib/site/snippet-previews/layout--shared-elements.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const buttons = (root: HTMLElement) =>
	Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
const highlight = (root: HTMLElement) =>
	root.querySelector<HTMLElement>('button[aria-pressed="true"] > div')!;

function assertPaintOrder(root: HTMLElement) {
	const lead = highlight(root);
	// Hit testing normally ignores this decorative layer. Include it briefly to inspect
	// actual paint order, then restore the authored pointer behavior before interaction.
	const original = lead.style.pointerEvents;
	lead.style.pointerEvents = 'auto';
	try {
		for (const button of buttons(root)) {
			const label = button.querySelector('span')!;
			const rect = label.getBoundingClientRect();
			const layers = document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
			expect(layers.indexOf(label)).toBeGreaterThanOrEqual(0);
			if (layers.includes(lead)) expect(layers.indexOf(label)).toBeLessThan(layers.indexOf(lead));
		}
	} finally {
		lead.style.pointerEvents = original;
	}
}

it('shared selection stays below every label throughout natural forward and reverse handoffs', async () => {
	const view = render(Notes);
	const root = view.container as HTMLElement;
	await tick();
	await frame();
	await frame();
	const controls = buttons(root);
	for (const target of [controls[2], controls[0]]) {
		const start = highlight(root).getBoundingClientRect().left;
		const destination = target.getBoundingClientRect().left + target.clientLeft;
		target.focus();
		target.click();
		await tick();
		let intermediate = 0;
		for (let index = 0; index < 50; index++) {
			await frame();
			assertPaintOrder(root);
			const current = highlight(root).getBoundingClientRect();
			if (Math.abs(current.left - start) > 1 && Math.abs(current.left - destination) > 1)
				intermediate++;
			expect(current.left).toBeGreaterThanOrEqual(Math.min(start, destination) - 1);
			expect(current.left).toBeLessThanOrEqual(Math.max(start, destination) + 1);
			expect(document.activeElement).toBe(target);
		}
		expect(intermediate).toBeGreaterThan(2);
		expect(Math.abs(highlight(root).getBoundingClientRect().left - destination)).toBeLessThan(1);
		expect(buttons(root)).toEqual(controls);
	}
});

it('rapid selection reversal preserves continuity, pointer targeting and independent instances', async () => {
	const first = render(Notes);
	const second = render(Notes);
	const root = first.container as HTMLElement;
	const other = second.container as HTMLElement;
	await tick();
	await frame();
	await frame();
	const controls = buttons(root);
	const otherLead = highlight(other);
	const otherOrigin = otherLead.getBoundingClientRect().left;
	for (const target of [controls[2], controls[0], controls[1], controls[0], controls[2]]) {
		const before = highlight(root).getBoundingClientRect().left;
		target.focus();
		target.click();
		await tick();
		await frame();
		// The first projected frame retains the visual origin across replacement.
		expect(Math.abs(highlight(root).getBoundingClientRect().left - before)).toBeLessThan(3);
		for (let index = 0; index < 4; index++) {
			await frame();
			assertPaintOrder(root);
			const rect = target.getBoundingClientRect();
			expect(
				document
					.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
					?.closest('button')
			).toBe(target);
			expect(highlight(other)).toBe(otherLead);
			expect(otherLead.getBoundingClientRect().left).toBe(otherOrigin);
		}
	}
	await expect
		.poll(() =>
			Math.abs(
				highlight(root).getBoundingClientRect().left -
					controls[2].getBoundingClientRect().left -
					controls[2].clientLeft
			)
		)
		.toBeLessThan(1);
	expect(root.querySelectorAll('button > div')).toHaveLength(1);
	expect(document.activeElement).toBe(controls[2]);
});
