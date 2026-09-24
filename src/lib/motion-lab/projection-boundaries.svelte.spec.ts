import { describe, expect, it } from 'vitest';
import { rootProjectionNode, visualElementStore, type IProjectionNode } from 'motion-dom';
import { createLayout } from '../motion/layout.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
};
const rect = (node: HTMLElement) => node.getBoundingClientRect();

async function fixture(transform = '') {
	const host = document.createElement('div');
	host.style.cssText = 'position:fixed;left:180px;top:160px;width:500px;height:400px';
	const wrapper = document.createElement('div');
	wrapper.style.cssText = `width:320px;height:240px;position:relative;transform:${transform || 'none'};transform-origin:23px 71px`;
	const node = document.createElement('div');
	node.style.cssText = 'position:relative;width:70px;height:40px;left:0px;top:0px;background:red';
	wrapper.append(node);
	host.append(wrapper);
	document.body.append(host);
	const layout = createLayout({ automatic: true, transition: { duration: 1, ease: 'linear' } });
	const release = layout()(node);
	await frames();
	return {
		host,
		wrapper,
		node,
		layout,
		async dispose() {
			release?.();
			host.remove();
			await frames();
		}
	};
}

async function seek(node: HTMLElement, time: number) {
	await frames();
	const animation = visualElementStore.get(node)?.projection?.currentAnimation;
	expect(animation).toBeDefined();
	animation!.pause();
	animation!.time = time;
	await frames();
}
function near(actual: DOMRect, expected: DOMRect, tolerance = 1.5) {
	for (const key of ['x', 'y', 'width', 'height'] as const) {
		expect(Math.abs(actual[key] - expected[key]), key).toBeLessThan(tolerance);
	}
}

function interpolateRect(from: DOMRect, to: DOMRect, progress: number) {
	const mix = (a: number, b: number) => a + (b - a) * progress;
	return new DOMRect(
		mix(from.x, to.x),
		mix(from.y, to.y),
		mix(from.width, to.width),
		mix(from.height, to.height)
	);
}

