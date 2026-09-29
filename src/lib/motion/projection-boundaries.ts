import { readTransformMatrix } from './css-transform.js';
import {
	HTMLProjectionNode,
	createBox,
	frame,
	cancelFrame,
	type IProjectionNode
} from 'motion-dom';

/** Keep aspect measurements intact when WebKit rounds opposite box edges differently. */
export function preserveAspectMeasurements(node: InstanceType<typeof HTMLProjectionNode>) {
	const measure = node.measure.bind(node);
	node.measure = (removeTransform = true) => {
		const measured = measure(removeTransform);
		if (node.options.animationType !== 'preserve-aspect') return measured;
		let exact = node.removeElementScroll(measured.measuredBox);
		if (removeTransform) exact = node.removeTransform(exact);
		// Retain Motion's rounded origin to avoid Safari position jitter, but do
		// not turn a 200.00002px extent into 201px by rounding both endpoints.
		for (const axis of ['x', 'y'] as const)
			measured.layoutBox[axis].max =
				measured.layoutBox[axis].min + exact[axis].max - exact[axis].min;
		return measured;
	};
}

/** Account only for the scroll that actually moves a sticky box, including its end constraint. */
export function correctStickyScroll(node: IProjectionNode, element: HTMLElement) {
	if (!node.scroll || getComputedStyle(element).position !== 'sticky') return;
	const x = element.offsetLeft;
	const y = element.offsetTop;
	const insets = new Map(
		['top', 'right', 'bottom', 'left'].map((property) => [
			property,
			{
				value: element.style.getPropertyValue(property),
				priority: element.style.getPropertyPriority(property)
			}
		])
	);
	try {
		for (const property of insets.keys()) element.style.setProperty(property, 'auto', 'important');
		node.scroll.offset.x = element.scrollLeft - (x - element.offsetLeft);
		node.scroll.offset.y = element.scrollTop - (y - element.offsetTop);
	} finally {
		for (const [property, { value, priority }] of insets) {
			if (value) element.style.setProperty(property, value, priority);
			else element.style.removeProperty(property);
		}
	}
}

export function observeProjectionScroll(
	node: InstanceType<typeof HTMLProjectionNode>,
	element: HTMLElement
) {
	const update = node.updateScroll.bind(node);
	const removeScroll = node.removeElementScroll.bind(node);
	const applyTransform = node.applyTransform.bind(node);
	let stickyOffset = { x: 0, y: 0 };
	node.updateScroll = (phase = 'measure') => {
		const position = getComputedStyle(element).position;
		if (position === 'sticky' || position === 'fixed') node.options.layoutScroll = true;
		update(phase);
		correctStickyScroll(node as IProjectionNode, element);
		stickyOffset =
			position === 'sticky' && node.scroll
				? {
						x: node.scroll.offset.x - element.scrollLeft,
						y: node.scroll.offset.y - element.scrollTop
					}
				: { x: 0, y: 0 };
	};
	// Motion removes ancestor scroll when measuring a participant. A sticky
	// participant also needs its own pinning displacement removed, otherwise a
	// child's layout update animates the parent's entry/exit or end constraint.
	node.removeElementScroll = (box) => {
		const corrected = removeScroll(box);
		corrected.x.min += stickyOffset.x;
		corrected.x.max += stickyOffset.x;
		corrected.y.min += stickyOffset.y;
		corrected.y.max += stickyOffset.y;
		return corrected;
	};
	node.applyTransform = (box, transformOnly, output) => {
		const transformed = applyTransform(box, transformOnly, output);
		if (!transformOnly) {
			transformed.x.min -= stickyOffset.x;
			transformed.x.max -= stickyOffset.x;
			transformed.y.min -= stickyOffset.y;
			transformed.y.max -= stickyOffset.y;
		}
		return transformed;
	};
}

