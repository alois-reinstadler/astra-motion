import { expect, it } from 'vitest';
import { visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const microtasks = async () => {
	for (let i = 0; i < 12; i++) await Promise.resolve();
};

it('observes direct CSS changes, preserves an interrupted pose, and stays idle during projection renders', async () => {
	const layout = createLayout({ automatic: true, transition: { duration: 1, ease: 'linear' } });
	const parent = document.createElement('div');
	const node = document.createElement('div');
	parent.style.cssText = 'display:flex;width:400px;height:100px';
	node.style.cssText = 'width:50px;height:50px';
	parent.append(node);
	document.body.append(parent);
	const remove = layout()(node);
	await microtasks();
	await frame();
	await frame();
	try {
		const before = node.getBoundingClientRect().x;
		parent.style.justifyContent = 'flex-end';
		await microtasks();
		expect(Math.abs(node.getBoundingClientRect().x - before)).toBeLessThan(1);
		const projection = visualElementStore.get(node)!.projection!;
		expect(projection.currentAnimation).toBeDefined();
		projection.currentAnimation!.pause();
		projection.currentAnimation!.time = 0.3;
		await frame();
		await frame();
		const intermediate = node.getBoundingClientRect().x;
		expect(intermediate - before).toBeGreaterThan(50);
		parent.style.justifyContent = 'center';
		await microtasks();
		expect(Math.abs(node.getBoundingClientRect().x - intermediate)).toBeLessThan(1);
		await frame();
		await frame();
		let reads = 0;
		const original = node.getBoundingClientRect;
		node.getBoundingClientRect = () => {
			reads++;
			return original.call(node);
		};
		try {
			await frame();
			await frame();
			await frame();
			expect(reads).toBe(0);
		} finally {
			node.getBoundingClientRect = original;
		}
	} finally {
		remove?.();
		parent.remove();
		await microtasks();
	}
});
