// Motion 13.4.4 @ 33f6e72; source mappings and MIT notices: tests/motion-baseline.
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamViewportExpanded.svelte';
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const node = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
it('viewport-remount: remount activates fresh visible nodes and calls entry once each', async () => {
	const report = vi.fn();
	const view = render(Fixture, { report });
	await expect.poll(() => report.mock.calls.length).toBe(1);
	await expect.poll(() => getComputedStyle(node('target')).opacity).toBe('1');
	const first = node('target');
	view.component.toggle();
	await tick();
	await expect.poll(() => first.isConnected).toBe(false);
	view.component.toggle();
	await tick();
	await expect.poll(() => report.mock.calls.length).toBe(2);
	expect(node('target')).not.toBe(first);
	await expect.poll(() => getComputedStyle(node('target')).opacity).toBe('1');
	expect(report.mock.calls).toEqual([['enter'], ['enter']]);
});
it('viewport-threshold-margin: amount=all waits for full intersection', async () => {
	const report = vi.fn();
	render(Fixture, { all: true, report });
	await tick();
	await frame();
	await frame();
	expect(getComputedStyle(node('target')).opacity).toBe('0.2');
	expect(report).not.toHaveBeenCalled();
	node('root').scrollTop = 75;
	await expect.poll(() => getComputedStyle(node('target')).opacity).toBe('1');
	expect(report.mock.calls).toEqual([['enter']]);
});
it('viewport-threshold-margin: expanded root margin activates before ordinary intersection', async () => {
	const report = vi.fn();
	render(Fixture, { margin: '100px', report });
	await tick();
	node('root').scrollTop = 300;
	await expect.poll(() => getComputedStyle(node('target')).opacity).toBe('1');
	expect(node('target').getBoundingClientRect().bottom).toBeLessThan(
		node('root').getBoundingClientRect().top
	);
	expect(report.mock.calls.map(([name]) => name)).toContain('enter');
});
