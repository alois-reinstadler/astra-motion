import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { motionValue } from 'motion-dom';
import Harness from './remaining-apis-harness.svelte';
import { animateView } from '../motion/animate-view.js';
import { startViewTransition } from '../motion/view-transitions.js';

it('follows tween targets, replaces sources/settings and preserves borrowed ownership', async () => {
	const source = motionValue(0),
		replacement = motionValue(80);
	const destroyed = vi.fn();
	source.on('destroy', destroyed);
	const screen = render(Harness, { source });
	await tick();
	const { follower, direct, willChange } = screen.component.api();
	source.set(30);
	await expect.poll(() => follower.get()).toBe(30);
	direct.set('24px');
	await expect.poll(() => direct.get()).toBe('24px');
	screen.component.select(replacement);
	await expect.poll(() => follower.get()).toBe(80);
	expect(screen.component.api().follower).toBe(follower);
	source.set(200);
	expect(follower.get()).toBe(80);
	screen.component.configure({ type: 'spring', stiffness: 900, damping: 80 });
	await tick();
	replacement.set(15);
	await expect.poll(() => follower.get()).toBe(15);
	expect(willChange.get()).toBe('transform');
	await screen.unmount();
	expect(destroyed).not.toHaveBeenCalled();
	expect(follower.isAnimating()).toBe(false);
	source.destroy();
	replacement.destroy();
});

it('retains direct follower intent and reconnects source after Activity suspension', async () => {
	const source = motionValue(0);
	const screen = render(Harness, { source });
	await tick();
	const { follower, direct } = screen.component.api();
	screen.component.show(false);
	await tick();
	source.set(60);
	direct.set('40px');
	expect(follower.get()).toBe(0);
	expect(direct.get()).toBe('0px');
	expect(direct.isAnimating()).toBe(false);
	screen.component.show(true);
	await expect.poll(() => follower.get()).toBe(60);
	await expect.poll(() => direct.get()).toBe('40px');
	await screen.unmount();
	source.destroy();
});

it('animates fluent selectors with real snapshots, playback control and authored style restoration', async () => {
	const target = document.createElement('div');
	target.style.cssText =
		'width:40px;height:40px;background:coral;view-transition-name:authored-fluent;view-transition-class:authored-class;view-transition-group:none';
	target.className = 'fluent-card';
	document.body.append(target);
	const originalName = target.style.viewTransitionName;
	try {
		const builder = animateView(
			() => {
				target.style.width = '100px';
			},
			{ duration: 0.1, reducedMotion: 'never' }
		)
			.add('.fluent-card')
			.class('fluent-demo')
			.group(false)
			.crop(true)
			.layout({ duration: 0.1 })
			.new({ opacity: [0.5, 1] })
			.old({ opacity: [1, 0.5] });
		const controls = await builder;
		if (typeof document.startViewTransition === 'function') {
			expect(
				document
					.getAnimations()
					.some((animation) =>
						(animation.effect as KeyframeEffect)?.pseudoElement?.includes('authored-fluent')
					)
			).toBe(true);
			controls.pause();
			expect(controls.state).toBe('paused');
			controls.play();
		}
		await controls.finished;
		await builder.finished;
		expect(target.style.width).toBe('100px');
		expect(target.style.viewTransitionName).toBe(originalName);
		expect(target.style.getPropertyValue('view-transition-class')).toBe('authored-class');
		expect(target.style.getPropertyValue('view-transition-group')).toBe('none');
		expect(document.querySelector('[data-astra-fluent-view]')).toBeNull();
	} finally {
		target.remove();
	}
});

it('pairs replacement elements, gates enter/exit, and resolves selector results after the update', async () => {
	const container = document.createElement('div');
	container.innerHTML =
		'<div class="old-fluent" style="width:50px;height:50px;background:blue"></div>';
	document.body.append(container);
	try {
		const builder = animateView(
			() => {
				container.innerHTML =
					'<div class="new-fluent" style="width:90px;height:60px;background:red"></div>';
			},
			{ duration: 0.06, reducedMotion: 'never' }
		)
			.add('.old-fluent', '.new-fluent')
			.enter({ opacity: 1 })
			.exit({ opacity: 0 });
		const controls = await builder;
		if (typeof document.startViewTransition === 'function') {
			const groups = document
				.getAnimations()
				.filter((animation) =>
					(animation.effect as KeyframeEffect)?.pseudoElement?.startsWith(
						'::view-transition-group(astra_fluent_'
					)
				);
			expect(groups.length).toBeGreaterThan(0);
		}
		await controls.finished;
		await builder.finished;
		expect(container.querySelector('.new-fluent')).not.toBeNull();
		expect((container.firstChild as HTMLElement).style.viewTransitionName).toBe('');
	} finally {
		container.remove();
	}
});

