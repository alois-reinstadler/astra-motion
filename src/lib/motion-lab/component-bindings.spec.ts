import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import ComponentBindings from './ComponentBindings.svelte';

it('renders caller-owned initial styles inside real components on the server', () => {
	const { body } = render(ComponentBindings);
	expect(body).toMatch(/data-testid="plain-card"[^>]*style="color:red;?"/);
	expect(body).toMatch(/data-testid="bound-card"[^>]*style="[^"]*color:\s*red;[^"]*opacity:\s*0.2/);
	expect(body).toContain('translateY(16px)');
	expect(body).toContain('opacity:0.3');
	expect(body).toContain('translateY(-4px)');
});

for (const path of [
	'card/card.svelte',
	'accordion/accordion-content.svelte',
	'dialog/dialog-content.svelte',
	'dialog/dialog-overlay.svelte'
]) {
	it(`${path} erases its motion dependency in client and server output`, () => {
		const filename = `src/lib/components/ui/${path}`;
		const source = readFileSync(filename, 'utf8');
		for (const generate of ['client', 'server'] as const) {
			const { js } = compile(source, { filename, generate });
			expect(js.code).not.toMatch(/from\s+['"][^'"]*\/motion\//);
			expect(js.code).not.toContain('createMotion');
		}
	});
}