/** Non-animating DOM ancestors still participate in Motion's measurement tree. */
export class ProjectionBoundary extends HTMLProjectionNode {
	private saved?: Map<string, { value: string; priority: string }>;
	private written = new Map<string, { value: string; priority: string }>();
	private element: HTMLElement;
	private authored?: DOMMatrix;
	private origin = { x: 0, y: 0, z: 0 };
	previousOffset?: { x: number; y: number };
	get affine() {
		return this.authored;
	}
	captureOffset() {
		// A newly registered parent has no measured origin yet. Comparing its
		// temporary zero origin to its first layout would invent wrapper movement.
		if (!this.layout || (this.parent?.instance instanceof HTMLElement && !this.parent.layout)) {
			this.previousOffset = undefined;
			return;
		}
		this.previousOffset = {
			x: this.layout.layoutBox.x.min - (this.parent?.layout?.layoutBox.x.min ?? 0),
			y: this.layout.layoutBox.y.min - (this.parent?.layout?.layoutBox.y.min ?? 0)
		};
	}

	constructor(element: HTMLElement, parent?: IProjectionNode) {
		super({}, parent);
		this.element = element;
		this.setOptions({
			layoutScroll: element !== element.ownerDocument.scrollingElement,
			alwaysMeasureLayout: true
		});
		this.mount(element);
	}

	private restoreProperty(property: string) {
		const saved = this.saved?.get(property);
		if (!saved) return;
		const last = this.written.get(property);
		if (
			!last ||
			(this.element.style.getPropertyValue(property) === last.value &&
				this.element.style.getPropertyPriority(property) === last.priority)
		) {
			if (saved.value) this.element.style.setProperty(property, saved.value, saved.priority);
			else this.element.style.removeProperty(property);
		}
		this.saved!.delete(property);
		this.written.delete(property);
	}

	private restore = () => {
		if (!this.saved) return;
		for (const property of this.saved.keys()) this.restoreProperty(property);
		this.saved = undefined;
		this.written.clear();
	};

	private write(property: string, value: string) {
		this.preserve();
		const last = this.written.get(property);
		const current = {
			value: this.element.style.getPropertyValue(property),
			priority: this.element.style.getPropertyPriority(property)
		};
		if (last && (last.value !== current.value || last.priority !== current.priority))
			this.saved!.set(property, current);
		this.element.style.setProperty(property, value, 'important');
		this.written.set(property, {
			value: this.element.style.getPropertyValue(property),
			priority: 'important'
		});
	}

	private preserve() {
		if (this.saved) return;
		this.saved = new Map(
			['transform', 'translate', 'rotate', 'scale', 'perspective'].map((key) => [
				key,
				{
					value: this.element.style.getPropertyValue(key),
					priority: this.element.style.getPropertyPriority(key)
				}
			])
		);
		frame.render(this.renderBoundary, false, true);
	}

	private renderBoundary = () => {
		// Perspective is suppressed only while measuring. It must be restored even
		// while this wrapper keeps a counter-scale transform during parent projection.
		this.restoreProperty('perspective');
		let x = 1,
			y = 1;
		for (const ancestor of this.path) {
			x *= ancestor.projectionDelta?.x.scale ?? 1;
			y *= ancestor.projectionDelta?.y.scale ?? 1;
		}
		if (!this.authored || (Math.abs(x - 1) < 1e-9 && Math.abs(y - 1) < 1e-9) || !x || !y) {
			this.restore();
			return;
		}
		this.preserve();
		const { x: ox, y: oy, z: oz } = this.origin;
		// Motion counter-scales descendants in the unrotated measurement space.
		// Conjugate the authored transform so that the browser applies the
		// inherited projection scale in that same space: S E' = E S.
		const matrix = new DOMMatrix()
			.translate(-ox, -oy, -oz)
			.scale(1 / x, 1 / y)
			.translate(ox, oy, oz)
			.multiply(this.authored)
			.translate(-ox, -oy, -oz)
			.scale(x, y)
			.translate(ox, oy, oz);
		for (const property of ['translate', 'rotate', 'scale']) this.write(property, 'none');
		this.write('transform', matrix.toString());
	};

	calcProjection() {
		super.calcProjection();
		if (this.authored || this.saved) frame.render(this.renderBoundary, false, true);
	}

	updateScroll(phase: 'snapshot' | 'measure' = 'measure') {
		super.updateScroll(phase);
		correctStickyScroll(this as IProjectionNode, this.element);
	}

