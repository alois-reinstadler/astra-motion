// Motion v13.4.4, 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Source mapping and attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamSharedLayoutExpanded.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const ready = async () => {
	await tick();
	await frame();
	await frame();
};
const box = (id: number) => document.querySelector<HTMLElement>(`[data-shared-box="${id}"]`)!;
const rect = (id: number) => box(id).getBoundingClientRect();
const near = (actual: number, expected: number) =>
	expect(Math.abs(actual - expected)).toBeLessThan(1);
const left = async (id: number, value: number) =>
	expect.poll(() => Math.abs(rect(id).left - value), { interval: 5 }).toBeLessThan(1);

// Upstream has replacement true/position/size cases and retained true/position cases.
for (const topology of ['replace', 'retain'] as const)
	for (const mode of (topology === 'replace' ? [true, 'position', 'size'] : [true, 'position']) as (
		true | 'position' | 'size'
	)[])
		it(`layout-shared-mode-matrix: ${topology} ${mode} measures both directions and retained source geometry`, async () => {
			const report = vi.fn();
			const view = render(Fixture, { mode, topology, report });
			await ready();
			const before = rect(0);
			flushSync(() => view.component.select(1));
			if (mode === 'size') await expect.poll(() => Math.abs(rect(1).width - 200)).toBeLessThan(1);
			else await left(1, before.left + 100);
			const during = rect(1);
			near(during.left - before.left, mode === 'size' ? 200 : 100);
			near(during.top - before.top, mode === 'size' ? 100 : 50);
			near(during.width, mode === 'position' ? 300 : 200);
			near(during.height, mode === 'position' ? 300 : 250);
			if (topology === 'retain') {
				const source = rect(0);
				near(source.left - before.left, 100);
				near(source.top - before.top, 50);
				near(source.width, mode === 'position' ? 100 : 200);
				near(source.height, mode === 'position' ? 200 : 250);
				expect(Number(getComputedStyle(box(0)).opacity)).toBe(1);
				expect(Number(getComputedStyle(box(1)).opacity)).toBe(1);
			}
			await expect.poll(() => report.mock.calls.map(([event]) => event)).toContain('complete:1');
			near(rect(1).left - before.left, 200);
			near(rect(1).top - before.top, 100);
			near(rect(1).width, 300);
			near(rect(1).height, 300);
			const forward = report.mock.calls.map(([event]) => event);
			expect(forward.indexOf('start:1')).toBeGreaterThanOrEqual(0);
			expect(forward.indexOf('complete:1')).toBeGreaterThan(forward.indexOf('start:1'));
			report.mockClear();
			flushSync(() => view.component.select(0));
			if (mode === 'size') await expect.poll(() => Math.abs(rect(0).width - 200)).toBeLessThan(1);
			else await left(0, before.left + 100);
			const reverse = rect(0);
			near(reverse.left - before.left, mode === 'size' ? 0 : 100);
			near(reverse.top - before.top, mode === 'size' ? 0 : 50);
			near(reverse.width, mode === 'position' ? 100 : 200);
			near(reverse.height, mode === 'position' ? 200 : 250);
			await expect.poll(() => report.mock.calls.map(([event]) => event)).toContain('complete:0');
			near(rect(0).left, before.left);
			near(rect(0).top, before.top);
			near(rect(0).width, 100);
			near(rect(0).height, 200);
			const backward = report.mock.calls.map(([event]) => event);
			expect(backward.indexOf('start:0')).toBeGreaterThanOrEqual(0);
			expect(backward.indexOf('complete:0')).toBeGreaterThan(backward.indexOf('start:0'));
			expect(backward.filter((event) => event === 'start:0')).toHaveLength(1);
			expect(backward.filter((event) => event === 'complete:0')).toHaveLength(1);
		});
