import { beforeCommit } from './commit.js';
import { observeLayout } from './observe.js';

export interface PresenceBox {
	parent: Element | null;
	width: string;
	height: string;
	boxSizing: string;
	left: number;
	top: number;
	right: number;
	bottom: number;
	direction: string;
}

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
	return {
		parent,
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
	boxes: WeakMap<HTMLElement, PresenceBox>,
	isPresent: () => boolean
): () => void {
	const releases = presenceRoots(nodes).map((node) => {
		const capture = () => {
			if (node.isConnected && isPresent()) boxes.set(node, measurePresenceBox(node));
		};
		capture();
		beforeCommit.add(capture);
		const release = observe(node, capture);
		return () => {
			beforeCommit.delete(capture);
			release();
		};
	});
	return () => releases.forEach((release) => release());
}
