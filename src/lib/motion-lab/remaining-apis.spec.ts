import { expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { motionValue } from 'motion-dom';
import Harness from './remaining-apis-harness.svelte';
import { WillChangeMotionValue } from '../motion/will-change.svelte.js';
import { animateView } from '../motion/animate-view.js';

it('renders new setup helpers without browser work and preserves borrowed SSR source', () => {
	const source = motionValue(42),
		destroyed = vi.fn();
	source.on('destroy', destroyed);
	const result = render(Harness, { props: { source } });
	expect(result.body).toContain('will-change:auto');
	expect(source.get()).toBe(42);
	expect(destroyed).not.toHaveBeenCalled();
	source.destroy();
});

it('matches pinned will-change eligible-target semantics and deduplicates values', () => {
	const value = new WillChangeMotionValue('auto');
	const changed = vi.fn();
	value.on('change', changed);
	value.add('width');
	expect(value.get()).toBe('auto');
	value.add('x');
	value.add('opacity');
	value.add('x');
	expect(value.get()).toBe('transform');
	expect(changed).toHaveBeenCalledTimes(1);
	value.destroy();
});

it('runs unsupported/SSR fluent updates once, supports repeated observers and propagates failures', async () => {
	const update = vi.fn(async () => {
		await Promise.resolve();
	});
	const builder = animateView(update)
		.add('.card')
		.crop(false)
		.group(false)
		.class('card')
		.layout({ duration: 0.2 })
		.new({ opacity: 1 })
		.old({ opacity: 0 })
		.enter({ opacity: 1 })
		.exit({ opacity: 0 });
	const [first, second] = await Promise.all([Promise.resolve(builder), Promise.resolve(builder)]);
	expect(first).toBe(second);
	expect(first.state).toBe('finished');
	expect(first.time).toBe(0);
	first.pause();
	first.play();
	first.stop();
	await first.finished;
	await expect(builder.finished).resolves.toBe('unsupported');
	expect(update).toHaveBeenCalledOnce();
	const error = new Error('failed update');
	await expect(
		Promise.resolve(
			animateView(() => {
				throw error;
			})
		)
	).rejects.toBe(error);
});

it('rejects ineffective transform aliases with a CSS correction and still applies a cancelled update once', async () => {
	const update = vi.fn();
	const builder = animateView(update);
	// @ts-expect-error Snapshot keyframes deliberately exclude element-only x aliases.
	expect(() => builder.new({ x: 50 })).toThrow(/snapshot CSS property.*transform/);
	await builder.finished;
	expect(update).toHaveBeenCalledOnce();
	const valid = animateView(() => {}).new({
		transform: ['translateX(0px)', 'translateX(40px)'],
		scale: [0.8, 1]
	});
	await expect(valid.finished).resolves.toBe('unsupported');
});
