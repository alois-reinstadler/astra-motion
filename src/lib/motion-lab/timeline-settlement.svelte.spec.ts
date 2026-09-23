import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAnimate, type AnimationCancellationReason } from '../motion/animate.js';
import { claimMotionOwnership } from '../motion/ownership.js';
import LiveTimelinePolicy from './LiveTimelinePolicy.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function fixture() {
	const root = document.createElement('section');
	const box = document.createElement('div');
	box.style.opacity = '1';
	root.append(box);
	document.body.append(root);
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	return { root, box, scope, detach };
}

it.each<AnimationCancellationReason>(['stopped', 'cancelled', 'replaced', 'detached'])(
	'resolves .settled exactly once with %s while leaving legacy then pending',
	async (reason) => {
		const { root, box, scope, detach } = fixture();
		try {
			const controls = scope.animate(box, { opacity: 0.3 }, { duration: 10 });
			const outcomes: unknown[] = [];
			void controls.settled.then((outcome) => outcomes.push(outcome));
			let legacyFinished = false;
			void controls.then(() => {
				legacyFinished = true;
			});
			await frame();
			if (reason === 'stopped') controls.stop();
			if (reason === 'cancelled') controls.cancel();
			if (reason === 'replaced') scope.animate(box, { opacity: 0.7 }, { duration: 0 });
			if (reason === 'detached') detach?.();
			expect(await controls.settled).toEqual({ status: 'cancelled', reason });
			await frame();
			expect(outcomes).toEqual([{ status: 'cancelled', reason }]);
			expect(legacyFinished).toBe(false);
		} finally {
			detach?.();
			root.remove();
		}
	}
);

it('scope.stop settles every active run and releases their owners', async () => {
	const { root, box, scope, detach } = fixture();
	const second = document.createElement('div');
	root.append(second);
	try {
		const runs = [
			scope.animate(box, { opacity: 0 }, { duration: 10 }),
			scope.animate(second, { x: 100 }, { duration: 10 })
		];
		scope.stop();
		expect(await Promise.all(runs.map((run) => run.settled))).toEqual([
			{ status: 'cancelled', reason: 'stopped' },
			{ status: 'cancelled', reason: 'stopped' }
		]);
		expect(scope.active).toBe(0);
		for (const node of [box, second]) claimMotionOwnership(node, 'state', {})();
	} finally {
		detach?.();
		root.remove();
	}
});

it('reacquiring completed playback creates a fresh settlement promise without changing the previous result', async () => {
	const { root, box, scope, detach } = fixture();
	try {
		const controls = scope.animate(box, { opacity: [1, 0.4] }, { duration: 0.1 });
		const original = controls.settled;
		expect(await original).toEqual({ status: 'finished' });
		expect(Number(getComputedStyle(box).opacity)).toBeCloseTo(0.4, 3);
		controls.play();
		const replay = controls.settled;
		expect(replay).not.toBe(original);
		controls.stop();
		expect(await replay).toEqual({ status: 'cancelled', reason: 'stopped' });
		expect(await original).toEqual({ status: 'finished' });
	} finally {
		detach?.();
		root.remove();
	}
});

it.each([
	{
		property: 'opacity',
		from: 1,
		to: 0.2,
		repeat: Infinity,
		repeatType: 'loop' as const,
		speed: 1,
		expected: 0.2
	},
	{
		property: 'opacity',
		from: 1,
		to: 0.2,
		repeat: 1,
		repeatType: 'reverse' as const,
		speed: 1,
		expected: 1
	},
	{
		property: 'opacity',
		from: 1,
		to: 0.2,
		repeat: 0,
		repeatType: 'loop' as const,
		speed: -1,
		expected: 1
	},
	{
		property: 'opacity',
		from: 1,
		to: 0.2,
		repeat: Infinity,
		repeatType: 'loop' as const,
		speed: 0,
		expected: 0.2
	},
	{
		property: 'x',
		from: 0,
		to: 120,
		repeat: Infinity,
		repeatType: 'loop' as const,
		speed: 1,
		expected: 120
	},
	{
		property: 'x',
		from: 0,
		to: 120,
		repeat: 1,
		repeatType: 'reverse' as const,
		speed: 1,
		expected: 0
	},
	{
		property: 'x',
		from: 0,
		to: 120,
		repeat: 0,
		repeatType: 'loop' as const,
		speed: -1,
		expected: 0
	}
])(
	'manual completion keeps the $property endpoint for repeat=$repeat / $repeatType / speed=$speed',
	async ({ property, from, to, repeat, repeatType, speed, expected }) => {
		const { root, box, scope, detach } = fixture();
		try {
			const controls = scope.animate(
				box,
				{ [property]: [from, to] },
				{ duration: 10, repeat, repeatType }
			);
			controls.speed = speed;
			controls.complete();
			expect(await controls.settled).toEqual({ status: 'finished' });
			await controls;
			const actual =
				property === 'opacity'
					? Number(getComputedStyle(box).opacity)
					: new DOMMatrix(getComputedStyle(box).transform).e;
			expect(actual).toBeCloseTo(expected, 3);
			expect(scope.active).toBe(0);
		} finally {
			detach?.();
			root.remove();
		}
	}
);

