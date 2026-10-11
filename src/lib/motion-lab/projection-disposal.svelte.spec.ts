import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync, tick } from 'svelte';
import Fixture from './UpstreamSharedLayoutExpanded.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const settle = async () => {
	await tick();
	await frame();
	await frame();
};

it('does not read destroyed reactive policy during shared exit reconciliation or teardown', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const report = vi.fn();
	const view = render(Fixture, { scenario: 'translation', duration: 0.08, report });
	let unmounted = false;
	try {
		await settle();
		for (const id of [1, 0, 1]) {
			flushSync(() => view.component.select(id));
			await expect
				.poll(() => report.mock.calls.map(([event]) => event))
				.toContain(`complete:${id}`);
			await expect.poll(() => document.querySelector(`[data-shared-box="${1 - id}"]`)).toBeNull();
			expect(document.querySelector(`[data-shared-box="${id}"]`)).not.toBeNull();
			report.mockClear();
		}
		await view.unmount();
		unmounted = true;
		await settle();
		expect(
			warn.mock.calls.filter((args) =>
				args.some((value) => String(value).includes('derived_inert'))
			)
		).toEqual([]);
	} finally {
		if (!unmounted) await view.unmount();
		warn.mockRestore();
	}
});
