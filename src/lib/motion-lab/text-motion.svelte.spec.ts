import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './TextMotionFixture.svelte';
import TextReveal from '../motion/TextReveal.svelte';
const swap = () => document.querySelector<HTMLElement>('[data-swap]')!;
const layers = () => Array.from(swap().querySelectorAll<HTMLElement>('[data-text-layer]'));
const fragments = () =>
	Array.from(document.querySelectorAll<HTMLElement>('[data-reveal] [data-text-fragment]'));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Wait for actual WAAPI settlement; software-rendered browser matrices can deliver finish events late.
const poll = <T>(read: () => T, options: { timeout?: number } = {}) =>
	expect.poll(read, { timeout: 5000, ...options });

it.each(['sync', 'wait'] as const)(
	'%s coalesces A → B → C and preserves focus and control identity',
	async (mode) => {
		const { component } = render(Fixture, { mode });
		await tick();
		const button = document.querySelector<HTMLButtonElement>('[data-control]')!;
		button.focus();
		const host = swap();
		flushSync(() =>
			component.select('Beta message that wraps across several lines at narrow widths.')
		);
		expect(layers().length).toBeLessThanOrEqual(mode === 'sync' ? 2 : 1);
		flushSync(() => component.select('Gamma.'));
		await poll(() => layers().map((n) => n.textContent), { timeout: 3000 }).toEqual(['Gamma.']);
		expect(swap()).toBe(host);
		expect(document.activeElement).toBe(button);
		expect(swap().querySelector('[aria-live]')?.textContent).toBe('Gamma.');
		expect(swap().querySelectorAll('[aria-live]')).toHaveLength(1);
	}
);
it.each(['sync', 'wait'] as const)(
	'%s handles A → B → A, repeats, empty strings and replacement during exit',
	async (mode) => {
		const { component } = render(Fixture, { mode });
		await tick();
		flushSync(() => component.select('Beta'));
		flushSync(() => component.select('Alpha message.'));
		await poll(() => layers().map((n) => n.textContent), { timeout: 3000 }).toEqual([
			'Alpha message.'
		]);
		const current = layers()[0];
		flushSync(() => component.select('Alpha message.'));
		expect(layers()[0]).toBe(current);
		flushSync(() => component.select(''));
		await poll(() => layers().map((n) => n.textContent), { timeout: 3000 }).toEqual(['']);
		flushSync(() => component.select('Replacement'));
		await poll(() => layers().map((n) => n.textContent), { timeout: 3000 }).toEqual([
			'Replacement'
		]);
	}
);
it('settles live policy changes including opacity, blur, travel and long stagger delays', async () => {
	const { component } = render(Fixture, { duration: 2, stagger: 1 });
	await tick();
	expect(fragments().some((n) => getComputedStyle(n).opacity !== '1')).toBe(true);
	flushSync(() => component.reduce('always'));
	await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '1')).toBe(true);
	expect(fragments().every((n) => getComputedStyle(n).filter === 'blur(0px)')).toBe(true);
	expect(fragments().every((n) => n.getAnimations().length === 0)).toBe(true);
	flushSync(() => component.show(false));
	expect(fragments().every((n) => getComputedStyle(n).opacity === '1')).toBe(true);
});
it('reserve and fixed geometry stay stable during multiline swaps and reflow with width and fonts', async () => {
	const { component } = render(Fixture);
	await tick();
	const box = () => swap().getBoundingClientRect();
	const height = box().height;
	flushSync(() =>
		component.select('Beta message that wraps across several lines at narrow widths.')
	);
	expect(box().height).toBeCloseTo(height, 1);
	await sleep(250);
	expect(box().height).toBeCloseTo(height, 1);
	flushSync(() => component.resize(150));
	expect(box().height).toBeGreaterThan(height);
	const narrow = box().height;
	flushSync(() => component.fontSize(28));
	expect(box().height).toBeGreaterThan(narrow);
});
it('hidden Activity cancels playback, keeps input state and accepts latest text without late remounts', async () => {
	const { component, unmount } = render(Fixture, { mode: 'wait', duration: 1, stagger: 1 });
	await tick();
	const input = document.querySelector<HTMLInputElement>('[data-retained]')!;
	input.value = 'kept';
	flushSync(() => {
		component.select('Beta');
		component.hide(true);
	});
	await poll(
		() => getComputedStyle(document.querySelector<HTMLElement>('[data-text-activity]')!).display,
		{ timeout: 3000 }
	).toBe('none');
	expect(fragments().every((n) => n.getAnimations().length === 0)).toBe(true);
	flushSync(() => component.select('Gamma.'));
	flushSync(() => component.hide(false));
	await poll(() => layers().map((n) => n.textContent), { timeout: 3000 }).toEqual(['Gamma.']);
	expect(document.querySelector('[data-retained]')).toBe(input);
	expect(input.value).toBe('kept');
	await unmount();
	await sleep(100);
	expect(document.querySelector('[data-swap]')).toBeNull();
});
it('disconnects viewport observation on unmount and once entry; reentry can replay', async () => {
	const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
	const { unmount } = render(Fixture, { trigger: 'viewport', once: true });
	await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '1')).toBe(true);
	await poll(() => disconnect.mock.calls.length).toBeGreaterThan(0);
	await unmount();
	disconnect.mockRestore();
});

