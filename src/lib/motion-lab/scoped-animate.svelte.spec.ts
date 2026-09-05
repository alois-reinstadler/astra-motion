import { render } from 'vitest-browser-svelte';
import ScopedTimelineSSR from './ScopedTimelineSSR.svelte';
import { expect, it } from 'vitest';
import { createAnimate } from '../motion/animate.js';
import { notifyMotionConfig, readMotionConfig } from '../motion/config.js';
import { claimMotionOwnership } from '../motion/ownership.js';
const frames = async (count = 2) => {
	for (let i = 0; i < count; i++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
function fixture() {
	const root = document.createElement('section');
	root.innerHTML =
		'<div class="box" style="opacity:1;width:20px;height:20px"></div><div class="second" style="opacity:1"></div>';
	document.body.append(root);
	return {
		root,
		box: root.firstElementChild as HTMLElement,
		second: root.lastElementChild as HTMLElement
	};
}
it('scopes selectors, sequences labels, and clears finished playback', async () => {
	const a = fixture(),
		b = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(a.root);
	try {
		const controls = scope.sequence([
			['.box', { x: [0, 60] }, { duration: 0.08 }],
			'fade',
			['.second', { opacity: 0.3 }, { duration: 0.08, at: 'fade' }]
		]);
		await controls;
		expect(new DOMMatrix(getComputedStyle(a.box).transform).e).toBeCloseTo(60, 1);
		expect(getComputedStyle(a.second).opacity).toBe('0.3');
		expect(getComputedStyle(b.box).transform).toBe('none');
		expect(scope.active).toBe(0);
	} finally {
		detach?.();
		a.root.remove();
		b.root.remove();
	}
});
it('retargets an in-flight timeline and prevents stale later segments', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	try {
		scope.sequence([
			['.box', { x: 100 }, { duration: 0.4 }],
			['.box', { x: 200 }, { duration: 0.1 }]
		]);
		await frames(4);
		const before = new DOMMatrix(getComputedStyle(box).transform).e;
		const next = scope.animate('.box', { x: 20 }, { duration: 0.06 });
		expect(Math.abs(new DOMMatrix(getComputedStyle(box).transform).e - before)).toBeLessThan(2);
		await next;
		await frames(35);
		expect(new DOMMatrix(getComputedStyle(box).transform).e).toBeCloseTo(20, 1);
		expect(scope.active).toBe(0);
	} finally {
		detach?.();
		root.remove();
	}
});
it('cleans up native playback and ownership when detached', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	scope.animate('.box', { opacity: [1, 0] }, { duration: 10, repeat: Infinity });
	await frames();
	detach?.();
	expect(scope.active).toBe(0);
	expect(box.getAnimations()).toHaveLength(0);
	expect(scope.current).toBeUndefined();
	const release = claimMotionOwnership(box, 'state', {});
	release();
	root.remove();
	expect(() => scope.animate('.box', { opacity: 0 })).toThrow('attach');
});
it('rejects out-of-scope and conflicting ownership without partial animation', () => {
	const a = fixture(),
		b = fixture();
	const scope = createAnimate();
	const detach = scope.attach(a.root);
	const release = claimMotionOwnership(a.box, 'layout', {});
	try {
		expect(() => scope.animate(b.box, { opacity: 0 })).toThrow('scope');
		expect(() => scope.animate('.missing', { opacity: 0 })).toThrow('matched no');
		expect(() =>
			scope.sequence([
				['.second', { opacity: 0 }],
				['.box', { opacity: 0 }]
			])
		).toThrow('layout');
		expect(scope.active).toBe(0);
		expect(a.second.getAnimations()).toHaveLength(0);
	} finally {
		release();
		detach?.();
		a.root.remove();
		b.root.remove();
	}
});
it('disables timeline delays and repetition under reduced motion', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'always' });
	const detach = scope.attach(root);
	try {
		await scope.sequence([['.box', { x: 90 }, { duration: 10, at: 20 }]], { repeat: Infinity });
		expect(new DOMMatrix(getComputedStyle(box).transform).e).toBeCloseTo(90, 1);
		expect(scope.active).toBe(0);
	} finally {
		detach?.();
		root.remove();
	}
});
it('releases canceled controls without waiting on an unresolved upstream promise', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	try {
		const controls = scope.animate(box, { opacity: 0 }, { duration: 10 });
		await frames();
		controls.stop();
		expect(scope.active).toBe(0);
		const release = claimMotionOwnership(box, 'state', {});
		release();
	} finally {
		detach?.();
		root.remove();
	}
});
it('keeps paused playback owned, and rejects replay after teardown', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	const controls = scope.animate(box, { x: 100 }, { duration: 0.2 });
	await frames();
	controls.pause();
	const paused = controls.time;
	await frames(3);
	expect(controls.time).toBeCloseTo(paused, 3);
	expect(scope.active).toBe(1);
	controls.play();
	await controls;
	expect(new DOMMatrix(getComputedStyle(box).transform).e).toBeCloseTo(100, 1);
	detach?.();
	expect(() => controls.play()).toThrow('detached');
	root.remove();
});
it('rejects authored CSS transforms and allows Motion-owned continuation', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	try {
		box.style.transform = 'rotate(12deg)';
		expect(() => scope.animate(box, { x: 50 })).toThrow('authored CSS transform');
		box.style.transform = '';
		await scope.animate(box, { x: 50 }, { duration: 0.03 });
		await scope.animate(box, { x: 70 }, { duration: 0.03 });
		expect(new DOMMatrix(getComputedStyle(box).transform).e).toBeCloseTo(70, 1);
	} finally {
		detach?.();
		root.remove();
	}
});
it('reacquires completed playback when replayed and releases it on scope cleanup', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	const controls = scope.animate(box, { opacity: [1, 0] }, { duration: 0.04 });
	await controls;
	expect(scope.active).toBe(0);
	controls.play();
	expect(scope.active).toBe(1);
	await frames();
	detach?.();
	expect(scope.active).toBe(0);
	expect(box.getAnimations()).toHaveLength(0);
	root.remove();
});

