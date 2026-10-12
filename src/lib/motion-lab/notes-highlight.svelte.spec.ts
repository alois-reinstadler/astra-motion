import { tick } from 'svelte';
import { expect, it, onTestFinished, vi } from 'vitest';
import { visualElementStore, type IProjectionNode } from 'motion-dom';
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

it.each([true, false])(
	'rapid selection reversal preserves targeting and isolation with controlled clocks=%s',
	async (controlled) => {
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
		if (controlled) {
			const projection = visualElementStore.get(highlight(root))!.projection!;
			const prototype = Object.getPrototypeOf(projection) as IProjectionNode;
			const startAnimation = prototype.startAnimation;
			// Shared handoffs create new projection nodes. Hold only this instance's
			// real projection animation at time zero before checking its origin.
			const spy = vi.spyOn(prototype, 'startAnimation').mockImplementation(function (
				this: IProjectionNode,
				options
			) {
				return startAnimation.call(
					this,
					root.contains(this.instance as Node) ? { ...options, autoplay: false } : options
				);
			});
			onTestFinished(() => spy.mockRestore());
		}
		let intermediate = 0;
		let interrupted = 0;
		for (const target of [controls[2], controls[0], controls[1], controls[0], controls[2]]) {
			const before = highlight(root).getBoundingClientRect().left;
			if (
				visualElementStore.get(highlight(root))!.projection!.currentAnimation?.state === 'running'
			)
				interrupted++;
			const destination = target.getBoundingClientRect().left + target.clientLeft;
			target.focus();
			target.click();
			await tick();
			if (controlled) {
				const projection = visualElementStore.get(highlight(root))!.projection!;
				await expect.poll(() => projection.currentAnimation?.state).toBe('paused');
				await frame();
				expect(projection.currentAnimation!.time).toBe(0);
				expect(Math.abs(highlight(root).getBoundingClientRect().left - before)).toBeLessThan(3);
				projection.currentAnimation!.time = 0.08;
			}

			for (let index = 0; index < 4; index++) {
				await frame();
				assertPaintOrder(root);
				const current = highlight(root).getBoundingClientRect().left;
				expect(current).toBeGreaterThanOrEqual(Math.min(before, destination) - 1);
				expect(current).toBeLessThanOrEqual(Math.max(before, destination) + 1);
				if (Math.abs(current - before) > 1 && Math.abs(current - destination) > 1) intermediate++;
				expect(document.activeElement).toBe(target);
				expect(buttons(root)).toEqual(controls);
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
		expect(intermediate).toBeGreaterThan(2);
		if (controlled) visualElementStore.get(highlight(root))!.projection!.currentAnimation!.play();
		else expect(interrupted).toBeGreaterThan(2);
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
	}
);
