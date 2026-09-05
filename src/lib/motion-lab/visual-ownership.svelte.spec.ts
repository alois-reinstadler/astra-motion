import { expect, it } from 'vitest';
import { animateTarget, motionValue } from 'motion-dom';
import { ensureMotionVisual, registerMotionVisual } from '../motion/visual.js';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const microtasks = async () => {
	for (let i = 0; i < 12; i++) await Promise.resolve();
};

it('diagnoses a pre-existing application transform without overwriting it on a state-only node', async () => {
	const node = document.createElement('div');
	node.style.cssText = 'transform:rotate(12deg);opacity:0.8';
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{ opacity: 0.8 },
		() => ({ animate: { scale: 2 } }),
		() => 'never',
		() => true
	);
	try {
		expect(() => ensureMotionVisual(node)).toThrow('Motion owns');
		expect(node.style.transform).toBe('rotate(12deg)');
	} finally {
		unregister();
		await microtasks();
		node.remove();
	}
});

it('restores owned style properties while preserving unrelated application style changes', async () => {
	const node = document.createElement('div');
	node.style.cssText = 'opacity:0.8;color:red;padding:4px';
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{ opacity: 0.8, color: 'red' },
		() => ({ initial: false, style: { opacity: 0.8, color: 'red' } }),
		() => 'never',
		() => true
	);
	try {
		const visual = ensureMotionVisual(node)!;
		await Promise.all(
			animateTarget(visual, {
				opacity: 0.3,
				x: 50,
				color: '#0000ff',
				transition: { duration: 0 }
			}).map((animation) => animation.finished)
		);
		await frame();
		await frame();
		expect(node.style.opacity).toBe('0.3');
		expect(node.style.transform).toContain('50px');
		node.style.padding = '8px';
		unregister();
		await microtasks();
		expect(node.style.opacity).toBe('0.8');
		expect(node.style.color).toBe('red');
		expect(node.style.transform).toBe('');
		expect(node.style.padding).toBe('8px');
	} finally {
		unregister();
		await microtasks();
		node.remove();
	}
});

it('unsubscribes an externally owned MotionValue without destroying its independent subscribers', async () => {
	const node = document.createElement('div');
	document.body.append(node);
	const x = motionValue(0);
	const seen: number[] = [];
	const stop = x.on('change', (value) => seen.push(value));
	const unregister = registerMotionVisual(
		node,
		{ x: 0 },
		() => ({ initial: false, style: { x } }),
		() => 'never',
		() => true
	);
	try {
		ensureMotionVisual(node);
		x.set(10);
		await frame();
		expect(node.style.transform).toContain('10px');
		unregister();
		await microtasks();
		await frame();
		const style = node.style.cssText;
		x.set(20);
		await frame();
		expect(seen).toEqual([10, 20]);
		expect(node.style.cssText).toBe(style);
	} finally {
		unregister();
		await microtasks();
		stop();
		x.destroy();
		node.remove();
	}
});
