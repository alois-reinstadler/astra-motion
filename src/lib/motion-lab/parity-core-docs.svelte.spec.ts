import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore } from 'motion-dom';
import Motion from '../site/examples/MotionExample.svelte';
import SVG from '../site/examples/SVGExample.svelte';
import Transitions from '../site/examples/TransitionExample.svelte';
import Config from '../site/examples/MotionConfigExample.svelte';
import Lazy from '../site/examples/LazyMotionExample.svelte';
import Text from '../site/examples/TextAnimationExample.svelte';

const button = (text: string) =>
	[...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === text)!;
const tile = () => document.querySelector<HTMLElement>('.tile')!;
const x = (node: Element) => new DOMMatrix(getComputedStyle(node).transform).m41;
const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));

it('changes a reactive motion destination and reverses on the same element', async () => {
	render(Motion);
	await tick();
	const element = tile();
	await expect.poll(() => x(element)).toBe(-90);
	button('Change target').click();
	await expect.poll(() => x(element)).toBe(90);
	expect(getComputedStyle(element).borderRadius).toBe('50%');
	button('Change target').click();
	await expect.poll(() => x(element)).toBe(-90);
	expect(getComputedStyle(element).borderRadius).toBe('16px');
	expect(tile()).toBe(element);
});

it('animates SVG geometry, path drawing and viewBox then restores the geometry', async () => {
	render(SVG);
	await tick();
	const circle = document.querySelector('circle')!;
	const path = document.querySelector('path')!;
	const svg = document.querySelector('svg')!;
	button('Draw line').click();
	await expect.poll(() => circle.getAttribute('cx')).toBe('285');
	expect(circle.getAttribute('r')).toBe('11');
	expect(path.getAttribute('stroke-dasharray')).toBe('1 1');
	button('Zoom view').click();
	await expect.poll(() => svg.getAttribute('viewBox')).toBe('60 25 200 112.5');
	button('Draw line').click();
	await expect.poll(() => circle.getAttribute('cx')).toBe('35');
	expect(circle.getAttribute('cy')).toBe('125');
	expect(circle.getAttribute('r')).toBe('7');
});

it('switches transition settings and interrupts a tween with a reversed spring target', async () => {
	render(Transitions);
	await tick();
	await expect.poll(() => x(tile())).toBe(-100);
	const select = document.querySelector('select')!;
	select.value = 'linear';
	select.dispatchEvent(new Event('change', { bubbles: true }));
	button('Move tile').click();
	await expect.poll(() => x(tile())).toBeGreaterThan(-90);
	expect(x(tile())).toBeLessThan(100);
	select.value = 'spring';
	select.dispatchEvent(new Event('change', { bubbles: true }));
	button('Move tile').click();
	// A reversed spring can settle beyond the default polling window.
	await expect.poll(() => x(tile()), { timeout: 4000 }).toBe(-100);
});

it('applies a changed provider policy to already-running position without stopping paint', async () => {
	render(Config);
	await tick();
	const duration = document.querySelector<HTMLInputElement>('input[type="range"]')!;
	duration.value = '1.2';
	duration.dispatchEvent(new Event('input', { bubbles: true }));
	button('Animate with policy').click();
	await expect.poll(() => x(tile())).toBeGreaterThan(-90);
	expect(x(tile())).toBeLessThan(95);
	const visual = visualElementStore.get(tile())!;
	const opacity = visual.getValue('opacity')!.animation;
	document.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
	await tick();
	await frame();
	await frame();
	expect(x(tile())).toBe(95);
	expect(visual.getValue('opacity')!.animation).toBe(opacity);
	expect(visual.getValue('opacity')!.isAnimating()).toBe(true);
	await opacity!.finished;
	await expect.poll(() => Number(getComputedStyle(tile()).opacity)).toBe(0.35);
});

it('loads features in place while preserving input identity and the newest pending target', async () => {
	render(Lazy);
	await tick();
	const input = document.querySelector('input')!;
	const element = tile();
	input.value = 'A retained native draft';
	input.dispatchEvent(new Event('input', { bubbles: true }));
	button('Change pending target').click();
	await tick();
	expect(x(element)).toBe(-65);
	button('Load animation').click();
	await expect
		.poll(() => document.querySelector('.status')?.textContent)
		.toBe('Animation features loaded');
	await expect.poll(() => x(element)).toBe(65);
	expect(document.querySelector('input')).toBe(input);
	expect(input.value).toBe('A retained native draft');
	expect(tile()).toBe(element);
});

it('keeps a complete semantic sentence and replays finite visual words', async () => {
	render(Text);
	await tick();
	const message = 'Make room for a little motion.';
	expect(document.querySelector('.sr-only')?.textContent).toBe(message);
	expect(document.querySelector('[aria-hidden="true"]')?.textContent).toBe(message);
	const old = document.querySelector('.word')!;
	await expect
		.poll(() =>
			[...document.querySelectorAll('.word')].every(
				(node) => getComputedStyle(node).opacity === '1'
			)
		)
		.toBe(true);
	button('Replay words').click();
	await tick();
	await expect.poll(() => old.isConnected).toBe(false);
	expect(document.querySelector('.word')).not.toBe(old);
	await expect
		.poll(() =>
			[...document.querySelectorAll('.word')].every(
				(node) => getComputedStyle(node).opacity === '1'
			)
		)
		.toBe(true);
	expect(document.querySelectorAll('.sr-only')).toHaveLength(1);
});
