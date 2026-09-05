import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Fixture from './OptionalPrimitiveMotion.svelte';

it.each(['Dialog', 'Accordion'])(
	'preserves editable %s content while optional motion changes',
	async (kind) => {
		const screen = render(Fixture);
		if (kind === 'Dialog')
			await screen.getByRole('button', { name: 'Open editable dialog' }).click();
		await expect.element(screen.getByRole('textbox', { name: `${kind} draft` })).toBeVisible();
		const input = document.querySelector<HTMLInputElement>(`[aria-label="${kind} draft"]`)!;
		input.focus();
		input.value = 'Unsaved draft';
		for (const enabled of [true, false, true]) {
			screen.component.setMotion(enabled);
			await tick();
			expect(document.querySelector(`[aria-label="${kind} draft"]`)).toBe(input);
			expect(document.activeElement).toBe(input);
			expect(input.value).toBe('Unsaved draft');
		}
	}
);