it('layout-shared-presence-retention: repeated shared exits remain mounted through crossfade', async () => {
	const view = render(Fixture, { scenario: 'presence-retention' });
	await ready();
	const origin = rect(0).left;
	for (const id of [1, 0, 1]) {
		const source = box(1 - id);
		flushSync(() => view.component.select(id));
		await left(id, origin + 100);
		expect(source.isConnected).toBe(true);
		expect(Number(getComputedStyle(source).opacity)).toBeGreaterThan(0);
		await left(id, origin + id * 200);
		await expect.poll(() => source.isConnected).toBe(false);
	}
});
it('layout-shared-presence-retention: detaching only the outgoing layout binding releases its exit without interrupting the lead', async () => {
	const report = vi.fn();
	const view = render(Fixture, { scenario: 'presence-detach', duration: 1.2, report });
	await ready();
	const source = box(0);
	const origin = source.getBoundingClientRect().left;
	flushSync(() => view.component.select(1));
	await left(1, origin + 100);
	const lead = box(1);
	expect(source.isConnected).toBe(true);
	expect(report.mock.calls.map(([event]) => event)).not.toContain('exit:0');
	flushSync(() => view.component.detachLayout(0));
	expect(source.dataset.sharedLayout).toBe('false');
	expect(lead.dataset.sharedLayout).toBe('true');
	expect(source.isConnected).toBe(true);
	await expect.poll(() => source.isConnected, { timeout: 900 }).toBe(false);
	const events = report.mock.calls.map(([event]) => event);
	expect(events.filter((event) => event === 'exit:0')).toHaveLength(1);
	expect(events.filter((event) => event === 'presence-complete')).toHaveLength(1);
	expect(events).not.toContain('complete:1');
	expect(box(1)).toBe(lead);
	near(rect(1).left, origin + 100);
	await expect
		.poll(() => report.mock.calls.map(([event]) => event), { timeout: 2000 })
		.toContain('complete:1');
	near(rect(1).left, origin + 200);
	near(rect(1).width, 300);
	expect(report.mock.calls.filter(([event]) => event === 'start:1')).toHaveLength(1);
	expect(report.mock.calls.filter(([event]) => event === 'complete:1')).toHaveLength(1);
});
for (const scenario of ['translation', 'percentage'])
	it(`layout-parent-translations: ${scenario} parent is included once in shared geometry`, async () => {
		const view = render(Fixture, { scenario });
		await ready();
		const source = rect(0),
			parent = document.querySelector<HTMLElement>('[data-shared-parent]')!.getBoundingClientRect();
		near(source.left, parent.left);
		near(source.top, parent.top);
		flushSync(() => view.component.select(1));
		await left(1, source.left + 100);
		near(rect(1).top - source.top, 50);
		await left(1, source.left + 200);
	});
it('layout-fragment-origin: wrapperless shared destination measures source position rather than page origin', async () => {
	const view = render(Fixture, { scenario: 'fragment' });
	await ready();
	const before = rect(0);
	flushSync(() => view.component.select(1));
	await expect.poll(() => Math.abs(rect(1).top - before.top - 100)).toBeLessThan(1);
	await expect.poll(() => Math.abs(rect(1).top - before.top - 200)).toBeLessThan(1);
});
it('layout-transform-origin-read: removing scale after shared replacement restores authored base', async () => {
	const view = render(Fixture, { scenario: 'scale-read', duration: 0.15 });
	await ready();
	flushSync(() => view.component.select(1));
	await expect.poll(() => rect(1).width).toBeCloseTo(600, 0);
	flushSync(() => view.component.update());
	await expect.poll(() => rect(1).width).toBeCloseTo(300, 0);
	await expect.poll(() => rect(1).height).toBeCloseTo(300, 0);
});
it('layout-shared-transform-template: centered template survives reversal during active shared projection', async () => {
	const report = vi.fn();
	const view = render(Fixture, { scenario: 'template', report });
	await ready();
	const parent = document
		.querySelector<HTMLElement>('[data-shared-parent]')!
		.getBoundingClientRect();
	// Authored 50% positioning and translate(-50%,-50%) center a 100x200 source
	// in a 500x500 parent. Removing the template must fail this independent oracle.
	near(rect(0).left, parent.left + 200);
	near(rect(0).top, parent.top + 150);
	flushSync(() => view.component.select(1));
	await left(1, parent.left + 150);
	near(rect(1).top, parent.top + 125);
	near(rect(1).width, 200);
	near(rect(1).height, 250);
	expect(report.mock.calls.map(([event]) => event)).not.toContain('complete:1');
	flushSync(() => view.component.select(0));
	await left(0, parent.left + 175);
	near(rect(0).top, parent.top + 137.5);
	near(rect(0).width, 150);
	near(rect(0).height, 225);
	await left(0, parent.left + 200);
	near(rect(0).top, parent.top + 150);
	near(rect(0).width, 100);
	near(rect(0).height, 200);
});
for (const scenario of ['matrix', 'same-aspect', 'same-position'])
	it(`layout-preserve-aspect-matrix: ${scenario} uses aspect-aware geometry`, async () => {
		const view = render(Fixture, { scenario, mode: 'preserve-aspect', topology: 'retain' });
		await ready();
		const before = rect(0);
		flushSync(() => view.component.select(1));
		if (scenario === 'same-position') {
			await ready();
			near(rect(1).left, before.left);
			near(rect(1).top, before.top);
			near(rect(1).width, 300);
			near(rect(1).height, 300);
		} else {
			await left(1, before.left + 100);
			near(rect(1).width, scenario === 'same-aspect' ? 200 : 300);
			near(rect(1).height, scenario === 'same-aspect' ? 400 : 300);
			await left(1, before.left + 200);
		}
		const final = rect(1);
		flushSync(() => view.component.update());
		await ready();
		near(rect(1).left, final.left);
		near(rect(1).width, final.width);
	});
