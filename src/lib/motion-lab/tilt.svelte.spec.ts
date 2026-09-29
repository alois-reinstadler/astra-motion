import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Harness from './TiltHarness.svelte';

const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) {
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		await tick();
	}
};

function preferences() {
	const records = new Map<
		string,
		{ matches: boolean; listeners: Set<EventListenerOrEventListenerObject> }
	>();
	vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
		let record = records.get(query);
		if (!record) {
			record = { matches: query.includes('pointer: fine'), listeners: new Set() };
			records.set(query, record);
		}
		const value = record;
		return {
			get matches() {
				return value.matches;
			},
			media: query,
			onchange: null,
			addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
				value.listeners.add(listener),
			removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
				value.listeners.delete(listener),
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => true
		} as MediaQueryList;
	});
	return {
		set(query: string, matches: boolean) {
			const record = records.get(query)!;
			record.matches = matches;
			for (const listener of [...record.listeners]) {
				const event = new Event('change');
				if (typeof listener === 'function') listener(event);
				else listener.handleEvent(event);
			}
		},
		count() {
			return [...records.values()].reduce((sum, value) => sum + value.listeners.size, 0);
		}
	};
}

function nodes() {
	const host = document.querySelector<HTMLDivElement>('[data-astra-tilt]')!;
	const content = host.querySelector<HTMLDivElement>('[data-astra-tilt-content]')!;
	return { host, content };
}

function move(host: HTMLElement, x = 1, y = 0, pointerType = 'mouse') {
	const box = host.getBoundingClientRect();
	host.dispatchEvent(
		new PointerEvent('pointermove', {
			clientX: box.left + box.width * x,
			clientY: box.top + box.height * y,
			pointerType,
			bubbles: true,
			cancelable: true
		})
	);
}

function rotations(content: HTMLElement) {
	const matches = content.style.transform.match(
		/rotateX\(([-.\de+]+)deg\) rotateY\(([-.\de+]+)deg\)/
	);
	return matches ? [Number(matches[1]), Number(matches[2])] : [0, 0];
}

afterEach(() => vi.restoreAllMocks());

it('tilts inside outer layout/entrance transforms, preserving native focus and clicks', async () => {
	preferences();
	const screen = render(Harness, { composed: true });
	await frames();
	const { host, content } = nodes();
	const outer = document.querySelector<HTMLElement>('[data-tilt-outer]')!;
	const before = outer.style.transform;
	const input = host.querySelector('input')!;
	input.focus();
	move(host);
	await expect.poll(() => rotations(content)[0]).toBeGreaterThan(8);
	expect(rotations(content)[1]).toBeGreaterThan(8);
	expect(outer.style.transform).toBe(before);
	expect(new DOMMatrix(getComputedStyle(outer).transform).m41).toBeCloseTo(20, 1);
	expect(new DOMMatrix(getComputedStyle(outer).transform).m11).toBeCloseTo(1.2, 1);
	expect(document.activeElement).toBe(input);
	host.querySelector('button')!.click();
	await tick();
	expect(host.textContent).toContain('Clicked 1');
	expect(host.style.touchAction).toBe('');
	await screen.unmount();
});

it('returns on leave and cancel, and immediately stops when disabled mid-animation', async () => {
	preferences();
	const screen = render(Harness);
	await tick();
	const { host, content } = nodes();
	for (const type of ['pointerleave', 'pointercancel']) {
		move(host);
		await expect.poll(() => rotations(content)[1]).toBeGreaterThan(3);
		host.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse' }));
		await expect.poll(() => content.style.transform).toBe('none');
	}
	move(host);
	await frames();
	expect(rotations(content)[1]).toBeGreaterThan(0);
	screen.component.configure({ disabled: true });
	await tick();
	expect(content.style.transform).toBe('none');
	move(host);
	await frames();
	expect(content.style.transform).toBe('none');
	await screen.unmount();
});

it('recomputes after resize, constrains axes, and keeps touch/coarse input neutral', async () => {
	const media = preferences();
	const screen = render(Harness);
	await tick();
	screen.component.configure({ axis: 'y', maxRotateY: 20 });
	await tick();
	const { host, content } = nodes();
	move(host, 1, 0);
	await expect.poll(() => rotations(content)[1]).toBeGreaterThan(16);
	expect(rotations(content)[0]).toBe(0);
	screen.component.resize(400);
	await expect.poll(() => Math.abs(rotations(content)[1])).toBeLessThan(2);
	move(host, 1, 0, 'touch');
	await frames();
	expect(content.style.transform).toBe('none');
	media.set('(hover: hover) and (pointer: fine)', false);
	move(host);
	await frames();
	expect(content.style.transform).toBe('none');
	await screen.unmount();
});

it('honors inherited application policy and live OS changes including explicit never', async () => {
	const media = preferences();
	const screen = render(Harness);
	await tick();
	const { host, content } = nodes();
	move(host);
	await frames();
	expect(rotations(content)[1]).toBeGreaterThan(0);
	media.set('(prefers-reduced-motion: reduce)', true);
	expect(content.style.transform).toBe('none');
	move(host);
	await frames();
	expect(content.style.transform).toBe('none');
	screen.component.reduce('never');
	await tick();
	move(host);
	await expect.poll(() => rotations(content)[1]).toBeGreaterThan(4);
	screen.component.reduce('always');
	await tick();
	expect(content.style.transform).toBe('none');
	media.set('(prefers-reduced-motion: reduce)', false);
	move(host);
	await frames();
	expect(content.style.transform).toBe('none');
	await screen.unmount();
});

it('releases subscriptions and observers while Activity is hidden and on teardown', async () => {
	const media = preferences();
	const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
	const screen = render(Harness);
	await tick();
	const { host, content } = nodes();
	move(host);
	await frames();
	expect(media.count()).toBeGreaterThan(0);
	screen.component.hide(true);
	await tick();
	await frames();
	expect(content.style.transform).toBe('none');
	expect(media.count()).toBe(0);
	expect(disconnect).toHaveBeenCalled();
	move(host);
	await frames();
	expect(content.style.transform).toBe('none');
	screen.component.hide(false);
	await tick();
	move(host);
	await expect.poll(() => rotations(content)[1]).toBeGreaterThan(4);
	await screen.unmount();
	expect(media.count()).toBe(0);
	const style = content.style.transform;
	move(host);
	await frames();
	expect(content.style.transform).toBe(style);
});
