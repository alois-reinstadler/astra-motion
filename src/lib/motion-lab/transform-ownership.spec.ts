import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import * as state from '../motion/motion.svelte.js';
import * as lite from '../motion/lite.svelte.js';
import TransformOwnership from './TransformOwnership.svelte';
it('exports the same native namespace from full and lite boundaries without a legacy constructor', () => {
	expect(typeof state.motion.bind).toBe('function');
	expect(typeof lite.motion.bind).toBe('function');
	expect(state).not.toHaveProperty('createMotion');
	expect(lite).not.toHaveProperty('createMotion');
});
it('uses raw transform precedence for a mixed native SSR target', () => {
	const html = render(TransformOwnership, {
		props: { config: { animate: { transform: 'rotate(30deg)', x: 40 } } }
	}).body;
	expect(html).toContain('transform:rotate(30deg)');
	expect(html).not.toContain('translateX');
});
it('allows a consistent raw transform strategy without layout', () => {
	const html = render(TransformOwnership, {
		props: { config: { animate: { transform: 'rotate(30deg)' } } }
	}).body;
	expect(html).toContain('transform:rotate(30deg)');
});
