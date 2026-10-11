import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import Cards from '../site/examples/SessionCards.svelte';
import GroupSnippet from '../site/snippet-previews/layout-group--coordination.svelte';
import Player from '../site/examples/LayoutExample.svelte';
import Tabs from '../site/examples/SharedExample.svelte';
import Scroll from '../site/examples/ScrollExample.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const click = (name: string) =>
	[...document.querySelectorAll('button')]
		.find((button) => button.textContent?.trim().startsWith(name))!
		.click();

it('resizes both cards, corrects scale, and starts collapse before exit finishes', async () => {
	render(Cards);
	await frame();
	await frame();
	const cards = [...document.querySelectorAll<HTMLElement>('.card')];
	expect(cards.map((card) => card.offsetWidth)).toEqual([240, 240]);
	click('Read session');
	await tick();
	expect(cards.map((card) => card.offsetWidth)).toEqual([380, 380]);
	await frame();
	click('Close session');
	await tick();
	expect(cards.map((card) => card.style.width)).toEqual(['240px', '240px']);
	expect(document.querySelectorAll('.detail')).toHaveLength(2);
	click('Read session');
	await tick();
	expect(cards.map((card) => card.style.width)).toEqual(['380px', '380px']);
	await expect
		.poll(() => cards.map((card) => Math.round(card.getBoundingClientRect().width)), {
			timeout: 4000
		})
		.toEqual([380, 380]);
	click('Close session');
	await tick();
	expect(cards.map((card) => card.style.width)).toEqual(['240px', '240px']);
	expect(document.querySelectorAll('.detail')).toHaveLength(2);
	await expect.poll(() => document.querySelectorAll('.detail').length, { timeout: 4000 }).toBe(0);
	await expect
		.poll(() => cards.map((card) => Math.round(card.getBoundingClientRect().width)), {
			timeout: 4000
		})
		.toEqual([240, 240]);
});

it('keeps the protected card text attached to its card through natural resize and reversal', async () => {
	render(Cards);
	// Match the docs column: two expanded 380px flex items used to wrap here.
	document.querySelector<HTMLElement>('.pair')!.style.width = '700px';
	await document.fonts.ready;
	await frame();
	await frame();
	const cards = [...document.querySelectorAll<HTMLElement>('.card')];
	const protectedCard = cards[1];
	const note = protectedCard.querySelector<HTMLElement>('.note')!;
	const start = protectedCard.getBoundingClientRect();
	const inset = note.getBoundingClientRect().left - start.left;
	const range = document.createRange();
	const text = note.firstChild!;
	const offset = text.textContent!.search(/\S/);
	range.setStart(text, offset);
	range.setEnd(text, offset + 1);
	const glyph = range.getBoundingClientRect();
	const plainRange = document.createRange();
	const plainText = cards[0].querySelector('.note')!.firstChild!;
	const plainOffset = plainText.textContent!.search(/\S/);
	plainRange.setStart(plainText, plainOffset);
	plainRange.setEnd(plainText, plainOffset + 1);
	const plainGlyph = plainRange.getBoundingClientRect();
	let maxPlainGlyphError = 0;
	let projected = 0;
	let maxInsetError = 0;
	let maxGlyphError = 0;
	click('Read session');
	for (let i = 0; i < 75; i++) {
		await frame();
		if (i === 8) click('Close session');
		if (i === 13) click('Read session');
		if (i === 40) click('Close session');
		const box = protectedCard.getBoundingClientRect();
		const actual = range.getBoundingClientRect();
		maxPlainGlyphError = Math.max(
			maxPlainGlyphError,
			Math.abs(plainRange.getBoundingClientRect().width - plainGlyph.width)
		);
		if (Math.abs(box.width - protectedCard.offsetWidth) > 1) projected++;
		maxInsetError = Math.max(
			maxInsetError,
			Math.abs(note.getBoundingClientRect().left - box.left - inset)
		);
		maxGlyphError = Math.max(
			maxGlyphError,
			Math.abs(actual.width - glyph.width),
			Math.abs(actual.height - glyph.height)
		);
	}
	expect(projected).toBeGreaterThan(3);
	expect(maxInsetError).toBeLessThan(2);
	expect(maxGlyphError).toBeLessThan(0.5);
	expect(maxPlainGlyphError).toBeGreaterThan(0.5);
	expect(document.querySelectorAll('.detail')).toHaveLength(0);
	expect(protectedCard.getBoundingClientRect().width).toBeCloseTo(240, 0);
	await expect
		.poll(() => visualElementStore.get(protectedCard)?.projection?.currentAnimation === undefined)
		.toBe(true);
});

