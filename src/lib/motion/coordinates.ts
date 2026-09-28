import { readPagePlane } from './css-transform.js';

export interface MotionPoint {
	x: number;
	y: number;
}

export type ElementReference<T extends Element = Element> =
	T | { current: T | null | undefined } | (() => T | null | undefined);

export function resolveElement<T extends Element>(
	source: ElementReference<T> | null | undefined
): T | undefined {
	if (typeof source === 'function') return source() ?? undefined;
	if (source && 'current' in source) return source.current ?? undefined;
	return source ?? undefined;
}

/** Convert page points into the local axes of a transformed parent. */
export function correctParentTransform(
	parent: ElementReference<HTMLElement | SVGElement>
): (point: MotionPoint) => MotionPoint {
	return (point) => {
		const element = resolveElement(parent);
		const view = element?.ownerDocument.defaultView;
		if (!element || !view) return point;
		if (element instanceof view.SVGGraphicsElement) {
			const matrix = element.getScreenCTM();
			if (!matrix || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-10) return point;
			const local = new DOMPoint(point.x - view.scrollX, point.y - view.scrollY).matrixTransform(
				matrix.inverse()
			);
			return Number.isFinite(local.x) && Number.isFinite(local.y)
				? { x: local.x, y: local.y }
				: point;
		}
		const { matrix: m, origin } = readPagePlane(element as HTMLElement);
		// Invert the projected plane (a 3x3 homography), not a 4D point with an invented z.
		const a = m.m11 - point.x * m.m14,
			b = m.m21 - point.x * m.m24;
		const c = m.m12 - point.y * m.m14,
			d = m.m22 - point.y * m.m24;
		const x = point.x * m.m44 - m.m41,
			y = point.y * m.m44 - m.m42;
		const determinant = a * d - b * c;
		if (Math.abs(determinant) < 1e-10) return point;
		const localX = (d * x - b * y) / determinant;
		const localY = (a * y - c * x) / determinant;
		return Number.isFinite(localX) && Number.isFinite(localY)
			? { x: origin.x + localX, y: origin.y + localY }
			: point;
	};
}

/** SVG's screen matrix includes viewBox origin, preserveAspectRatio and ancestor transforms. */
export function transformViewBoxPoint(
	svg: ElementReference<SVGSVGElement>
): (point: MotionPoint) => MotionPoint {
	return (point) => {
		const element = resolveElement(svg);
		const view = element?.ownerDocument.defaultView;
		const matrix = element?.getScreenCTM();
		if (!element || !view || !matrix || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-10)
			return point;
		const local = new DOMPoint(point.x - view.scrollX, point.y - view.scrollY).matrixTransform(
			matrix.inverse()
		);
		return Number.isFinite(local.x) && Number.isFinite(local.y)
			? { x: local.x, y: local.y }
			: point;
	};
}
