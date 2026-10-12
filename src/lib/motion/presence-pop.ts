import { cancelFrame, frame } from 'motion-dom';
import { presenceMeasurements, queueLayoutMutation } from './commit.js';
import { layoutOrigin } from './css-transform.js';
import {
	measurePresenceBox,
	presenceRoots,
	type PresenceBox,
	type PresenceBoxes
} from './presence-measure.js';

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
	boxes?: Pick<PresenceBoxes, 'get'>
): () => void {
	const captures = presenceRoots(nodes).map((element) => {
		const saved = boxes?.get(element);
		// Projection transforms may change offsetParent without reparenting the node.
		// Keep its last present dimensions and rebase its parent-local coordinates.
		const box =
			saved && saved.domParent === element.parentElement ? saved : measurePresenceBox(element);
		const { width, height, left, top, right, bottom, direction, boxSizing } = box;
		const horizontal =
			(options.anchorX ?? 'left') === (direction === 'rtl' ? 'right' : 'left')
				? `left:${left}px!important;right:auto!important;`
				: `right:${right}px!important;left:auto!important;`;
		const vertical =
			options.anchorY === 'bottom'
				? `bottom:${bottom}px!important;top:auto!important;`
				: `top:${top}px!important;bottom:auto!important;`;
		return { element, box, width, height, boxSizing, horizontal, vertical };
	});
	let alive = true;
	const cleanup: (() => void)[] = [];
	queueLayoutMutation(() => {
		if (!alive) return;
		for (const { element, box, width, height, boxSizing, horizontal, vertical } of captures) {
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
			const rule = style.sheet?.cssRules[0] as CSSStyleRule | undefined;
			const refresh = () => {
				if (!alive || !rule || element.getAttribute('data-astra-presence-pop') !== id) return;
				const offsets = popOffsets(element, box);
				const horizontalProperty =
					(options.anchorX ?? 'left') === (box.direction === 'rtl' ? 'right' : 'left')
						? 'left'
						: 'right';
				const verticalProperty = options.anchorY === 'bottom' ? 'bottom' : 'top';
				for (const property of [horizontalProperty, verticalProperty] as const) {
					const value = `${offsets[property]}px`;
					if (rule.style.getPropertyValue(property) !== value)
						rule.style.setProperty(property, value, 'important');
				}
			};
			let preparations = presenceMeasurements.get(element);
			if (!preparations) presenceMeasurements.set(element, (preparations = new Set()));
			preparations.add(refresh);
			refresh();
			// Only active retained exits own this callback; no subscriptions while present.
			frame.postRender(refresh, true);
			cleanup.push(() => {
				cancelFrame(refresh);
				preparations.delete(refresh);
				if (!preparations.size) presenceMeasurements.delete(element);
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

/** Convert the captured parent-local box to the current absolute positioning context. */
function popOffsets(element: HTMLElement, box: PresenceBox) {
	const parent = box.domParent;
	const containing = element.offsetParent as HTMLElement | null;
	if (!parent || parent !== element.parentElement) return box;
	const origin = layoutOrigin(parent);
	const containingOrigin = containing ? layoutOrigin(containing) : { x: 0, y: 0 };
	const x =
		origin.x +
		parent.clientLeft -
		parent.scrollLeft -
		containingOrigin.x -
		(containing?.clientLeft ?? 0) +
		(containing?.scrollLeft ?? 0);
	const y =
		origin.y +
		parent.clientTop -
		parent.scrollTop -
		containingOrigin.y -
		(containing?.clientTop ?? 0) +
		(containing?.scrollTop ?? 0);
	// Used margins can change when a normal-flow RTL box becomes absolute
	// (notably WebKit's over-constrained inline margin). Preserve border edges.
	const computed = getComputedStyle(element);
	return {
		left: x + box.localLeft - (parseFloat(computed.marginLeft) || 0),
		top: y + box.localTop - (parseFloat(computed.marginTop) || 0),
		right:
			(containing?.clientWidth ?? element.ownerDocument.documentElement.clientWidth) -
			x -
			parent.clientWidth +
			box.localRight -
			(parseFloat(computed.marginRight) || 0),
		bottom:
			(containing?.clientHeight ?? element.ownerDocument.documentElement.clientHeight) -
			y -
			parent.clientHeight +
			box.localBottom -
			(parseFloat(computed.marginBottom) || 0)
	};
}
