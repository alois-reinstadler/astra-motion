import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Fixture from './LexicalInheritance.svelte';

it('uses its declared parent for SSR initial=false keyframes through a different controlling node', () => {
	const { body } = render(Fixture);
	expect(body).toContain('opacity:1;transform:translateX(80px)');
	expect(body).not.toContain('translateX(-80px)');
});
