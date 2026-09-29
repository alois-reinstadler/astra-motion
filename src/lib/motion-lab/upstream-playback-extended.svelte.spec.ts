// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamPlaybackExtended.svelte';
const kinds = ['hybrid', 'mini', 'strict'] as const;
const node = (kind: string) =>
	document.querySelector<HTMLElement>(`[data-upstream-play="${kind}"]`)!;
const opacity = (kind: string) => Number(getComputedStyle(node(kind)).opacity);
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
async function fixture(kind: (typeof kinds)[number]) {
	const screen = render(Fixture);
	await tick();
	const api = screen.component.api();
	const animate = kind === 'mini' ? api.mini : kind === 'strict' ? api.strict.animate : api.animate;
	const scope = kind === 'mini' ? api.miniScope : kind === 'strict' ? api.strict : api.scope;
	return { component: screen.component, unmount: screen.unmount, api, animate, scope };
}
it.each(kinds)(
	'scoped-autoplay-pause: %s autoplay false holds opacity, then plays and completes',
	async (kind) => {
		const { animate, scope } = await fixture(kind);
		const run = animate(
			node(kind),
			{ opacity: [1, 0.2] },
			{ duration: 0.12, autoplay: false, ease: 'linear' }
		);
		await frames(5);
		expect(opacity(kind)).toBe(1);
		expect(scope.active).toBe(1);
		expect(run.state).toBe('paused');
		run.play();
		await run;
		await expect.poll(() => opacity(kind)).toBeCloseTo(0.2, 3);
		await expect.poll(() => scope.active).toBe(0);
	}
);
it.each(kinds)(
	'scoped-autoplay-pause: %s pauses before resolution with and without a seek',
	async (kind) => {
		const { animate } = await fixture(kind);
		const first = animate(node(kind), { opacity: [1, 0] }, { duration: 1, ease: 'linear' });
		first.pause();
		await frames();
		expect(opacity(kind)).toBe(1);
		first.cancel();
		const seek = animate(node(kind), { opacity: [1, 0] }, { duration: 1, ease: 'linear' });
		seek.time = 0.5;
		seek.pause();
		await frames();
		expect(opacity(kind)).toBeCloseTo(0.5, 2);
		const time = seek.time;
		await frames();
		expect(seek.time).toBeCloseTo(time, 3);
	}
);
it.each(kinds)('scoped-autoplay-pause: %s immediate stop prevents delayed writes', async (kind) => {
	const { animate, scope } = await fixture(kind);
	const complete = vi.fn();
	const run = animate(node(kind), { opacity: [1, 0] }, { duration: 0.05, onComplete: complete });
	run.stop();
	await frames(5);
	expect(opacity(kind)).toBe(1);
	expect(scope.active).toBe(0);
	expect(complete).not.toHaveBeenCalled();
	expect(() => run.play()).toThrow(/stopped|detached/);
});
it.each(kinds)(
	'scoped-replay-promises: %s finished and then settle once per play and preserve old promises',
	async (kind) => {
		const { animate, scope } = await fixture(kind);
		const run = animate(node(kind), { opacity: [1, 0.2] }, { duration: 0.15, ease: 'linear' });
		const original = run.finished;
		const secondObserver = run.finished;
		const settled = vi.fn();
		void original.then(settled);
		void secondObserver.then(settled);
		await Promise.all([original, secondObserver]);
		expect(settled).toHaveBeenCalledTimes(2);
		const then = vi.fn();
		await run.then(then);
		expect(then).toHaveBeenCalledOnce();
		run.play();
		run.pause();
		const replay = run.finished;
		let replayDone = false;
		void replay.then(() => {
			replayDone = true;
		});
		await Promise.all([original, secondObserver]);
		expect(settled).toHaveBeenCalledTimes(2);
		await frames();
		expect(replayDone).toBe(false);
		expect(scope.active).toBe(1);
		run.complete();
		await replay;
		expect(replayDone).toBe(true);
		await expect.poll(() => scope.active).toBe(0);
	}
);
it.each(kinds)(
	'scoped-replay-promises: %s seeking completed playback reacquires ownership and changed speed replays',
	async (kind) => {
		const { animate, scope, unmount } = await fixture(kind);
		const run = animate(node(kind), { opacity: [1, 0.2] }, { duration: 0.2, ease: 'linear' });
		await run;
		run.time = 0;
		run.pause();
		await frames();
		expect(opacity(kind)).toBe(1);
		expect(scope.active).toBe(1);
		run.time = 0.05;
		run.speed = 0.5;
		expect(run.speed).toBe(0.5);
		await frames();
		expect(opacity(kind)).toBeCloseTo(0.8, 2);
		run.play();
		await run;
		await expect.poll(() => opacity(kind)).toBeCloseTo(0.2, 3);
		run.speed = 2;
		run.time = 0.05;
		run.play();
		await run;
		await expect.poll(() => opacity(kind)).toBeCloseTo(0.2, 3);
		await unmount();
		expect(() => {
			run.time = 0;
		}).toThrow(/stopped|detached/);
	}
);
it.each(kinds)(
	'scoped-cancel: %s cancel after pause restores origin and makes the handle terminal',
	async (kind) => {
		const { animate, scope } = await fixture(kind);
		const complete = vi.fn();
		const run = animate(
			node(kind),
			{ opacity: [1, 0] },
			{ duration: 1, ease: 'linear', onComplete: complete }
		);
		run.pause();
		run.time = 0.5;
		await frames();
		expect(opacity(kind)).toBeCloseTo(0.5, 2);
		run.cancel();
		await frames();
		expect(opacity(kind)).toBe(1);
		expect(scope.active).toBe(0);
		expect(complete).not.toHaveBeenCalled();
		expect(() => run.play()).toThrow(/stopped|detached/);
		expect(() => run.complete()).toThrow(/stopped|detached/);
		const replacement = animate(node(kind), { opacity: [1, 0] }, { duration: 1, ease: 'linear' });
		replacement.pause();
		replacement.time = 0.5;
		await frames();
		expect(opacity(kind)).toBeCloseTo(0.5, 2);
		await frames();
		expect(opacity(kind)).toBeCloseTo(0.5, 2);
	}
);
it.each(kinds)(
	'scoped-cancel: %s cancel while playing restores origin; cancel after completion preserves endpoint',
	async (kind) => {
		const { animate } = await fixture(kind);
		const active = animate(node(kind), { opacity: [1, 0] }, { duration: 1, ease: 'linear' });
		await expect.poll(() => opacity(kind)).toBeLessThan(0.95);
		active.cancel();
		await frames();
		expect(opacity(kind)).toBe(1);
		const finished = animate(node(kind), { opacity: [1, 0.2] }, { duration: 0.05, ease: 'linear' });
		await finished;
		finished.cancel();
		await frames();
		expect(opacity(kind)).toBeCloseTo(0.2, 3);
	}
);
it.each(kinds)(
	'scoped-cancel: %s stop freezes an intermediate style and prevents restart',
	async (kind) => {
		const { animate, scope } = await fixture(kind);
		const run = animate(node(kind), { opacity: [1, 0] }, { duration: 1, ease: 'linear' });
		run.pause();
		run.time = 0.4;
		await frames();
		expect(opacity(kind)).toBeCloseTo(0.6, 2);
		run.stop();
		const stopped = opacity(kind);
		expect(stopped).toBeCloseTo(0.6, 2);
		await frames(5);
		expect(opacity(kind)).toBeCloseTo(stopped, 3);
		expect(scope.active).toBe(0);
		expect(() => run.play()).toThrow(/stopped|detached/);
	}
);
it.each(kinds)(
	'scoped-timing: %s delayed seeks, grouped speed and duration remain in seconds',
	async (kind) => {
		const { animate } = await fixture(kind);
		const targets = [node(kind), node(kind + '-second')];
		const run = animate(
			targets,
			{ opacity: [1, 0] },
			{ duration: 1, delay: 0.5, repeat: 1, ease: 'linear', autoplay: false }
		);
		await frames();
		expect(run.duration).toBe(1);
		run.time = 0.25;
		await frames();
		expect(targets.map((el) => Number(getComputedStyle(el).opacity))).toEqual([1, 1]);
		run.time = 1;
		await frames();
		expect(targets.map((el) => Number(getComputedStyle(el).opacity))).toEqual([
			expect.closeTo(0.5, 2),
			expect.closeTo(0.5, 2)
		]);
		run.speed = 2;
		expect(run.speed).toBe(2);
		run.speed = 0.5;
		expect(run.speed).toBe(0.5);
		run.stop();
	}
);
it.each(kinds)('scoped-timing: %s negative speed finishes at the origin', async (kind) => {
	const { animate } = await fixture(kind);
	const run = animate(
		node(kind),
		{ opacity: [1, 0] },
		{ duration: 0.2, ease: 'linear', autoplay: false }
	);
	run.time = 0.2;
	run.speed = -1;
	run.play();
	await run;
	await expect.poll(() => opacity(kind)).toBe(1);
});
it.each(['loop', 'reverse', 'mirror'] as const)(
	'scoped-timing: natural %s odd/even repeats and forced completion reach their endpoint',
	async (repeatType) => {
		const { animate } = await fixture('hybrid');
		for (const repeat of [1, 2]) {
			node('hybrid').style.opacity = '1';
			const run = animate(
				node('hybrid'),
				{ opacity: [1, 0.2] },
				{ duration: 0.04, repeat, repeatType, ease: 'linear' }
			);
			await run;
			const expected = repeatType !== 'loop' && repeat % 2 === 1 ? 1 : 0.2;
			await expect.poll(() => opacity('hybrid')).toBeCloseTo(expected, 3);
		}
		const forced = animate(
			node('hybrid'),
			{ opacity: [1, 0.2] },
			{ duration: 10, repeat: 1, repeatType, ease: 'linear' }
		);
		forced.complete();
		await forced;
		await expect.poll(() => opacity('hybrid')).toBeCloseTo(repeatType === 'loop' ? 0.2 : 1, 3);
	}
);
it('layout-reverse-playback: reverses a layout-enabled Motion node through useAnimate', async () => {
	const { api } = await fixture('hybrid');
	const element = node('layout');
	const x = () => new DOMMatrix(getComputedStyle(element).transform).m41;
	expect(x()).toBe(0);
	const run = api.animate(
		element,
		{ x: [0, 100] },
		{ duration: 0.2, ease: 'linear', autoplay: false }
	);
	run.time = 0.1;
	await frames();
	expect(x()).toBeCloseTo(50, 1);
	run.speed = -1;
	run.play();
	await run;
	await expect.poll(x).toBeCloseTo(0, 2);
	await frames();
	expect(x()).toBeCloseTo(0, 2);
});

