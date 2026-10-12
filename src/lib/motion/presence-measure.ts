import { beforeCommit, currentPresenceSnapshot } from './commit.js';
import { observeLayout } from './observe.js';
import { layoutOrigin } from './css-transform.js';

export interface PresenceBox {
	parent: Element | null;
	domParent: HTMLElement | null;
	localLeft: number;
	localTop: number;
	localRight: number;
	localBottom: number;
	width: string;
	height: string;
	boxSizing: string;
	left: number;
	top: number;
	right: number;
	bottom: number;
	direction: string;
}

/** Observation can advance without replacing an open transaction's origin. */
export function createPresenceBoxes() {
	const observed = new WeakMap<HTMLElement, PresenceBox>();
	const captured = new WeakMap<HTMLElement, { owner: symbol; box: PresenceBox }>();
	return {
		get(node: HTMLElement): PresenceBox | undefined {
			const origin = captured.get(node);
			return origin && origin.owner === currentPresenceSnapshot() ? origin.box : observed.get(node);
		},
		observe(node: HTMLElement) {
			observed.set(node, measurePresenceBox(node));
		},
		capture(node: HTMLElement) {
			const owner = currentPresenceSnapshot();
			if (owner && captured.get(node)?.owner === owner) return;
			const box = measurePresenceBox(node);
			observed.set(node, box);
			if (owner) captured.set(node, { owner, box });
		}
	};
}

export type PresenceBoxes = ReturnType<typeof createPresenceBoxes>;

export function presenceRoots(nodes: Iterable<HTMLElement | SVGElement>): HTMLElement[] {
	const flatten = (node: Element): Element[] =>
		getComputedStyle(node).display === 'contents' ? [...node.children].flatMap(flatten) : [node];
	const candidates = [...nodes].flatMap(flatten);
	return candidates.filter(
		(node): node is HTMLElement =>
			node instanceof node.ownerDocument.defaultView!.HTMLElement &&
			node.isConnected &&
			!candidates.some((other) => other !== node && other.contains(node))
	);
}

export function measurePresenceBox(element: HTMLElement): PresenceBox {
	const computed = getComputedStyle(element);
	const parent = element.offsetParent;
	const domParent = element.parentElement;
	const origin = layoutOrigin(element);
	const parentOrigin = domParent ? layoutOrigin(domParent) : { x: 0, y: 0 };
	const localLeft =
		origin.x - parentOrigin.x - (domParent?.clientLeft ?? 0) + (domParent?.scrollLeft ?? 0);
	const localTop =
		origin.y - parentOrigin.y - (domParent?.clientTop ?? 0) + (domParent?.scrollTop ?? 0);
	return {
		parent,
		domParent,
		localLeft,
		localTop,
		localRight:
			(domParent?.clientWidth ?? element.ownerDocument.documentElement.clientWidth) -
			localLeft -
			element.offsetWidth,
		localBottom:
			(domParent?.clientHeight ?? element.ownerDocument.documentElement.clientHeight) -
			localTop -
			element.offsetHeight,
		width: computed.width,
		height: computed.height,
		boxSizing: computed.boxSizing,
		left: element.offsetLeft - (parseFloat(computed.marginLeft) || 0),
		top: element.offsetTop - (parseFloat(computed.marginTop) || 0),
		right:
			(parent?.clientWidth ?? element.ownerDocument.documentElement.clientWidth) -
			element.offsetLeft -
			element.offsetWidth -
			(parseFloat(computed.marginRight) || 0),
		bottom:
			(parent?.clientHeight ?? element.ownerDocument.documentElement.clientHeight) -
			element.offsetTop -
			element.offsetHeight -
			(parseFloat(computed.marginBottom) || 0),
		direction: computed.direction
	};
}

type Capture = () => void;
const documents = new WeakMap<
	Document,
	{
		observer: ReturnType<typeof observeLayout>;
		owners: Map<HTMLElement, Set<Capture>>;
	}
>();

/** One observer per document, with no frame loop or reads for paint-only changes. */
function observe(node: HTMLElement, capture: Capture): () => void {
	const document = node.ownerDocument;
	let group = documents.get(document);
	if (!group) {
		const owners = new Map<HTMLElement, Set<Capture>>();
		const observer = observeLayout(document, (dirty) => {
			for (const node of dirty) for (const capture of owners.get(node) ?? []) capture();
		});
		group = { owners, observer };
		documents.set(document, group);
	}
	let owners = group.owners.get(node);
	if (!owners) {
		owners = new Set();
		group.owners.set(node, owners);
		group.observer.add(node, () => node.parentElement);
	}
	owners.add(capture);
	return () => {
		owners.delete(capture);
		if (!owners.size) {
			group.owners.delete(node);
			group.observer.remove(node);
		}
		if (!group.owners.size) {
			group.observer.disconnect();
			documents.delete(document);
		}
	};
}

/** Keep the last present layout. Exit must never replace it with already-reflowed geometry. */
export function observePresenceBoxes(
	nodes: Iterable<HTMLElement | SVGElement>,
	boxes: PresenceBoxes,
	isPresent: () => boolean
): () => void {
	const releases = presenceRoots(nodes).map((node) => {
		const capture = () => {
			if (node.isConnected && isPresent()) boxes.capture(node);
		};
		const refresh = () => {
			if (node.isConnected && isPresent()) boxes.observe(node);
		};
		capture();
		beforeCommit.add(capture);
		const release = observe(node, refresh);
		return () => {
			beforeCommit.delete(capture);
			release();
		};
	});
	return () => releases.forEach((release) => release());
}
