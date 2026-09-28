import { flushSync, tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AnimationPlaybackControls } from 'motion-dom';
import Fixture from './ParityConfigNonce.svelte';

const styles = () =>
	[...document.head.querySelectorAll('style')].filter((style) =>
		style.textContent?.includes('[data-astra-presence-pop=')
	);
const poppedStyle = (element: Element) =>
	styles().find((style) =>
		style.textContent?.includes(element.getAttribute('data-astra-presence-pop')!)
	);

it('inherits reactive nonces through nested configuration, respects explicit overrides and removes pop styles', async () => {
	const { component } = render(Fixture);
	await tick();
	const inherited = document.querySelector('[data-nonce-inherited]')!;
	const explicit = document.querySelector('[data-nonce-explicit]')!;
	flushSync(() => {
		component.configure('updated-nonce');
		component.presence(false);
	});
	await expect.poll(() => poppedStyle(inherited)?.nonce).toBe('updated-nonce');
	expect(poppedStyle(explicit)?.nonce).toBe('explicit-nonce');
	expect(getComputedStyle(inherited).position).toBe('absolute');
	await expect.poll(() => inherited.isConnected).toBe(false);
	await expect.poll(() => styles()).toHaveLength(0);
});

it('uses the inherited nonce for a retained Activity pop and removes its stylesheet after hiding', async () => {
	const { component } = render(Fixture);
	await tick();
	const child = document.querySelector('[data-nonce-active-child]')!;
	flushSync(() => component.activity(false));
	await expect.poll(() => poppedStyle(child)?.nonce).toBe('first-nonce');
	await expect
		.poll(() => document.querySelector<HTMLElement>('[data-nonce-activity]')?.dataset.astraActivity)
		.toBe('hidden');
	expect(child.isConnected).toBe(true);
	expect(styles()).toHaveLength(0);
});

it('uses the latest inherited nonce for view capture and cleans it up on completion', async () => {
	let playback: AnimationPlaybackControls | undefined;
	const { component } = render(Fixture, {
		onViewStart: (controls) => {
			playback = controls;
			controls.pause();
		}
	});
	await tick();
	flushSync(() => component.configure('view-nonce'));
	const handle = component.view();
	await handle.ready;
	if (typeof document.startViewTransition === 'function') {
		expect(document.querySelector<HTMLStyleElement>('[data-astra-view-reset]')?.nonce).toBe(
			'view-nonce'
		);
		expect(playback?.state).toBe('paused');
		playback!.complete();
	}
	await handle.finished;
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
});
