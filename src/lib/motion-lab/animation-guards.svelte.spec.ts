import { expect, it } from 'vitest';
import {
	AsyncMotionValueAnimation,
	type MotionNodeOptions,
	type MotionValueAnimation
} from 'motion-dom';
import { animateMotionDefinition } from '../motion/animation.js';
import { ensureMotionVisual, registerMotionVisual } from '../motion/visual.js';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
};
function completeAnimation(animation: MotionValueAnimation | undefined) {
	if (!(animation instanceof AsyncMotionValueAnimation))
		throw new Error('Expected animateTarget to create full asynchronous playback controls');
	animation.complete();
}
async function fixture(props: MotionNodeOptions = {}) {
	const node = document.createElement('div');
	node.style.opacity = '1';
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{ opacity: 1, x: 0 },
		() => props,
		() => 'never',
		() => true
	);
	const visual = ensureMotionVisual(node)!;
	visual.render();
	await frames();
	return {
		node,
		visual,
		cleanup: async () => {
			unregister();
			await Promise.resolve();
			node.remove();
		}
	};
}

it('prevents a queued old completion from applying transitionEnd after a newer target', async () => {
	const { node, visual, cleanup } = await fixture();
	try {
		void animateMotionDefinition(visual, {
			opacity: 0.4,
			transition: { duration: 1 },
			transitionEnd: { visibility: 'hidden' }
		});
		await frames();
		completeAnimation(visual.getValue('opacity')!.animation);
		await animateMotionDefinition(visual, {
			opacity: 1,
			transition: { duration: 0 },
			transitionEnd: { visibility: 'visible' }
		});
		await frames();
		await frames();
		expect(node.style.visibility).toBe('visible');
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
	} finally {
		await cleanup();
	}
});

it('resolves overlapping variant arrays with final-label priority and completes the whole request', async () => {
	const { node, visual, cleanup } = await fixture({
		variants: {
			first: {
				x: 50,
				opacity: 0.4,
				transition: { duration: 0.2 },
				transitionEnd: { visibility: 'hidden' }
			},
			second: {
				x: 100,
				opacity: 1,
				transition: { duration: 0.1 },
				transitionEnd: { visibility: 'visible' }
			}
		}
	});
	try {
		let completed = false;
		void animateMotionDefinition(visual, ['first', 'second']).then(() => {
			completed = true;
		});
		await expect.poll(() => Number(visual.getValue('x')!.get())).toBeCloseTo(100, 3);
		await expect.poll(() => completed).toBe(true);
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
		expect(node.style.visibility).toBe('visible');
	} finally {
		await cleanup();
	}
});

it('waits for child animations before starting an afterChildren parent target', async () => {
	const parent = await fixture({
		variants: { active: { opacity: 0.5 } },
		transition: { duration: 0.1, when: 'afterChildren' }
	});
	const child = document.createElement('div');
	parent.node.append(child);
	const unregister = registerMotionVisual(
		child,
		{ x: 0 },
		() => ({ variants: { active: { x: 50 } }, transition: { duration: 0.1 } }),
		() => 'never',
		() => true
	);
	const visual = ensureMotionVisual(child)!;
	let childAtParentStart = -1;
	const stop = parent.visual.getValue('opacity', 1).on('animationStart', () => {
		childAtParentStart = Number(visual.getValue('x')?.get() ?? visual.latestValues.x);
	});
	try {
		await animateMotionDefinition(parent.visual, 'active');
		await frames();
		expect(childAtParentStart).toBeCloseTo(50, 3);
		expect(Number(getComputedStyle(parent.node).opacity)).toBeCloseTo(0.5, 3);
	} finally {
		stop();
		unregister();
		await parent.cleanup();
	}
});

it('does not launch deferred child animation after its parent is destroyed at completion', async () => {
	const parent = await fixture({
		variants: { active: { opacity: 0.5 } },
		transition: { duration: 1, when: 'beforeChildren' }
	});
	const child = document.createElement('div');
	parent.node.append(child);
	const unregister = registerMotionVisual(
		child,
		{ x: 0 },
		() => ({ variants: { active: { x: 50 } }, transition: { duration: 0.1 } }),
		() => 'never',
		() => true
	);
	const visual = ensureMotionVisual(child)!;
	let starts = 0;
	const stop = visual.on('AnimationStart', () => {
		starts++;
	});
	try {
		void animateMotionDefinition(parent.visual, 'active');
		await frames();
		completeAnimation(parent.visual.getValue('opacity')!.animation);
		unregister();
		await parent.cleanup();
		await frames();
		await frames();
		expect(starts).toBe(0);
		expect(visual.latestValues.x).toBe(0);
	} finally {
		stop();
		unregister();
		await parent.cleanup();
	}
});

it('lets a later variant target replace an earlier transitionEnd for the same property', async () => {
	const { visual, cleanup } = await fixture({
		variants: {
			first: { opacity: 0.5, transition: { duration: 0.1 }, transitionEnd: { x: 50 } },
			second: { x: 100, transition: { duration: 0.1 } }
		}
	});
	try {
		await animateMotionDefinition(visual, ['first', 'second']);
		await frames();
		expect(Number(visual.getValue('x')!.get())).toBeCloseTo(100, 3);
	} finally {
		await cleanup();
	}
});
