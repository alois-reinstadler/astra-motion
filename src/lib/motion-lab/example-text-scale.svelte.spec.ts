import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore } from 'motion-dom';
import Group from '../site/examples/ParityLayoutGroup.svelte';
import Note from '../site/examples/ParityLayoutExpand.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
};

function assertUnscaled(node: HTMLElement) {
	const box = node.getBoundingClientRect();
	const style = getComputedStyle(node);
	const width = parseFloat(style.width);
	const height = parseFloat(style.height);
	const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
	const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
	expect(
		Math.abs(box.width - (width + (style.boxSizing === 'border-box' ? 0 : paddingX)))
	).toBeLessThan(1);
	expect(
		Math.abs(box.height - (height + (style.boxSizing === 'border-box' ? 0 : paddingY)))
	).toBeLessThan(1);
}

async function sample(root: HTMLElement, nodes: HTMLElement[], finish: boolean) {
	await expect
		.poll(() => Boolean(visualElementStore.get(root)?.projection?.currentAnimation))
		.toBe(true);
	const animation = visualElementStore.get(root)!.projection!.currentAnimation!;
	animation.pause();
	for (const time of [0.02, 0.08, 0.14]) {
		animation.time = time;
		await frames();
		for (const node of nodes) assertUnscaled(node);
	}
	if (finish) {
		animation.complete();
		await frames();
	}
}

it('keeps both native panel headings and visible paragraphs unscaled on open, close and reversal', async () => {
	await render(Group);
	await frames();
	const panels = [...document.querySelectorAll<HTMLDetailsElement>('details.panel')];
	const headings = panels.map((panel) => panel.querySelector('summary')!);
	for (const [index, panel] of panels.entries()) {
		headings[index].click();
		await sample(panel, [...headings, panel.querySelector('p')!], true);
		headings[index].click();
		await sample(panel, headings, false);
		headings[index].click();
		await frames();
		await sample(panel, [...headings, panel.querySelector('p')!], true);
		expect(panel.open).toBe(true);
	}
});

it('keeps the incoming note paragraph unscaled while its card expands', async () => {
	await render(Note);
	await frames();
	const card = document.querySelector<HTMLElement>('.card')!;
	card.querySelector('button')!.click();
	await frames();
	const detail = card.querySelector<HTMLElement>('.detail')!;
	expect(detail).not.toBeNull();
	await sample(card, [detail], true);
});
