import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import TiltHarness from '../motion-lab/TiltHarness.svelte';

it('renders complete neutral native content without browser APIs or JavaScript', () => {
	const { body } = render(TiltHarness);
	expect(body).toContain('data-astra-tilt-content');
	expect(body).toContain('perspective: 800px');
	expect(body).toContain('Clicked 0');
	expect(body).toContain('aria-label="Native input"');
	expect(body).not.toMatch(/rotate[XY]|visibility:\s*hidden|opacity:\s*0/);
});
