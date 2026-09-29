import { expect, it } from 'vitest';
import { animateMotionDefinition } from '../motion/animation.js';
import { ensureMotionVisual, registerMotionVisual } from '../motion/visual.js';

it.each([
	['transform', 'translateX(20px)'],
	['scale', '2'],
	['translate', '20px'],
	['rotate', '20deg']
])('preserves authored CSS %s for an opacity-only binding', async (property, value) => {
	const node = document.createElement('div');
	node.style.setProperty(property, value);
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{ opacity: 0.5 },
		() => ({ animate: { opacity: 1 } }),
		() => 'never',
		() => true
	);
	try {
		const visual = ensureMotionVisual(node)!;
		visual.getValue('opacity', 0.5).set(1);
		visual.render();
		expect(node.style.getPropertyValue(property)).toBe(value);
		expect(node.style.opacity).toBe('1');
	} finally {
		unregister();
		await Promise.resolve();
		expect(node.style.getPropertyValue(property)).toBe(value);
		node.remove();
	}
});

it.each([
	['scale', '2'],
	['translate', '20px'],
	['rotate', '20deg']
])('composes authored CSS %s with the independent Motion transform', async (property, value) => {
	const node = document.createElement('div');
	const sheet = document.createElement('style');
	sheet.textContent = `[data-state-css-transform] { ${property}: ${value}; }`;
	node.dataset.stateCssTransform = '';
	node.style.transform = 'scale(0.5)';
	document.head.append(sheet);
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{ scale: 0.5 },
		() => ({ animate: { scale: 1 } }),
		() => 'never',
		() => true
	);
	try {
		const visual = ensureMotionVisual(node)!;
		visual.getValue('scale', 0.5).set(0.75);
		visual.render();
		expect(node.style.transform).toBe('scale(0.75)');
		expect(getComputedStyle(node).getPropertyValue(property)).toBe(value);
	} finally {
		unregister();
		await Promise.resolve();
		node.remove();
		sheet.remove();
	}
});

it('accepts CSS individual transforms explicitly reset to none with Motion initial transforms', async () => {
	const node = document.createElement('div');
	node.style.cssText = 'transform:scale(0.5);scale:none;translate:none;rotate:none';
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{ scale: 0.5 },
		() => ({ animate: { scale: 1 } }),
		() => 'never',
		() => true
	);
	try {
		expect(ensureMotionVisual(node)?.getValue('scale', 0.5).get()).toBe(0.5);
	} finally {
		unregister();
		await Promise.resolve();
		node.remove();
	}
});

it('claims inherited transform targets before browser serialization can change their precision', async () => {
	const node = document.createElement('div');
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{},
		() => ({ variants: { moved: { x: 12.123456789 } } }),
		() => 'never',
		() => true
	);
	try {
		const visual = ensureMotionVisual(node)!;
		await animateMotionDefinition(visual, 'moved', { transitionOverride: { duration: 0 } });
		visual.render();
		expect(new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(12.123456789, 3);
		expect(() => ensureMotionVisual(node)).not.toThrow();
	} finally {
		unregister();
		await Promise.resolve();
		node.remove();
	}
});

it('replaces a raw CSS transform when an inherited variant takes transform ownership', async () => {
	const node = document.createElement('div');
	node.style.transform = 'scale(2)';
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{},
		() => ({ variants: { moved: { x: 12.123456789 } } }),
		() => 'never',
		() => true
	);
	try {
		const visual = ensureMotionVisual(node)!;
		await animateMotionDefinition(visual, 'moved', { transitionOverride: { duration: 0 } });
		visual.render();
		const matrix = new DOMMatrix(getComputedStyle(node).transform);
		expect(matrix.e).toBeCloseTo(12.123456789, 3);
		expect(matrix.a).toBe(1);
	} finally {
		unregister();
		await Promise.resolve();
		node.remove();
	}
});
