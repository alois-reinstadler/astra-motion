import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import Cards from '../site/examples/SessionCards.svelte';
import Player from '../site/examples/LayoutExample.svelte';
import Tabs from '../site/examples/SharedExample.svelte';
import Scroll from '../site/examples/ScrollExample.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const click = (name: string) =>
	[...document.querySelectorAll('button')]
		.find((button) => button.textContent?.trim().startsWith(name))!
		.click();

it('resizes both cards, corrects inherited scale, and reverses a held exit without stale dimensions', async () => {
	render(Cards);
	await frame();
	await frame();
	const cards = [...document.querySelectorAll<HTMLElement>('.card')];
	expect(cards.map((card) => card.offsetWidth)).toEqual([240, 240]);
	click('Read session');
	await tick();
	expect(cards.map((card) => card.offsetWidth)).toEqual([380, 380]);
	await expect
		.poll(() => Boolean(visualElementStore.get(cards[0])?.projection?.currentAnimation))
		.toBe(true);
	// Capture a moving frame; the protected boundary has a wider painted text box.
	let contrast = 0;
	for (let i = 0; i < 8; i++) {
		await frame();
		contrast = Math.max(
			contrast,
			cards[1].querySelector('.note')!.getBoundingClientRect().width -
				cards[0].querySelector('.note')!.getBoundingClientRect().width
		);
	}
	expect(contrast).toBeGreaterThan(8);
	click('Close session');
	await tick();
	expect(cards.every((card) => card.style.height !== '')).toBe(true);
	click('Read session');
	await tick();
	expect(cards.every((card) => card.style.height === '')).toBe(true);
	await expect
		.poll(() => cards.map((card) => Math.round(card.getBoundingClientRect().width)), {
			timeout: 4000
		})
		.toEqual([380, 380]);
	click('Close session');
	await expect.poll(() => document.querySelectorAll('.detail').length, { timeout: 4000 }).toBe(0);
	await expect
		.poll(() => cards.map((card) => Math.round(card.getBoundingClientRect().width)), {
			timeout: 4000
		})
		.toEqual([240, 240]);
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
