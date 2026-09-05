import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createMotion, type MotionOptions } from '../motion/motion.svelte.js';
import TransformOwnership from './TransformOwnership.svelte';

it.each<MotionOptions>([
	{ layout: true, animate: { transform: 'rotate(30deg)' } },
	{ style: { x: 10 }, animate: { transform: 'rotate(30deg)' } },
	{ style: { transform: 'rotate(30deg)' }, exit: { scale: 0.5 } },
	{ animate: { transform: 'none' }, whileInView: { x: 20 } },
	{ animate: { x: 20, transitionEnd: { transform: 'none' } } },
	{ initial: 'start', animate: 'end', variants: { start: { transform: 'none' }, end: { y: 10 } } }
])('diagnoses mixed raw/decomposed transform ownership before SSR: %j', (config) => {
	expect(() => createMotion(config)).toThrow('raw transform cannot compose');
});

it('allows a consistent raw transform strategy without layout', () => {
	const html = render(TransformOwnership, {
		props: { config: { animate: { transform: 'rotate(30deg)' } } }
	}).body;
	expect(html).toContain('transform:rotate(30deg)');
});
