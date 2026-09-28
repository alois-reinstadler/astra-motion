import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Presence from '../site/examples/AnimatePresenceExample.svelte';
import Sequence from '../site/examples/AnimatePresenceSequenceExample.svelte';
import List from '../site/examples/AnimatePresenceListExample.svelte';
import Activity from '../site/examples/AnimateActivityExample.svelte';
import View from '../site/examples/AnimateViewExample.svelte';

const button = (text: string) =>
	[...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === text)!;

it('runs the canonical conditional Presence example through removal and re-entry', async () => {
	render(Presence);
	await tick();
	button('Dismiss note').click();
	await tick();
	expect(document.querySelector('aside.note')).not.toBeNull();
	await expect.poll(() => document.querySelector('aside.note')).toBeNull();
	button('Show note').click();
	await expect.poll(() => document.querySelector('aside.note')).not.toBeNull();
});

it('runs the canonical wait sequence and displays the latest requested note', async () => {
	render(Sequence);
	await tick();
	button('Next note').click();
	await tick();
	expect(document.querySelector('h3')?.textContent).toBe('Make room.');
	await expect.poll(() => document.querySelector('h3')?.textContent).toBe('Find a rhythm.');
	expect(document.querySelectorAll('article.card')).toHaveLength(1);
});

it('runs the canonical popLayout list removal and restoration', async () => {
	render(List);
	await tick();
	document.querySelector<HTMLButtonElement>('[aria-label="Remove Read something new"]')!.click();
	await expect.poll(() => document.querySelectorAll('li').length).toBe(2);
	button('Restore list').click();
	await expect.poll(() => document.querySelectorAll('li').length).toBe(3);
	expect(document.querySelector('[data-astra-presence-pop]')).toBeNull();
});

it('retains the same input node and native value in the canonical Activity example', async () => {
	render(Activity);
	await tick();
	const input = document.querySelector<HTMLInputElement>('#retained-draft')!;
	input.value = 'A retained draft';
	button('Hide editor').click();
	await expect
		.poll(() =>
			document.querySelector('[data-astra-activity]')?.getAttribute('data-astra-activity')
		)
		.toBe('hidden');
	button('Show editor').click();
	await tick();
	expect(document.querySelector('#retained-draft')).toBe(input);
	expect(input.value).toBe('A retained draft');
	expect(input.checkVisibility()).toBe(true);
});

it('runs the canonical named view swap and releases transition styles', async () => {
	render(View);
	await tick();
	button('Open cover').click();
	await expect.poll(() => document.querySelector('h3')?.textContent).toBe('A closer look.');
	await expect.poll(() => document.querySelector('[data-astra-view-reset]')).toBeNull();
	button('Back to collection').click();
	await expect.poll(() => document.querySelector('h3')?.textContent).toBe('Small discoveries.');
	await expect.poll(() => document.querySelector('[data-astra-view-reset]')).toBeNull();
});
