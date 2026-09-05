import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import ConfigLifecycle from './ConfigLifecycle.svelte';

const frames = async () => {
	await tick();
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
const node = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const visual = (id: string) => visualElementStore.get(node(id))!;

it('live reduced policy stops both plain layout and state while a nested override stays animated', async () => {
	const screen = render(ConfigLifecycle);
	await expect.poll(() => Number(getComputedStyle(node('outer-motion')).opacity)).toBe(1);
	screen.component.change();
	await frames();
	expect(visual('outer-layout').projection?.currentAnimation).toBeDefined();
	expect(visual('outer-motion').getValue('x')!.isAnimating()).toBe(true);
	screen.component.reduce('always');
	await frames();
	expect(visual('outer-layout').shouldReduceMotion).toBe(true);
	expect(visual('outer-motion').shouldReduceMotion).toBe(true);
	expect(visual('outer-layout').projection?.currentAnimation).toBeUndefined();
	expect(visual('outer-motion').getValue('x')!.get()).toBe(70);
	expect(visual('nested-layout').shouldReduceMotion).toBe(false);
	expect(visual('nested-motion').shouldReduceMotion).toBe(false);
	expect(visual('nested-motion').getValue('x')!.isAnimating()).toBe(true);
});

it('reenables projection after the inherited reduced policy changes back', async () => {
	const screen = render(ConfigLifecycle, { initialPolicy: 'always' });
	await frames();
	screen.component.change();
	await frames();
	expect(visual('outer-layout').projection?.currentAnimation).toBeUndefined();
	screen.component.reduce('never');
	await frames();
	screen.component.change();
	await frames();
	expect(visual('outer-layout').projection?.currentAnimation).toBeDefined();
	expect(visual('outer-motion').getValue('x')!.isAnimating()).toBe(true);
});

it('toggles projection without replacing the forwarded native element or state VisualElement', async () => {
	const screen = render(ConfigLifecycle);
	await expect.poll(() => Number(getComputedStyle(node('outer-motion')).opacity)).toBe(1);
	const element = node('outer-motion');
	const state = visual('outer-motion');
	expect(state.projection).toBeDefined();
	screen.component.projection(false);
	await frames();
	expect(node('outer-motion')).toBe(element);
	expect(visual('outer-motion')).toBe(state);
	expect(state.projection).toBeUndefined();
	screen.component.change();
	await expect.poll(() => state.getValue('x')!.get(), { timeout: 3000 }).toBe(70);
	screen.component.projection(true);
	await frames();
	expect(visual('outer-motion')).toBe(state);
	expect(state.projection).toBeDefined();
	screen.component.change();
	await expect.poll(() => state.getValue('x')!.get(), { timeout: 3000 }).toBe(0);
});

it('updates shared identity and projection mode while preserving the state VisualElement', async () => {
	const screen = render(ConfigLifecycle);
	await frames();
	const state = visual('outer-motion');
	const oldId = state.projection?.options.layoutId;
	screen.component.identity('second', 'position');
	await frames();
	expect(visual('outer-motion')).toBe(state);
	expect(state.projection?.options.layoutId).not.toBe(oldId);
	expect(state.projection?.options.layoutId).toContain('outer-second');
	expect(state.projection?.options.animationType).toBe('position');
});
