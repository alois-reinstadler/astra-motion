import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createAnimate } from '../motion/animate.js';
import ScopedTimelineSSR from './ScopedTimelineSSR.svelte';
it('imports vanilla Motion and renders scoped attachments without browser globals', () => {
	expect(typeof document).toBe('undefined');
	const html = render(ScopedTimelineSSR).body;
	expect(html).toContain('Server timeline content');
	expect(html).toContain('style="opacity:1"');
	expect(html).not.toContain('transform');
});
it('creates an inert server scope and diagnoses playback before mount', () => {
	const scope = createAnimate();
	expect(scope.current).toBeUndefined();
	expect(scope.active).toBe(0);
	expect(() => scope.animate('span', { opacity: 0 })).toThrow('attach');
	scope.stop();
});
