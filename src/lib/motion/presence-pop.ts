import { queueLayoutMutation } from './commit.js';

export interface PresencePopOptions {
	anchorX?: 'left' | 'right';
	anchorY?: 'top' | 'bottom';
	root?: HTMLElement | ShadowRoot;
	nonce?: string;
}

let nextId = 0;

/** Captures every root before any style write and releases only its own stylesheet/attribute. */
export function popPresenceNodes(
	nodes: Iterable<HTMLElement | SVGElement>,
	options: PresencePopOptions
): () => void {
	const flatten = (node: Element): Element[] =>
		getComputedStyle(node).display === 'contents' ? [...node.children].flatMap(flatten) : [node];
	const candidates = [...nodes].flatMap(flatten);
	const roots = candidates.filter(
		(node) =>
			node.isConnected && !candidates.some((other) => other !== node && other.contains(node))
	);
	const captures = roots.flatMap((node) => {
		if (!(node instanceof node.ownerDocument.defaultView!.HTMLElement)) return [];
		const element = node as HTMLElement;
		const computed = getComputedStyle(element);
		const parent = element.offsetParent as HTMLElement | null;
		const width = computed.width;
		const height = computed.height;
		const left = element.offsetLeft - (parseFloat(computed.marginLeft) || 0);
		const top = element.offsetTop - (parseFloat(computed.marginTop) || 0);
		const right =
			(parent?.clientWidth ?? node.ownerDocument.documentElement.clientWidth) -
			element.offsetLeft -
			element.offsetWidth -
			(parseFloat(computed.marginRight) || 0);
		const bottom =
			(parent?.clientHeight ?? node.ownerDocument.documentElement.clientHeight) -
			element.offsetTop -
			element.offsetHeight -
			(parseFloat(computed.marginBottom) || 0);
		const horizontal =
			(options.anchorX ?? 'left') === (computed.direction === 'rtl' ? 'right' : 'left')
				? `left:${left}px!important;right:auto!important;`
				: `right:${right}px!important;left:auto!important;`;
		const vertical =
			options.anchorY === 'bottom'
				? `bottom:${bottom}px!important;top:auto!important;`
				: `top:${top}px!important;bottom:auto!important;`;
		return [{ element, width, height, horizontal, vertical }];
	});
	let alive = true;
	const cleanup: (() => void)[] = [];
	queueLayoutMutation(() => {
		if (!alive) return;
		for (const { element, width, height, horizontal, vertical } of captures) {
			const id = `astra-pop-${++nextId}`;
			const previous = element.getAttribute('data-astra-presence-pop');
			element.setAttribute('data-astra-presence-pop', id);
			const style = element.ownerDocument.createElement('style');
			if (options.nonce) style.nonce = options.nonce;
			style.textContent = `[data-astra-presence-pop="${id}"]{position:absolute!important;width:${width}!important;height:${height}!important;${horizontal}${vertical}}`;
			(options.root ?? element.ownerDocument.head).appendChild(style);
			cleanup.push(() => {
				style.remove();
				if (element.getAttribute('data-astra-presence-pop') !== id) return;
				if (previous === null) element.removeAttribute('data-astra-presence-pop');
				else element.setAttribute('data-astra-presence-pop', previous);
			});
		}
	});
	return () => {
		alive = false;
		for (const dispose of cleanup) dispose();
	};
}
