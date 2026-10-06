import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Fixture from './LayoutStateFixture.svelte';
import { layoutStateHTML } from './layout-state-ssr.js';

it('publishes initialization writes synchronously during SSR without browser work', () => {
	const onRender = vi.fn();
	const onExitComplete = vi.fn();
	const microtask = vi.spyOn(globalThis, 'queueMicrotask');
	try {
		const output = render(Fixture, {
			props: { initializeCount: 7, mountWrite: true, onRender, onExitComplete }
		});
		expect(output.body).toContain('data-layout-state-count="">7</output>');
		expect(output.body).toContain('repeat(10, minmax(0, 1fr))');
		expect(output.body.match(/data-layout-state-item=/g)).toHaveLength(30);
		expect(microtask).not.toHaveBeenCalled();
		expect(onRender).not.toHaveBeenCalled();
		expect(onExitComplete).not.toHaveBeenCalled();
	} finally {
		microtask.mockRestore();
	}
});

it('renders initialization geometry and membership for the hydration fixture', () => {
	const { body } = render(Fixture, { props: { initializeScene: true } });
	expect(body).toBe(layoutStateHTML);
	expect(body.match(/data-layout-state-item=/g)).toHaveLength(28);
});
