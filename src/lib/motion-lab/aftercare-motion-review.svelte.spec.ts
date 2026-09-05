import { expect, it } from 'vitest';
import { HTMLVisualElement, animateTarget } from 'motion-dom';
import { createAnimate } from '../motion/animate.js';
import { claimMotionOwnership } from '../motion/ownership.js';
import { createPresenceTimeline } from '../motion/presence-state.js';
import { animateMotionDefinition } from '../motion/animation.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function visualFixture() {
	const node = document.createElement('div');
	node.style.opacity = '0.2';
	document.body.append(node);
	const visual = new HTMLVisualElement({
		presenceContext: null,
		props: {},
		visualState: {
			latestValues: { opacity: 0.2 },
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	visual.mount(node);
	return {
		node,
		visual,
		cleanup() {
			visual.unmount();
			node.remove();
		}
	};
}

it('preserves native velocity when presence interrupts an active spring-compatible value', async () => {
	const { node, visual, cleanup } = visualFixture();
	try {
		animateTarget(visual, { opacity: 1, transition: { duration: 1, ease: 'linear' } });
		await expect.poll(() => node.getAnimations().length).toBe(1);
		await frame();
		await frame();
		const trajectory = createPresenceTimeline(
			visual,
			{ ...visual.latestValues },
			{ opacity: 0 },
			{ type: 'spring', stiffness: 100, damping: 10 },
			'out'
		);
		trajectory.tick!(1, 0);
		const source = Number(visual.latestValues.opacity);
		trajectory.tick!(0.999, 0.001);
		expect(Number(visual.latestValues.opacity)).toBeGreaterThan(source);
		trajectory.cancel();
	} finally {
		cleanup();
	}
});

it('retains the new state animation handle when replacing a native effect before its finish event', async () => {
	const { node, visual, cleanup } = visualFixture();
	try {
		animateTarget(visual, { opacity: 0.5, transition: { duration: 1 } });
		await expect.poll(() => node.getAnimations().length).toBe(1);
		node.getAnimations()[0].finish();
		void animateMotionDefinition(visual, { opacity: 0.9, transition: { duration: 1 } });
		await frame();
		await frame();
		expect(node.getAnimations().length).toBe(1);
		expect(visual.values.get('opacity')?.animation).toBeDefined();
	} finally {
		cleanup();
	}
});

it('cannot write a queued finished timeline endpoint after its ownership transfers', async () => {
	const node = document.createElement('div');
	node.style.opacity = '1';
	document.body.append(node);
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(node);
	let release: (() => void) | undefined;
	try {
		const controls = scope.animate(node, { opacity: 0.25 }, { duration: 1 });
		await expect.poll(() => node.getAnimations().length).toBe(1);
		node.getAnimations()[0].finish();
		controls.stop();
		release = claimMotionOwnership(node, 'state', {});
		node.style.opacity = '0.75';
		await frame();
		await frame();
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(0.75, 3);
	} finally {
		release?.();
		detach?.();
		node.remove();
	}
});

it('keeps the stopped pose for JavaScript-backed scoped playback', async () => {
	const node = document.createElement('div');
	node.style.opacity = '1';
	document.body.append(node);
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(node);
	try {
		const controls = scope.animate(
			node,
			{ opacity: 0 },
			{ duration: 1, ease: 'linear', repeatDelay: 0.1 }
		);
		await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeLessThan(0.85);
		controls.stop();
		await frame();
		await frame();
		expect(Number(getComputedStyle(node).opacity)).toBeLessThan(0.9);
		expect(scope.active).toBe(0);
	} finally {
		detach?.();
		node.remove();
	}
});

it.each(['native', 'javascript'] as const)(
	'keeps cancel distinct from stop for %s playback',
	async (backend) => {
		const node = document.createElement('div');
		node.style.opacity = '1';
		document.body.append(node);
		const scope = createAnimate({ reducedMotion: 'never' });
		const detach = scope.attach(node);
		try {
			const controls = scope.animate(
				node,
				{ opacity: 0.25 },
				{ duration: 1, ...(backend === 'javascript' ? { repeatDelay: 0.1 } : {}) }
			);
			await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeLessThan(0.85);
			if (backend === 'native') node.getAnimations()[0].finish();
			controls.cancel();
			await frame();
			await frame();
			expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
			expect(scope.active).toBe(0);
		} finally {
			detach?.();
			node.remove();
		}
	}
);

it('flushes naturally completed scoped renders before releasing ownership', async () => {
	const node = document.createElement('div');
	node.style.opacity = '1';
	document.body.append(node);
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(node);
	let release: (() => void) | undefined;
	try {
		await scope.animate(node, { opacity: 0.25 }, { duration: 0.04 });
		release = claimMotionOwnership(node, 'state', {});
		node.style.opacity = '0.75';
		await frame();
		await frame();
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(0.75, 3);
	} finally {
		release?.();
		detach?.();
		node.remove();
	}
});

it('does not force unrelated pending auto-size measurements while taking the presence clock', () => {
	const nodes = [document.createElement('div'), document.createElement('div')];
	const visuals = nodes.map((node, i) => {
		node.style.cssText = 'width:100px;height:30px;opacity:1';
		node.textContent = 'Content for measuring intrinsic height';
		document.body.append(node);
		const visual = new HTMLVisualElement({
			presenceContext: null,
			props: {},
			visualState: {
				latestValues: i ? { height: 30 } : { opacity: 1 },
				renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
			}
		});
		visual.mount(node);
		return visual;
	});
	const original = nodes[1].getBoundingClientRect.bind(nodes[1]);
	let reads = 0;
	nodes[1].getBoundingClientRect = () => {
		reads++;
		return original();
	};
	try {
		animateTarget(visuals[1], { height: 'auto', transition: { duration: 1 } });
		animateTarget(visuals[0], { opacity: 0.5, transition: { duration: 1 } });
		const trajectory = createPresenceTimeline(
			visuals[0],
			{ opacity: 1 },
			{ opacity: 0 },
			{ duration: 0.2 },
			'out'
		);
		trajectory.cancel();
		expect(reads).toBe(0);
	} finally {
		visuals.forEach((visual) => visual.unmount());
		nodes.forEach((node) => node.remove());
	}
});
