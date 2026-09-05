import {
	HTMLProjectionNode,
	HTMLVisualElement,
	GroupAnimation,
	AsyncMotionValueAnimation,
	NativeAnimationExtended,
	animateTarget,
	createAnimationState,
	motionValue,
	JSAnimation,
	frame
} from 'motion-dom';

/** Shape checks are upgrade tripwires; the existing Astra suites test behavior. */
export async function inspectContracts() {
	const errors: string[] = [];
	function methods(subject: object, names: string[], label: string) {
		for (const name of names)
			if (typeof Reflect.get(subject, name) !== 'function')
				errors.push(`${label}.${name} is not callable`);
	}
	function fields(subject: object, names: string[], label: string) {
		for (const name of names) if (!(name in subject)) errors.push(`${label}.${name} is absent`);
	}
	const node = document.createElement('div');
	node.style.opacity = '1';
	document.body.append(node);
	const visual = new HTMLVisualElement({
		props: { variants: { ready: { opacity: 1 } } },
		presenceContext: null,
		visualState: {
			latestValues: { opacity: 1 },
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	visual.mount(node);
	const projection = new HTMLProjectionNode({});
	projection.setOptions({ layout: true, layoutId: 'upstream-contract', visualElement: visual });
	projection.mount(node);
	try {
		methods(
			visual,
			[
				'mount',
				'unmount',
				'update',
				'getProps',
				'getValue',
				'removeValue',
				'readValue',
				'render',
				'notify',
				'getDefaultTransition'
			],
			'VisualElement'
		);
		fields(
			visual,
			[
				'values',
				'latestValues',
				'renderState',
				'variantChildren',
				'parent',
				'manuallyAnimateOnMount',
				'shouldReduceMotion'
			],
			'VisualElement'
		);
		methods(
			projection,
			[
				'mount',
				'unmount',
				'setOptions',
				'willUpdate',
				'updateLayout',
				'updateScroll',
				'resetTransform',
				'finishAnimation',
				'getStack',
				'isLead',
				'promote',
				'relegate',
				'applyTransform',
				'removeElementScroll',
				'addEventListener'
			],
			'projection'
		);
		fields(projection, ['options', 'path', 'root'], 'projection');
		methods(
			projection.root!,
			['didUpdate', 'update', 'startUpdate', 'registerSharedNode'],
			'projection.root'
		);
		if (!(projection.root?.sharedNodes instanceof Map))
			errors.push('projection.root.sharedNodes is not a Map');
		const stack = projection.getStack();
		if (!stack) errors.push('shared layout stack was not created');
		else {
			methods(stack, ['remove', 'promote', 'relegate'], 'shared stack');
			if (!Array.isArray(stack.members)) errors.push('shared stack.members is not an Array');
		}
		methods(
			createAnimationState(visual),
			['animateChanges', 'setAnimateFunction', 'setActive', 'getState'],
			'animationState'
		);
		methods(
			frame,
			['read', 'resolveKeyframes', 'update', 'preRender', 'render', 'postRender'],
			'frame'
		);
		const sampler = new JSAnimation({
			keyframes: [0, 1],
			duration: 100,
			autoplay: false,
			driver: () => ({ start() {}, stop() {}, now: () => 0 })
		});
		methods(sampler, ['sample', 'stop', 'attachTimeline'], 'JSAnimation');
		sampler.stop();
		const value = motionValue(0);
		methods(
			value,
			['get', 'set', 'setWithVelocity', 'getVelocity', 'stop', 'jump', 'on', 'destroy'],
			'MotionValue'
		);
		value.destroy();
		animateTarget(visual, { opacity: 0.5, transition: { duration: 10 } });
		const async = visual.getValue('opacity')!.animation;
		if (!(async instanceof AsyncMotionValueAnimation))
			errors.push('value.animation class identity changed');
		for (let i = 0; !node.getAnimations().length && i < 60; i++)
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		const materialized: unknown = async && Reflect.get(async, '_animation');
		if (!(materialized instanceof NativeAnimationExtended))
			errors.push('AsyncMotionValueAnimation._animation is no longer NativeAnimationExtended');
		else {
			const native: unknown = Reflect.get(materialized, 'animation');
			if (!(native instanceof Animation))
				errors.push('NativeAnimation.animation is not a browser Animation');
			methods(
				materialized,
				['updateMotionValue', 'stop', 'cancel', 'attachTimeline'],
				'native playback'
			);
			fields(materialized, ['options', 'state', 'speed'], 'native playback');
			fields(materialized.options, ['keyframes', 'motionValue'], 'native options');
		}
		const group = new GroupAnimation(async ? [async] : []);
		if (!Array.isArray(group.animations) || group.animations[0] !== async)
			errors.push('GroupAnimation.animations changed');
		methods(group, ['stop', 'cancel', 'attachTimeline'], 'group playback');
		return {
			errors,
			privateFields: ['AsyncMotionValueAnimation._animation', 'NativeAnimation.animation'],
			projectionStack: !!stack
		};
	} finally {
		visual.values.forEach((value) => value.stop());
		projection.unmount();
		visual.unmount();
		node.remove();
	}
}
