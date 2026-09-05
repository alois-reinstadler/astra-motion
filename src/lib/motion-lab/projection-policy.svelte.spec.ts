import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync, tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';
import { layoutBridge } from '../motion/commit.js';
import ProjectionPolicy from './ProjectionPolicy.svelte';

const frame = async () => {
	await tick();
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

it('updates transition policy without reattachment, resetting values, or interrupting projection', async () => {
	const screen = render(ProjectionPolicy);
	await frame();
	await frame();
	const node = screen.getByTestId('projection-policy').element();
	const visual = visualElementStore.get(node)!;
	const projection = visual.projection!;
	screen.component.move();
	await frame();
	const active = projection.currentAnimation!;
	expect(active).toBeDefined();
	active.pause();
	active.time = 0.25;
	visual.getValue('rotate', 0).set(35);
	flushSync(() => screen.component.setDuration(0.2));
	await frame();
	expect(screen.component.counts()).toEqual({ creates: 1, attaches: 1, releases: 0 });
	expect(visual.projection).toBe(projection);
	expect(projection.currentAnimation).toBe(active);
	expect(visual.getValue('rotate')!.get()).toBe(35);
	expect(projection.options.transition?.duration).toBe(0.2);
	active.complete();
	await frame();
	screen.component.move();
	await frame();
	expect(projection.currentAnimation).toBeDefined();
	expect(projection.currentAnimation!.duration).toBeCloseTo(0.2);
});

it('keeps reduced-motion and automatic policy live without reattaching', async () => {
	const screen = render(ProjectionPolicy);
	await frame();
	await frame();
	const node = screen.getByTestId('projection-policy').element();
	const visual = visualElementStore.get(node)!;
	const projection = visual.projection!;
	flushSync(() => screen.component.setAutomatic(true));
	await frame();
	await frame();
	screen.component.move(false);
	await expect.poll(() => Boolean(projection.currentAnimation)).toBe(true);
	flushSync(() => screen.component.reduce());
	await frame();
	expect(visual.shouldReduceMotion).toBe(true);
	expect(projection.options.transition?.duration).toBe(0);
	expect(projection.currentAnimation).toBeUndefined();
	expect(screen.component.counts()).toEqual({ creates: 1, attaches: 1, releases: 0 });
});

it('creates a default layout controller only when needed and reuses it when re-enabled', async () => {
	const screen = render(ProjectionPolicy, { enabled: false });
	await frame();
	expect(screen.component.counts()).toEqual({ creates: 0, attaches: 0, releases: 0 });
	flushSync(() => screen.component.setLayout(true));
	await frame();
	expect(screen.component.counts()).toEqual({ creates: 1, attaches: 1, releases: 0 });
	flushSync(() => screen.component.setLayout(false));
	await frame();
	flushSync(() => screen.component.setLayout(true));
	await frame();
	expect(screen.component.counts()).toEqual({ creates: 1, attaches: 2, releases: 1 });
});

it('does not create unused default controllers for bindings with an explicit layout group', async () => {
	const screen = render(ProjectionPolicy, { shared: true });
	await frame();
	expect(screen.component.counts()).toEqual({ creates: 0, attaches: 0, releases: 0 });
	expect(
		visualElementStore.get(screen.getByTestId('projection-policy').element())!.projection
	).toBeDefined();
});

it('installs stable global layout bridge callbacks across controllers', () => {
	createLayout();
	const { update, schedule } = layoutBridge;
	createLayout();
	expect(layoutBridge.update).toBe(update);
	expect(layoutBridge.schedule).toBe(schedule);
});
