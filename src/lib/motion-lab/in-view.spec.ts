import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import InViewHarness from './InViewHarness.svelte';

it('renders visibility defaults and explicit initial state without browser globals', () => {
	expect(typeof IntersectionObserver).toBe('undefined');
	expect(render(InViewHarness).body).toContain('>false</output>');
	expect(render(InViewHarness, { props: { options: { initial: true } } }).body).toContain(
		'>true</output>'
	);
});
