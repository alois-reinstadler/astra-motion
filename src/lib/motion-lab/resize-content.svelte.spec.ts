import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import Lab from '../../routes/motion-lab/+page.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function element(selector: string): HTMLElement {
	const node = document.querySelector<HTMLElement>(selector);
	if (!node) throw new Error(`Missing ${selector}`);
	return node;
}

function glyph(element: HTMLElement) {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	let text: Node | null;
	while ((text = walker.nextNode())) {
		const value = text.textContent ?? '';
		const start = value.search(/\S/);
		if (start < 0) continue;
		const range = document.createRange();
		range.setStart(text, start);
		range.setEnd(text, Math.min(start + 2, value.length));
		return range.getBoundingClientRect();
	}
	throw new Error('Expected text content');
}

async function pauseIntermediate(trigger: string, parent: HTMLElement | (() => HTMLElement)) {
	element(`[data-testid="${trigger}"]`).click();
	await tick();
	await frame();
	await frame();
	const projections = [...document.querySelectorAll<HTMLElement>('*')]
		.map((node) => visualElementStore.get(node)?.projection)
		.filter((projection) => projection !== undefined);
	const controls = new Set(projections.map((projection) => projection.currentAnimation));
	for (const control of controls) {
		if (!control) continue;
		control.pause();
		control.time = 0.075;
	}
	await frame();
	await frame();
	const target = typeof parent === 'function' ? parent() : parent;
	const matrix = new DOMMatrix(getComputedStyle(target).transform);
	expect(Math.max(Math.abs(matrix.a - 1), Math.abs(matrix.d - 1))).toBeGreaterThan(0.05);
	return async () => {
		for (const control of controls) {
			if (control) control.time = 3;
		}
		await frame();
		await frame();
		const final = new DOMMatrix(getComputedStyle(target).transform);
		expect(Math.max(Math.abs(final.a - 1), Math.abs(final.d - 1))).toBeLessThan(0.001);
	};
}

function unchangedGlyph(before: DOMRect, after: DOMRect, label: string) {
	expect.soft(Math.abs(before.width - after.width), `${label} glyph width`).toBeLessThan(0.5);
	expect.soft(Math.abs(before.height - after.height), `${label} glyph height`).toBeLessThan(0.5);
}

it('preserves existing and newly mounted accordion glyphs during real size projection', async () => {
	await render(Lab);
	const parent = element('[data-testid="accordion-box"]');
	const settle = await pauseIntermediate('accordion', parent);
	const strong = glyph(element('.accordion strong'));
	const paragraph = glyph(element('.accordion p'));
	await settle();
	unchangedGlyph(strong, glyph(element('.accordion strong')), 'Existing heading');
	unchangedGlyph(paragraph, glyph(element('.accordion p')), 'New paragraph');
});

it('preserves accordion heading glyphs while collapsing', async () => {
	await render(Lab);
	const parent = element('[data-testid="accordion-box"]');
	await (
		await pauseIntermediate('accordion', parent)
	)();
	const settle = await pauseIntermediate('accordion', parent);
	const strong = glyph(element('.accordion strong'));
	await settle();
	unchangedGlyph(strong, glyph(element('.accordion strong')), 'Collapsing heading');
});

it('preserves grid label and button glyphs while column width projects', async () => {
	await render(Lab);
	const tile = element('[data-testid="tile-0"]');
	const settle = await pauseIntermediate('columns', tile);
	const label = glyph(element('[data-testid="tile-0"] span'));
	const button = glyph(element('[data-testid="remove-0"]'));
	await settle();
	unchangedGlyph(label, glyph(element('[data-testid="tile-0"] span')), 'Grid label');
	unchangedGlyph(button, glyph(element('[data-testid="remove-0"]')), 'Remove button');
});

it('preserves grid glyphs when reorder interrupts a column resize', async () => {
	await render(Lab);
	const tile = element('[data-testid="tile-0"]');
	await pauseIntermediate('columns', tile);
	const settle = await pauseIntermediate('reorder', tile);
	const label = glyph(element('[data-testid="tile-0"] span'));
	const button = glyph(element('[data-testid="remove-0"]'));
	await settle();
	unchangedGlyph(label, glyph(element('[data-testid="tile-0"] span')), 'Reordered label');
	unchangedGlyph(button, glyph(element('[data-testid="remove-0"]')), 'Reordered button');
});

it.each(['open', 'close'])(
	'preserves shared image aspect while its frame changes aspect: %s',
	async (direction) => {
		await render(Lab);
		if (direction === 'close') {
			await (
				await pauseIntermediate('shared', () => element('.product'))
			)();
		}
		// The shared destination is a replacement node, so resolve it after the click.
		element('[data-testid="shared"]').click();
		await tick();
		await frame();
		await frame();
		const parent = element('.art');
		const projection = visualElementStore.get(parent)!.projection!;
		const control = projection.currentAnimation!;
		expect(control).toBeDefined();
		const controls = new Set(
			[...document.querySelectorAll<HTMLElement>('*')].map(
				(node) => visualElementStore.get(node)?.projection?.currentAnimation
			)
		);
		for (const animation of controls) {
			if (!animation) continue;
			animation.pause();
			animation.time = 0.025;
		}
		await frame();
		await frame();
		const intermediate = parent.getBoundingClientRect();
		expect(
			Math.max(
				Math.abs(intermediate.width / parent.offsetWidth - 1),
				Math.abs(intermediate.height / parent.offsetHeight - 1)
			)
		).toBeGreaterThan(0.05);
		const before = element('.art img').getBoundingClientRect();
		expect(before.width / before.height).toBeCloseTo(6 / 5, 2);
		for (const animation of controls) {
			if (animation) animation.time = 3;
		}
		await frame();
		await frame();
		const after = element('.art img').getBoundingClientRect();
		expect(after.width / after.height).toBeCloseTo(6 / 5, 2);
		expect(Math.abs(before.width - after.width)).toBeGreaterThan(5);
	}
);
