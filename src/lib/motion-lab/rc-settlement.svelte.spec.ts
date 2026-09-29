import { flushSync } from 'svelte';
import { expect, it, vi } from 'vitest';
import {
	arc,
	JSAnimation,
	frame as motionFrame,
	frameSteps,
	styleSubjectEffect,
	type AnimationPlaybackControls
} from 'motion-dom';
import { render } from 'vitest-browser-svelte';
import { animate as externalAnimate, motionValue } from 'motion';
import Fixture from './RCSettlement.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
it.each(['stopped', 'cancelled', 'replaced', 'detached'] as const)(
	'settles %s once without completing upstream finished',
	async (reason) => {
		const { component } = render(Fixture);
		const { scope, animate } = component.api();
		const run = animate('[data-rc-settlement]', { opacity: 0.2 }, { duration: 10 });
		const promise = run.settled;
		let finished = false;
		void run.finished.then(() => {
			finished = true;
		});
		await frame();
		if (reason === 'stopped') run.stop();
		if (reason === 'cancelled') run.cancel();
		if (reason === 'replaced')
			animate('[data-rc-settlement]', { opacity: 0.7 }, { duration: 0.01 });
		if (reason === 'detached') flushSync(() => component.detach());
		expect(await promise).toEqual({ status: 'cancelled', reason });
		expect(run.settled).toBe(promise);
		expect(await promise).toEqual(await run.settled);
		expect(finished).toBe(false);
		scope.stop();
	}
);
it('retains pending settlement through pause and renews it only after completed replay', async () => {
	const { component } = render(Fixture);
	const { animate } = component.api();
	const run = animate(0, 1, { duration: 0.1 });
	const first = run.settled;
	run.pause();
	let settled = false;
	void first.then(() => {
		settled = true;
	});
	await frame();
	expect(settled).toBe(false);
	run.play();
	expect(run.settled).toBe(first);
	expect(await first).toEqual({ status: 'finished' });
	run.play();
	expect(run.settled).not.toBe(first);
	run.stop();
	expect(await run.settled).toEqual({ status: 'cancelled', reason: 'stopped' });
});
it('settles replaced sequences and leaves external replacement owned by its original caller on teardown', async () => {
	const { component, unmount } = render(Fixture);
	const { animate, value } = component.api();
	const sequence = animate([
		[value, 100, { duration: 1 }],
		['[data-rc-second]', { opacity: 0.4 }, { duration: 1 }]
	]);
	await frame();
	const replacement = externalAnimate(value, 200, { duration: 0.15 });
	expect(await sequence.settled).toEqual({ status: 'cancelled', reason: 'replaced' });
	await unmount();
	await replacement;
	expect(value.get()).toBe(200);
});
it('owner unmount resolves a paused run and no-target run completes', async () => {
	const { component, unmount } = render(Fixture);
	const { animate } = component.api();
	const empty = animate([] as Element[], { opacity: 0 });
	expect(await empty.settled).toEqual({ status: 'finished' });
	const run = animate(0, 100, { duration: 10 });
	run.pause();
	await unmount();
	expect(await run.settled).toEqual({ status: 'cancelled', reason: 'detached' });
});

it('preserves completed settlement while seeking reacquires playback ownership', async () => {
	const { component } = render(Fixture);
	const { scope, animate } = component.api();
	const run = animate(0, 100, { duration: 1 });
	const disconnect = run.attachTimeline({ observe: () => () => {} });
	run.complete();
	expect(await run.settled).toEqual({ status: 'cancelled', reason: 'cancelled' });
	expect(scope.active).toBe(0);
	disconnect();
	const replayedValue = motionValue(0);
	const finished = animate(replayedValue, 1, { duration: 0.1 });
	const original = finished.settled;
	await original;
	finished.pause();
	expect(finished.settled).toBe(original);
	expect(await finished.settled).toEqual({ status: 'finished' });
	expect(scope.active).toBe(0);
	finished.time = 0;
	finished.speed = 0.5;
	expect(finished.settled).toBe(original);
	expect(await finished.settled).toEqual({ status: 'finished' });
	expect(scope.active).toBe(1);
	finished.play();
	expect(finished.settled).not.toBe(original);
	expect(await finished.settled).toEqual({ status: 'finished' });
	expect(replayedValue.get()).toBe(1);
	await expect.poll(() => scope.active).toBe(0);
});

it('settles partial replacement immediately while untouched siblings stay owned until completion', async () => {
	const { component } = render(Fixture);
	const { scope, animate, value } = component.api();
	const sibling = { position: 0 };
	const sequence = animate([
		[value, 100, { duration: 0.2 }],
		[sibling, { position: 100 }, { duration: 0.2, at: 0 }]
	]);
	const original = sequence.settled;
	await frame();
	const replacement = externalAnimate(value, 200, { duration: 0.1 });
	expect(await original).toEqual({ status: 'cancelled', reason: 'replaced' });
	expect(scope.active).toBe(1);
	expect(sequence.settled).toBe(original);
	expect(() => sequence.play()).toThrow(/replaced/);
	await expect.poll(() => sibling.position).toBe(100);
	await expect.poll(() => scope.active).toBe(0);
	await replacement;
	expect(value.get()).toBe(200);
});

