import { eager_effect, effect_root } from 'virtual:probe-effects';
import { install, captureDeferred, inCapture } from './hooks.js';
export const writeStats = { callbacks: 0, mutations: [] };
// ponytail: global prototype interception is experiment-only; scope filtering cannot
// observe CSSOM, font/viewport reflow, shadow roots, or cached native method references.
export function installWriteProbe(mode, host, read) {
	const restoreCapture = install(mode);
	writeStats.callbacks = 0;
	writeStats.mutations = [];
	const restorers = [];
	let disposed = false;
	const capture = (method) => {
		writeStats.callbacks++;
		if (!inCapture()) writeStats.mutations.push(method);
		captureDeferred(mode === 'eager-tick');
	};
	try {
		// ponytail: reading every index after each proxy write makes reverse/splice O(n²);
		// snapshot coalescing does not coalesce dependency getter work.
		if (mode === 'eager' || mode === 'eager-tick') {
			let initial = true;
			restorers.push(
				effect_root(() => {
					eager_effect(() => {
						read();
						if (!initial) capture('eager');
						initial = false;
					});
				})
			);
		}
		if (mode === 'dom') {
			const owners = new WeakMap();
			for (const node of [host, ...host.querySelectorAll('*')]) owners.set(node.style, node);
			const inside = (node) => node instanceof Node && host.contains(node);
			const patch = (proto, name, change) => {
				const original = Object.getOwnPropertyDescriptor(proto, name);
				if (!original) throw new Error(`Missing native descriptor: ${name}`);
				const replacement = change(original);
				Object.defineProperty(proto, name, replacement);
				restorers.push(() => Object.defineProperty(proto, name, original));
			};
			const method = (proto, name, relevant) =>
				patch(proto, name, (descriptor) => ({
					...descriptor,
					value: function (...args) {
						if (relevant(this, args)) capture(name);
						return descriptor.value.apply(this, args);
					}
				}));
			const setter = (proto, name, relevant) =>
				patch(proto, name, (descriptor) => ({
					...descriptor,
					set: function (value) {
						if (relevant(this, value)) capture(name);
						return descriptor.set.call(this, value);
					}
				}));
			for (const proto of [HTMLElement.prototype, SVGElement.prototype]) {
				patch(proto, 'style', (descriptor) => ({
					...descriptor,
					get: function () {
						const style = descriptor.get.call(this);
						owners.set(style, this);
						return style;
					}
				}));
			}
			for (const name of ['insertBefore', 'appendChild', 'removeChild', 'replaceChild'])
				method(Node.prototype, name, inside);
			for (const proto of [Element.prototype, CharacterData.prototype])
				for (const name of ['before', 'after', 'remove', 'replaceWith'])
					method(proto, name, (node) => inside(node.parentNode));
			for (const name of ['append', 'prepend', 'replaceChildren'])
				method(Element.prototype, name, inside);
			for (const name of ['nodeValue', 'textContent']) setter(Node.prototype, name, inside);
			setter(Element.prototype, 'innerHTML', inside);
			method(
				Element.prototype,
				'setAttribute',
				(node, args) => inside(node) && args[0] !== 'style'
			);
			method(Element.prototype, 'removeAttribute', inside);
			const paint = new Set([
				'transform',
				'opacity',
				'visibility',
				'will-change',
				'transform-origin'
			]);
			for (const name of ['setProperty', 'removeProperty'])
				method(
					CSSStyleDeclaration.prototype,
					name,
					(style, args) => inside(owners.get(style)) && !paint.has(args[0])
				);
			// ponytail: cssText is conservatively all geometry; Motion uses direct transform/opacity.
			setter(CSSStyleDeclaration.prototype, 'cssText', (style) => inside(owners.get(style)));
		}
	} catch (error) {
		for (const restore of restorers.reverse()) restore();
		restoreCapture();
		throw error;
	}
	return () => {
		if (disposed) return;
		disposed = true;
		try {
			// Stop writes/subscriptions from opening transactions during finalization.
			for (const restore of restorers.reverse()) restore();
		} finally {
			restoreCapture();
		}
	};
}
