import { tick } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MotionValues from '../site/examples/MotionValuesExample.svelte';
import Template from '../site/examples/MotionTemplateExample.svelte';
import Events from '../site/examples/MotionValueEventExample.svelte';
import Scroll from '../site/examples/ScrollValuesExample.svelte';
import Spring from '../site/examples/SpringValueExample.svelte';
import Time from '../site/examples/TimeValueExample.svelte';
import Transform from '../site/examples/TransformValueExample.svelte';
import Velocity from '../site/examples/VelocityValueExample.svelte';
import Animate from '../site/examples/AnimateScopeExample.svelte';
import Frames from '../site/examples/AnimationFrameExample.svelte';
import InView from '../site/examples/InViewStateExample.svelte';
import Page from '../site/examples/PageVisibilityExample.svelte';
import Reduced from '../site/examples/ReducedMotionExample.svelte';
import Techniques from '../site/examples/ScrollTechniquesExample.svelte';

const button = (text: string) =>
	[...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === text)!;
const output = () => document.querySelector('output')?.textContent ?? '';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function slider(label: string, value: number) {
	const input = document.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
	input.value = String(value);
	input.dispatchEvent(new Event('input', { bubbles: true }));
}
afterEach(() => vi.restoreAllMocks());

it('shares a MotionValue between actual rendered markers and a Svelte store readout', async () => {
	render(MotionValues);
	await tick();
	slider('Position', 60);
	await expect.poll(output).toBe('Both positions: 60px');
	await expect
		.poll(() =>
			[...document.querySelectorAll('.dot')].map((node) => getComputedStyle(node).transform)
		)
		.toEqual(['matrix(1, 0, 0, 1, 60, 0)', 'matrix(1, 0, 0, 1, 60, 0)']);
});

it('assembles a live template including zero and applies the CSS filter', async () => {
	render(Template);
	await tick();
	expect(output()).toBe('blur(0px) saturate(120%)');
	slider('Blur', 4);
	await expect.poll(output).toBe('blur(4px) saturate(120%)');
	await expect
		.poll(() => getComputedStyle(document.querySelector('.tile')!).filter)
		.toBe('blur(4px) saturate(1.2)');
});

it('reports value animation events and supports cancellation followed by completion', async () => {
	render(Events);
	await tick();
	button('Start value').click();
	await expect.poll(() => document.querySelector('p')?.textContent).toContain('Started');
	button('Stop value').click();
	await expect.poll(() => document.querySelector('p')?.textContent).toContain('Cancelled');
	button('Start value').click();
	await expect.poll(output).toBe('100 / 100');
	await expect.poll(() => document.querySelector('p')?.textContent).toContain('Completed');
});

it('reads both native scroll axes and resets normalized progress', async () => {
	render(Scroll);
	await tick();
	button('Move both axes').click();
	const viewport = document.querySelector<HTMLElement>('.viewport')!;
	await expect
		.poll(() =>
			output().includes(
				`X ${Math.round(viewport.scrollLeft)}px · Y ${Math.round(viewport.scrollTop)}px`
			)
		)
		.toBe(true);
	expect(viewport.scrollTop).toBeGreaterThan(0);
	await expect
		.poll(() => getComputedStyle(document.querySelector('.progress')!).transform)
		.not.toBe('matrix(0, 0, 0, 1, 0, 0)');
	button('Reset scroll').click();
	await expect.poll(output).toBe('X 0px · Y 0px · 0%');
});

it('follows a spring target and allows an immediate jump', async () => {
	render(Spring);
	await tick();
	slider('Spring target', 80);
	await expect.poll(() => parseInt(output())).toBe(80);
	slider('Spring target', -70);
	button('Jump to target').click();
	await expect.poll(output).toBe('-70px');
});

it('updates the elapsed clock and resets its derived origin', async () => {
	render(Time);
	await expect.poll(() => parseInt(output()), { timeout: 2500 }).toBeGreaterThanOrEqual(1);
	button('Restart clock').click();
	await expect.poll(output).toBe('0 seconds');
	button('Start rotation').click();
	await expect
		.poll(() => getComputedStyle(document.querySelector('.dial')!).transform)
		.not.toBe('none');
	button('Stop rotation').click();
	await expect
		.poll(() => getComputedStyle(document.querySelector('.dial')!).transform)
		.toBe('none');
});

