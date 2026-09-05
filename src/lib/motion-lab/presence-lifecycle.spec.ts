import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Fixture from './PresenceLifecycle.svelte';

for (const mode of ['wait', 'sync'] as const) {
	it(`${mode} renders its initial value on the server without completing an exit`, async () => {
		const complete = vi.fn();
		const output = render(Fixture, { props: { mode, onExitComplete: complete } });
		await Promise.resolve();
		expect(output.body).toContain('data-lifecycle="a"');
		expect(complete).not.toHaveBeenCalled();
	});
}
