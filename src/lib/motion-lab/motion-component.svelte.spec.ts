import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { visualElementStore } from 'motion-dom';
import MotionComponent from './MotionComponent.svelte';

it('retains keyed list items for exit and reverses on the same native element', async () => {
	const screen = render(MotionComponent);
	const item = screen.getByTestId('motion-component-2').element();
	await expect.poll(() => Number(getComputedStyle(item).opacity)).toBe(1);
	flushSync(() => screen.component.remove(2));
	expect(item.isConnected).toBe(true);
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	flushSync(() => screen.component.restore());
	expect(screen.getByTestId('motion-component-2').element()).toBe(item);
	await expect.poll(() => Number(getComputedStyle(item).opacity)).toBe(1);
	flushSync(() => screen.component.remove(2));
	await expect.poll(() => item.isConnected).toBe(false);
});

it('preserves keyed native elements through reorder and inherits provider options', async () => {
	const screen = render(MotionComponent);
	const first = screen.getByTestId('motion-component-1').element();
	await expect.poll(() => visualElementStore.get(first)?.projection).toBeDefined();
	const visual = visualElementStore.get(first)!;
	expect(visual.getProps().transition).toMatchObject({ duration: 0.2 });
	flushSync(() => screen.component.reverse());
	expect(screen.getByTestId('motion-component-1').element()).toBe(first);
	expect(first.parentElement?.lastElementChild).toBe(first);
	expect(visualElementStore.get(first)).toBe(visual);
});

it('forwards native attributes, events and refs and merges reactive author styles', async () => {
	const screen = render(MotionComponent);
	const button = screen.getByTestId('motion-component-button').element() as HTMLButtonElement;
	expect(button.tagName).toBe('BUTTON');
	expect(button.type).toBe('button');
	expect(screen.component.element()).toBe(button);
	await expect.poll(() => Number(getComputedStyle(button).opacity)).toBe(1);
	button.click();
	expect(screen.component.clicked()).toBe(1);
	flushSync(() => screen.component.recolor());
	expect(button.style.color).toBe('blue');
	expect(Number(getComputedStyle(button).opacity)).toBe(1);
	expect(screen.getByRole('textbox', { name: 'Motion input' }).element().tagName).toBe('INPUT');
	await screen.unmount();
	expect(screen.component.element()).toBeNull();
});
