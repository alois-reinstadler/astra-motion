import type { ViewAnimationOptions, ViewAnimationType } from './view-types.js';

export interface ViewParticipant {
	readonly id: string;
	readonly owner: symbol;
	readonly node: HTMLElement | SVGElement;
	options(): ViewAnimationOptions;
	isActive(): boolean;
}
export interface ViewSnapshot {
	readonly participant: ViewParticipant;
	readonly name: string;
	readonly options: ViewAnimationOptions;
	readonly fingerprint: string;
	readonly box: readonly number[];
}
export interface ViewChange {
	readonly name: string;
	readonly type: ViewAnimationType;
	readonly snapshot: ViewSnapshot;
}

const documents = new WeakMap<Document, Set<ViewParticipant>>();
const ownership = new WeakMap<Element, ViewParticipant>();
let nextViewId = 0;

export function createViewIdentity(): { id: string; owner: symbol } {
	const id = `auto-${++nextViewId}`;
	return { id, owner: Symbol(id) };
}

export function registerViewParticipant(participant: ViewParticipant): () => void {
	const { node } = participant;
	if (ownership.has(node))
		throw new Error('Astra AnimateView: an element can have only one view attachment.');
	ownership.set(node, participant);
	let entries = documents.get(node.ownerDocument);
	if (!entries) documents.set(node.ownerDocument, (entries = new Set()));
	entries.add(participant);
	let active = true;
	return () => {
		if (!active) return;
		active = false;
		entries.delete(participant);
		if (ownership.get(node) === participant) ownership.delete(node);
	};
}

/** CSS identifiers are encoded injectively, including arbitrary user names and multi-root suffixes. */
export function viewName(name: string, index: number): string {
	const value = JSON.stringify([name, index]);
	let result = 'astra_view_';
	for (let i = 0; i < value.length; i++)
		result += value.charCodeAt(i).toString(16).padStart(4, '0');
	return result;
}

function fingerprint(node: Element, boundary: ViewParticipant): string {
	const childBoundary = ownership.get(node);
	if (childBoundary && childBoundary.owner !== boundary.owner)
		return `<view:${childBoundary.options().name ?? childBoundary.id}>`;
	const attributes = [...node.attributes].map(({ name, value }) => [name, value]);
	const computed = node.ownerDocument.defaultView!.getComputedStyle(node);
	const styles = [...computed].map((name) => [name, computed.getPropertyValue(name)]);
	const children = [...node.childNodes].map((child) =>
		child.nodeType === 1 ? fingerprint(child as Element, boundary) : child.textContent
	);
	return JSON.stringify([node.nodeName, attributes, styles, children]);
}

export function snapshotViews(
	document: Document,
	diagnostic: (message: string) => void
): Map<string, ViewSnapshot> {
	const all = [...(documents.get(document) ?? [])].filter(
		(entry) => entry.node.isConnected && entry.isActive() && entry.node.getClientRects().length > 0
	);
	all.sort((a, b) => {
		if (a.node === b.node) return 0;
		return a.node.compareDocumentPosition(b.node) & 4 ? -1 : 1;
	});
	const indices = new Map<symbol, number>();
	const snapshots = new Map<string, ViewSnapshot>();
	const duplicates = new Set<string>();
	for (const participant of all) {
		const options = { ...participant.options() };
		const index = indices.get(participant.owner) ?? 0;
		indices.set(participant.owner, index + 1);
		const identity =
			options.name === undefined ? ['auto', participant.id] : ['named', options.name];
		const name = viewName(JSON.stringify(identity), index);
		if (snapshots.has(name) || duplicates.has(name)) {
			duplicates.add(name);
			snapshots.delete(name);
			diagnostic(
				`Duplicate AnimateView name ${JSON.stringify(options.name)}; this shared pair was skipped.`
			);
			continue;
		}
		const box = participant.node.getBoundingClientRect();
		snapshots.set(name, {
			participant,
			name,
			options,
			fingerprint: fingerprint(participant.node, participant),
			box: [box.left, box.top, box.width, box.height]
		});
	}
	return snapshots;
}

export function classifyViewChanges(
	before: ReadonlyMap<string, ViewSnapshot>,
	after: ReadonlyMap<string, ViewSnapshot>
): ViewChange[] {
	const changes: ViewChange[] = [];
	for (const name of new Set([...before.keys(), ...after.keys()])) {
		const previous = before.get(name);
		const next = after.get(name);
		if (!previous && next) changes.push({ name, type: 'enter', snapshot: next });
		else if (previous && !next) changes.push({ name, type: 'exit', snapshot: previous });
		else if (previous && next) {
			if (previous.participant.owner !== next.participant.owner)
				changes.push({ name, type: 'share', snapshot: next });
			else if (
				previous.fingerprint !== next.fingerprint ||
				previous.box.some((value, i) => value !== next.box[i])
			)
				changes.push({ name, type: 'update', snapshot: next });
		}
	}
	return changes;
}

export function applyViewNames(snapshots: ReadonlyMap<string, ViewSnapshot>): () => void {
	const saved = [...snapshots.values()].map(({ participant: { node }, name }) => {
		const value = node.style.getPropertyValue('view-transition-name');
		const priority = node.style.getPropertyPriority('view-transition-name');
		const hadStyle = node.hasAttribute('style');
		node.style.setProperty('view-transition-name', name, 'important');
		return { node, name, value, priority, hadStyle };
	});
	let restored = false;
	return () => {
		// A skipped native callback can arrive after a replacement capture has
		// installed the same names. This lease must release its writes only once.
		if (restored) return;
		restored = true;
		for (const { node, name, value, priority, hadStyle } of saved) {
			if (
				node.style.getPropertyValue('view-transition-name') !== name ||
				node.style.getPropertyPriority('view-transition-name') !== 'important'
			)
				continue;
			if (value) node.style.setProperty('view-transition-name', value, priority);
			else node.style.removeProperty('view-transition-name');
			if (!hadStyle && node.style.length === 0) node.removeAttribute('style');
		}
	};
}

/** A fluent transaction may not rename an element already owned by AnimateView. */
export function isRegisteredView(node: Element): boolean {
	return ownership.has(node);
}