it('observes live local getter and proxy policies, finishing original repeating controls at their visible endpoint', async () => {
	const screen = render(LiveTimelinePolicy);
	const scopes = screen.component.scopes();
	const roots = scopes.map((scope) => scope.current);
	const runs = scopes.map((scope) =>
		scope.sequence([['.subject', { x: [0, 120], opacity: [1, 0.4] }, { duration: 10 }]], {
			repeat: Infinity
		})
	);
	const legacy = runs.map(() => false);
	runs.forEach((run, index) => {
		void run.then(() => {
			legacy[index] = true;
		});
	});
	await frame();
	screen.component.reduce(true);
	for (const run of runs) expect(await run.settled).toEqual({ status: 'finished' });
	await expect.poll(() => legacy.every(Boolean)).toBe(true);
	expect(scopes.map((scope) => scope.current)).toEqual(roots);
	for (const scope of scopes) {
		const node = scope.current!.querySelector('.subject') as HTMLElement;
		expect(new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(120, 3);
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(0.4, 3);
		expect(scope.active).toBe(0);
		expect(node.getAnimations()).toHaveLength(0);
	}
});

it('disposes local policy subscriptions and settles retained control handles on component removal', async () => {
	const screen = render(LiveTimelinePolicy);
	const scopes = screen.component.scopes();
	const nodes = scopes.map((scope) => scope.current!.querySelector('.subject') as HTMLElement);
	const runs = scopes.map((scope) => scope.animate('.subject', { opacity: 0 }, { duration: 10 }));
	await frame();
	screen.component.remove();
	for (const run of runs)
		expect(await run.settled).toEqual({ status: 'cancelled', reason: 'detached' });
	const styles = nodes.map((node) => node.style.cssText);
	screen.component.reduce(true);
	await frame();
	expect(nodes.map((node) => node.style.cssText)).toEqual(styles);
	expect(scopes.every((scope) => scope.active === 0 && !scope.current)).toBe(true);
});

it.each(['cleanup', 'complete', 'cancel'] as const)(
	'settles and releases externally attached timeline %s',
	async (action) => {
		const { root, box, scope, detach } = fixture();
		try {
			const controls = scope.animate(box, { opacity: 0 }, { duration: 10 });
			const subscriptions = new Set<object>();
			const cleanup = controls.attachTimeline({
				observe(animation) {
					animation.pause();
					subscriptions.add(animation);
					return () => {
						subscriptions.delete(animation);
					};
				}
			});
			await expect.poll(() => subscriptions.size).toBe(1);
			if (action === 'cleanup') cleanup();
			else controls[action]();
			expect(await controls.settled).toEqual({ status: 'cancelled', reason: 'cancelled' });
			expect(subscriptions.size).toBe(0);
			expect(scope.active).toBe(0);
			claimMotionOwnership(box, 'state', {})();
			cleanup();
		} finally {
			detach?.();
			root.remove();
		}
	}
);

it('cancels externally driven progress on live reduced motion without leaving .settled pending', async () => {
	const screen = render(LiveTimelinePolicy);
	const scope = screen.component.scopes()[0];
	const controls = scope.animate('.subject', { opacity: 0 }, { duration: 10 });
	const subscriptions = new Set<object>();
	controls.attachTimeline({
		observe(animation) {
			animation.pause();
			subscriptions.add(animation);
			return () => {
				subscriptions.delete(animation);
			};
		}
	});
	await expect.poll(() => subscriptions.size).toBe(1);
	screen.component.reduce(true);
	expect(await controls.settled).toEqual({ status: 'cancelled', reason: 'cancelled' });
	expect(subscriptions.size).toBe(0);
	expect(scope.active).toBe(0);
});
