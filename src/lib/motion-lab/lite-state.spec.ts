import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import LiteState from './LiteState.svelte';

it('renders lite bindings and child initial styles on the server', () => {
	expect(typeof document).toBe('undefined');
	const html = render(LiteState).body;
	expect(html).toContain('Light native state');
	expect(html).toContain('opacity:1;transform:none');
});
it('diagnoses unsupported layout and gesture options instead of silently ignoring JavaScript callers', () => {
	// Simulate a JavaScript caller; these fresh object shapes are rejected by TypeScript too.
	expect(
		() => render(LiteState, { props: { options: { initial: false, ...{ layout: true } } } }).body
	).toThrow('lite entry');
	expect(
		() =>
			render(LiteState, {
				props: { options: { initial: false, ...{ whileHover: { scale: 1.2 } } } }
			}).body
	).toThrow('gestures require');
});
