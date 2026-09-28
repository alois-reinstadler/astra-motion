/** Computed individual transforms precede the transform list, in CSS T R S order. */
export function readTransformMatrix(element: HTMLElement | SVGElement, css: CSSStyleDeclaration) {
	const size =
		element instanceof element.ownerDocument.defaultView!.HTMLElement
			? {
					width: (element as HTMLElement).offsetWidth,
					height: (element as HTMLElement).offsetHeight
				}
			: (element as SVGGraphicsElement).getBBox();
	const length = (value: string, extent: number) =>
		parseFloat(value) * (value.endsWith('%') ? extent / 100 : 1);
	let matrix = new DOMMatrix();
	if (css.translate && css.translate !== 'none') {
		const [x = '0', y = '0', z = '0'] = css.translate.split(' ');
		matrix = matrix.translate(length(x, size.width), length(y, size.height), parseFloat(z));
	}
	if (css.rotate && css.rotate !== 'none') {
		const parts = css.rotate.split(' ');
		const angle = parts.pop()!;
		const amount = parseFloat(angle);
		const degrees = angle.endsWith('grad')
			? amount * 0.9
			: angle.endsWith('turn')
				? amount * 360
				: angle.endsWith('rad')
					? (amount * 180) / Math.PI
					: amount;
		const axes =
			parts.length === 3
				? parts.map(Number)
				: parts[0] === 'x'
					? [1, 0, 0]
					: parts[0] === 'y'
						? [0, 1, 0]
						: [0, 0, 1];
		matrix = matrix.rotateAxisAngle(axes[0], axes[1], axes[2], degrees);
	}
	if (css.scale && css.scale !== 'none') {
		const [x, y = x, z = 1] = css.scale.split(' ').map((value) => length(value, 1));
		matrix = matrix.scale(x, y, z);
	}
	return matrix.multiply(new DOMMatrix(css.transform === 'none' ? undefined : css.transform));
}

/** The pre-transform page origin; offset metrics include current sticky positioning. */
function layoutOrigin(element: HTMLElement) {
	let x = 0,
		y = 0;
	for (
		let node: HTMLElement | null = element;
		node;
		node = node.offsetParent as HTMLElement | null
	) {
		x += node.offsetLeft;
		y += node.offsetTop;
		const parent = node.offsetParent as HTMLElement | null;
		if (parent) {
			x += parent.clientLeft;
			y += parent.clientTop;
		} else if (getComputedStyle(node).position === 'fixed') {
			x += node.ownerDocument.defaultView!.scrollX;
			y += node.ownerDocument.defaultView!.scrollY;
		}
	}
	for (let node = element.parentElement; node; node = node.parentElement) {
		if (node === element.ownerDocument.scrollingElement) continue;
		x -= node.scrollLeft;
		y -= node.scrollTop;
	}
	return { x, y };
}

/** Compose ancestor CSS transforms and child perspective before projecting the z=0 plane. */
export function readPagePlane(element: HTMLElement) {
	const chain: HTMLElement[] = [];
	for (let node: HTMLElement | null = element; node; node = node.parentElement) chain.unshift(node);
	let matrix = new DOMMatrix();
	let previous = { x: 0, y: 0 };
	for (const node of chain) {
		const origin = layoutOrigin(node);
		const css = getComputedStyle(node);
		const [ox = 0, oy = 0, oz = 0] = css.transformOrigin.split(' ').map(parseFloat);
		matrix = matrix
			.translate(origin.x - previous.x, origin.y - previous.y)
			.translate(ox, oy, oz)
			.multiply(readTransformMatrix(node, css))
			.translate(-ox, -oy, -oz);
		previous = origin;
		if (node === element) break;
		// A flat ancestor composites its children into its own plane before its transform.
		if (css.transformStyle !== 'preserve-3d') {
			const flatten = new DOMMatrix();
			flatten.m33 = 0;
			matrix = matrix.multiply(flatten);
		}
		if (css.perspective !== 'none') {
			const [px, py] = css.perspectiveOrigin.split(' ').map(parseFloat);
			const perspective = new DOMMatrix();
			perspective.m34 = -1 / Math.max(1, parseFloat(css.perspective));
			matrix = matrix.translate(px, py).multiply(perspective).translate(-px, -py);
		}
	}
	return { matrix, origin: previous };
}