	resetSkewAndRotation() {
		this.restore();
		this.authored = undefined;
		for (const key of Object.keys(this.latestValues)) delete this.latestValues[key];
		const css = getComputedStyle(this.element);
		const matrix = readTransformMatrix(this.element, css);
		// Measure a flat layout plane, then restore the full authored 4x4 transform.
		// Projected bounding boxes cannot be inverted as axis-aligned 2D boxes.
		const scaleX = matrix.is2D ? Math.hypot(matrix.a, matrix.b) : 1;
		const scaleY =
			matrix.is2D && scaleX ? Math.abs((matrix.a * matrix.d - matrix.b * matrix.c) / scaleX) : 1;
		if (!scaleX || !scaleY) return;
		if (css.perspective !== 'none') {
			this.preserve();
			this.write('perspective', 'none');
		}
		const [originX, originY, originZ = 0] = css.transformOrigin.split(' ').map(parseFloat);
		Object.assign(this.latestValues, {
			x: matrix.e,
			y: matrix.f,
			scaleX,
			scaleY,
			originX: originX / (this.element.offsetWidth || 1),
			originY: originY / (this.element.offsetHeight || 1)
		});
		if (
			css.transform !== 'none' ||
			css.translate !== 'none' ||
			css.rotate !== 'none' ||
			css.scale !== 'none'
		) {
			this.authored = matrix;
			this.origin = { x: originX, y: originY, z: originZ };
			this.preserve();
			for (const property of ['translate', 'rotate', 'scale']) this.write(property, 'none');
			this.write(
				'transform',
				`translate(${matrix.e}px, ${matrix.f}px) scale(${scaleX}, ${scaleY})`
			);
		}
	}

	resetTransform() {
		if (!this.saved) return;
		this.write('transform', 'none');
		this.shouldResetTransform = false;
	}

	measurePageBox(): import('framer-motion').Box {
		const rect = this.element.getBoundingClientRect();
		const box = createBox();
		const fixed = this.scroll?.wasRoot || this.path.some((ancestor) => ancestor.scroll?.wasRoot);
		const scroll = fixed ? undefined : this.root.scroll?.offset;
		box.x.min = rect.left + (scroll?.x ?? 0);
		box.x.max = rect.right + (scroll?.x ?? 0);
		box.y.min = rect.top + (scroll?.y ?? 0);
		box.y.max = rect.bottom + (scroll?.y ?? 0);
		return box;
	}

	unmount() {
		cancelFrame(this.renderBoundary);
		this.restore();
		super.unmount();
	}
}

/** Convert layout displacement of plain wrappers into their descendants' local axes. */
export function correctBoundarySnapshot(node: IProjectionNode) {
	if (!node.snapshot) return;
	let matrix = new DOMMatrix();
	let x = 0,
		y = 0;
	for (let index = node.path.length - 1; index >= 0; index--) {
		const ancestor = node.path[index];
		if (!(ancestor instanceof ProjectionBoundary)) continue;
		if (ancestor.affine) {
			const { a, b, c, d } = ancestor.affine;
			matrix = new DOMMatrix([a, b, c, d, 0, 0]).multiply(matrix);
		}
		if (!ancestor.previousOffset || !ancestor.layout) continue;
		const current = ancestor.layout.layoutBox;
		const parent = ancestor.parent?.layout?.layoutBox;
		const dx = current.x.min - (parent?.x.min ?? 0) - ancestor.previousOffset.x;
		const dy = current.y.min - (parent?.y.min ?? 0) - ancestor.previousOffset.y;
		if (!dx && !dy) continue;
		const local = matrix.inverse().transformPoint({ x: dx, y: dy });
		if (!Number.isFinite(local.x) || !Number.isFinite(local.y)) continue;
		x += dx - local.x;
		y += dy - local.y;
	}
	for (const box of [node.snapshot.layoutBox, node.snapshot.measuredBox]) {
		box.x.min += x;
		box.x.max += x;
		box.y.min += y;
		box.y.max += y;
	}
}
