import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import ConfigScopeHarness from './ConfigScopeHarness.svelte';

const frame = async () => {
	await tick();
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
const element = (name: string) => document.querySelector<HTMLElement>(`[data-testid="${name}"]`)!;
const visual = (name: string) => visualElementStore.get(element(name))!;

it('notifies only descendants and leaves unrelated state and plain layout bindings untouched', async () => {
	const reports: string[] = [];
	const screen = render(ConfigScopeHarness, { report: (name) => reports.push(name) });
	await frame();
	await frame();
	reports.length = 0;
	const stateSpies = ['outside', 'sibling'].map((name) =>
		vi.spyOn(visual(`${name}-motion`), 'update')
	);
	const layoutSpies = ['outside', 'sibling'].map((name) =>
		vi.spyOn(visual(`${name}-layout`).projection!, 'setOptions')
	);
	try {
		screen.component.changeTransition();
		await frame();
		expect(new Set(reports)).toEqual(new Set(['inside', 'nested', 'override']));
		for (const spy of [...stateSpies, ...layoutSpies]) expect(spy).not.toHaveBeenCalled();
		expect(visual('inside-motion').getProps().transition?.duration).toBe(2);
	} finally {
		for (const spy of [...stateSpies, ...layoutSpies]) spy.mockRestore();
	}
});

it('delivers ancestor policy changes through paused nested providers and respects retained overrides', async () => {
	const reports: string[] = [];
	const screen = render(ConfigScopeHarness, { report: (name) => reports.push(name) });
	await frame();
	const retained = element('nested-motion');
	const overridden = element('override-motion');
	screen.component.hide();
	await frame();
	expect(retained.isConnected).toBe(true);
	reports.length = 0;
	screen.component.reduce();
	await frame();
	expect(reports).toContain('nested');
	expect(reports).not.toContain('outside');
	expect(reports).not.toContain('sibling');
	expect(visual('nested-motion').shouldReduceMotion).toBe(true);
	await expect.poll(() => Number(getComputedStyle(retained).opacity), { timeout: 500 }).toBe(0);
	expect(overridden.isConnected).toBe(true);
	expect(visual('override-motion').shouldReduceMotion).toBe(false);
	// Svelte still owns the retention clock after Motion settles the visual pose.
	await expect.poll(() => retained.isConnected, { timeout: 1500 }).toBe(false);
	reports.length = 0;
	screen.component.changeTransition();
	await frame();
	expect(reports).not.toContain('nested');
});
