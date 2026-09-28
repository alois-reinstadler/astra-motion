import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import View from './ParityNextVerificationView.svelte';

const card = () => document.querySelector<HTMLElement>('[data-verification-view-card]');
const activity = () => document.querySelector<HTMLElement>('[data-verification-view-activity]');
const count = () => document.querySelector('[data-verification-view-count]')?.textContent;

it('composes managed Presence, retained Activity and named View without dropping exits or losing state', async () => {
	expect(typeof document.startViewTransition).toBe('function');
	const onView = vi.fn();
	const screen = render(View, { onView });
	await screen.getByRole('textbox', { name: 'Combined view draft' }).fill('Saved across captures');
	const original = card()!;
	const input = original.querySelector('input')!;
	const hidden = screen.component.hide();
	await hidden.updateCallbackDone;
	expect(activity()?.dataset.astraActivity).toBe('exiting');
	expect(card()).toBe(original);
	await hidden.finished;
	await expect.poll(() => activity()?.dataset.astraActivity).toBe('hidden');
	await screen.component.show().finished;
	expect(card()).toBe(original);
	expect(original.querySelector('input')).toBe(input);
	expect(input.value).toBe('Saved across captures');
	expect(original.style.viewTransitionName).toBe('authored-verification-card');
	expect(original.style.getPropertyPriority('view-transition-name')).toBe('important');
	const removed = screen.component.remove();
	await removed.updateCallbackDone;
	expect(card()).toBe(original);
	expect(activity()?.dataset.astraActivity).toBe('exiting');
	await removed.finished;
	await expect.poll(card).toBeNull();
	expect(onView.mock.calls.map(([type]) => type)).toEqual(['exit', 'enter', 'exit']);
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
});

it('releases native capture after a live reduced-motion change while applying the pending update once', async () => {
	expect(typeof document.startViewTransition).toBe('function');
	const onView = vi.fn();
	const { component } = render(View, { onView });
	await tick();
	const original = card()!;
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	const update = vi.fn(() => gate);
	const transition = component.update(update);
	try {
		await expect.poll(() => update.mock.calls.length).toBe(1);
		expect(document.querySelector('[data-astra-view-reset]')).not.toBeNull();
		flushSync(() => component.reduce());
		await expect(transition.ready).rejects.toMatchObject({ name: 'AbortError' });
		expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
		expect(original.style.viewTransitionName).toBe('authored-verification-card');
		expect(original.style.getPropertyPriority('view-transition-name')).toBe('important');
		expect(count()).toBe('0');
		release();
		await transition.updateCallbackDone;
		await expect(transition.finished).resolves.toBe('skipped');
		expect(count()).toBe('1');
		expect(update).toHaveBeenCalledTimes(1);
		expect(onView).not.toHaveBeenCalled();
		expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
	} finally {
		release();
		transition.cancel();
		await transition.finished;
	}
});
