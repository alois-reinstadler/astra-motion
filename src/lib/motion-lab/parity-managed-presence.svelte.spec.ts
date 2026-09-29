import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './ParityManagedPresence.svelte';
const item = (id = 'a') => document.querySelector<HTMLElement>(`[data-managed-item="${id}"]`);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

it('waits for descendant motion exits and emits one completion without a second native outro', async () => {
	const completions: string[] = [];
	const retained: { phase: string; connected: boolean; sameNode: boolean }[] = [];
	const recordAnimationCompletion = (phase: string) => {
		completions.push(phase);
		retained.push({ phase, connected: original.isConnected, sameNode: item() === original });
	};
	const complete = vi.fn(() => completions.push('presence'));
	const end = vi.fn((definition: unknown) => {
		if (definition === 'leave') recordAnimationCompletion('parent');
	});
	const descendantEnd = vi.fn((definition: unknown) => {
		if (
			definition &&
			typeof definition === 'object' &&
			'opacity' in definition &&
			definition.opacity === 0
		) {
			recordAnimationCompletion('descendant');
		}
	});
	const { component } = render(Fixture, {
		onComplete: complete,
		onAnimationComplete: end,
		onDescendantAnimationComplete: descendantEnd
	});
	await expect.poll(() => item()?.style.opacity).toBe('1');
	const original = item()!;
	flushSync(() => component.hide());
	expect(original.isConnected).toBe(true);
	await expect.poll(() => original.isConnected).toBe(false);
	// Capture retention in the completion callbacks themselves: a delayed test
	// continuation can legitimately run after both finite exits have finished.
	expect(retained).toHaveLength(2);
	expect(retained).toEqual(
		expect.arrayContaining([
			{ phase: 'parent', connected: true, sameNode: true },
			{ phase: 'descendant', connected: true, sameNode: true }
		])
	);
	expect(completions.slice(0, 2).sort()).toEqual(['descendant', 'parent']);
	expect(completions[2]).toBe('presence');
	expect(complete).toHaveBeenCalledTimes(1);
	expect(end.mock.calls.filter(([definition]) => definition === 'leave')).toHaveLength(1);
});

it('uses current boundary custom data for exits and suppresses stale completion on reversal', async () => {
	const complete = vi.fn();
	const updates: number[] = [];
	const { component } = render(Fixture, {
		onComplete: complete,
		onUpdate: (values) => {
			if (typeof values.x === 'number') updates.push(values.x);
		}
	});
	await expect.poll(() => item()?.style.opacity).toBe('1');
	const original = item();
	flushSync(() => {
		component.setCustom(-1);
		component.hide();
	});
	await expect.poll(() => updates.some((x) => x < -1)).toBe(true);
	flushSync(() => component.show());
	await expect.poll(() => item()?.style.opacity).toBe('1');
	expect(item()).toBe(original);
	expect(complete).not.toHaveBeenCalled();
	flushSync(() => component.hide());
	await expect.poll(() => item()).toBeNull();
	expect(complete).toHaveBeenCalledTimes(1);
});

it('suppresses only initial entry and waits before mounting the latest keyed replacement', async () => {
	const { component } = render(Fixture, { initial: false, mode: 'wait' });
	await tick();
	expect(item()?.style.opacity).toBe('1');
	flushSync(() => component.select('b'));
	expect(item()).not.toBeNull();
	expect(item('b')).toBeNull();
	flushSync(() => component.select('c'));
	await expect.poll(() => item('c')).not.toBeNull();
	expect(item()).toBeNull();
	expect(item('b')).toBeNull();
	await expect.poll(() => item('c')?.style.opacity).toBe('1');
});

it('retains activity DOM and pauses repeated motion after exit, then restores playback', async () => {
	const updates = vi.fn();
	const complete = vi.fn();
	const { component } = render(Fixture, {
		activity: true,
		onUpdate: updates,
		onComplete: complete
	});
	await expect.poll(() => item('activity')?.style.opacity).toBe('1');
	const original = item('activity')!;
	const input = original.querySelector('input')!;
	input.value = 'draft';
	flushSync(() => component.hide());
	await expect
		.poll(
			() => document.querySelector<HTMLElement>('[data-managed-activity]')?.dataset.astraActivity
		)
		.toBe('hidden');
	await sleep(32);
	const count = updates.mock.calls.length;
	const transform = original.style.transform;
	await sleep(70);
	expect(updates).toHaveBeenCalledTimes(count);
	expect(original.style.transform).toBe(transform);
	expect(complete).toHaveBeenCalledTimes(1);
	flushSync(() => component.show());
	expect(item('activity')).toBe(original);
	expect(input.value).toBe('draft');
	await expect.poll(() => original.style.opacity).toBe('1');
	await expect.poll(() => original.style.transform).not.toBe(transform);
});

it('does not run motion frames in an initially hidden activity', async () => {
	const updates = vi.fn();
	const { component } = render(Fixture, {
		activity: true,
		initiallyHidden: true,
		onUpdate: updates
	});
	await tick();
	await sleep(50);
	expect(updates).not.toHaveBeenCalled();
	flushSync(() => component.show());
	await expect.poll(() => updates.mock.calls.length).toBeGreaterThan(0);
});

it('allows later descendants under an unchanged initial=false record to animate their entrance', async () => {
	const { component } = render(Fixture, { initial: false });
	await tick();
	await sleep(20);
	expect(item()?.style.opacity).toBe('1');
	flushSync(() => component.addDescendant());
	const later = document.querySelector<HTMLElement>('[data-later-descendant]')!;
	expect(later.style.opacity).toBe('0');
	await expect.poll(() => later.style.opacity).toBe('1');
});