describe('unregistered projection boundaries', () => {
	it.each([
		'scale(1.6, .7)',
		'scale(-1.2, .8)',
		'rotate(32deg)',
		'translate(18px, 11px) rotate(-24deg) skewX(13deg) scale(1.3, .8)'
	])('keeps transformed geometry continuous through %s', async (transform) => {
		const f = await fixture(transform);
		try {
			const before = rect(f.node);
			f.layout.update(() => {
				f.node.style.left = '150px';
				f.node.style.top = '80px';
				f.node.style.width = '110px';
				f.node.style.height = '60px';
			});
			await seek(f.node, 0);
			near(rect(f.node), before);
			await seek(f.node, 0.4);
			const middle = rect(f.node);
			expect(Math.hypot(middle.x - before.x, middle.y - before.y)).toBeGreaterThan(20);
			f.layout.update(() => {
				f.node.style.left = '20px';
				f.node.style.top = '10px';
			});
			await seek(f.node, 0);
			near(rect(f.node), middle);
		} finally {
			await f.dispose();
		}
	});
	it.each([
		{ registered: false, transform: '' },
		{ registered: true, transform: '' },
		{ registered: false, transform: 'rotate(13deg) scale(1.1, .8)' },
		{ registered: true, transform: 'rotate(13deg) scale(1.1, .8)' }
	])(
		'does not replay nested scroll inside sticky clipping (registered: $registered, transform: $transform)',
		async ({ registered, transform }) => {
			const f = await fixture();
			f.host.style.transform = transform;
			const outer = document.createElement('div');
			const inner = document.createElement('div');
			const constraint = document.createElement('div');
			const spacer = document.createElement('div');
			const tail = document.createElement('div');
			outer.style.cssText = 'width:400px;height:300px;overflow:auto;overflow-anchor:none';
			inner.style.cssText =
				'width:350px;height:260px;overflow:auto;overflow-anchor:none;margin-top:80px';
			spacer.style.height = '90px';
			constraint.style.cssText = 'position:relative;height:260px';
			tail.style.height = '600px';
			f.wrapper.style.cssText += ';position:sticky;top:10px;overflow:clip;height:120px';
			f.host.append(outer);
			outer.append(inner);
			inner.append(constraint, tail);
			constraint.append(spacer, f.wrapper);
			const releaseSticky = registered ? f.layout()(f.wrapper) : undefined;
			await frames();
			try {
				for (const scroll of [50, 140, 240, 30, 280]) {
					inner.scrollTop = scroll;
					outer.scrollTop = scroll % 50;
					await frames();
					const stickyTop = Math.min(Math.max(90 - scroll, 10), 140 - scroll);
					expect(Math.abs(f.wrapper.offsetTop - scroll - stickyTop)).toBeLessThan(1.5);
					const before = rect(f.node);
					// Automatic postcommit projection must refresh the scroll/sticky origin.
					f.node.style.left = f.node.style.left === '140px' ? '0px' : '140px';
					await seek(f.node, 0);
					near(rect(f.node), before);
					await seek(f.node, 0.35);
				}
			} finally {
				releaseSticky?.();
				await f.dispose();
			}
		}
	);

	it('composes nested independent transforms and restores authored important declarations', async () => {
		const f = await fixture('rotate(15deg) scale(1.2, .8)');
		const inner = document.createElement('div');
		inner.style.cssText =
			'width:240px;height:160px;translate:10% 12px!important;rotate:-22deg!important;scale:.8 1.3!important;transform:skewX(8deg)!important;transform-origin:17px 23px';
		f.wrapper.append(inner);
		inner.append(f.node);
		await frames();
		const original = inner.getAttribute('style');
		try {
			const before = rect(f.node);
			f.layout.update(() => {
				f.node.style.left = '100px';
				f.node.style.width = '120px';
			});
			await seek(f.node, 0);
			near(rect(f.node), before);
			expect(inner.getAttribute('style')).toBe(original);
		} finally {
			await f.dispose();
		}
	});

	it('keeps registered parents and frees boundary chains after reparenting and late registration', async () => {
		const count = () => {
			let count = 0;
			rootProjectionNode.current?.nodes?.forEach(() => count++);
			return count;
		};
		const baseline = count();
		const f = await fixture();
		const second = document.createElement('div');
		second.style.cssText = 'width:360px;height:220px;transform:rotate(20deg)';
		f.host.append(second);
		let releaseParent: (() => void) | void = undefined;
		try {
			releaseParent = f.layout()(f.wrapper);
			await frames();
			const p = visualElementStore.get(f.node)!.projection!;
			expect(p.parent).toBe(visualElementStore.get(f.wrapper)!.projection);
			f.layout.update(() => {
				f.node.style.left = '100px';
			});
			await seek(f.node, 0.3);
			f.layout.update(() => {
				second.append(f.node);
			});
			await frames();
			expect(p.parent?.instance).toBe(second);
			expect(p.path.some((ancestor: IProjectionNode) => ancestor.instance === f.wrapper)).toBe(
				false
			);
		} finally {
			releaseParent?.();
			await f.dispose();
		}
		expect(count()).toBe(baseline);
	});
	it('projects a registered parent and descendant through a rotated wrapper together', async () => {
		const f = await fixture('rotate(18deg) scale(.9, 1.2)');
		const unregistered = rect(f.node);
		const releaseParent = f.layout()(f.host);
		await frames();
		near(rect(f.node), unregistered);
		const original = f.wrapper.getAttribute('style');
		// An unregistered copy supplies independent browser geometry at each endpoint.
		const reference = f.host.cloneNode(true) as HTMLElement;
		const referenceNode = reference.firstElementChild!.firstElementChild as HTMLElement;
		referenceNode.style.removeProperty('transform');
		reference.style.visibility = 'hidden';
		document.body.append(reference);
		try {
			const before = rect(f.node);
			reference.style.width = '650px';
			referenceNode.style.left = '110px';
			referenceNode.style.width = '120px';
			const target = rect(referenceNode);
			f.layout.update(() => {
				f.host.style.width = '650px';
				f.node.style.left = '110px';
				f.node.style.width = '120px';
			});
			await seek(f.node, 0);
			const parentAnimation = visualElementStore.get(f.host)!.projection!.currentAnimation!;
			parentAnimation.pause();
			parentAnimation.time = 0;
			await frames();
			near(rect(f.node), before);
			parentAnimation.time = 0.4;
			visualElementStore.get(f.node)!.projection!.currentAnimation!.time = 0.4;
			await frames();
			const middle = rect(f.node);
			near(middle, interpolateRect(before, target, 0.4));
			expect(f.wrapper.getAttribute('style')).not.toBe(original);
			reference.style.width = '530px';
			referenceNode.style.left = '35px';
			referenceNode.style.width = '85px';
			const reversedTarget = rect(referenceNode);
			f.layout.update(() => {
				f.host.style.width = '530px';
				f.node.style.left = '35px';
				f.node.style.width = '85px';
			});
			await frames();
			for (const element of [f.host, f.node]) {
				const animation = visualElementStore.get(element)!.projection!.currentAnimation!;
				animation.pause();
				animation.time = 0;
			}
			await frames();
			near(rect(f.node), middle);
			for (const element of [f.host, f.node]) {
				visualElementStore.get(element)!.projection!.currentAnimation!.time = 0.5;
			}
			await frames();
			near(rect(f.node), interpolateRect(middle, reversedTarget, 0.5));
			for (const element of [f.host, f.node]) {
				visualElementStore.get(element)!.projection!.currentAnimation!.complete();
			}
			await frames();
			near(rect(f.node), reversedTarget);
			expect(f.wrapper.getAttribute('style')).toBe(original);
		} finally {
			reference.remove();
			releaseParent?.();
			await f.dispose();
		}
	});
	it('restores compensated wrapper declarations on teardown and permits reattachment', async () => {
		const f = await fixture();
		f.wrapper.style.cssText +=
			';translate:12px 6px!important;rotate:21deg!important;scale:.9 1.2!important;transform:skewX(8deg)!important';
		const original = f.wrapper.getAttribute('style');
		let releaseParent: (() => void) | void = f.layout()(f.host);
		try {
			await frames();
			f.layout.update(() => {
				f.host.style.width = '650px';
				f.node.style.left = '100px';
			});
			await seek(f.host, 0.3);
			expect(f.wrapper.getAttribute('style')).not.toBe(original);
			releaseParent?.();
			releaseParent = undefined;
			await frames();
			expect(f.wrapper.getAttribute('style')).toBe(original);
			releaseParent = f.layout()(f.host);
			await frames();
			const before = rect(f.node);
			f.layout.update(() => {
				f.node.style.left = '150px';
			});
			await seek(f.node, 0);
			near(rect(f.node), before);
			expect(f.wrapper.getAttribute('style')).toBe(original);
		} finally {
			releaseParent?.();
			await f.dispose();
		}
		expect(f.wrapper.getAttribute('style')).toBe(original);
	});
	it('keeps a fixed ancestor in viewport space after late registration on a scrolled page', async () => {
		const f = await fixture('rotate(18deg)');
		const spacer = document.createElement('div');
		spacer.style.height = '2000px';
		const originalScroll = { x: window.scrollX, y: window.scrollY };
		document.body.append(spacer);
		let releaseParent: (() => void) | void = undefined;
		try {
			window.scrollTo(0, 180);
			await frames();
			expect(window.scrollY).toBeGreaterThan(100);
			const before = rect(f.node);
			releaseParent = f.layout()(f.host);
			await frames();
			near(rect(f.node), before);
			f.layout.update(() => {
				f.node.style.left = '100px';
			});
			await seek(f.node, 0);
			near(rect(f.node), before);
		} finally {
			releaseParent?.();
			spacer.remove();
			window.scrollTo(originalScroll.x, originalScroll.y);
			await f.dispose();
		}
	});
	it.each([false, true])(
		'preserves the child position when its transformed wrapper moves (automatic: %s)',
		async (automatic) => {
			const f = await fixture('rotate(30deg) scale(1.3, .8)');
			try {
				const before = rect(f.node);
				const change = () => {
					f.wrapper.style.left = '100px';
					f.wrapper.style.top = '40px';
				};
				if (automatic) change();
				else f.layout.update(change);
				await seek(f.node, 0);
				near(rect(f.node), before);
			} finally {
				await f.dispose();
			}
		}
	);
});
