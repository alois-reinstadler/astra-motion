import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Presence from './ParityPresence.svelte';
import Nested from './ParityPresenceNested.svelte';
import Activity from './ParityActivity.svelte';

it('renders keyed presence content without scheduling an exit during SSR', async () => {
	const complete = vi.fn();
	const output = render(Presence, {
		props: { initialItems: ['a', 'b'], onExitComplete: complete }
	});
	await Promise.resolve();
	expect(output.body).toContain('data-presence-item="a"');
	expect(output.body).toContain('data-presence-item="b"');
	expect(output.body).toContain('data-present="">true');
	expect(complete).not.toHaveBeenCalled();
});

it('renders nested propagation boundaries without registering browser work on the server', () => {
	const exit = vi.fn();
	const output = render(Nested, { props: { propagate: true, onExit: exit } });
	expect(output.body).toContain('data-presence-item="outer"');
	expect(output.body).toContain('data-presence-item="inner"');
	expect(exit).not.toHaveBeenCalled();
});

it('renders retained Activity content hidden initially and never runs effects on the server', async () => {
	const setup = vi.fn();
	const cleanup = vi.fn();
	const ordinary = vi.fn();
	const complete = vi.fn();
	const output = render(Activity, {
		props: {
			initialMode: 'hidden',
			onSetup: setup,
			onCleanup: cleanup,
			onOrdinary: ordinary,
			onExitComplete: complete
		}
	});
	await Promise.resolve();
	expect(output.body).toContain('display:none');
	expect(output.body).toContain('data-astra-activity="hidden"');
	expect(output.body).toContain('aria-label="activity-input"');
	expect(setup).not.toHaveBeenCalled();
	expect(cleanup).not.toHaveBeenCalled();
	expect(ordinary).not.toHaveBeenCalled();
	expect(complete).not.toHaveBeenCalled();
});