it('fixed sizing clips overflow and content sizing follows the message', async () => {
	const fixed = render(Fixture, { size: 'fixed' });
	await tick();
	const region = swap().querySelector<HTMLElement>('[data-text-region]')!;
	expect(region.getBoundingClientRect().height).toBe(90);
	expect(getComputedStyle(region).overflow).toBe('clip');
	flushSync(() => fixed.component.select('A much longer message '.repeat(30)));
	expect(swap().getBoundingClientRect().height).toBe(90);
	await fixed.unmount();
	const content = render(Fixture, { size: 'content' });
	await tick();
	const small = swap().getBoundingClientRect().height;
	flushSync(() =>
		content.component.select('A longer multiline paragraph with several words. '.repeat(3))
	);
	await poll(() => layers().length).toBe(1);
	expect(swap().getBoundingClientRect().height).toBeGreaterThan(small);
});

it('observes live device preference but respects explicit application never', async () => {
	let reduced = false;
	const listeners = new Set<EventListenerOrEventListenerObject>();
	const native = window.matchMedia.bind(window);
	const mock = vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
		query === '(prefers-reduced-motion: reduce)'
			? ({
					get matches() {
						return reduced;
					},
					media: query,
					onchange: null,
					addEventListener: (_: string, listener: EventListenerOrEventListenerObject) =>
						listeners.add(listener),
					removeEventListener: (_: string, listener: EventListenerOrEventListenerObject) =>
						listeners.delete(listener),
					addListener() {},
					removeListener() {},
					dispatchEvent: () => true
				} as MediaQueryList)
			: native(query)
	);
	const screen = render(Fixture, { initialPolicy: 'user', duration: 0.05 });
	try {
		await tick();
		flushSync(() => screen.component.show(false));
		await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '0')).toBe(true);
		reduced = true;
		for (const listener of listeners) {
			if (typeof listener === 'function') listener(new Event('change'));
			else listener.handleEvent(new Event('change'));
		}
		await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '1')).toBe(true);
		flushSync(() => screen.component.reduce('never'));
		await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '0')).toBe(true);
	} finally {
		await screen.unmount();
		mock.mockRestore();
	}
	expect(listeners.size).toBe(0);
});

it('replays viewport entry and releases the observer during hidden Activity', async () => {
	let callback: IntersectionObserverCallback | undefined;
	let target: Element | undefined;
	const disconnect = vi.fn();
	const original = window.IntersectionObserver;
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(fn: IntersectionObserverCallback) {
				callback = fn;
			}
			observe(node: Element) {
				target = node;
			}
			disconnect = disconnect;
		}
	);
	const screen = render(Fixture, { trigger: 'viewport', once: false, duration: 0.03 });
	const entry = (inside: boolean) =>
		callback!(
			[
				{
					target,
					isIntersecting: inside,
					intersectionRatio: inside ? 1 : 0
				} as IntersectionObserverEntry
			],
			{} as IntersectionObserver
		);
	try {
		await tick();
		entry(true);
		await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '1')).toBe(true);
		entry(false);
		await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '0')).toBe(true);
		entry(true);
		await poll(() => fragments().every((n) => getComputedStyle(n).opacity === '1')).toBe(true);
		flushSync(() => screen.component.hide(true));
		await poll(() => disconnect.mock.calls.length).toBeGreaterThan(0);
	} finally {
		await screen.unmount();
		vi.unstubAllGlobals();
	}
	expect(window.IntersectionObserver).toBe(original);
});

it('keeps closing punctuation on its word line at a narrow wrap boundary', async () => {
	render(TextReveal, {
		text: 'Hello.',
		split: 'words',
		as: 'p',
		duration: 0,
		style: 'width:50px;font:10px monospace'
	});
	await tick();
	const pieces = document.querySelectorAll<HTMLElement>('[data-text-fragment]');
	expect(pieces).toHaveLength(2);
	expect(pieces[0].getBoundingClientRect().top).toBe(pieces[1].getBoundingClientRect().top);
});
