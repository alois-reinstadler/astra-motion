import { expect, it } from 'vitest';
import { visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
async function microtasks() {
	for (let i = 0; i < 8; i++) await Promise.resolve();
}

it('automatically projects reflow caused by an unregistered sibling resizing in a fixed flex row', async () => {
	const layout = createLayout({ automatic: true, transition: { duration: 1, ease: 'linear' } });
	const row = document.createElement('div');
	row.style.cssText = 'display:flex;width:400px;height:40px';
	const sibling = document.createElement('div');
	sibling.style.cssText = 'width:50px;flex-shrink:0';
	const child = document.createElement('div');
	child.style.cssText = 'width:50px;height:40px;flex-shrink:0';
	row.append(sibling, child);
	document.body.append(row);
	const dispose = layout()(child);
	await microtasks();
	await frame();
	await frame();
	try {
		const before = child.getBoundingClientRect();
		sibling.style.width = '150px';
		await microtasks();
		const after = child.getBoundingClientRect();
		expect(
			Math.abs(after.x - before.x),
			'Sibling reflow must start at the old painted position'
		).toBeLessThan(1);
		expect(visualElementStore.get(child)!.projection!.currentAnimation).toBeDefined();
	} finally {
		dispose?.();
		row.remove();
		await microtasks();
	}
});

it('uses the current scroll offset for shared handoff after a scrolled active animation', async () => {
	const layout = createLayout({ automatic: true, transition: { duration: 1, ease: 'linear' } });
	const host = document.createElement('div');
	host.style.cssText = 'position:relative;overflow:auto;width:200px;height:150px';
	const parent = document.createElement('div');
	parent.style.cssText = 'position:relative;width:600px;height:100px';
	host.append(parent);
	document.body.append(host);
	const disposeHost = layout({ scroll: true })(host);
	const make = (left: number) => {
		const element = document.createElement('div');
		element.style.cssText = `position:relative;left:${left}px;width:50px;height:40px`;
		parent.append(element);
		const dispose = layout({ id: 'scroll-shared' })(element);
		return { element, dispose };
	};
	let current = make(0);
	await microtasks();
	await frame();
	await frame();
	try {
		current.element.style.left = '180px';
		await microtasks();
		await frame();
		const animation = visualElementStore.get(current.element)!.projection!.currentAnimation!;
		expect(animation).toBeDefined();
		animation.pause();
		animation.time = 0.3;
		await frame();
		await frame();
		host.scrollLeft = 40;
		const scrolled = current.element.getBoundingClientRect();
		current.element.remove();
		current.dispose?.();
		current = make(90);
		await microtasks();
		const after = current.element.getBoundingClientRect();
		expect(
			Math.abs(after.x - scrolled.x),
			'Shared source must account for a new scroll offset'
		).toBeLessThan(1);
	} finally {
		current.dispose?.();
		disposeHost?.();
		host.remove();
		await microtasks();
	}
});

it('preserves the scrolled intermediate visual pose when automatic reflow retargets', async () => {
	const layout = createLayout({ automatic: true, transition: { duration: 1, ease: 'linear' } });
	const host = document.createElement('div');
	host.style.cssText = 'position:relative;overflow:auto;width:200px;height:150px';
	const parent = document.createElement('div');
	parent.style.cssText = 'position:relative;width:600px;height:100px';
	const child = document.createElement('div');
	child.style.cssText = 'position:relative;left:0px;width:50px;height:40px';
	parent.append(child);
	host.append(parent);
	document.body.append(host);
	const disposeHost = layout({ scroll: true })(host);
	const disposeChild = layout()(child);
	await microtasks();
	await frame();
	await frame();
	try {
		child.style.left = '180px';
		await microtasks();
		await frame();
		const projection = visualElementStore.get(child)!.projection!;
		const animation = projection.currentAnimation!;
		expect(animation).toBeDefined();
		animation.pause();
		animation.time = 0.3;
		await frame();
		await frame();
		host.scrollLeft = 40;
		const scrolled = child.getBoundingClientRect();
		child.style.left = '90px';
		await microtasks();
		const after = child.getBoundingClientRect();
		expect(
			Math.abs(after.x - scrolled.x),
			'Scrolling must not rebase the source to stale viewport coordinates'
		).toBeLessThan(1);
	} finally {
		disposeChild?.();
		disposeHost?.();
		host.remove();
		await microtasks();
	}
});
