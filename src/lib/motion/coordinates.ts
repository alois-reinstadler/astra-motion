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
		const style = view.getComputedStyle(element);
		let matrix = new DOMMatrix();
		if (style.rotate && style.rotate !== 'none') {
			const parts = style.rotate.split(' ');
			const angle = parts.at(-1)!;
			const amount = parseFloat(angle);
			const degrees = angle.endsWith('grad')
				? amount * 0.9
				: angle.endsWith('turn')
					? amount * 360
					: angle.endsWith('rad')
						? (amount * 180) / Math.PI
						: amount;
			if (parts.length === 1 || parts[0] === 'z') matrix = matrix.rotate(degrees);
		}
		if (style.scale && style.scale !== 'none') {
			const [x, y = x] = style.scale.split(' ').map(Number);
			matrix = matrix.scale(x, y);
		}
		if (style.transform && style.transform !== 'none')
			matrix = matrix.multiply(new DOMMatrix(style.transform));
		const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
		if (!matrix.is2D || Math.abs(determinant) < 1e-10) return point;
		const rect = element.getBoundingClientRect();
		const center = {
			x: rect.left + view.scrollX + rect.width / 2,
			y: rect.top + view.scrollY + rect.height / 2
		};
		const dx = point.x - center.x;
		const dy = point.y - center.y;
		return {
			x: center.x + (matrix.d * dx - matrix.c * dy) / determinant,
			y: center.y + (-matrix.b * dx + matrix.a * dy) / determinant
		};
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
