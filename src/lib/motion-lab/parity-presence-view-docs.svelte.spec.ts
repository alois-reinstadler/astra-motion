import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
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
	const expectIconPolicy = () =>
		expect(document.querySelector('.example')?.textContent).not.toMatch(
			/[\u2190-\u21ff\u27f0-\u27ff\u2900-\u297f\u2b00-\u2b11]/u
		);
	expectIconPolicy();
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
			expectIconPolicy();
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
			await screen.getByRole('button', { name: 'Back to collection', exact: true }).click();
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

it('preserves intentional outside focus when a native View transition completes', async () => {
	expect(typeof document.startViewTransition).toBe('function');
	const screen = await render(View);
	const outside = document.createElement('button');
	outside.textContent = 'Continue elsewhere';
	document.body.appendChild(outside);
	const layers = () =>
		document
			.getAnimations()
			.filter((animation) =>
				(animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith('::view-transition-')
			);
	try {
		await screen.getByRole('button', { name: 'Open Coastal light', exact: true }).click();
		await expect.poll(() => layers().length).toBeGreaterThan(0);
		const active = layers();
		for (const animation of active) animation.pause();
		expect(document.querySelector('[data-view-back]')).not.toBeNull();
		outside.focus();
		expect(document.activeElement).toBe(outside);
		// Complete real snapshot layers after the user's later focus choice.
		for (const animation of active) animation.finish();
		await expect
			.poll(() => document.querySelector('.status')?.textContent)
			.toBe('Viewing Coastal light.');
		expect(document.activeElement).toBe(outside);
		expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
	} finally {
		for (const animation of layers()) animation.finish();
		await screen.unmount();
		outside.remove();
	}
});

it('cancels a native View capture promptly when the whole example is disposed', async () => {
	expect(typeof document.startViewTransition).toBe('function');
	const screen = await render(View);
	const root = document.querySelector<HTMLElement>('.example')!;
	const status = root.querySelector('.status')!;
	const nodes = [...root.querySelectorAll<HTMLElement>('[data-shared-art], [data-shared-title]')];
	const start = document.startViewTransition.bind(document);
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	let captured = false;
	let native: ViewTransition | undefined;
	let skips = 0;
	let restoreSkip = () => {};
	const spy = vi.spyOn(document, 'startViewTransition').mockImplementation((update) => {
		// Hold the real browser callback before the application's pending mutation.
		// Cancellation must release ownership without waiting for this gate.
		native = start(async () => {
			captured = true;
			await gate;
			if (typeof update === 'function') await update();
			else await update?.update?.();
		});
		const skip = native.skipTransition.bind(native);
		const skipSpy = vi.spyOn(native, 'skipTransition').mockImplementation(() => {
			skips++;
			skip();
		});
		restoreSkip = () => skipSpy.mockRestore();
		void native.ready.catch(() => {});
		return native;
	});
	const lateWrites: MutationRecord[] = [];
	const observer = new MutationObserver((records) => lateWrites.push(...records));
	let unmounted = false;
	try {
		await screen.getByRole('button', { name: 'Open Coastal light', exact: true }).click();
		await expect.poll(() => captured).toBe(true);
		expect(nodes).toHaveLength(6);
		expect(nodes.every((node) => node.style.viewTransitionName.startsWith('astra_view_'))).toBe(
			true
		);
		expect(document.querySelector('[data-astra-view-reset]')).not.toBeNull();
		expect(root.querySelector('[data-view-detail]')).toBeNull();
		await screen.unmount();
		unmounted = true;
		await tick();
		expect
			.soft({
				skips,
				namedNodes: nodes.filter((node) => node.style.viewTransitionName).length,
				styles: document.querySelectorAll('[data-astra-view-reset]').length
			})
			.toEqual({ skips: 1, namedNodes: 0, styles: 0 });
		observer.observe(root, { childList: true, subtree: true, characterData: true });
		release();
		await native!.updateCallbackDone;
		await native!.finished;
		await tick();
		expect(lateWrites).toEqual([]);
		expect(status.textContent).toBe('Choose a field note to explore.');
		expect(root.isConnected).toBe(false);
		expect(document.querySelector('[data-view-detail]')).toBeNull();
		expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
		expect(nodes.every((node) => !node.style.viewTransitionName)).toBe(true);
	} finally {
		release();
		native?.skipTransition();
		if (native) await Promise.allSettled([native.updateCallbackDone, native.finished]);
		observer.disconnect();
		if (!unmounted) await screen.unmount();
		restoreSkip();
		spy.mockRestore();
	}
});
