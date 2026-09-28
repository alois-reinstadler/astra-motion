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

it('shares separate artwork and title snapshots across new DOM trees and restores card focus', async () => {
	expect(typeof document.startViewTransition).toBe('function');
	const screen = await render(View);
	// Names are intentionally restored as soon as native capture is ready.
	// Record the actual leases while capturing, then inspect their snapshot layers.
	const capturedNames = new Map<Element, string>();
	const observer = new MutationObserver((records) => {
		for (const { target } of records) {
			if (
				!(target instanceof HTMLElement) ||
				!target.matches('[data-shared-art], [data-shared-title]')
			)
				continue;
			const name = target.style.getPropertyValue('view-transition-name');
			if (name) capturedNames.set(target, name);
		}
	});
	observer.observe(document.body, { attributes: true, attributeFilter: ['style'], subtree: true });
	try {
		for (const [id, title] of [
			['coast', 'Coastal light'],
			['river', 'River paths']
		]) {
			const art = () => document.querySelector<HTMLElement>(`[data-shared-art="${id}"]`)!;
			const heading = () => document.querySelector<HTMLElement>(`[data-shared-title="${id}"]`)!;
			const oldArt = art();
			const oldTitle = heading();
			await screen.getByRole('button', { name: `Open ${title}`, exact: true }).click();
			await expect
				.poll(() => document.querySelector('[data-view-detail]')?.getAttribute('data-view-detail'))
				.toBe(id);
			expect(art()).not.toBe(oldArt);
			expect(heading()).not.toBe(oldTitle);
			await expect
				.poll(() => {
					const names = [art(), heading()].map((node) => capturedNames.get(node));
					const layers = document
						.getAnimations()
						.map((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement);
					return (
						new Set(names).size === 2 &&
						names.every(
							(name) =>
								name &&
								['group', 'old', 'new'].every((layer) =>
									layers.includes(`::view-transition-${layer}(${name})`)
								)
						)
					);
				})
				.toBe(true);
			expect(capturedNames.get(oldArt)).toBe(capturedNames.get(art()));
			expect(capturedNames.get(oldTitle)).toBe(capturedNames.get(heading()));
			await expect
				.poll(() => document.querySelector('.status')?.textContent)
				.toBe(`Viewing ${title}.`);
			expect(document.activeElement).toBe(document.querySelector('[data-view-back]'));
			expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
			expect(art().style.getPropertyValue('view-transition-name')).toBe('');
			expect(heading().style.getPropertyValue('view-transition-name')).toBe('');
			await screen.getByRole('button', { name: '← Back to collection', exact: true }).click();
			await expect
				.poll(() => document.querySelector('.status')?.textContent)
				.toBe('Back to the field notes.');
			expect(document.querySelector('[data-view-detail]')).toBeNull();
			expect(document.querySelectorAll('[data-view-open]')).toHaveLength(3);
			expect(document.activeElement).toBe(document.querySelector(`[data-view-open="${id}"]`));
			expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
		}
	} finally {
		observer.disconnect();
	}
}, 15000);
