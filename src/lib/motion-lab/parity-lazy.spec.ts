import { expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Harness from './parity-lazy-harness.svelte';
import { domAnimation } from '../motion/dom-animation.js';

it('renders async m initial HTML and SVG without invoking the loader on the server', () => {
	const loader = vi.fn(async () => domAnimation);
	const { body } = render(Harness, { props: { features: loader } });
	expect(loader).not.toHaveBeenCalled();
	expect(body).toContain('value="retained"');
	expect(body).toContain('opacity:0.2');
	expect(body).toContain('opacity:0.25');
	expect(body).toContain('stroke-dasharray="0 1"');
	expect(body).not.toContain('translateX(80px)');
});

it('shares eager initial:false target selection for synchronous and deferred bundles', () => {
	for (const features of [domAnimation, async () => domAnimation]) {
		const { body } = render(Harness, { props: { features, initialFalse: true } });
		expect(body).toContain('translateX(80px)');
		expect(body).toContain('opacity:0.75');
	}
});
