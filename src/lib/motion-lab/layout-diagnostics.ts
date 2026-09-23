/** Development-only measurement probe, imported explicitly through Vite by Chrome MCP.
 * Does not change projection algorithms, style output or the animation clock in record().
 * freeze() pauses/seeks the real controls for inspectable in-flight screenshots.
 */
import { HTMLProjectionNode, visualElementStore } from 'motion-dom';

type Selectors = Record<string, string>;
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

export function sample(selectors: Selectors) {
	return Object.fromEntries(
		Object.entries(selectors).map(([name, selector]) => {
			const node = document.querySelector<HTMLElement>(selector);
			if (!node) return [name, null];
			const rect = node.getBoundingClientRect();
			const projection = visualElementStore.get(node)?.projection;
			let scaleX = 1,
				scaleY = 1;
			for (let parent: Element | null = node; parent; parent = parent.parentElement) {
				const matrix = new DOMMatrix(getComputedStyle(parent).transform);
				scaleX *= Math.hypot(matrix.a, matrix.b);
				scaleY *= Math.hypot(matrix.c, matrix.d);
			}
			const css = getComputedStyle(node);
			return [
				name,
				{
					x: rect.x + scrollX,
					y: rect.y + scrollY,
					width: rect.width,
					height: rect.height,
					transform: node.style.transform,
					computed: css.transform,
					scaleX,
					scaleY,
					cssWidth: css.width,
					cssHeight: css.height,
					font: css.font,
					treeScale: clone(projection?.treeScale),
					layout: clone(projection?.layout),
					target: clone(projection?.target),
					active: !!projection?.currentAnimation
				}
			];
		})
	);
}

function environment() {
	return {
		userAgent: navigator.userAgent,
		dpr: devicePixelRatio,
		viewport: [innerWidth, innerHeight],
		scroll: [scrollX, scrollY],
		clientWidth: document.documentElement.clientWidth,
		fonts: document.fonts.status,
		images: [...document.images].map((image) => ({
			src: image.currentSrc,
			complete: image.complete,
			width: image.naturalWidth
		}))
	};
}

export async function record(
	selectors: Selectors,
	actions: { frame: number; selector: string }[],
	count = 105
) {
	await document.fonts.ready;
	await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
	const events: unknown[] = [];
	const prototype = HTMLProjectionNode.prototype;
	const original = prototype.notifyListeners;
	prototype.notifyListeners = function (name: string, ...args: unknown[]) {
		if (name === 'willUpdate' || name === 'didUpdate') {
			const element = this.instance;
			const label = Object.entries(selectors).find(([, selector]) =>
				element?.matches(selector)
			)?.[0];
			if (label)
				events.push({
					name,
					label,
					time: performance.now(),
					snapshot: clone(this.snapshot),
					data: clone(args)
				});
		}
		return original.call(this, name, ...args);
	};
	const before = environment();
	const frames = [];
	try {
		frames.push({ time: performance.now(), nodes: sample(selectors) });
		for (let index = 0; index < count; index++) {
			for (const action of actions.filter((action) => action.frame === index)) {
				const button = document.querySelector<HTMLButtonElement>(action.selector);
				if (!button) throw new Error(`Missing trigger: ${action.selector}`);
				button.click();
			}
			await frame();
			frames.push({ time: performance.now(), nodes: sample(selectors) });
		}
		return { before, after: environment(), actions, events, frames };
	} finally {
		prototype.notifyListeners = original;
	}
}

let resume: (() => void) | undefined;
export async function freeze(selectors: Selectors, trigger: string, time: number) {
	resume?.();
	document.querySelector<HTMLButtonElement>(trigger)!.click();
	await frame();
	await frame();
	const controls = new Set(
		[...document.querySelectorAll<HTMLElement>('body *')]
			.map((node) => visualElementStore.get(node)?.projection?.currentAnimation)
			.filter((control) => !!control)
	);
	if (!controls.size) throw new Error('No projection controls to freeze');
	for (const control of controls) {
		control.pause();
		control.time = time;
	}
	resume = () => {
		for (const control of controls) control.play();
		resume = undefined;
	};
	await frame();
	await frame();
	return { environment: environment(), time, controls: controls.size, nodes: sample(selectors) };
}

export function play() {
	resume?.();
}
