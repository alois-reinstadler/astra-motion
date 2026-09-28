import { flushSync, tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Fixture from './ParityCustom.svelte';

it('forwards custom bindings, attachment roots, native props and managed exit without wrappers', async () => {
	const { component } = render(Fixture);
	await expect
		.poll(() => document.querySelector<HTMLElement>('[data-custom]')?.style.opacity)
		.toBe('1');
	const element = document.querySelector('[data-custom]')!;
	expect(element.tagName).toBe('BUTTON');
	expect(component.inspect().ref).toBe(element);
	expect(element.hasAttribute('animate')).toBe(false);
	await page.getByRole('button', { name: 'Custom motion button' }).click();
	expect(component.inspect().count).toBe(1);
	expect(element.textContent).toContain('Child 1');
	flushSync(() => component.hide());
	expect(element.isConnected).toBe(true);
	await expect.poll(() => element.isConnected).toBe(false);
	expect(component.inspect().ref).toBeNull();
	expect(document.querySelector('[data-custom-tag]')?.tagName).toBe('ASTRA-CARD');
});

it('renders live MotionValue text without wrappers, replaces subscriptions, and preserves SVG namespaces', async () => {
	const { component, unmount } = render(Fixture);
	await tick();
	const text = document.querySelector('[data-value-text]')!;
	expect(text.textContent).toBe('10');
	expect(text.children.length).toBe(0);
	component.updateText(25);
	await expect.poll(() => text.textContent).toBe('25');
	expect(document.querySelector('[data-svg-link]')?.namespaceURI).toBe(
		'http://www.w3.org/2000/svg'
	);
	expect(document.querySelector('svg title')?.namespaceURI).toBe('http://www.w3.org/2000/svg');
	expect(document.querySelector('[data-html-child]')?.namespaceURI).toBe(
		'http://www.w3.org/1999/xhtml'
	);
	component.replaceText();
	await tick();
	component.updateText(99);
	await tick();
	expect(text.textContent).toBe('ready');
	await unmount();
	expect(component.inspect().text.get()).toBe(99);
});
