import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Fixture from './ParityCustom.svelte';
it('renders custom components, SVG text and MotionValues on the server', () => {
	const { body } = render(Fixture);
	expect(body).toMatch(/<button[^>]*data-custom[^>]*style="[^"]*opacity:0/);
	expect(body).toContain('<astra-card');
	expect(body).not.toContain('[object Object]');
	expect(body).toContain('SVG title');
	expect(body).toMatch(/data-value-text[^>]*>(?:<!--.*?-->)*10/);
});