it('maps one source into a typed scale and rendered color', async () => {
	render(Transform);
	await tick();
	slider('Transform source', 100);
	await expect.poll(output).toBe('Scale 1.25 · one source, two outputs');
	await expect
		.poll(() => getComputedStyle(document.querySelector('.tile')!).backgroundColor)
		.toBe('rgb(237, 209, 186)');
});

it('displays a nonzero velocity during movement and returns to rest', async () => {
	render(Velocity);
	await tick();
	button('Move the marker').click();
	await expect.poll(() => Math.abs(parseInt(output()))).toBeGreaterThan(0);
	await expect.poll(output).toBe('0 pixels per second');
});

it('plays, pauses, resumes and completes the canonical scoped sequence', async () => {
	render(Animate);
	await tick();
	button('Replay sequence').click();
	await expect.poll(() => document.querySelector('p')?.textContent).toContain('Playing');
	button('Pause').click();
	await expect.poll(() => document.querySelector('p')?.textContent).toContain('Paused');
	button('Resume').click();
	button('Finish').click();
	await expect
		.poll(() => document.querySelector('p')?.textContent)
		.toBe('Finished · 0 active run(s)');
	for (const tile of document.querySelectorAll('.tile'))
		expect(getComputedStyle(tile).opacity).toBe('1');
});

it('schedules the frame demo only while enabled', async () => {
	render(Frames);
	await tick();
	expect(output()).toBe('0ms elapsed');
	button('Start frames').click();
	await expect.poll(() => parseInt(output())).toBeGreaterThan(0);
	button('Pause frames').click();
	await tick();
	const stopped = output();
	await frame();
	await frame();
	expect(output()).toBe(stopped);
});

it('measures a real target and retains once state after leaving', async () => {
	render(InView);
	await expect.poll(output).toBe('Outside');
	button('Find target').click();
	await expect.poll(output).toBe('Inside');
	button('Back to top').click();
	await expect.poll(output).toBe('Outside');
	const once = document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
	once.click();
	button('Find target').click();
	await expect.poll(output).toBe('Inside');
	button('Back to top').click();
	await frame();
	await frame();
	expect(output()).toBe('Inside');
});

it('pauses page-dependent work on the real document visibility event contract', async () => {
	let hidden = false;
	vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
	render(Page);
	await tick();
	button('Start counting').click();
	await expect.poll(() => parseInt(output())).toBeGreaterThan(0);
	hidden = true;
	document.dispatchEvent(new Event('visibilitychange'));
	await tick();
	expect(document.querySelector('p')?.textContent).toContain('Page is hidden');
	const stopped = output();
	await frame();
	await frame();
	expect(output()).toBe(stopped);
	hidden = false;
	document.dispatchEvent(new Event('visibilitychange'));
	await expect.poll(() => parseInt(output())).toBeGreaterThan(parseInt(stopped));
});

it('adapts reduced-motion targets while preserving the state change', async () => {
	const media = matchMedia('(prefers-reduced-motion: reduce)');
	vi.spyOn(window, 'matchMedia').mockReturnValue(media);
	vi.spyOn(media, 'matches', 'get').mockReturnValue(true);
	render(Reduced);
	await expect
		.poll(() => document.querySelector('p')?.textContent)
		.toBe('Reduced motion: fade only');
	button('Change state').click();
	await expect.poll(() => getComputedStyle(document.querySelector('.card')!).opacity).toBe('0.45');
	expect(getComputedStyle(document.querySelector('.card')!).transform).toBe('none');
});

it('demonstrates scroll-triggered opacity and continuously linked progress together', async () => {
	render(Techniques);
	await tick();
	const viewport = document.querySelector<HTMLElement>('.viewport')!;
	viewport.scrollTop = 210;
	await expect.poll(() => getComputedStyle(document.querySelector('.note')!).opacity).toBe('1');
	await expect
		.poll(() => getComputedStyle(document.querySelector('.bar')!).transform)
		.not.toBe('matrix(0, 0, 0, 1, 0, 0)');
	viewport.scrollTop = 0;
	await expect.poll(() => getComputedStyle(document.querySelector('.note')!).opacity).toBe('0.3');
});