it('serializes fluent and declarative requests with one document owner and cancellation', async () => {
	const mutations: number[] = [];
	const builder = animateView(
		() => {
			mutations.push(1);
		},
		{ duration: 1, reducedMotion: 'never' }
	).new({ opacity: [0, 1] });
	const controls = await builder;
	controls.pause();
	const second = animateView(
		() => {
			mutations.push(2);
		},
		{ reducedMotion: 'never' }
	).new({ opacity: 1 }, { duration: 0.01 });
	const third = startViewTransition(
		() => {
			mutations.push(3);
		},
		{ reducedMotion: 'never' }
	);
	builder.cancel();
	await Promise.all([builder.finished, second.finished, third.finished]);
	expect(mutations).toEqual([1, 2, 3]);
	expect(document.querySelector('[data-astra-fluent-view]')).toBeNull();
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
});

it('reports fluent capture mistakes and still applies the application update once', async () => {
	if (typeof document.startViewTransition !== 'function') {
		expect(true).toBe(true);
		return;
	}
	const update = vi.fn();
	const builder = animateView(update, { reducedMotion: 'never' }).add('[');
	await expect(Promise.resolve(builder)).rejects.toBeInstanceOf(DOMException);
	expect(update).toHaveBeenCalledOnce();
	expect(document.querySelector('[data-astra-fluent-view]')).toBeNull();
});

it('releases a surviving paired source name and restores both authored priorities', async () => {
	const container = document.createElement('div');
	container.innerHTML =
		'<div data-pair-source style="width:50px;height:50px;background:blue;view-transition-name:shared-source!important"></div><div data-pair-target style="width:70px;height:70px;background:red;display:none"></div>';
	document.body.append(container);
	const source = container.querySelector<HTMLElement>('[data-pair-source]')!;
	const target = container.querySelector<HTMLElement>('[data-pair-target]')!;
	try {
		const builder = animateView(
			() => {
				source.style.visibility = 'hidden';
				target.style.display = 'block';
			},
			{ duration: 0.02, reducedMotion: 'never' }
		).add(source, target);
		await builder;
		await expect(builder.finished).resolves.toBe(
			typeof document.startViewTransition === 'function' ? 'finished' : 'unsupported'
		);
		expect(source.style.viewTransitionName).toBe('shared-source');
		expect(source.style.getPropertyPriority('view-transition-name')).toBe('important');
		expect(target.style.viewTransitionName).toBe('');
	} finally {
		container.remove();
	}
});

it('skips reduced-motion capture without acquiring names or cancelling borrowed work', async () => {
	const update = vi.fn();
	const builder = animateView(update, { reducedMotion: 'always' })
		.add('.does-not-exist')
		.new({ opacity: [0, 1] });
	const controls = await builder;
	await controls.finished;
	expect(update).toHaveBeenCalledOnce();
	expect(controls.state).toBe('finished');
	await expect(builder.finished).resolves.toBe(
		typeof document.startViewTransition === 'function' ? 'skipped' : 'unsupported'
	);
	expect(document.querySelector('[data-astra-fluent-view]')).toBeNull();
});

const nativeView = it.skipIf(typeof document.startViewTransition !== 'function');
function viewAnimations(side?: string) {
	return document.getAnimations().filter((animation) => {
		const pseudo = (animation.effect as KeyframeEffect | null)?.pseudoElement;
		return pseudo?.startsWith(side ? `::view-transition-${side}(` : '::view-transition-');
	});
}
function createViewCard(name = 'review-card') {
	const card = document.createElement('div');
	card.style.cssText = `width:40px;height:40px;background:coral;view-transition-name:${name}`;
	document.body.append(card);
	return card;
}

