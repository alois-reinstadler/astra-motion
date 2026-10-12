import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Accordion from '$lib/site/snippet-previews/getting-started--accordion-recipe.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const near = (actual: number, expected: number) =>
	expect(Math.abs(actual - expected)).toBeLessThan(0.5);

for (const width of [360, 240]) {
	it(`accordion at ${width}px keeps trigger and answer text fixed during natural height changes`, async () => {
		const view = render(Accordion);
		const root = view.container as HTMLElement;
		root.style.width = `${width}px`;
		await tick();
		await frame();
		const button = root.querySelector('button')!;
		const before = button.getBoundingClientRect();
		button.focus();
		button.click();
		await tick();
		const answer = root.querySelector<HTMLElement>('.answer')!;
		const text = answer.querySelector('p')!;
		const origin = answer.getBoundingClientRect().top;
		const textOrigin = text.getBoundingClientRect().top;
		const opening: number[] = [];
		const assertGeometry = () => {
			near(button.getBoundingClientRect().height, before.height);
			near(button.getBoundingClientRect().top, before.top);
			near(answer.getBoundingClientRect().top, origin);
			near(text.getBoundingClientRect().top, textOrigin);
			expect(document.activeElement).toBe(button);
		};
		for (let index = 0; index < 35; index++) {
			await frame();
			assertGeometry();
			opening.push(answer.getBoundingClientRect().height);
		}
		const height = answer.getBoundingClientRect().height;
		expect(height).toBeGreaterThan(20);
		expect(answer.style.height).toBe('auto');
		expect(opening.filter((value) => value > 1 && value < height - 1).length).toBeGreaterThan(2);
		button.click();
		await tick();
		expect(answer.isConnected).toBe(true);
		const closing: number[] = [];
		for (let index = 0; index < 35; index++) {
			await frame();
			near(button.getBoundingClientRect().height, before.height);
			near(button.getBoundingClientRect().top, before.top);
			if (answer.isConnected) {
				assertGeometry();
				closing.push(answer.getBoundingClientRect().height);
			}
		}
		expect(closing.filter((value) => value > 1 && value < height - 1).length).toBeGreaterThan(2);
		expect(answer.isConnected).toBe(false);
		expect(root.querySelector('.answer')).toBeNull();
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(button);
	});
}

it('accordion reverses an active exit without replacing its answer or moving the trigger and text', async () => {
	const view = render(Accordion);
	const root = view.container as HTMLElement;
	await tick();
	const button = root.querySelector('button')!;
	const trigger = button.getBoundingClientRect();
	button.focus();
	button.click();
	await tick();
	const answer = root.querySelector<HTMLElement>('.answer')!;
	await expect.poll(() => answer.style.height).toBe('auto');
	const text = answer.querySelector('p')!;
	const textTop = text.getBoundingClientRect().top;
	const height = answer.getBoundingClientRect().height;
	button.click();
	await tick();
	let partial = height;
	for (let index = 0; index < 20 && partial > height * 0.8; index++) {
		await frame();
		partial = answer.getBoundingClientRect().height;
	}
	expect(partial).toBeGreaterThan(0);
	expect(partial).toBeLessThan(height * 0.8);
	button.click();
	await tick();
	// Reversing a retained native branch must not restart it at initial height zero.
	near(answer.getBoundingClientRect().height, partial);
	let intermediate = 0;
	for (let index = 0; index < 35; index++) {
		await frame();
		expect(root.querySelector('.answer')).toBe(answer);
		near(button.getBoundingClientRect().height, trigger.height);
		near(button.getBoundingClientRect().top, trigger.top);
		near(text.getBoundingClientRect().top, textTop);
		const current = answer.getBoundingClientRect().height;
		if (current > partial + 1 && current < height - 1) intermediate++;
	}
	expect(intermediate).toBeGreaterThan(1);
	near(answer.getBoundingClientRect().height, height);
	expect(button.getAttribute('aria-expanded')).toBe('true');
	button.click();
	await expect.poll(() => answer.isConnected).toBe(false);
	expect(document.activeElement).toBe(button);
});
