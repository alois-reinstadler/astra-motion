import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ParityCore from './ParityCore.svelte';

it('animates SVG attributes and paths, binds SVG nodes and retains SVG exits', async () => {
	const view = render(ParityCore);
	const circle = view.container.querySelector('[data-testid="svg-circle"]')!;
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
	await expect.poll(() => circle.getAttribute('r')).toBe('15');
	await page.getByRole('button', { name: 'Change SVG target' }).click();
	await expect.poll(() => circle.getAttribute('r')).toBe('25');
	await page.getByRole('button', { name: 'Change SVG value' }).click();
	await expect.poll(() => circle.getAttribute('cx')).toBe('75');
	await expect
		.poll(() =>
			view.container.querySelector('[data-testid="svg-path"]')?.getAttribute('stroke-dasharray')
		)
		.toBe('1 1');
	await page.getByRole('button', { name: 'Toggle SVG' }).click();
	expect(circle.isConnected).toBe(true);
	await expect.poll(() => circle.isConnected).toBe(false);
	await expect.element(page.getByTestId('svg-ref')).toHaveTextContent('none');
	view.unmount();
});
