import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { isDragActive, visualElementStore } from 'motion-dom';
import Feedback from '../site/examples/ParityGestureFeedback.svelte';
import Drag from '../site/examples/ParityGestureDrag.svelte';
import Hover from '../site/examples/ParityGestureHover.svelte';
import Controls from '../site/examples/ParityGestureControls.svelte';
import Reorder from '../site/examples/ParityGestureReorder.svelte';
import Layout from '../site/examples/ParityLayoutExpand.svelte';
import Group from '../site/examples/ParityLayoutGroup.svelte';
import Namespaces from '../site/examples/ParityLayoutNamespaces.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const button = (name: string) =>
	[...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === name)!;
function pointer(target: EventTarget, type: string, x: number, y: number) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerType: 'mouse',
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: x,
			clientY: y
		})
	);
}

it('keeps the gesture demo native and renders callback feedback', async () => {
	await render(Feedback);
	await frame();
	const save = button('Save to collection');
	save.click();
	await tick();
	expect(save.getAttribute('aria-pressed')).toBe('true');
	pointer(save, 'pointerdown', 10, 10);
	pointer(save, 'pointerup', 10, 10);
	await expect.poll(() => document.querySelector('output')?.textContent).toBe('Released inside');
});

it('mounts element constraints and provides pointer-free movement and reset', async () => {
	await render(Drag);
	await frame();
	await frame();
	const tile = document.querySelector<HTMLElement>('.tile')!;
	button('Move right').click();
	await expect.poll(() => Number(visualElementStore.get(tile)?.getValue('x', 0).get())).toBe(24);
	button('Reset position').click();
	await expect.poll(() => Number(visualElementStore.get(tile)?.getValue('x', 0).get())).toBe(0);
	const start = tile.getBoundingClientRect();
	pointer(tile, 'pointerdown', start.x + 10, start.y + 10);
	pointer(window, 'pointermove', start.x + 35, start.y + 30);
	await frame();
	expect(isDragActive()).toBe(true);
	pointer(window, 'pointercancel', start.x + 35, start.y + 30);
	expect(isDragActive()).toBe(false);
});

it('runs inherited hover variants while keeping native click behavior', async () => {
	await render(Hover);
	await frame();
	const card = document.querySelector<HTMLElement>('.card')!;
	pointer(card, 'pointerenter', 10, 10);
	await expect.poll(() => getComputedStyle(card).transform).not.toBe('none');
	card.click();
	await expect.poll(() => document.querySelector('output')?.textContent).toBe('Opened 1 time');
});

it('starts the thumb only from its handle and keeps its range input reactive', async () => {
	await render(Controls);
	await frame();
	const thumb = document.querySelector<HTMLElement>('.thumb')!;
	const start = thumb.getBoundingClientRect();
	pointer(thumb, 'pointerdown', start.x + 10, start.y + 10);
	pointer(window, 'pointermove', start.x + 60, start.y + 10);
	await frame();
	expect(isDragActive()).toBe(false);
	pointer(window, 'pointerup', start.x + 60, start.y + 10);
	pointer(button('Drag from this handle'), 'pointerdown', 20, 20);
	pointer(window, 'pointermove', 60, 20);
	await frame();
	expect(isDragActive()).toBe(true);
	pointer(window, 'pointerup', 60, 20);
	const input = document.querySelector<HTMLInputElement>('input[type=range]')!;
	input.value = '120';
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await expect.poll(() => document.querySelector('output')?.textContent).toBe('120');
});

it('reorders from keyboard-friendly controls and changes to a measured grid', async () => {
	await render(Reorder);
	await frame();
	await frame();
	const later = document.querySelector<HTMLButtonElement>('[aria-label="Move Outline later"]')!;
	later.focus();
	later.click();
	await tick();
	expect(document.querySelector('.item .handle')?.textContent?.trim()).toBe('Research');
	await expect.poll(() => document.activeElement).toBe(later);
	expect(document.querySelector('output')?.textContent).toContain('Outline moved to position 2');
	button('Use grid').click();
	await tick();
	expect(
		getComputedStyle(document.querySelector('.items')!).gridTemplateColumns.split(' ')
	).toHaveLength(2);
});

it('expands the real layout and preserves the disclosure state', async () => {
	await render(Layout);
	await frame();
	const card = document.querySelector<HTMLElement>('.card')!;
	const before = card.offsetWidth;
	button('Read the note').click();
	await tick();
	expect(card.offsetWidth).toBeGreaterThan(before);
	expect(button('Close the note').getAttribute('aria-expanded')).toBe('true');
	await expect
		.poll(() => Boolean(visualElementStore.get(card)?.projection?.currentAnimation))
		.toBe(true);
});

it('coordinates independent native disclosure state without adding group wrappers', async () => {
	await render(Group);
	await frame();
	await frame();
	const panels = [...document.querySelectorAll<HTMLDetailsElement>('details')];
	expect(panels).toHaveLength(2);
	expect(panels[0].parentElement).toBe(panels[1].parentElement);
	panels[0].querySelector('summary')!.click();
	await expect.poll(() => panels[0].open).toBe(true);
	expect(panels[1].open).toBe(false);
	await expect
		.poll(() => Boolean(visualElementStore.get(panels[1])?.projection?.currentAnimation))
		.toBe(true);
});

it('keeps shared indicators inside their separate namespaces', async () => {
	await render(Namespaces);
	await frame();
	await frame();
	const rows = [...document.querySelectorAll<HTMLElement>('.row')];
	const before = [...document.querySelectorAll('.indicator')].map(
		(node) => visualElementStore.get(node)?.projection?.options.layoutId
	);
	expect(new Set(before).size).toBe(2);
	rows[0].querySelectorAll('button')[1].click();
	await tick();
	await frame();
	expect(rows[0].querySelectorAll('button')[1].getAttribute('aria-pressed')).toBe('true');
	expect(rows[1].querySelectorAll('button')[1].getAttribute('aria-pressed')).toBe('true');
	await expect.poll(() => document.querySelectorAll('.indicator').length).toBe(2);
	const after = [...document.querySelectorAll('.indicator')].map(
		(node) => visualElementStore.get(node)?.projection?.options.layoutId
	);
	expect(after).toEqual(before);
});
