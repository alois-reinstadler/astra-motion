import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Fixture from './CoordinatedPresence.svelte';

it('renders child variant initial styles from a lexical parent during SSR', () => {
	const html = render(Fixture, { props: { initial: 'hidden' } }).body;
	expect(html).toContain('opacity:0;transform:translateY(20px)');
});
it('inherits initial=false and renders child animate targets on the server', () => {
	const html = render(Fixture).body;
	expect(html).toContain('opacity:1;transform:none');
	expect(html).not.toContain('translateY(20px)');
});
