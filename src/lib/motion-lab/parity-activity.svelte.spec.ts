import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './ParityActivity.svelte';

const host = () => document.querySelector<HTMLElement>('[data-activity-host]')!;
const input = () => document.querySelector<HTMLInputElement>('[aria-label="activity-input"]')!;

it('retains input and DOM state, finishes exits before hiding and suspends only activity-aware effects', async () => {
	const setup = vi.fn();
	const cleanup = vi.fn();
	const ordinary = vi.fn();
	const complete = vi.fn();
	const { component } = render(Fixture, {
		onSetup: setup,
		onCleanup: cleanup,
		onOrdinary: ordinary,
		onExitComplete: complete
	});
	await tick();
	const original = input();
	original.value = 'retained draft';
	expect(setup).toHaveBeenCalledTimes(1);
	flushSync(() => component.hide());
	expect(host().dataset.astraActivity).toBe('exiting');
	expect(getComputedStyle(host()).display).not.toBe('none');
	expect(host().inert).toBe(true);
	expect(cleanup).not.toHaveBeenCalled();
	await expect.poll(() => host().dataset.astraActivity).toBe('hidden');
	expect(getComputedStyle(host()).display).toBe('none');
	expect(cleanup).toHaveBeenCalledTimes(1);
	expect(complete).toHaveBeenCalledTimes(1);
	const ordinaryCalls = ordinary.mock.calls.length;
	flushSync(() => component.update());
	expect(ordinary).toHaveBeenCalledTimes(ordinaryCalls + 1);
	expect(setup).toHaveBeenCalledTimes(1);
	flushSync(() => component.show());
	expect(input()).toBe(original);
	expect(input().value).toBe('retained draft');
	expect(host().inert).toBe(false);
	expect(setup).toHaveBeenCalledTimes(2);
});

it('does not start activity-aware work while initially hidden and starts once on reveal', async () => {
	const setup = vi.fn();
	const cleanup = vi.fn();
	const { component, unmount } = render(Fixture, {
		initialMode: 'hidden',
		onSetup: setup,
		onCleanup: cleanup
	});
	await tick();
	expect(getComputedStyle(host()).display).toBe('none');
	expect(input()).not.toBeNull();
	expect(setup).not.toHaveBeenCalled();
	flushSync(() => component.show());
	expect(setup).toHaveBeenCalledTimes(1);
	await unmount();
	expect(cleanup).toHaveBeenCalledTimes(1);
});

it('cancels a hide on re-entry without clearing state, stopping effects or reporting completion', async () => {
	const setup = vi.fn();
	const cleanup = vi.fn();
	const complete = vi.fn();
	const { component } = render(Fixture, {
		onSetup: setup,
		onCleanup: cleanup,
		onExitComplete: complete
	});
	await tick();
	const original = input();
	flushSync(() => component.hide());
	flushSync(() => component.show());
	await new Promise<void>((resolve) => setTimeout(resolve, 80));
	expect(input()).toBe(original);
	expect(host().dataset.astraActivity).toBe('visible');
	expect(cleanup).not.toHaveBeenCalled();
	expect(setup).toHaveBeenCalledTimes(1);
	expect(complete).not.toHaveBeenCalled();
});
