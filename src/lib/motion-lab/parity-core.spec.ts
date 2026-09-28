import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import ParityCore from './ParityCore.svelte';

it('renders SVG attributes, value attributes, paths and typed element refs without browser access', () => {
	const { body } = render(ParityCore);
	expect(body).toMatch(/<svg[^>]*viewBox="0 0 200 120"/);
	expect(body).toMatch(/<circle[^>]*cx="25"[^>]*r="10"/);
	expect(body).toContain('pathLength="1"');
	expect(body).toContain('stroke-dasharray="0 1"');
	expect(body).toMatch(/<rect[^>]*x="130"[^>]*y="20"/);
	expect(body).not.toContain('[object Object]');
	expect(body).not.toMatch(/\slayout(?:Anchor|Id|Dependency)?=/);
});