nativeView(
	'gives entering and exiting definitions priority over new/old values and timing',
	async () => {
		const old = createViewCard('precedence-old');
		const incoming = document.createElement('div');
		incoming.className = 'precedence-incoming';
		incoming.style.cssText =
			'width:50px;height:50px;background:blue;view-transition-name:precedence-new';
		const builder = animateView(
			() => {
				old.remove();
				document.body.append(incoming);
			},
			{ reducedMotion: 'never' }
		)
			.add('.precedence-incoming')
			.enter({ opacity: [0, 1] }, { duration: 0.1 })
			.new({ opacity: [0.5, 0.7] }, { duration: 1 })
			.add(old)
			.exit({ opacity: [1, 0] }, { duration: 0.12 })
			.old({ opacity: [0.7, 0.5] }, { duration: 1 });
		try {
			const controls = await builder;
			controls.pause();
			for (const [side, name, values, duration] of [
				['new', 'precedence-new', [0, 1], 100],
				['old', 'precedence-old', [1, 0], 120]
			] as const) {
				const effects = viewAnimations(side)
					.map((animation) => animation.effect as KeyframeEffect)
					.filter(
						(effect) =>
							effect.pseudoElement?.includes(name) &&
							effect.getKeyframes().some((frame) => frame.opacity !== undefined)
					);
				expect(effects).toHaveLength(1);
				expect(effects[0].getKeyframes().map((frame) => Number(frame.opacity))).toEqual(values);
				expect(effects[0].getTiming().duration).toBe(duration);
			}
		} finally {
			builder.cancel();
			await builder.finished;
			old.remove();
			incoming.remove();
		}
	}
);

nativeView(
	'settles a cancelled queued builder without disturbing a paused owner or earlier queued work',
	async () => {
		const mutations: string[] = [];
		const a = animateView(
			() => {
				mutations.push('a');
			},
			{ reducedMotion: 'never' }
		).new({ opacity: [0.3, 1] }, { duration: 10 });
		const controls = await a;
		controls.pause();
		const b = animateView(
			() => {
				mutations.push('b');
			},
			{ reducedMotion: 'never' }
		).new({ opacity: [0.3, 1] }, { duration: 0.01 });
		const c = animateView(
			() => {
				mutations.push('c');
			},
			{ reducedMotion: 'never' }
		).new({ opacity: [0.3, 1] }, { duration: 0.01 });
		try {
			c.cancel();
			const [outcome, skippedControls] = await Promise.all([c.finished, Promise.resolve(c)]);
			expect(outcome).toBe('skipped');
			expect(skippedControls.state).toBe('finished');
			expect(mutations).toEqual(['a', 'c']);
			expect(controls.state).toBe('paused');
			expect(viewAnimations().length).toBeGreaterThan(0);
			a.cancel();
			await b.finished;
			expect(mutations).toEqual(['a', 'c', 'b']);
		} finally {
			a.cancel();
			b.cancel();
			c.cancel();
			await Promise.all([a.finished, b.finished, c.finished]);
		}
	}
);

nativeView(
	'gives immediate builders capture priority over already queued wait builders',
	async () => {
		const mutations: string[] = [];
		const a = animateView(
			() => {
				mutations.push('a');
			},
			{ reducedMotion: 'never' }
		).new({ opacity: [0.3, 1] }, { duration: 10 });
		(await a).pause();
		const b = animateView(
			() => {
				mutations.push('b');
			},
			{ reducedMotion: 'never' }
		).new({ opacity: [0.3, 1] }, { duration: 0.01 });
		const c = animateView(
			() => {
				mutations.push('c');
			},
			{ reducedMotion: 'never', interrupt: 'immediate' }
		).new({ opacity: [0.6, 1] }, { duration: 10 });
		try {
			const controls = await c;
			controls.pause();
			expect(mutations).toEqual(['a', 'c']);
			await expect(a.finished).resolves.toBe('skipped');
			const effects = viewAnimations('new')
				.map((animation) => animation.effect as KeyframeEffect)
				.filter((effect) => effect.getKeyframes().some((frame) => frame.opacity !== undefined));
			expect(effects.some((effect) => Number(effect.getKeyframes()[0].opacity) === 0.6)).toBe(true);
			c.cancel();
			await b.finished;
			expect(mutations).toEqual(['a', 'c', 'b']);
		} finally {
			a.cancel();
			b.cancel();
			c.cancel();
			await Promise.all([a.finished, b.finished, c.finished]);
		}
	}
);

