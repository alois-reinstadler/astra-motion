import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore } from 'motion-dom';
import Fixture from './LexicalInheritance.svelte';
const node = (name: string) => document.querySelector<HTMLElement>(`[data-lexical="${name}"]`)!;
const x = () => new DOMMatrix(getComputedStyle(node('leaf')).transform).e;
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

it('keeps initial=false keyframes settled while state and projection use their declared trees', async () => {
	await render(Fixture);
	const samples: number[] = [];
	for (let i = 0; i < 20; i++) {
		await frame();
		samples.push(x());
	}
	expect(samples).toEqual(Array(20).fill(80));
	const visual = visualElementStore.get(node('leaf'))!;
	expect(visual.parent?.current).toBe(node('outer'));
	expect(visual.projection?.parent?.instance).toBe(node('middle'));
});

it('responds to the declared parent and ignores an intervening controlling binding', async () => {
	const { component } = await render(Fixture);
	await frame();
	await frame();
	component.moveMiddle();
	for (let i = 0; i < 20; i++) {
		await frame();
		expect(x()).toBe(80);
	}
	component.moveOuter();
	await expect.poll(x).toBe(120);
	component.moveMiddle();
	for (let i = 0; i < 20; i++) {
		await frame();
		expect(x()).toBe(120);
	}
});
