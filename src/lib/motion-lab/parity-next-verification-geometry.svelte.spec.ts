import { expect, it } from 'vitest';
import { visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';
import { correctParentTransform } from '../motion/coordinates.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
};
const box = (node: HTMLElement) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height };
};

it('retains CSS perspective on a transformed wrapper while its registered parent and nested child resize', async () => {
	const host = document.createElement('div');
	host.style.cssText = 'position:fixed;left:180px;top:160px;width:500px;height:400px';
	const wrapper = document.createElement('div');
	wrapper.style.cssText =
		'position:relative;width:320px;height:240px;transform:rotateY(28deg) rotateX(-12deg);transform-origin:23px 71px 18px;transform-style:preserve-3d;perspective:650px;perspective-origin:31px 170px';
	const plane = document.createElement('div');
	plane.style.cssText =
		'width:240px;height:160px;transform:rotateY(-22deg) rotateX(17deg) translateZ(24px);transform-origin:17px 23px 11px';
	const node = document.createElement('div');
	node.style.cssText =
		'position:relative;left:0;top:0;width:70px;height:40px;background:rgb(120,60,200)';
	plane.append(node);
	wrapper.append(plane);
	host.append(wrapper);
	document.body.append(host);
	const reference = host.cloneNode(true) as HTMLElement;
	reference.style.visibility = 'hidden';
	const referenceNode = reference.firstElementChild!.firstElementChild!
		.firstElementChild as HTMLElement;
	document.body.append(reference);
	const original = wrapper.getAttribute('style');
	const layout = createLayout({ automatic: true, transition: { duration: 1, ease: 'linear' } });
	const releaseParent = layout()(host);
	const releaseChild = layout()(node);
	const samples: {
		phase: string;
		actual: ReturnType<typeof box>;
		expected: ReturnType<typeof box>;
		perspective: string;
	}[] = [];
	const sample = (phase: string) =>
		samples.push({
			phase,
			actual: box(node),
			expected: box(referenceNode),
			perspective: getComputedStyle(wrapper).perspective
		});
	try {
		await frames();
		sample('before');
		layout.update(() => {
			host.style.width = '650px';
			host.style.height = '460px';
			node.style.left = '110px';
			node.style.top = '80px';
			node.style.width = '120px';
			node.style.height = '60px';
		});
		await frames();
		const animations = [host, node].map((element) => {
			const animation = visualElementStore.get(element)?.projection?.currentAnimation;
			expect(animation).toBeDefined();
			animation!.pause();
			animation!.time = 0;
			return animation!;
		});
		await frames();
		sample('start');
		for (const animation of animations) animation.time = 0.4;
		reference.style.width = '560px';
		reference.style.height = '424px';
		referenceNode.style.left = '44px';
		referenceNode.style.top = '32px';
		referenceNode.style.width = '90px';
		referenceNode.style.height = '48px';
		await frames();
		sample('middle');
		for (const animation of animations) animation.complete();
		reference.style.width = '650px';
		reference.style.height = '460px';
		referenceNode.style.left = '110px';
		referenceNode.style.top = '80px';
		referenceNode.style.width = '120px';
		referenceNode.style.height = '60px';
		await frames();
		sample('end');
		const error = Math.max(
			...samples.flatMap(({ actual, expected }) =>
				(['x', 'y', 'width', 'height'] as const).map((axis) =>
					Math.abs(actual[axis] - expected[axis])
				)
			)
		);
		expect(error, JSON.stringify(samples)).toBeLessThan(1.5);
		expect(samples.map(({ perspective }) => perspective)).toEqual([
			'650px',
			'650px',
			'650px',
			'650px'
		]);
		expect(wrapper.getAttribute('style')).toBe(original);
	} finally {
		releaseChild?.();
		releaseParent?.();
		reference.remove();
		host.remove();
		await frames();
	}
});

it.each(['opacity:0.75', 'overflow:hidden', 'filter:opacity(1)'])(
	'inverts the actual flattened pointer plane when preserve-3d has a grouping style (%s)',
	(grouping) => {
		const host = document.createElement('div');
		host.style.cssText = `position:fixed;left:120px;top:95px;width:500px;height:350px;perspective:650px;perspective-origin:47px 160px;transform:rotate(8deg) rotateY(-12deg);transform-style:preserve-3d;${grouping}`;
		const plane = document.createElement('div');
		plane.style.cssText =
			'position:relative;left:30px;top:25px;width:300px;height:220px;transform:rotateY(35deg) rotateX(-18deg);transform-origin:23px 71px 15px';
		host.append(plane);
		document.body.append(host);
		try {
			const markers = [
				[40, 35],
				[130, 95]
			].map(([x, y]) => {
				const marker = document.createElement('span');
				marker.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0`;
				plane.append(marker);
				return marker;
			});
			const correct = correctParentTransform(plane);
			const points = markers.map((marker) => {
				const rect = marker.getBoundingClientRect();
				return correct({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
			});
			expect(getComputedStyle(host).transformStyle).toBe('preserve-3d');
			expect(Math.abs(points[1].x - points[0].x - 90), JSON.stringify(points)).toBeLessThan(1.5);
			expect(Math.abs(points[1].y - points[0].y - 60), JSON.stringify(points)).toBeLessThan(1.5);
		} finally {
			host.remove();
		}
	}
);
