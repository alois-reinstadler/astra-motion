import { expect, it } from 'vitest';
import { spring } from 'motion-dom';
import { animateViewChanges } from '../motion/view-animation.js';
import {
	createViewIdentity,
	registerViewParticipant,
	type ViewChange
} from '../motion/view-registry.js';
import { startViewTransition } from '../motion/view-transitions.js';
import type { ViewAnimationTarget, ViewAnimationOptions } from '../motion/view-types.js';

it.each(['x', 'scale', 'rotateX', 'pathLength', 'transitionEnd'])(
	'rejects unsupported JS snapshot property %s before creating animations',
	(property) => {
		const change = {
			name: 'invalid',
			type: 'update',
			snapshot: { options: { update: { [property]: 1 } } }
		} as unknown as ViewChange;
		expect(() => animateViewChanges(document, [change], [])).toThrow(/CSS snapshot/);
	}
);
it.each([{ type: 'spring' }, { layout: { type: 'spring' } }, { onUpdate: () => {} }])(
	'diagnoses unsupported JS native timing %o',
	(transition) => {
		const change = {
			name: 'invalid',
			type: 'update',
			snapshot: { options: { transition } }
		} as unknown as ViewChange;
		expect(() => animateViewChanges(document, [change], [])).toThrow(/Astra AnimateView:/);
	}
);
it('animates typed CSS transform keyframes and generator timing on native snapshots', async () => {
	expect(typeof document.startViewTransition).toBe('function');
	const node = document.createElement('div');
	node.style.cssText = 'width:100px;height:50px;background:red';
	node.textContent = 'Before';
	document.body.append(node);
	const target: ViewAnimationTarget = {
		transform: ['translateX(30px)', 'translateX(0px)'],
		opacity: [0, 1]
	};
	const options: ViewAnimationOptions = {
		update: target,
		reducedMotion: 'never',
		transition: {
			type: spring,
			duration: 0.4,
			bounce: 0.1,
			repeat: 1,
			repeatType: 'reverse',
			autoplay: false
		}
	};
	const release = registerViewParticipant({
		...createViewIdentity(),
		node,
		options: () => options,
		isActive: () => true
	});
	const handle = startViewTransition(
		() => {
			node.textContent = 'After';
		},
		{ reducedMotion: 'never' }
	);
	try {
		await handle.ready;
		{
			const effects = document
				.getAnimations()
				.map((animation) => animation.effect as KeyframeEffect);
			const transform = effects.find(
				(effect) =>
					effect.pseudoElement?.includes('view-transition-old(astra_view_') &&
					effect.getKeyframes().some((frame) => frame.transform)
			);
			expect(transform?.getKeyframes().map((frame) => frame.transform)).toEqual([
				'translateX(30px)',
				'translateX(0px)'
			]);
			expect(transform?.getTiming().duration).toBe(400);
			for (const effect of effects.filter((effect) =>
				effect.pseudoElement?.includes('(astra_view_')
			)) {
				expect(effect.getTiming().iterations).toBe(2);
				expect(effect.getTiming().direction).toBe('alternate');
			}
			expect(
				document
					.getAnimations()
					.filter((animation) =>
						(animation.effect as KeyframeEffect)?.pseudoElement?.includes('(astra_view_')
					)
					.every((animation) => animation.playState === 'paused')
			).toBe(true);
		}
		expect(node.textContent).toBe('After');
	} finally {
		handle.cancel();
		await handle.finished;
		release();
		node.remove();
	}
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
});