nativeView.each([false, true])(
	'does not capture an unselected root and restores owned root styles (application update=%s)',
	async (changeRoot) => {
		const card = createViewCard();
		const root = document.documentElement;
		const authored = root.getAttribute('style');
		root.style.setProperty('view-transition-name', 'authored-page', 'important');
		const builder = animateView(
			() => {
				expect(getComputedStyle(root).viewTransitionName).toBe('none');
				card.style.width = '80px';
				if (changeRoot) root.style.setProperty('view-transition-name', 'application-page');
			},
			{ reducedMotion: 'never' }
		)
			.add(card)
			.layout({ duration: 10 });
		try {
			const controls = await builder;
			controls.pause();
			expect(
				viewAnimations().some((animation) =>
					/\((root|authored-page|application-page)\)/.test(
						(animation.effect as KeyframeEffect).pseudoElement ?? ''
					)
				)
			).toBe(false);
			expect(
				viewAnimations('group').some((animation) =>
					(animation.effect as KeyframeEffect).pseudoElement?.includes('review-card')
				)
			).toBe(true);
			expect(root.style.viewTransitionName).toBe(changeRoot ? 'application-page' : 'authored-page');
			expect(root.style.getPropertyPriority('view-transition-name')).toBe(
				changeRoot ? '' : 'important'
			);
		} finally {
			builder.cancel();
			await builder.finished;
			card.remove();
			if (authored === null) root.removeAttribute('style');
			else root.setAttribute('style', authored);
		}
	}
);

nativeView(
	'keeps survivor opacity at spring visualDuration while geometry continues settling',
	async () => {
		const card = createViewCard('visual-duration');
		const builder = animateView(
			() => {
				card.style.width = '140px';
			},
			{ reducedMotion: 'never' }
		)
			.add(card)
			.layout({ type: 'spring', visualDuration: 0.25, bounce: 0.4 });
		try {
			const controls = await builder;
			controls.pause();
			const geometry = viewAnimations('group')
				.map((animation) => animation.effect as KeyframeEffect)
				.find((effect) => effect.pseudoElement?.includes('visual-duration'));
			const fades = [...viewAnimations('new'), ...viewAnimations('old')]
				.map((animation) => animation.effect as KeyframeEffect)
				.filter(
					(effect) =>
						effect.pseudoElement?.includes('visual-duration') &&
						effect.getKeyframes().some((frame) => frame.opacity !== undefined)
				);
			expect(fades).toHaveLength(2);
			for (const fade of fades) {
				expect(fade.getTiming().duration).toBe(250);
				expect(fade.getTiming().easing).toBe('linear');
			}
			expect(Number(geometry?.getTiming().duration)).toBeGreaterThan(250);
		} finally {
			builder.cancel();
			await builder.finished;
			card.remove();
		}
	}
);

nativeView(
	'ignores top-level null keyframes without suppressing the native survivor crossfade',
	async () => {
		const card = createViewCard('null-target');
		const builder = animateView(
			() => {
				card.style.width = '100px';
			},
			{ reducedMotion: 'never' }
		)
			.add(card)
			.layout({ duration: 0.3 })
			.new({ opacity: null, scale: null } as never);
		try {
			const controls = await builder;
			controls.pause();
			const fades = [...viewAnimations('new'), ...viewAnimations('old')]
				.map((animation) => animation.effect as KeyframeEffect)
				.filter(
					(effect) =>
						effect.pseudoElement?.includes('null-target') &&
						effect.getKeyframes().some((frame) => frame.opacity !== undefined)
				);
			expect(fades).toHaveLength(2);
			for (const fade of fades) expect(fade.getTiming().duration).toBe(300);
		} finally {
			builder.cancel();
			await builder.finished;
			card.remove();
		}
	}
);

nativeView('does not let a null entering target mask a valid new snapshot target', async () => {
	const card = document.createElement('div');
	card.style.cssText = 'width:40px;height:40px;background:blue;view-transition-name:null-enter';
	card.className = 'null-enter-card';
	const builder = animateView(
		() => {
			document.body.append(card);
		},
		{ reducedMotion: 'never' }
	)
		.add('.null-enter-card')
		.enter({ opacity: null } as never, { duration: 2 })
		.new({ opacity: [0.3, 1] }, { duration: 0.2 });
	try {
		const controls = await builder;
		controls.pause();
		const fades = viewAnimations('new')
			.map((animation) => animation.effect as KeyframeEffect)
			.filter(
				(effect) =>
					effect.pseudoElement?.includes('null-enter') &&
					effect.getKeyframes().some((frame) => frame.opacity !== undefined)
			);
		expect(fades).toHaveLength(1);
		expect(fades[0].getKeyframes().map((frame) => Number(frame.opacity))).toEqual([0.3, 1]);
		expect(fades[0].getTiming().duration).toBe(200);
	} finally {
		builder.cancel();
		await builder.finished;
		card.remove();
	}
});
