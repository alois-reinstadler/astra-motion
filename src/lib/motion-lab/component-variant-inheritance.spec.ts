import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Fixture from './ComponentVariantInheritance.svelte';

it('inherits initial:false and labels through component context during SSR, preserving overrides and root isolation', () => {
	for (let request = 0; request < 2; request++) {
		const { body } = render(Fixture);
		expect(body).toContain('id="inherited" style="opacity:0.6;transform:translateX(20px)"');
		expect(body).toContain('id="override" style="opacity:0.2"');
		expect(body).toContain('id="independent" style=""');
	}
});
