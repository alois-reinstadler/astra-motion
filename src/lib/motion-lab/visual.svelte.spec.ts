import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Lab from '../../routes/motion-lab/+page.svelte';

it('renders the complete native-element lab without horizontal overflow', async () => {
	await page.viewport(1100, 900);
	await render(Lab);
	expect(document.querySelectorAll('main section.experiment')).toHaveLength(7);
	expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
});
