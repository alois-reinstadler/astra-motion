import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { animate as externalAnimate } from 'motion';
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

it('settles timeline completion and completed pause/seek without reacquiring stopped playback', async () => {
	const { component } = render(Fixture);
	const { scope, animate } = component.api();
	const run = animate(0, 100, { duration: 1 });
	const disconnect = run.attachTimeline({ observe: () => () => {} });
	run.complete();
	expect(await run.settled).toEqual({ status: 'cancelled', reason: 'cancelled' });
	expect(scope.active).toBe(0);
	disconnect();
	const finished = animate(0, 1, { duration: 0.01 });
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
	expect(scope.active).toBe(0);
});
