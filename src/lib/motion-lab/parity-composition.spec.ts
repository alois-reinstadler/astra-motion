import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import Activity from './ParityCompositionActivity.svelte';
import Factory from './ParityCompositionFactory.svelte';
import { factoryHTML } from './parity-composition-ssr.js';

it('renders the first Activity subtree at its animate state and retains hidden SSR content', () => {
	const visible = render(Activity).body;
	expect(visible).toContain('data-composition-first');
	expect(visible).not.toContain('translateX(-80px)');
	const hidden = render(Activity, { props: { initialMode: 'hidden' } }).body;
	expect(hidden).toContain('display:none');
	expect(hidden).toContain('Retained composition input');
	expect(hidden).toContain('data-composition-frames');
});

it('renders native factory input, SVG geometry and wrapped MotionValue children on the server', () => {
	const { body } = render(Factory);
	expect(body).toBe(factoryHTML);
	expect(body).toMatch(/<input[^>]*type="email"[^>]*required[^>]*value="example@astra.test"/);
	expect(body).not.toContain('</input>');
	expect(body).toMatch(
		/<circle[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"[^>]*cx="25"[^>]*cy="35"[^>]*r="12"/
	);
	expect(body).toContain('stroke-width="2"');
	expect(body).toMatch(/data-composition-button[^>]*>(?:<!--.*?-->)*10/);
	expect(body).not.toContain('[object Object]');
});
