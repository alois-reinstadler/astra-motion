import { expect, it } from 'vitest';
import { visualElementStore, type IProjectionNode } from 'motion-dom';
import { createLayout, type LayoutOptions } from '../motion/layout.js';
import { projectAfterCommit } from './auto-snapshot-spike.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const commit = async (nodes: IProjectionNode[]) => {
	projectAfterCommit(nodes);
	await Promise.resolve();
	await Promise.resolve();
};

it.each(['plain', 'nested', 'scroll', 'authored-scale', 'ancestor-scale'])(
	'retargets after DOM commit from cached Motion geometry: %s',
	async (variant) => {
		const layout = createLayout({ automatic: false, transition: { duration: 1, ease: 'linear' } });
		const host = document.createElement('div');
		host.style.cssText = 'position:relative;width:500px;height:300px;overflow:auto';
		const parent = document.createElement('div');
		parent.style.cssText = 'position:relative;width:300px;height:200px;margin-left:20px';
		const child = document.createElement('div');
		child.style.cssText = 'position:relative;width:50px;height:40px;left:10px;top:5px';
		parent.append(child);
		host.append(parent);
		document.body.append(host);
		const cleanups: Array<void | (() => void)> = [];
		const elements: HTMLElement[] = [];
		function attach(node: HTMLElement, options: LayoutOptions = {}) {
			cleanups.push(layout(options)(node));
			elements.push(node);
		}
		if (variant === 'scroll') {
			host.style.width = '200px';
			host.scrollLeft = 30;
			attach(host, { scroll: true });
		}
		if (variant !== 'plain')
			attach(parent, variant === 'ancestor-scale' ? { style: { scale: 0.8 } } : {});
		attach(child, variant === 'authored-scale' ? { style: { scale: 0.8, rotate: 0 } } : {});
		await Promise.resolve();
		await frame();
		await frame();
		const nodes = elements.map((element) => visualElementStore.get(element)!.projection!);
		// Establish the initial committed measurement once at registration.
		await commit(nodes);
		await frame();
		const sample = () => child.getBoundingClientRect();
		const close = (before: DOMRect, after: DOMRect) => {
			expect(Math.abs(after.x - before.x), `${variant}: x continuity`).toBeLessThan(1);
			expect(Math.abs(after.y - before.y), `${variant}: y continuity`).toBeLessThan(1);
			expect(Math.abs(after.width - before.width), `${variant}: width continuity`).toBeLessThan(1);
			expect(Math.abs(after.height - before.height), `${variant}: height continuity`).toBeLessThan(
				1
			);
		};
		try {
			const before = sample();
			child.style.left = '180px';
			child.style.width = '100px';
			if (variant !== 'plain') {
				parent.style.width = '440px';
				parent.style.marginLeft = '40px';
			}
			await commit(nodes);
			close(before, sample());
			await frame();
			const animations = new Set(nodes.map((node) => node.currentAnimation));
			for (const animation of animations) {
				if (!animation) continue;
				animation.pause();
				animation.time = 0.3;
			}
			await frame();
			await frame();
			const intermediate = sample();
			expect(Math.abs(intermediate.x - before.x)).toBeGreaterThan(10);
			child.style.left = '30px';
			child.style.width = '70px';
			if (variant !== 'plain') {
				parent.style.width = '350px';
				parent.style.marginLeft = '5px';
			}
			await commit(nodes);
			close(intermediate, sample());
		} finally {
			cleanups.reverse().forEach((cleanup) => cleanup?.());
			host.remove();
			await Promise.resolve();
		}
	}
);

it.each(['plain', 'scaled', 'scroll', 'scroll-scaled', 'native-scroll', 'scroll-root'])(
	'hands off a removed shared node after DOM commit: %s',
	async (variant) => {
		const scaled = variant.includes('scaled');
		const scrolled = variant.includes('scroll');
		const layout = createLayout({ automatic: false, transition: { duration: 1, ease: 'linear' } });
		const host = document.createElement('div');
		host.style.cssText = 'position:relative;width:500px;height:300px';
		if (scrolled) host.style.cssText = 'position:relative;width:200px;height:300px;overflow:auto';
		const container = document.createElement('div');
		container.style.cssText = 'position:relative;width:600px;height:200px';
		host.append(container);
		document.body.append(host);
		const disposeHost = scrolled
			? layout({ scroll: true, root: variant === 'scroll-root' })(host)
			: undefined;
		const make = (left: number, width: number) => {
			const element = document.createElement('div');
			element.style.cssText = `position:relative;left:${left}px;width:${width}px;height:${width / 1.2}px`;
			container.append(element);
			const cleanup = layout({ id: 'shared', style: scaled ? { scale: 0.8 } : undefined })(element);
			return { element, cleanup };
		};
		let current = make(0, 50);
		await Promise.resolve();
		await frame();
		const sharedNodes = (element: HTMLElement) => [
			...(scrolled ? [visualElementStore.get(host)!.projection!] : []),
			visualElementStore.get(element)!.projection!
		];
		await commit(sharedNodes(current.element));
		try {
			for (const [left, width] of [
				[180, 100],
				[20, 60],
				[150, 80]
			]) {
				const old = current;
				if (scrolled && left === 20) host.scrollLeft = 40;
				const before = old.element.getBoundingClientRect();
				const previousNodes = sharedNodes(old.element);
				const replace = () => {
					old.element.remove();
					current = make(left, width);
					old.cleanup?.();
				};
				if (variant === 'native-scroll') {
					layout.update(replace);
					await Promise.resolve();
					await Promise.resolve();
				} else {
					replace();
					await commit(previousNodes);
				}
				const after = current.element.getBoundingClientRect();
				expect(
					Math.abs(after.x - before.x),
					JSON.stringify({
						variant,
						left,
						before,
						after,
						scroll: host.scrollLeft,
						sourceTarget: previousNodes.at(-1)?.target,
						sourceLayout: previousNodes.at(-1)?.layout
					})
				).toBeLessThan(1);
				expect(Math.abs(after.width - before.width), 'shared width continuity').toBeLessThan(1);
				expect(
					after.width / after.height,
					'Shared aspect must preserve subpixel dimensions'
				).toBeCloseTo(1.2, 2);
				await frame();
				const animation = visualElementStore.get(current.element)!.projection!.currentAnimation!;
				expect(animation).toBeDefined();
				animation.pause();
				animation.time = 0.3;
				await frame();
				await frame();
				const midway = current.element.getBoundingClientRect();
				expect(midway.width / midway.height, 'Intermediate shared aspect').toBeCloseTo(1.2, 2);
			}
		} finally {
			current.cleanup?.();
			disposeHost?.();
			host.remove();
			await Promise.resolve();
		}
	}
);
