import type { MotionOptions } from './motion.svelte.js';

/** Component conveniences; native CSS strings remain available alongside Motion style objects. */
export interface ComponentMotionProps extends Omit<MotionOptions, 'style' | 'disabled'> {
	/** Compatibility syntax. Defined top-level options take precedence. */
	motion?: MotionOptions;
	style?: string | MotionOptions['style'] | null;
	/** Also forwarded as a native attribute; motion.disabled only gates gestures. */
	disabled?: boolean | null;
}

// Exhaustive against MotionOptions so new engine options cannot silently leak to HTML.
const optionKeys = {
	initial: true,
	animate: true,
	exit: true,
	variants: true,
	custom: true,
	style: true,
	layout: true,
	layoutGroup: true,
	transition: true,
	layoutTransition: true,
	automatic: true,
	reducedMotion: true,
	disabled: true,
	whileHover: true,
	whileTap: true,
	whileFocus: true,
	whileInView: true,
	whileDrag: true,
	drag: true,
	dragConstraints: true,
	dragMomentum: true,
	dragTransition: true,
	viewport: true,
	onAnimationStart: true,
	onAnimationComplete: true,
	onUpdate: true,
	onHoverStart: true,
	onHoverEnd: true,
	onTap: true,
	onTapStart: true,
	onTapCancel: true,
	onPan: true,
	onPanStart: true,
	onPanEnd: true,
	onPanSessionStart: true,
	onDrag: true,
	onDragStart: true,
	onDragEnd: true,
	onViewportEnter: true,
	onViewportLeave: true
} satisfies Record<keyof MotionOptions, true>;
const keys = Object.keys(optionKeys) as (keyof MotionOptions)[];

/** Read reactively in the binding's existing effect; retain MotionValue/custom identities. */
export function componentMotionOptions(
	legacy: MotionOptions,
	flat: ComponentMotionProps,
	style: ComponentMotionProps['style']
): MotionOptions {
	const result = { ...legacy };
	for (const key of keys) {
		if (key === 'style' || key === 'disabled') continue;
		const value = flat[key];
		if (value !== undefined) Object.assign(result, { [key]: value });
	}
	if (flat.disabled !== undefined) result.disabled = flat.disabled ?? false;
	if (style && typeof style === 'object') result.style = { ...legacy.style, ...style };
	return result;
}

/** Preserve attachment symbols and avoid subscribing DOM forwarding to animation values. */
export function nativeComponentProps<Props extends object>(props: Props): Props {
	const native: Record<PropertyKey, unknown> = {};
	for (const key of Reflect.ownKeys(props)) {
		if (typeof key === 'string' && key !== 'disabled' && Object.hasOwn(optionKeys, key)) continue;
		if (Object.prototype.propertyIsEnumerable.call(props, key)) {
			native[key] = (props as Record<PropertyKey, unknown>)[key];
		}
	}
	return native as Props;
}
