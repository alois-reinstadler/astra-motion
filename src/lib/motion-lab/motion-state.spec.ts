import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import MotionState from './MotionState.svelte';

it('renders resolved motion initial styles during SSR without a browser', () => {
	expect(typeof window).toBe('undefined');
	const html = render(MotionState).body;
	expect(html).toContain('opacity:0');
	expect(html).toContain('translateY(-20px) scale(0.6)');
	expect(html).toContain('translateX(20px)');
	expect(html).not.toContain('undefined');
});