it('retains cleanup ownership of untouched siblings after partial replacement', async () => {
	const { component, unmount } = render(Fixture);
	const { scope, animate, value } = component.api();
	const sibling = motionValue(0);
	const sequence = animate([
		[value, 100, { duration: 10 }],
		[sibling, 100, { duration: 10, at: 0 }]
	]);
	await frame();
	const replacement = externalAnimate(value, 200, { duration: 0.1 });
	expect(await sequence.settled).toEqual({ status: 'cancelled', reason: 'replaced' });
	expect(scope.active).toBe(1);
	await unmount();
	const held = sibling.get();
	await replacement;
	expect(sibling.get()).toBe(held);
	expect(value.get()).toBe(200);
	expect(scope.active).toBe(0);
});

it.each(['pause', 'activity'] as const)(
	'releases replay completion frame work during %s suspension',
	async (suspension) => {
		const { component } = render(Fixture);
		const { animate } = component.api();
		const value = motionValue(0);
		const run = animate(value, 1, { duration: 0.2 });
		await run.settled;
		run.pause();
		run.time = 0;
		const schedule = vi.spyOn(motionFrame, 'postRender');
		const cancel = vi.spyOn(frameSteps.postRender, 'cancel');
		try {
			run.play();
			const pending = run.settled;
			let settled = false;
			void pending.then(() => {
				settled = true;
			});
			// Wait on the actual fallback registration, not elapsed animation time.
			await expect
				.poll(() => schedule.mock.calls.filter(([, keepAlive]) => keepAlive).length)
				.toBe(1);
			const completionCheck = schedule.mock.calls.find(([, keepAlive]) => keepAlive)![0];
			if (suspension === 'pause') run.pause();
			else flushSync(() => component.setActivity(false));
			expect(cancel).toHaveBeenCalledWith(completionCheck);
			const registrations = schedule.mock.calls.filter(([, keepAlive]) => keepAlive).length;
			await frame();
			await frame();
			expect(schedule.mock.calls.filter(([, keepAlive]) => keepAlive)).toHaveLength(registrations);
			expect(settled).toBe(false);
			expect(run.settled).toBe(pending);
			if (suspension === 'pause') run.play();
			else flushSync(() => component.setActivity(true));
			expect(run.settled).toBe(pending);
			expect(await pending).toEqual({ status: 'finished' });
			expect(value.get()).toBe(1);
		} finally {
			schedule.mockRestore();
			cancel.mockRestore();
		}
	}
);

it('retains untouched replay channels when replacement encounters stale finished promises', async () => {
	const { component, unmount } = render(Fixture);
	const { scope, animate, value } = component.api();
	const sibling = motionValue(0);
	const sequence = animate([
		[value, 100, { duration: 10 }],
		[sibling, 100, { duration: 10, at: 0 }]
	]);
	const replacedDriver = value.animation!;
	sequence.complete();
	await sequence.settled;
	sequence.pause();
	sequence.time = 0;
	sequence.play();
	// The raw channel stop is the signal used by the engine on replacement.
	// Completed standalone values clear their animation pointer upstream.
	replacedDriver.stop();
	const replacement = externalAnimate(value, 200, { duration: 0.1 });
	expect(await sequence.settled).toEqual({ status: 'cancelled', reason: 'replaced' });
	await frame();
	expect(scope.active).toBe(1);
	await unmount();
	const held = sibling.get();
	await replacement;
	expect(sibling.get()).toBe(held);
	expect(value.get()).toBe(200);
	expect(scope.active).toBe(0);
});

it('revokes only the replaced arc timeline observer across Activity reveal and owner cleanup', async () => {
	const { component, unmount } = render(Fixture);
	const { animate } = component.api();
	const element = document.querySelector<HTMLElement>('[data-rc-settlement]')!;
	const run = animate(element, { x: 100, y: 100, opacity: 0.2 }, { path: arc(), duration: 10 });
	const x = styleSubjectEffect.get(element, 'x')!;
	const arcDriver = x.animation;
	if (!(arcDriver instanceof JSAnimation)) throw new Error('Expected a synchronous arc driver');
	const active = new Map<AnimationPlaybackControls, (time: number) => void>();
	const observe = vi.fn((animation: AnimationPlaybackControls) => {
		animation.pause();
		active.set(animation, (time) => {
			animation.time = time;
		});
		return () => active.delete(animation);
	});
	run.attachTimeline({ observe });
	await expect.poll(() => active.size).toBe(2);
	expect(active.has(arcDriver)).toBe(true);
	const replacement = externalAnimate(x, 300, { duration: 10, ease: 'linear' });
	replacement.pause();
	replacement.time = 5;
	const held = x.get();
	expect(await run.settled).toEqual({ status: 'cancelled', reason: 'replaced' });
	expect(active.has(arcDriver)).toBe(false);
	expect(active.size).toBe(1);
	for (const seek of active.values()) seek(5);
	expect(x.get()).toBe(held);
	flushSync(() => component.setActivity(false));
	expect(active.size).toBe(0);
	flushSync(() => component.setActivity(true));
	expect(active.size).toBe(1);
	expect(observe.mock.calls.filter(([animation]) => animation === arcDriver)).toHaveLength(1);
	for (const seek of active.values()) seek(8);
	expect(x.get()).toBe(held);
	await unmount();
	expect(active.size).toBe(0);
	expect(x.get()).toBe(held);
	replacement.complete();
	await replacement;
	expect(x.get()).toBe(300);
});
