import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Fixture from './ApiAdversary.svelte';
const x = () =>
	new DOMMatrix(getComputedStyle(document.querySelector('[data-api-child]')!).transform).e;

it('updates inherited variant children when reduced motion was already enabled', async () => {
	const { component } = await render(Fixture, { reducedInitially: true });
	await tick();
	component.move();
	await expect.poll(x).toBe(120);
});

it('settles inherited variant children when reduced motion interrupts an update', async () => {
	const { component } = await render(Fixture);
	component.move();
	await expect.poll(x).toBeGreaterThan(10);
	expect(x()).toBeLessThan(120);
	component.reduce();
	await expect.poll(x).toBe(120);
});

it('preserves a Card native root and focused input when motion is enabled', async () => {
	const { component } = await render(Fixture);
	const original = document.querySelector<HTMLInputElement>('input[aria-label="Draft name"]')!;
	const root = original.parentElement;
	original.focus();
	original.value = 'Unsaved editing';
	component.enable();
	await tick();
	expect(document.querySelector('input[aria-label="Draft name"]')).toBe(original);
	expect(original.parentElement).toBe(root);
	expect(document.activeElement).toBe(original);
	expect(original.value).toBe('Unsaved editing');
});

it('keeps current motion values when an unrelated Card style prop changes', async () => {
	const { component } = await render(Fixture);
	component.move();
	const node = document.querySelector<HTMLElement>('[data-api-styled-card]')!;
	const position = () => new DOMMatrix(getComputedStyle(node).transform).e;
	await expect.poll(position).toBe(120);
	component.recolor();
	await tick();
	await new Promise(requestAnimationFrame);
	expect(getComputedStyle(node).backgroundColor).toBe('rgb(0, 0, 255)');
	expect(position()).toBe(120);
});

it('keeps an explicit never-reduced child animated under its reduced parent', async () => {
	const { component } = await render(Fixture, { reducedInitially: true, childNever: true });
	component.move();
	await expect.poll(x).toBeGreaterThan(10);
	expect(x()).toBeLessThan(120);
	await expect.poll(x).toBe(120);
});

it('updates a DOM-inferred variant follower under an already-reduced parent', async () => {
	const { component } = await render(Fixture, { reducedInitially: true, domInferred: true });
	await new Promise(requestAnimationFrame);
	component.move();
	await expect.poll(x).toBe(120);
});

it('preserves a DOM-inferred child never override when its parent is reduced', async () => {
	const { component } = await render(Fixture, {
		reducedInitially: true,
		domInferred: true,
		childNever: true
	});
	await new Promise(requestAnimationFrame);
	component.move();
	await expect.poll(x).toBeGreaterThan(10);
	expect(x()).toBeLessThan(120);
	await expect.poll(x).toBe(120);
});

it('retargets a DOM-inferred child to its inherited target on live reduction', async () => {
	const { component } = await render(Fixture, { domInferred: true });
	await new Promise(requestAnimationFrame);
	component.move();
	await expect.poll(x).toBeGreaterThan(10);
	component.reduce();
	await expect.poll(x).toBe(120);
});

it('completes a never-reduced child after live reduction of its parent', async () => {
	const { component } = await render(Fixture, { domInferred: true, childNever: true });
	await new Promise(requestAnimationFrame);
	component.move();
	await expect.poll(x).toBeGreaterThan(10);
	const before = x();
	const completed = component.completed();
	component.reduce();
	await tick();
	expect(x()).toBeGreaterThanOrEqual(before - 1);
	expect(x()).toBeLessThan(120);
	await expect.poll(x).toBe(120);
	await expect.poll(() => component.completed()).toBeGreaterThan(completed);
});