it('layout-after-instant-shared: a normal reverse animates after instant promotion', async () => {
	const view = render(Fixture, { topology: 'retain' });
	await ready();
	const before = rect(0);
	flushSync(() => {
		view.component.setInstant(true);
		view.component.select(1);
	});
	await left(1, before.left + 200);
	flushSync(() => {
		view.component.setInstant(false);
		view.component.select(0);
	});
	await left(0, before.left + 100);
	await left(0, before.left);
});
it('layout-empty-shared-cycle: empty and replacement cycles have fresh origins and remove obsolete nodes', async () => {
	const view = render(Fixture, { scenario: 'empty' });
	await ready();
	expect(box(0)).toBeNull();
	flushSync(() => view.component.select(0));
	await ready();
	const before = rect(0);
	flushSync(() => view.component.select(1));
	await left(1, before.left + 100);
	flushSync(() => view.component.select(0));
	await left(0, before.left);
	await expect.poll(() => box(1)).toBeNull();
	flushSync(() => view.component.select(-1));
	await expect.poll(() => box(0)).toBeNull();
	flushSync(() => view.component.select(1));
	await ready();
	near(rect(1).left, before.left + 200);
	near(rect(1).width, 300);
});
for (const scenario of ['nested', 'contents'])
	it(`layout-nested-shared: ${scenario} children avoid inherited scaling`, async () => {
		const view = render(Fixture, { scenario });
		await ready();
		const before = rect(0);
		flushSync(() => view.component.select(1));
		await left(1, before.left + 100);
		const child = document
			.querySelector<HTMLElement>('[data-shared-child="1"]')!
			.getBoundingClientRect();
		near(child.width, 50);
		near(child.height, 50);
		near(child.left, rect(1).left);
		near(child.top, rect(1).top);
		await left(1, before.left + 200);
		flushSync(() => view.component.select(0));
		await left(0, before.left);
		near(
			document.querySelector<HTMLElement>('[data-shared-child="0"]')!.getBoundingClientRect().width,
			50
		);
	});
for (const duration of [0, 0.05])
	it(`layout-lightbox-crossfade: nested shared lightbox settles at duration ${duration}`, async () => {
		const view = render(Fixture, { scenario: 'lightbox', topology: 'retain', duration });
		await ready();
		const before = rect(0);
		flushSync(() => view.component.select(1));
		await left(1, before.left + 200);
		near(rect(1).width, 300);
		near(rect(1).height, 300);
		expect(Number(getComputedStyle(box(1)).opacity)).toBeCloseTo(0.8);
		expect(getComputedStyle(box(1)).borderRadius).toBe('0px');
		expect(Number(getComputedStyle(box(0)).opacity)).toBe(0);
		const child = document.querySelector<HTMLElement>('[data-shared-child="1"]')!;
		near(child.getBoundingClientRect().width, 50);
		expect(Number(getComputedStyle(child).opacity)).toBeCloseTo(0.5);
		expect(getComputedStyle(child).borderRadius).toBe('25px');
		flushSync(() => view.component.select(0));
		await left(0, before.left);
		await expect.poll(() => box(1)).toBeNull();
		near(rect(0).width, 100);
		expect(Number(getComputedStyle(box(0)).opacity)).toBeCloseTo(0.8);
	});