it('keeps native grouped disclosure text unscaled through prompt opening and reversal', async () => {
	render(GroupSnippet);
	await document.fonts.ready;
	await frame();
	await frame();
	const panels = [...document.querySelectorAll<HTMLDetailsElement>('.snippet-stage details')];
	const summary = panels[0].querySelector('summary')!;
	const closed = panels[0].getBoundingClientRect().height;
	const glyph = document.createRange();
	const text = [...summary.childNodes].find(
		(node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
	)!;
	glyph.setStart(text, 0);
	glyph.setEnd(text, 1);
	const original = glyph.getBoundingClientRect();
	let maxGlyphError = 0;
	let movingFrames = 0;
	summary.focus();
	summary.click();
	const start = performance.now();
	while (performance.now() - start < 500) {
		await frame();
		const actual = glyph.getBoundingClientRect();
		maxGlyphError = Math.max(
			maxGlyphError,
			Math.abs(actual.width - original.width),
			Math.abs(actual.height - original.height)
		);
		if (Math.abs(panels[0].getBoundingClientRect().height - panels[0].offsetHeight) > 1)
			movingFrames++;
	}
	expect(movingFrames).toBeGreaterThan(2);
	expect(maxGlyphError).toBeLessThan(0.5);
	expect(panels[0].open).toBe(true);
	expect(panels[0].getBoundingClientRect().height).toBeGreaterThan(closed);
	expect(visualElementStore.get(panels[0])?.projection?.currentAnimation).toBeUndefined();
	// Native keyboard activation is exercised separately in the live docs page.
	summary.click();
	await expect.poll(() => panels[0].getBoundingClientRect().height).toBeCloseTo(closed, 0);
	expect(panels[0].open).toBe(false);
	expect(document.activeElement).toBe(summary);
});

it('expands the player using ordinary layout props', async () => {
	render(Player);
	await frame();
	await frame();
	const record = document.querySelector<HTMLElement>('.record')!;
	const height = record.offsetHeight;
	click('Open player');
	await tick();
	expect(record.offsetHeight).toBeGreaterThan(height);
	expect(document.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
	expect(document.querySelector('.record-heading')!.getBoundingClientRect().width).toBeGreaterThan(
		0
	);
});

it('moves a shared highlight on keyboard focus while retaining one identity', async () => {
	render(Tabs);
	await frame();
	await frame();
	const buttons = [...document.querySelectorAll<HTMLButtonElement>('.choices button')];
	buttons[1].focus();
	await tick();
	expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
	await expect.poll(() => document.querySelectorAll('.selected').length, { timeout: 4000 }).toBe(1);
	expect(buttons[1].querySelector('.selected')).not.toBeNull();
	buttons[2].click();
	await tick();
	expect(buttons[2].querySelector('.selected')).not.toBeNull();
});

it('scrubs the modern scroll study through its phases and reverses to the start', async () => {
	render(Scroll);
	await frame();
	await frame();
	const reader = document.querySelector<HTMLElement>('.reader')!;
	reader.scrollTop = reader.scrollHeight - reader.clientHeight;
	await expect
		.poll(() => document.querySelector('.stage-footer h3')!.textContent)
		.toBe('Let them go.');
	expect(document.querySelector('progress')!.value).toBeGreaterThan(0.95);
	reader.scrollTop = 0;
	await expect
		.poll(() => document.querySelector('.stage-footer h3')!.textContent)
		.toBe('Find the pieces.');
	expect(document.querySelector('progress')!.value).toBe(0);
});
