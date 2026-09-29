import type { TargetAndTransition } from './animation-types.js';
import type { VariantLabels } from 'motion-dom';
import type {
	HTMLVisualElement,
	SVGVisualElement,
	InertiaOptions,
	MotionNodeDragHandlers,
	MotionNodeFocusHandlers,
	MotionNodeHoverHandlers,
	MotionNodePanHandlers,
	MotionNodeTapHandlers,
	MotionNodeViewportOptions
} from 'motion-dom';
import type { ElementReference, MotionPoint } from './coordinates.js';
import type { DragControls } from './drag-controls.js';
import { attachBaseGestures } from './base-gestures.js';
import { attachDragGestures, type DragGestureCleanup } from './drag-gestures.js';
export { validateDragConstraints, resolveDragElastic, constrainDrag } from './drag-gestures.js';

export type GestureState = 'whileHover' | 'whileTap' | 'whileFocus' | 'whileInView' | 'whileDrag';
export type GestureElement = HTMLElement | SVGElement;
type GestureVisual = HTMLVisualElement | SVGVisualElement;

/** Translation bounds, in CSS pixels, relative to the element's layout position. */
export interface DragConstraints {
	left?: number;
	right?: number;
	top?: number;
	bottom?: number;
}
export type DragConstraintSource = DragConstraints | ElementReference<GestureElement> | false;
export type DragElastic = boolean | number | DragConstraints;

export interface GestureOptions
	extends
		MotionNodeHoverHandlers,
		MotionNodeTapHandlers,
		MotionNodeFocusHandlers,
		Omit<MotionNodeViewportOptions, 'viewport'>,
		MotionNodePanHandlers,
		MotionNodeDragHandlers {
	disabled?: boolean;
	whileHover?: TargetAndTransition | VariantLabels;
	whileTap?: TargetAndTransition | VariantLabels;
	whileFocus?: TargetAndTransition | VariantLabels;
	whileInView?: TargetAndTransition | VariantLabels;
	whileDrag?: TargetAndTransition | VariantLabels;
	drag?: boolean | 'x' | 'y';
	dragConstraints?: DragConstraintSource;
	dragMomentum?: boolean;
	dragTransition?: InertiaOptions;
	dragElastic?: DragElastic;
	dragDirectionLock?: boolean;
	dragPropagation?: boolean;
	dragListener?: boolean;
	dragSnapToOrigin?: boolean | 'x' | 'y';
	dragControls?: DragControls;
	onMeasureDragConstraints?: (constraints: DragConstraints) => DragConstraints | void;
	propagate?: { tap?: boolean };
	transformPagePoint?: (point: MotionPoint) => MotionPoint;
	viewport?: Omit<NonNullable<MotionNodeViewportOptions['viewport']>, 'root'> & {
		root?: ElementReference<Element>;
	};
}

/** Full components compose the same adapters used by the isolated lazy feature bundles. */
export function attachMotionGestures(
	node: GestureElement,
	getOptions: () => GestureOptions,
	setActive: (name: GestureState, active: boolean) => void,
	visual: GestureVisual
): DragGestureCleanup {
	const base = attachBaseGestures(node, getOptions, setActive);
	try {
		const drag = attachDragGestures(node, getOptions, setActive, visual);
		return Object.assign(
			() => {
				drag();
				base();
			},
			{ update: drag.update }
		);
	} catch (error) {
		base();
		throw error;
	}
}
