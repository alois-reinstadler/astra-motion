import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import ConfigLifecycle from './ConfigLifecycle.svelte';

function style(html: string, id: string): string {
	const element = html.match(new RegExp(`<div[^>]*data-testid="${id}"[^>]*>`))?.[0];
	if (!element) throw new Error(`Missing ${id} in SSR output`);
	return element.match(/style="([^"]*)"/)?.[1] ?? '';
}
it('isolates initial styles across SSR providers and independent render requests', () => {
	const reduced = render(ConfigLifecycle, { props: { initialPolicy: 'always' } }).body;
	const animated = render(ConfigLifecycle, { props: { initialPolicy: 'never' } }).body;
	const reducedAgain = render(ConfigLifecycle, { props: { initialPolicy: 'always' } }).body;
	expect(style(reduced, 'outer-motion')).toContain('opacity:1');
	expect(style(reduced, 'nested-motion')).toContain('opacity:0');
	expect(style(animated, 'outer-motion')).toContain('opacity:0');
	expect(style(reducedAgain, 'outer-motion')).toContain('opacity:1');
});
