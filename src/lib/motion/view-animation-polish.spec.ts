import { expect, it, vi } from 'vitest';
import { animateViewChanges } from './view-animation.js';
import type { ViewChange } from './view-registry.js';
import type { ViewAnimationOptions } from './view-types.js';

function nativeAnimation(pseudoElement: string, playState: AnimationPlayState = 'running') {
	return {
		effect: { pseudoElement, updateTiming: vi.fn() },
		playState,
		cancel: vi.fn(),
		pause: vi.fn(),
		onfinish: undefined as (() => void) | undefined
	};
}

function animationDocument(animations: ReturnType<typeof nativeAnimation>[]) {
	const animate = vi.fn((_keyframes, options) => {
		const animation = nativeAnimation(options.pseudoElement);
		animations.push(animation);
		return animation;
	});
	const getAnimations = vi.fn(() => [...animations]);
	return {
		document: {
			documentElement: { style: { opacity: '' }, animate },
			getAnimations
		} as unknown as Document,
		getAnimations,
		animate
	};
}

function change(name: string, options: ViewAnimationOptions = {}): ViewChange {
	return {
		name,
		type: 'enter',
		snapshot: { options }
	} as ViewChange;
}

it('preserves native crossfades when a snapshot definition contains only undefined values', async () => {
	const fade = nativeAnimation('::view-transition-new(card)');
	const { document, animate } = animationDocument([fade]);
	const onAnimationComplete = vi.fn();
	const layer = animateViewChanges(
		document,
		[change('card', { enter: { opacity: undefined }, onAnimationComplete })],
		[]
	);
	try {
		expect(fade.cancel).not.toHaveBeenCalled();
		expect(fade.effect.updateTiming).toHaveBeenCalledOnce();
		expect(animate).not.toHaveBeenCalled();
		fade.onfinish?.();
		await layer.finished;
		expect(onAnimationComplete).toHaveBeenCalledExactlyOnceWith('enter');
	} finally {
		layer.cancel();
	}
});

it('enumerates document animations once for multiple roots while preserving layer selection', async () => {
	const first = nativeAnimation('::view-transition-group(first)');
	const second = nativeAnimation('::view-transition-new(second)');
	const unrelated = nativeAnimation('::view-transition-new(unrelated)');
	const ordinary = nativeAnimation('');
	const finished = nativeAnimation('::view-transition-old(first)', 'finished');
	const { document, getAnimations } = animationDocument([
		first,
		second,
		unrelated,
		ordinary,
		finished
	]);
	const layer = animateViewChanges(
		document,
		[change('first', { transition: { duration: 0.2, autoplay: false } }), change('second')],
		[]
	);
	try {
		expect(getAnimations).toHaveBeenCalledOnce();
		for (const animation of [first, second]) {
			expect(animation.effect.updateTiming).toHaveBeenCalledWith(
				expect.objectContaining({ duration: 200 })
			);
			expect(animation.pause).toHaveBeenCalledOnce();
		}
		for (const animation of [unrelated, ordinary, finished]) {
			expect(animation.effect.updateTiming).not.toHaveBeenCalled();
			expect(animation.cancel).not.toHaveBeenCalled();
		}
	} finally {
		layer.cancel();
	}
	await layer.finished;
	expect(first.cancel).toHaveBeenCalledOnce();
	expect(second.cancel).toHaveBeenCalledOnce();
});

it('replaces each root crossfade without adopting custom animations created for earlier roots', async () => {
	const first = nativeAnimation('::view-transition-new(first)');
	const second = nativeAnimation('::view-transition-old(second)');
	const group = nativeAnimation('::view-transition-group(second)');
	const animations = [first, second, group];
	const { document, animate } = animationDocument(animations);
	const onAnimationComplete = vi.fn();
	const layer = animateViewChanges(
		document,
		[
			change('first', { enter: { opacity: 1 }, onAnimationComplete }),
			change('second'),
			change('missing')
		],
		[]
	);
	try {
		expect(first.cancel).toHaveBeenCalledOnce();
		expect(second.cancel).toHaveBeenCalledOnce();
		expect(group.cancel).not.toHaveBeenCalled();
		expect(group.effect.updateTiming).toHaveBeenCalledOnce();
		expect(animate).toHaveBeenCalledTimes(2);
		for (const [index, name] of ['first', 'second'].entries()) {
			expect(animate).toHaveBeenNthCalledWith(
				index + 1,
				{ opacity: [0, 1] },
				expect.objectContaining({ pseudoElement: `::view-transition-new(${name})` })
			);
			expect(animations[index + 3].effect.updateTiming).not.toHaveBeenCalled();
		}
	} finally {
		layer.cancel();
	}
	await layer.finished;
	expect(onAnimationComplete).not.toHaveBeenCalled();
	for (const animation of animations) expect(animation.cancel).toHaveBeenCalledOnce();
});
