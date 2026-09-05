/** Observe mutation records and registered boxes, never scan the document. */
export function observeLayout(document: Document, changed: (nodes: Set<HTMLElement>) => void) {
	const nodes = new Map<HTMLElement, () => Element | null | undefined>();
	const roots = new Map<Element, Set<HTMLElement>>();
	const ancestors = new Map<Element, Set<HTMLElement>>();
	const paths = new Map<HTMLElement, { root: Element; ancestors: Element[] }>();
	const styles = new WeakMap<Element, string>();
	const sizes = new WeakMap<Element, string>();
	const parser = document.createElement('div').style;
	const owned = new Set([
		'transform',
		'transform-origin',
		'opacity',
		'visibility',
		'pointer-events',
		'border-radius',
		'border-top-left-radius',
		'border-top-right-radius',
		'border-bottom-left-radius',
		'border-bottom-right-radius',
		'box-shadow',
		'color',
		'background-color',
		'border-color',
		'border-top-color',
		'border-right-color',
		'border-bottom-color',
		'border-left-color',
		'outline-color',
		'text-shadow',
		'fill',
		'stroke'
	]);
	const signature = (style: CSSStyleDeclaration) =>
		Array.from(style)
			.filter((key) => !owned.has(key))
			.sort()
			.map((key) => `${key}:${style.getPropertyValue(key)}!${style.getPropertyPriority(key)}`)
			.join(';');
	function removePath(node: HTMLElement) {
		const path = paths.get(node);
		if (!path) return;
		const members = roots.get(path.root)!;
		members.delete(node);
		if (!members.size) roots.delete(path.root);
		for (const ancestor of path.ancestors) {
			const descendants = ancestors.get(ancestor)!;
			descendants.delete(node);
			if (!descendants.size) {
				ancestors.delete(ancestor);
				resize.unobserve(ancestor);
			}
		}
		paths.delete(node);
	}
	function refreshPath(node: HTMLElement, root: Element) {
		const path: Element[] = [];
		for (let current: Element | null = node; current; current = current.parentElement) {
			path.push(current);
		}
		const previous = paths.get(node);
		if (
			previous?.root === root &&
			previous.ancestors.length === path.length &&
			previous.ancestors.every((ancestor, index) => ancestor === path[index])
		)
			return false;
		removePath(node);
		if (!roots.has(root)) roots.set(root, new Set());
		roots.get(root)!.add(node);
		for (const ancestor of path) {
			if (!ancestors.has(ancestor)) {
				ancestors.set(ancestor, new Set());
				resize.observe(ancestor);
			}
			ancestors.get(ancestor)!.add(node);
		}
		paths.set(node, { root, ancestors: path });
		return true;
	}
	function recordsChanged(records: MutationRecord[]) {
		const dirty = new Set<HTMLElement>();
		const checkedStyles = new Set<Element>();
		const expanded = new Set<Set<HTMLElement>>();
		const visitedPaths = new Set<Element>();
		function include(members: Set<HTMLElement> | undefined) {
			if (!members || expanded.has(members) || dirty.size === nodes.size) return;
			expanded.add(members);
			for (const node of members) dirty.add(node);
		}
		for (const record of records) {
			const element =
				record.target instanceof Element ? record.target : record.target.parentElement;
			if (!element) continue;
			// Motion writes these styles every frame. Reject/coalesce them before
			// expanding shared roots, which can contain every participant in a list.
			if (record.type === 'attributes' && record.attributeName === 'style') {
				if (checkedStyles.has(element)) continue;
				checkedStyles.add(element);
				let previous = styles.get(element);
				if (previous === undefined) {
					parser.cssText = record.oldValue ?? '';
					previous = signature(parser);
				}
				const next = signature((element as HTMLElement).style);
				styles.set(element, next);
				if (previous === next) continue;
			}
			include(ancestors.get(element));
			// Every matching root contributes only once per mutation batch, even
			// when many changed siblings walk through the same ancestor chain.
			for (let current: Element | null = element; current; current = current.parentElement) {
				if (visitedPaths.has(current)) break;
				visitedPaths.add(current);
				include(roots.get(current));
			}
		}
		return dirty;
	}
	const mutations = new MutationObserver((records) => {
		const dirty = recordsChanged(records);
		// Reparenting can change both inferred roots and ancestor subscriptions.
		if (records.some((record) => record.type === 'childList')) {
			for (const [node, readRoot] of nodes) {
				const root = readRoot() ?? node.parentElement ?? node;
				if (refreshPath(node, root)) dirty.add(node);
			}
		}
		if (dirty.size) changed(dirty);
	});
	mutations.observe(document.documentElement, {
		subtree: true,
		childList: true,
		characterData: true,
		attributes: true,
		attributeOldValue: true
	});
	const resize = new ResizeObserver((entries) => {
		const dirty = new Set<HTMLElement>();
		for (const entry of entries) {
			const box = entry.borderBoxSize[0];
			const next = box
				? `${box.inlineSize},${box.blockSize}`
				: `${entry.contentRect.width},${entry.contentRect.height}`;
			const previous = sizes.get(entry.target);
			sizes.set(entry.target, next);
			if (previous !== undefined && previous !== next) {
				for (const node of ancestors.get(entry.target) ?? []) dirty.add(node);
			}
		}
		if (dirty.size) changed(dirty);
	});
	return {
		add(node: HTMLElement, readRoot: () => Element | null | undefined) {
			const root = readRoot() ?? node.parentElement ?? node;
			if (node.isConnected && !root.contains(node)) {
				throw new Error('Astra layout: observationRoot must contain its layout participants.');
			}
			nodes.set(node, readRoot);
			if (!paths.has(node)) styles.set(node, signature(node.style));
			refreshPath(node, root);
		},
		remove(node: HTMLElement) {
			nodes.delete(node);
			removePath(node);
		},
		/** Explicit commits already cover their mutations; update signatures and discard records. */
		acknowledge() {
			recordsChanged(mutations.takeRecords());
		},
		disconnect() {
			mutations.disconnect();
			resize.disconnect();
			nodes.clear();
			ancestors.clear();
			roots.clear();
			paths.clear();
		}
	};
}
