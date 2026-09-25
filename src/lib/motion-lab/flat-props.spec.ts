import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import FlatProps from './FlatProps.svelte';

it('renders flat initial/style options and inherited variants without leaking animation props', () => {
	const { body } = render(FlatProps);
	expect(body).toMatch(/data-testid="flat"[^>]*style="[^"]*color:red/);
	expect(body).toMatch(/data-testid="flat"[^>]*style="[^"]*width:80px/);
	expect(body).toMatch(/data-testid="flat"[^>]*style="[^"]*translateX\(40px\)/);
	expect(body).toMatch(/data-testid="inherited-flat"[^>]*style="[^"]*opacity:0.2/);
	expect(body).toMatch(/data-testid="value-style"[^>]*style="[^"]*translateX\(12px\)/);
	expect(body).toMatch(/data-testid="flat-button"[^>]*disabled/);
	expect(body.match(/<button[^>]*data-testid="legacy-disabled"[^>]*>/)?.[0]).not.toContain(
		' disabled'
	);
	expect(body).not.toMatch(
		/ (?:motion|animate|initial|exit|variants|transition|whileTap|reducedMotion)=/i
	);
	expect(body).not.toContain('[object Object]');
});
