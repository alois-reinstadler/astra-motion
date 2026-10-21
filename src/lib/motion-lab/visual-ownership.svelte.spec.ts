import { expect, it } from 'vitest';
import { animateTarget, motionValue } from 'motion-dom';
import { ensureMotionVisual, registerMotionVisual } from '../motion/visual.js';
import { animateMotionDefinition } from '../motion/animation.js';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const microtasks = async () => {
	for (let i = 0; i < 12; i++) await Promise.resolve();
};

it('preserves an authored transform until an animation acquires independent targets', async () => {
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
		expect(ensureMotionVisual(node)).toBeDefined();
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

it.each([true, false])(
	'adopts a late variant parent with inherit=%s and removes its registration on teardown',
	async (inherit) => {
		const parent = document.createElement('div');
		const child = document.createElement('div');
		parent.append(child);
		document.body.append(parent);
		const unregisterChild = registerMotionVisual(
			child,
			{},
			() => ({ inherit, variants: { shown: { opacity: 1 } } }),
			() => 'never',
			() => true,
			() => parent
		);
		const childVisual = ensureMotionVisual(child)!;
		const unregisterParent = registerMotionVisual(
			parent,
			{},
			() => ({ animate: 'shown', variants: { shown: { opacity: 1 } } }),
			() => 'never',
			() => true
		);
		try {
			const parentVisual = ensureMotionVisual(parent)!;
			expect(childVisual.parent).toBe(parentVisual);
			expect(childVisual.depth).toBe(parentVisual.depth + 1);
			expect(parentVisual.children.has(childVisual)).toBe(true);
			expect(parentVisual.variantChildren?.has(childVisual)).toBe(inherit);
			unregisterChild();
			await microtasks();
			expect(parentVisual.variantChildren?.has(childVisual)).toBe(false);
			expect(parentVisual.children.has(childVisual)).toBe(false);
		} finally {
			unregisterChild();
			unregisterParent();
			await microtasks();
			parent.remove();
		}
	}
);

it.each([true, false])(
	'walks a late non-variant parent with inherit=%s and detaches when that parent unmounts',
	async (inherit) => {
		const root = document.createElement('div');
		const parent = document.createElement('div');
		const child = document.createElement('div');
		root.append(parent);
		parent.append(child);
		document.body.append(root);
		const unregisterRoot = registerMotionVisual(
			root,
			{},
			() => ({ animate: 'shown', variants: { shown: { opacity: 1 } } }),
			() => 'never',
			() => true
		);
		const rootVisual = ensureMotionVisual(root)!;
		const unregisterChild = registerMotionVisual(
			child,
			{},
			() => ({ variants: { shown: { opacity: 1 } } }),
			() => 'never',
			() => true,
			() => parent
		);
		const childVisual = ensureMotionVisual(child)!;
		const unregisterParent = registerMotionVisual(
			parent,
			{},
			() => ({ inherit }),
			() => 'never',
			() => true
		);
		try {
			const parentVisual = ensureMotionVisual(parent)!;
			expect(parentVisual.parent).toBe(rootVisual);
			expect(rootVisual.variantChildren?.has(childVisual)).toBe(inherit);
			unregisterParent();
			await microtasks();
			expect(childVisual.parent).toBeUndefined();
			expect(childVisual.depth).toBe(0);
			expect(rootVisual.variantChildren?.has(childVisual)).toBe(false);
		} finally {
			unregisterChild();
			unregisterParent();
			unregisterRoot();
			await microtasks();
			root.remove();
		}
	}
);

it('preserves an initial masked scale and its base before a MotionValue has been created', async () => {
	const node = document.createElement('div');
	document.body.append(node);
	const unregister = registerMotionVisual(
		node,
		{ transform: 'rotate(60deg)', scale: 3 },
		() => ({ initial: { transform: 'rotate(60deg)', scale: 3 } }),
		() => 'never',
		() => true
	);
	try {
		const visual = ensureMotionVisual(node)!;
		expect(visual.hasValue('scale')).toBe(false);
		const completion = animateMotionDefinition(visual, {
			scale: 2,
			transition: { duration: 0.05 }
		});
		expect(visual.getValue('scale')?.get()).toBe(3);
		expect(visual.getBaseTarget('scale')).toBe(3);
		await completion;
		expect(visual.getValue('scale')?.get()).toBe(2);
	} finally {
		unregister();
		await microtasks();
		node.remove();
	}
});

it('removes an old registration when inheritance is disabled before late parent adoption', async () => {
	const root = document.createElement('div');
	const parent = document.createElement('div');
	const child = document.createElement('div');
	root.append(parent);
	parent.append(child);
	document.body.append(root);
	let declaredParent = root;
	let inherit = true;
	const unregisterRoot = registerMotionVisual(
		root,
		{},
		() => ({ animate: 'shown' }),
		() => 'never',
		() => true
	);
	const rootVisual = ensureMotionVisual(root)!;
	const props = () => ({ inherit, variants: { shown: { opacity: 1 } } });
	const unregisterChild = registerMotionVisual(
		child,
		{},
		props,
		() => 'never',
		() => true,
		() => declaredParent
	);
	const childVisual = ensureMotionVisual(child)!;
	expect(rootVisual.variantChildren?.has(childVisual)).toBe(true);
	inherit = false;
	childVisual.update(props(), null);
	declaredParent = parent;
	const unregisterParent = registerMotionVisual(
		parent,
		{},
		() => ({ animate: 'shown' }),
		() => 'never',
		() => true
	);
	try {
		const parentVisual = ensureMotionVisual(parent)!;
		expect(childVisual.parent).toBe(parentVisual);
		expect(rootVisual.variantChildren?.has(childVisual)).toBe(false);
		expect(parentVisual.variantChildren?.has(childVisual)).toBe(false);
	} finally {
		unregisterChild();
		unregisterParent();
		unregisterRoot();
		await microtasks();
		root.remove();
	}
});
