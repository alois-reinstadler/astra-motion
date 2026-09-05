import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import ScrollLab from './ScrollLab.svelte';

it('renders scroll bindings without DOM access or invented animation styles on the server', () => {
	expect(typeof document).toBe('undefined');
	const html = render(ScrollLab).body;
	expect(html).toContain('Follow the reading.');
	expect(html).toContain('scroll-container');
	expect(html).not.toContain('NaN');
	expect(html).not.toContain('translateY');
});
