import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { animateTarget, visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';
import { initialStyleSpike } from './state-engine-spike.js';
import StateEngineSpike from './StateEngineSpike.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
};
const microtasks = async () => {
	for (let i = 0; i < 12; i++) await Promise.resolve();
};

it('retargets Motion values on the same VisualElement while layout projection is active', async () => {
	const parent = document.createElement('div');
	const node = document.createElement('div');
	parent.style.cssText = 'display:flex;width:400px;height:100px';
	node.style.cssText = 'width:100px;height:100px';
	parent.append(node);
	document.body.append(parent);
	const layout = createLayout({ automatic: false, transition: { duration: 1, ease: 'linear' } });
	const cleanup = layout({ style: { scale: 1 } })(node);
	await microtasks();
	await frames();
	try {
		const visual = visualElementStore.get(node)!;
		const state = animateTarget(visual, {
			opacity: 0.4,
			scale: 0.7,
			transition: { duration: 1, ease: 'linear' }
		});
		state.forEach((animation) => {
			animation.pause();
			animation.time = 0.3;
		});
		await frames();
		const currentScale = Number(visual.getValue('scale')!.get());
		expect(currentScale).toBeGreaterThan(0.7);
		expect(currentScale).toBeLessThan(1);
		layout.update(() => {
			parent.style.justifyContent = 'flex-end';
		});
		await frames();
		const projection = visual.projection!;
		expect(projection.currentAnimation).toBeDefined();
		projection.currentAnimation!.pause();
		projection.currentAnimation!.time = 0.4;
		await frames();
		const projected = node.getBoundingClientRect();
		expect(projected.x - parent.getBoundingClientRect().x).toBeGreaterThan(50);
		expect(projected.width).toBeCloseTo(currentScale * 100, 0);
		const replacement = animateTarget(visual, {
			opacity: 1,
			scale: 0.95,
			transition: { duration: 0.1, ease: 'linear' }
		});
		expect(Number(visual.getValue('scale')!.get())).toBeCloseTo(currentScale, 5);
		await Promise.all(replacement.map((animation) => animation.finished));
		projection.currentAnimation!.complete();
		await frames();
		expect(Number(visual.getValue('scale')!.get())).toBeCloseTo(0.95, 5);
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 5);
		expect(node.getBoundingClientRect().width).toBeCloseTo(95, 0);
	} finally {
		cleanup?.();
		parent.remove();
		await microtasks();
	}
});

it('lets native Svelte retention reverse a finite Motion spring without replacing the node', async () => {
	const screen = render(StateEngineSpike);
	const node = screen.getByTestId('state-node').element() as HTMLElement;
	await frames();
	await screen.getByRole('button', { name: 'Move spike' }).click();
	await screen.getByRole('button', { name: 'Toggle spike' }).click();
	await frames();
	expect(node.isConnected).toBe(true);
	await screen.getByRole('button', { name: 'Toggle spike' }).click();
	expect(screen.getByTestId('state-node').element()).toBe(node);
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
	await screen.getByRole('button', { name: 'Toggle spike' }).click();
	await expect.poll(() => node.isConnected).toBe(false);
});

it('builds initial units, CSS variables and transforms using Motion render state', () => {
	const style = initialStyleSpike({
		opacity: 0,
		scale: 0.96,
		x: 12,
		originX: 0,
		'--accent': 'red'
	});
	expect(style).toMatchObject({
		opacity: 0,
		transform: 'translateX(12px) scale(0.96)',
		transformOrigin: '0% 50% 0',
		'--accent': 'red'
	});
});