it('scoped-timing: repeatDelay holds the completed endpoint before the next iteration', async () => {
	const { animate } = await fixture('hybrid');
	const run = animate(
		node('hybrid'),
		{ opacity: [1, 0] },
		{ duration: 0.1, repeat: 1, repeatDelay: 0.2, ease: 'linear', autoplay: false }
	);
	run.time = 0.2;
	await frames();
	expect(opacity('hybrid')).toBeCloseTo(0, 3);
	run.time = 0.35;
	await frames();
	expect(opacity('hybrid')).toBeCloseTo(0.5, 2);
	run.complete();
	await run;
	await expect.poll(() => opacity('hybrid')).toBe(0);
});

it.each(kinds)(
	'scoped-autoplay-pause: %s scalar opacity hydrates the implicit zero origin on the same node',
	async (kind) => {
		const { animate, scope } = await fixture(kind);
		const element = node(kind);
		element.style.opacity = '0';
		const run = animate(
			element,
			{ opacity: 1 },
			{ duration: 0.15, autoplay: false, ease: 'linear' }
		);
		await frames(5);
		expect(node(kind)).toBe(element);
		expect(opacity(kind)).toBe(0);
		expect(scope.active).toBe(1);
		run.play();
		await run;
		await expect.poll(() => opacity(kind)).toBe(1);
		expect(node(kind)).toBe(element);
	}
);
it.each(kinds)(
	'scoped-timing: %s grouped speed changes both subjects relative to an independent clock',
	async (kind) => {
		const { animate, scope } = await fixture(kind);
		const reference = document.createElement('div');
		reference.style.opacity = '1';
		scope.current!.append(reference);
		try {
			for (const speed of [2, 0.5]) {
				const subjects = [node(kind), node(kind + '-second')];
				const group = animate(
					subjects,
					{ opacity: [1, 0] },
					{ duration: 2, ease: 'linear', autoplay: false }
				);
				const clock = animate(
					reference,
					{ opacity: [1, 0] },
					{ duration: 2, ease: 'linear', autoplay: false }
				);
				group.speed = speed;
				group.play();
				clock.play();
				await expect
					.poll(() => Number(getComputedStyle(reference).opacity), { interval: 10 })
					.toBeLessThan(0.75);
				group.pause();
				clock.pause();
				await frames();
				const progress = 1 - Number(getComputedStyle(reference).opacity);
				expect(progress).toBeGreaterThan(0.2);
				expect(progress).toBeLessThan(0.45);
				for (const subject of subjects)
					expect(
						Math.abs(1 - Number(getComputedStyle(subject).opacity) - progress * speed)
					).toBeLessThan(0.04);
				group.stop();
				clock.stop();
			}
		} finally {
			reference.remove();
		}
	}
);