it('settles an infinitely repeating active timeline when central policy changes', async () => {
	const { root, box } = fixture();
	let reduce = false;
	const scope = createAnimate(() => ({ reducedMotion: reduce ? 'always' : 'never' }));
	const detach = scope.attach(root);
	try {
		scope.sequence([[box, { x: [0, 120] }, { duration: 0.4 }]], { repeat: Infinity });
		await frames(3);
		reduce = true;
		notifyMotionConfig(readMotionConfig());
		await expect.poll(() => new DOMMatrix(getComputedStyle(box).transform).e).toBeCloseTo(120, 1);
		await expect.poll(() => scope.active).toBe(0);
		expect(box.getAnimations()).toHaveLength(0);
	} finally {
		detach?.();
		root.remove();
	}
});
it('guards finished callbacks across replay and rejects targets moved outside the scope', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	try {
		const controls = scope.animate(box, { opacity: [1, 0.3] }, { duration: 0.15 });
		await frames();
		controls.complete();
		controls.play();
		await Promise.resolve();
		await Promise.resolve();
		expect(scope.active).toBe(1);
		box.remove();
		expect(() => controls.play()).toThrow('scope');
	} finally {
		detach?.();
		root.remove();
	}
});
it('blocks every mutating control after attachment cleanup', async () => {
	const { root, box } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	const controls = scope.animate(box, { opacity: 0.3 }, { duration: 0.1 });
	await frames();
	detach?.();
	expect(() => controls.complete()).toThrow('detached');
	expect(() => controls.pause()).toThrow('detached');
	expect(() => {
		controls.time = 0.05;
	}).toThrow('detached');
	root.remove();
});

it('inherits configured duration for single animations and default sequence segments', async () => {
	const screen = render(ScopedTimelineSSR);
	const scope = screen.component.getScope();
	const controls = scope.animate('span', { opacity: 0.4 });
	await frames();
	expect(controls.duration).toBeCloseTo(0.123, 3);
	await controls;
	const sequence = scope.sequence([
		['span', { opacity: 0.8 }],
		['span', { opacity: 0.2 }]
	]);
	await frames();
	expect(sequence.duration).toBeCloseTo(0.246, 3);
	await sequence;
});

it('preserves authored transforms through paint-only sequences and still rejects later transform takeover', async () => {
	const { root, box, second } = fixture();
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	box.style.transform = 'rotate(17deg) scale(.8)';
	box.style.translate = '7px 3px';
	const before = getComputedStyle(box).transform;
	try {
		await scope.animate(box, { opacity: 0.6 }, { duration: 0.04 });
		expect(getComputedStyle(box).transform).toBe(before);
		await scope.sequence([
			[box, { opacity: 0.25 }, { duration: 0.04 }],
			[second, { x: 35 }, { duration: 0.04, at: 0 }]
		]);
		expect(Number(getComputedStyle(box).opacity)).toBeCloseTo(0.25, 3);
		expect(getComputedStyle(box).transform).toBe(before);
		expect(getComputedStyle(box).translate).toBe('7px 3px');
		expect(new DOMMatrix(getComputedStyle(second).transform).e).toBeCloseTo(35, 1);
		expect(() => scope.animate(box, { x: 50 })).toThrow('authored CSS transform');
		box.style.translate = '';
		expect(() => scope.sequence([[box, { transform: 'rotate(0deg)' }]])).toThrow(
			'authored CSS transform'
		);
		expect(getComputedStyle(box).transform).toBe(before);
	} finally {
		detach?.();
		root.remove();
	}
});
