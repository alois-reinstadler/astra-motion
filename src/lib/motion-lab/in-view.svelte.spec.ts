import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import InViewHarness from './InViewHarness.svelte';

class Observer implements IntersectionObserver {
	static instances: Observer[] = [];
	readonly root;
	readonly rootMargin;
	readonly thresholds;
	readonly scrollMargin = '0px';
	readonly targets = new Set<Element>();
	disconnect = vi.fn(() => this.targets.clear());
	observe = vi.fn((element: Element) => this.targets.add(element));
	unobserve = vi.fn((element: Element) => this.targets.delete(element));
	takeRecords = () => [];

	constructor(
		private callback: IntersectionObserverCallback,
		options: IntersectionObserverInit = {}
	) {
		this.root = options.root ?? null;
		this.rootMargin = options.rootMargin ?? '0px';
		this.thresholds = [Number(options.threshold ?? 0)];
		Observer.instances.push(this);
	}

	deliver(target: Element, ratio: number, isIntersecting = ratio > 0) {
		const bounds = target.getBoundingClientRect();
		this.callback(
			[
				{
					target,
					isIntersecting,
					intersectionRatio: ratio,
					boundingClientRect: bounds,
					intersectionRect: bounds,
					rootBounds: null,
					time: performance.now()
				}
			],
			this
		);
	}
}

beforeEach(() => {
	Observer.instances = [];
	vi.stubGlobal('IntersectionObserver', Observer);
});
afterEach(() => vi.unstubAllGlobals());

const observer = () => Observer.instances.at(-1)!;
const target = () => document.querySelector('[data-testid="in-view-target"]')!;
const output = () => document.querySelector('[data-testid="in-view-current"]')!.textContent;

it('clears initial true on the first outside measurement and reacts to enter and leave', async () => {
	const screen = render(InViewHarness, { options: { initial: true } });
	await tick();
	expect(output()).toBe('true');
	observer().deliver(target(), 0);
	await tick();
	expect(output()).toBe('false');
	observer().deliver(target(), 0.1);
	await tick();
	expect(output()).toBe('true');
	observer().deliver(target(), 0);
	await tick();
	expect(output()).toBe('false');
	await screen.unmount();
});

it('honors numeric and all thresholds, including initial partial intersections', async () => {
	const screen = render(InViewHarness, { options: { amount: 0.5 } });
	await tick();
	const first = observer();
	expect(first.thresholds).toEqual([0.5]);
	first.deliver(target(), 0.49);
	await tick();
	expect(output()).toBe('false');
	first.deliver(target(), 0.5);
	await tick();
	expect(output()).toBe('true');
	first.deliver(target(), 0.49);
	await tick();
	expect(output()).toBe('false');
	screen.component.configure({ amount: 'all', root: document, margin: '10px 20%' });
	await tick();
	expect(first.disconnect).toHaveBeenCalledOnce();
	expect(observer().root).toBe(document);
	expect(observer().rootMargin).toBe('10px 20%');
	expect(observer().thresholds).toEqual([1]);
	observer().deliver(target(), 0.99);
	await tick();
	expect(output()).toBe('false');
	observer().deliver(target(), 1);
	await tick();
	expect(output()).toBe('true');
	await screen.unmount();
});

it('latches once only after a measured entry and starts fresh for a replacement target', async () => {
	const screen = render(InViewHarness, { options: { initial: true, once: true } });
	await tick();
	const first = observer();
	const original = target();
	first.deliver(original, 0);
	await tick();
	expect(output()).toBe('false');
	expect(first.disconnect).not.toHaveBeenCalled();
	first.deliver(original, 0.1);
	await tick();
	expect(output()).toBe('true');
	expect(first.disconnect).toHaveBeenCalledOnce();
	first.deliver(original, 0);
	await tick();
	expect(output()).toBe('true');
	screen.component.configure({ initial: false, margin: '20px' });
	await tick();
	expect(Observer.instances).toHaveLength(1);
	expect(output()).toBe('true');
	screen.component.replace();
	await tick();
	expect(Observer.instances).toHaveLength(2);
	expect(target()).not.toBe(original);
	expect(output()).toBe('false');
	first.deliver(original, 1);
	await tick();
	expect(output()).toBe('false');
	observer().deliver(target(), 1);
	await tick();
	expect(output()).toBe('true');
	await screen.unmount();
});

it('disconnects changed options, removed targets and destroyed owners and ignores stale deliveries', async () => {
	const screen = render(InViewHarness);
	await tick();
	const first = observer();
	const element = target();
	screen.component.configure({ amount: 1 });
	await tick();
	const second = observer();
	expect(first.disconnect).toHaveBeenCalledOnce();
	first.deliver(element, 1);
	await tick();
	expect(output()).toBe('false');
	second.deliver(element, 1);
	await tick();
	expect(output()).toBe('true');
	screen.component.hide();
	await tick();
	expect(second.disconnect).toHaveBeenCalledOnce();
	expect(output()).toBe('false');
	second.deliver(element, 1);
	await tick();
	expect(output()).toBe('false');
	await screen.unmount();

	const another = render(InViewHarness);
	await tick();
	const last = observer();
	const lastTarget = target();
	const read = another.component.read;
	await another.unmount();
	expect(last.disconnect).toHaveBeenCalledOnce();
	last.deliver(lastTarget, 1);
	expect(read()).toBe(false);
});

it('can resume observation when once is disabled and treats amount zero as some', async () => {
	const screen = render(InViewHarness, { options: { once: true, amount: 0 } });
	await tick();
	observer().deliver(target(), 0, true);
	await tick();
	expect(output()).toBe('true');
	screen.component.configure({ once: false });
	await tick();
	expect(Observer.instances).toHaveLength(2);
	observer().deliver(target(), 0, false);
	await tick();
	expect(output()).toBe('false');
	await screen.unmount();
});

it('tracks actual browser intersections as an element moves through a scroll container', async () => {
	vi.unstubAllGlobals();
	// Vitest scales its iframe, introducing subpixel clipping at a threshold of exactly 1.
	const screen = render(InViewHarness, { options: { amount: 0.75 } });
	await tick();
	const element = target() as HTMLElement;
	const root = element.parentElement!;
	root.style.cssText =
		'position:fixed;left:100px;top:100px;width:100px;height:100px;overflow:hidden';
	element.style.cssText = 'position:absolute;left:10px;top:10px;width:20px;height:20px';
	screen.component.configure({ root });
	await tick();
	await expect.poll(output).toBe('true');
	element.style.left = '-10px';
	await expect.poll(output).toBe('false');
	element.style.left = '10px';
	await expect.poll(output).toBe('true');
	element.style.left = '-10000px';
	await expect.poll(output).toBe('false');
	await screen.unmount();
});
