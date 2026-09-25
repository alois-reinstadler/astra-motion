import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import StyleOwnership, { type StyleSurface } from './StyleOwnership.svelte';

const surfaces: StyleSurface[] = ['flat', 'generic', 'legacy', 'native'];

it.each(surfaces)('%s: renders ordinary and raw transform styles during SSR', (surface) => {
	const { body } = render(StyleOwnership, {
		props: { surface, initialStyle: { color: 'red', width: 50, transform: 'rotate(30deg)' } }
	});
	expect(body).toContain('color:red');
	expect(body).toContain('width:50px');
	expect(body).toContain('transform:rotate(30deg)');
});

for (const initial of [false, { transform: 'rotate(15deg)' }] as const) {
	it.each(surfaces)(
		`%s: initial/animate raw transform overrides the style during SSR (initial=${JSON.stringify(initial)})`,
		(surface) => {
			const { body } = render(StyleOwnership, {
				props: {
					surface,
					initial,
					animate: { transform: 'rotate(60deg)' },
					initialStyle: { transform: 'rotate(30deg)' }
				}
			});
			expect(body).toContain(`transform:rotate(${initial === false ? 60 : 15}deg)`);
			expect(body).not.toContain('rotate(30deg)');
		}
	);
}
