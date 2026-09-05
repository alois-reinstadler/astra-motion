import { expect, it } from 'vitest';
import { visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
it('keeps a paused isolated projection across a no-op layout transaction', async () => {
	const layout = createLayout();
	const parent = document.createElement('div');
	const child = document.createElement('div');
	parent.style.cssText = 'width:300px;height:50px;display:flex;justify-content:flex-start';
	child.style.cssText = 'width:50px;height:50px';
	parent.append(child);
	document.body.append(parent);
	const dispose = layout()(child);
	await Promise.resolve();
	try {
		layout.update(() => {
			parent.style.justifyContent = 'flex-end';
		});
		await frame();
		await frame();
		const p = visualElementStore.get(child)!.projection!;
		p.currentAnimation!.pause();
		p.currentAnimation!.time = 0.075;
		await frame();
		await frame();
		const old = child.getBoundingClientRect().x;
		const oldTransform = child.style.transform;
		layout.update(() => {});
		await Promise.resolve();
		await Promise.resolve();
		const now = child.getBoundingClientRect().x;
		const transform = child.style.transform;
		const target = p.target;
		expect(
			Math.abs(now - old),
			JSON.stringify({
				old,
				now,
				oldTransform,
				transform,
				state: p.currentAnimation?.state,
				delta: p.projectionDelta,
				target,
				targetDelta: p.targetDelta
			})
		).toBeLessThan(1);
	} finally {
		dispose?.();
		parent.remove();
		await Promise.resolve();
	}
});
