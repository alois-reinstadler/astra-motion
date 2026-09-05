import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import RebindReview from './RebindReview.svelte';
it('resolves SSR initial:false targets when markup is rendered, not when the binding was constructed', () => {
	expect(typeof document).toBe('undefined');
	const html = render(RebindReview, { props: { lateTarget: 80 } }).body;
	expect(html).toContain('translateX(80px)');
	expect(html).toContain('opacity:1');
});
