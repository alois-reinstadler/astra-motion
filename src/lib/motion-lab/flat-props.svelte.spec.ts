import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { visualElementStore } from 'motion-dom';
import FlatProps from './FlatProps.svelte';
import type { MotionOptions } from '../motion/index.js';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const x = (node: Element) => new DOMMatrix(getComputedStyle(node).transform).m41;
const tap = (node: HTMLElement) => {
	for (const type of ['pointerdown', 'pointerup'])
		node.dispatchEvent(new PointerEvent(type, { bubbles: true, isPrimary: true }));
};

it('reacts to nested flat targets, uses per-option precedence and keeps MotionValue subscriptions', async () => {
	const screen = render(FlatProps);
	const node = screen.getByTestId('flat').element() as HTMLElement;
	const generic = screen.getByTestId('generic-flat').element();
	const values = screen.getByTestId('value-style').element();
	await expect.poll(() => x(node)).toBe(40);
	expect(visualElementStore.get(node)?.getProps().transition).toEqual({ duration: 0 });
	flushSync(() => screen.component.mutate());
	await expect.poll(() => x(node)).toBe(90);
	await expect.poll(() => x(generic)).toBe(90);
	flushSync(() => screen.component.fallback());
	await expect.poll(() => x(node)).toBe(8);
	screen.component.snapshot().x.set(28);
	await expect.poll(() => x(values)).toBe(28);
	expect(visualElementStore.get(values)?.getValue('x')).toBe(screen.component.snapshot().x);
	expect(node.getAttributeNames()).not.toContain('animate');
	await expect
		.poll(() => getComputedStyle(screen.getByTestId('inherited-flat').element()).opacity)
		.toBe('1');
});

it('updates and clears object styles and can switch back to native CSS strings', async () => {
	const screen = render(FlatProps);
	const node = screen.getByTestId('flat').element() as HTMLElement;
	await frame();
	flushSync(() =>
		screen.component.paint({ color: 'blue', height: 25, '--tone': 3, lineHeight: 1.5 })
	);
	await expect.poll(() => node.style.color).toBe('blue');
	expect(node.style.width).toBe('');
	expect(node.style.height).toBe('25px');
	expect(node.style.getPropertyValue('--tone')).toBe('3');
	expect(node.style.lineHeight).toBe('1.5');
	expect(node.style.backgroundColor).toBe('white');
	flushSync(() => screen.component.paint('padding:7px'));
	await expect.poll(() => node.style.color).toBe('black');
	expect(node.style.height).toBe('');
	expect(node.style.padding).toBe('7px');
	flushSync(() => screen.component.paint({ color: undefined }));
	await expect.poll(() => node.style.color).toBe('');
	expect(node.style.padding).toBe('');
	expect(node.getAttribute('style')).not.toContain('[object Object]');
});

it('keeps native disabled/events/bindings and symbol attachments while retaining reversible exits', async () => {
	const screen = render(FlatProps);
	const button = screen.getByTestId('flat-button').element() as HTMLButtonElement;
	const legacy = screen.getByTestId('legacy-disabled').element() as HTMLButtonElement;
	expect(button.disabled).toBe(true);
	expect(legacy.disabled).toBe(false);
	expect(screen.component.snapshot().ref).toBe(button);
	expect(button.dataset.attached).toBe('true');
	button.click();
	expect(screen.component.snapshot().clicks).toBe(0);
	flushSync(() => screen.component.gate(false));
	expect(button.disabled).toBe(false);
	button.click();
	expect(screen.component.snapshot().clicks).toBe(1);
	await expect
		.poll(() => (visualElementStore.get(button)?.getProps() as MotionOptions)?.disabled)
		.toBe(false);
	tap(button);
	expect(screen.component.snapshot().taps).toBe(1);
	flushSync(() => screen.component.gate(undefined));
	expect(button.disabled).toBe(false);
	await expect
		.poll(() => (visualElementStore.get(button)?.getProps() as MotionOptions)?.disabled)
		.toBe(true);
	tap(button);
	expect(screen.component.snapshot().taps).toBe(1);
	flushSync(() => screen.component.gate(null));
	expect(button.disabled).toBe(false);
	await expect
		.poll(() => (visualElementStore.get(button)?.getProps() as MotionOptions)?.disabled)
		.toBe(false);
	const input = screen.getByLabelText('Flat input').element() as HTMLInputElement;
	input.value = 'typed';
	input.dispatchEvent(new Event('input', { bubbles: true }));
	expect(screen.component.snapshot().text).toBe('typed');
	flushSync(() => screen.component.show(false));
	expect(button.isConnected).toBe(true);
	await frame();
	flushSync(() => screen.component.show(true));
	expect(screen.getByTestId('flat-button').element()).toBe(button);
	await expect.poll(() => Number(getComputedStyle(button).opacity)).toBe(1);
	flushSync(() => screen.component.show(false));
	await expect.poll(() => button.isConnected).toBe(false);
	expect(screen.component.snapshot().ref).toBeNull();
	expect(screen.component.snapshot().attached).toBe(1);
	expect(screen.component.snapshot().detached).toBe(1);
});

it('releases MotionValue styles when replaced with plain values or removed', async () => {
	const screen = render(FlatProps);
	const node = screen.getByTestId('changing-style').element() as HTMLElement;
	await expect.poll(() => node.style.color).toBe('red');
	expect(visualElementStore.get(node)?.getValue('color')).toBe(screen.component.snapshot().color);
	flushSync(() => screen.component.paintValue({ color: 'blue', x: 5 }));
	await expect.poll(() => node.style.color).toBe('blue');
	await expect.poll(() => x(node)).toBe(5);
	screen.component.snapshot().color.set('green');
	await frame();
	expect(node.style.color).toBe('blue');
	flushSync(() => screen.component.paintValue({}));
	await expect.poll(() => node.style.color).toBe('');
	await expect.poll(() => x(node)).toBe(0);
});

it('keeps animated values in charge until their target returns ownership to style', async () => {
	const screen = render(FlatProps);
	const node = screen.getByTestId('return-style').element() as HTMLElement;
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBe(1);
	flushSync(() => screen.component.changeBase());
	expect(Number(getComputedStyle(node).opacity)).toBe(1);
	flushSync(() => screen.component.releaseAnimation());
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBe(0.6);
});
