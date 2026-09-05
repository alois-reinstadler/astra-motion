import {
	createBox,
	copyBoxInto,
	createDelta,
	calcBoxDelta,
	applyBoxDelta,
	type HTMLProjectionNode,
	type IProjectionNode,
	type Measurements
} from 'motion-dom';

/** Research only: seed Motion's normal commit from its last projected pose, after DOM mutation. */
export function projectAfterCommit(nodes: IProjectionNode[]) {
	const snapshots = new Map<InstanceType<typeof HTMLProjectionNode>, Measurements>();
	for (const candidate of nodes) {
		// The generic tree interface omits methods declared on the exported DOM constructor.
		const node = candidate as InstanceType<typeof HTMLProjectionNode>;
		if (!node.layout) continue;
		const layoutBox = createBox();
		copyBoxInto(
			layoutBox,
			node.target && node.resumingFrom
				? node.removeElementScroll(node.target)
				: (node.target ?? node.layout.layoutBox)
		);
		const measuredBox = node.removeElementScroll(node.layout.measuredBox);
		const delta = createDelta();
		calcBoxDelta(delta, node.layout.layoutBox, layoutBox);
		applyBoxDelta(measuredBox, delta);
		snapshots.set(node, {
			...node.layout,
			layoutBox,
			measuredBox,
			latestValues: { ...node.latestValues }
		});
	}
	const scrollNodes = new Set(nodes.flatMap((node) => [...node.path, node]));
	for (const node of scrollNodes) node.updateScroll('snapshot');
	for (const [node, snapshot] of snapshots)
		snapshot.measuredBox = node.applyTransform(snapshot.measuredBox);
	for (const [node, snapshot] of snapshots) node.snapshot = snapshot;
	for (const node of nodes) node.willUpdate();
	for (const root of new Set(nodes.map((node) => node.root))) root?.didUpdate();
}