for (const scenario of ['matrix', 'persistent-sibling'])
	it(`layout-clear-shared-snapshot: ${scenario} remount has no stale source`, async () => {
		const view = render(Fixture, { scenario });
		await ready();
		const before = rect(0);
		flushSync(() => view.component.remove());
		await expect.poll(() => box(0)).toBeNull();
		await ready();
		flushSync(() => view.component.mount(1));
		await ready();
		near(rect(1).left, before.left + 200);
		near(rect(1).top, before.top + 100);
		near(rect(1).width, 300);
	});
it('layout-follower-pointer-events: only the lead is interactive during shared promotion', async () => {
	const view = render(Fixture, { topology: 'retain' });
	await ready();
	const before = rect(0);
	flushSync(() => view.component.select(1));
	await left(1, before.left + 100);
	expect(getComputedStyle(box(0)).pointerEvents).toBe('none');
	expect(getComputedStyle(box(1)).pointerEvents).not.toBe('none');
	await left(1, before.left + 200);
	flushSync(() => view.component.select(0));
	await left(0, before.left);
	expect(getComputedStyle(box(0)).pointerEvents).not.toBe('none');
});
it('layout-shared-rotation: rotated shared destinations settle correctly across two switches', async () => {
	const view = render(Fixture, { scenario: 'rotate', duration: 0.2 });
	await ready();
	const first = rect(0);
	flushSync(() => view.component.select(1));
	const expected = 300 * (Math.cos((20 * Math.PI) / 180) + Math.sin((20 * Math.PI) / 180));
	await expect.poll(() => rect(1).width).toBeCloseTo(expected, 0);
	flushSync(() => view.component.select(0));
	await expect.poll(() => rect(0).width).toBeCloseTo(first.width, 0);
	near(rect(0).left, first.left);
	near(rect(0).top, first.top);
});
it('layout-shared-border-radius: shared source and destination interpolate the same nonzero radius', async () => {
	const view = render(Fixture, { scenario: 'radius', topology: 'retain' });
	await ready();
	const before = rect(0);
	flushSync(() => view.component.select(1));
	await left(1, before.left + 100);
	const a = getComputedStyle(box(0)).borderRadius,
		b = getComputedStyle(box(1)).borderRadius;
	expect(parseFloat(a)).toBeGreaterThan(0);
	expect(a).toBe(b);
	await left(1, before.left + 200);
	expect(getComputedStyle(box(1)).borderRadius).toBe('40px');
});
it('layout-crossfade-disabled: shared destination remains opaque in both directions', async () => {
	const view = render(Fixture, { crossfade: false });
	await ready();
	const before = rect(0);
	for (const id of [1, 0]) {
		flushSync(() => view.component.select(id));
		await left(id, before.left + 100);
		expect(Number(getComputedStyle(box(id)).opacity)).toBe(1);
		await left(id, before.left + id * 200);
	}
});
it('layout-dependency-exits: unchanged shared dependency blocks projection until invalidated', async () => {
	const report = vi.fn();
	const view = render(Fixture, { scenario: 'dependency', report });
	await ready();
	const before = rect(0);
	flushSync(() => view.component.select(1));
	await ready();
	near(rect(1).left, before.left + 200);
	expect(report).not.toHaveBeenCalled();
	flushSync(() => view.component.unlock());
	await left(1, before.left + 300);
	await left(1, before.left + 400);
	expect(report.mock.calls.map(([event]) => event)).toEqual(['start:1', 'complete:1']);
});
for (const namespace of [
	'named',
	'unnamed-parent',
	'unnamed-child',
	'different',
	'inherit-false',
	'inherit-id',
	'separate-parents',
	'unnamed-bridge',
	'direct'
])
	it(`layout-group-namespaces: ${namespace} distinguishes matching effective namespaces`, async () => {
		const view = render(Fixture, { scenario: 'namespace', namespace });
		await ready();
		const source = document
			.querySelector<HTMLElement>('[data-namespace-box="source"]')!
			.getBoundingClientRect();
		flushSync(() => view.component.select(1));
		const dest = () =>
			document
				.querySelector<HTMLElement>('[data-namespace-box="destination"]')!
				.getBoundingClientRect();
		if (namespace === 'different' || namespace === 'separate-parents') {
			await ready();
			near(dest().left, source.left + 200);
		} else await expect.poll(() => Math.abs(dest().left - source.left - 100)).toBeLessThan(1);
		await expect.poll(() => Math.abs(dest().left - source.left - 200)).toBeLessThan(1);
	});
