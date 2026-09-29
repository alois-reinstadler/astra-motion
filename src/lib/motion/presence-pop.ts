import { queueLayoutMutation } from './commit.js';
import { measurePresenceBox, presenceRoots, type PresenceBox } from './presence-measure.js';

export interface PresencePopOptions {
	anchorX?: 'left' | 'right';
	anchorY?: 'top' | 'bottom';
	root?: HTMLElement | ShadowRoot;
	nonce?: string;
}

let nextId = 0;
const popOwners = new WeakMap<HTMLElement, { original: string | null; ids: string[] }>();

/** Captures every root before any style write and releases only its own stylesheet/attribute. */
export function popPresenceNodes(
	nodes: Iterable<HTMLElement | SVGElement>,
	options: PresencePopOptions,
	boxes?: WeakMap<HTMLElement, PresenceBox>
): () => void {
	const captures = presenceRoots(nodes).map((element) => {
		const saved = boxes?.get(element);
		// Offsets only make sense in the containing block in which they were measured.
		const box =
			saved && saved.parent === element.offsetParent ? saved : measurePresenceBox(element);
		const { width, height, left, top, right, bottom, direction, boxSizing } = box;
		const horizontal =
			(options.anchorX ?? 'left') === (direction === 'rtl' ? 'right' : 'left')
				? `left:${left}px!important;right:auto!important;`
				: `right:${right}px!important;left:auto!important;`;
		const vertical =
			options.anchorY === 'bottom'
				? `bottom:${bottom}px!important;top:auto!important;`
				: `top:${top}px!important;bottom:auto!important;`;
		return { element, width, height, boxSizing, horizontal, vertical };
	});
	let alive = true;
	const cleanup: (() => void)[] = [];
	queueLayoutMutation(() => {
		if (!alive) return;
		for (const { element, width, height, boxSizing, horizontal, vertical } of captures) {
			const id = `astra-pop-${++nextId}`;
			const current = element.getAttribute('data-astra-presence-pop');
			let owners = popOwners.get(element);
			if (!owners) {
				owners = { original: current, ids: [] };
				popOwners.set(element, owners);
			} else if (current === null || !owners.ids.includes(current)) owners.original = current;
			owners.ids.push(id);
			element.setAttribute('data-astra-presence-pop', id);
			const style = element.ownerDocument.createElement('style');
			if (options.nonce) style.nonce = options.nonce;
			style.textContent = `[data-astra-presence-pop="${id}"]{position:absolute!important;box-sizing:${boxSizing}!important;width:${width}!important;height:${height}!important;min-width:0!important;max-width:none!important;min-height:0!important;max-height:none!important;${horizontal}${vertical}}`;
			(options.root ?? element.ownerDocument.head).appendChild(style);
			cleanup.push(() => {
				style.remove();
				owners.ids.splice(owners.ids.indexOf(id), 1);
				if (!owners.ids.length) popOwners.delete(element);
				if (element.getAttribute('data-astra-presence-pop') !== id) return;
				const remaining = owners.ids.at(-1) ?? owners.original;
				if (remaining === null) element.removeAttribute('data-astra-presence-pop');
				else element.setAttribute('data-astra-presence-pop', remaining);
			});
		}
	}, true);
	return () => {
		if (!alive) return;
		alive = false;
		for (const dispose of cleanup) dispose();
	};
}
