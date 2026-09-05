import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ReviewPresence from './ReviewPresence.svelte';
import ReviewEmptyPresence from './ReviewEmptyPresence.svelte';

const delay = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));
const outer = () => document.querySelector<HTMLElement>('[data-review="outer"]');

describe('independent native presence lifecycle review', () => {
	it('waits for a nested longer local outro after the root outro finishes', async () => {
		const { component } = await render(ReviewPresence);
		await delay(350);
		const initial = outer();
		component.select('b');
		await tick();
		await delay(110);
		expect(outer()).toBe(initial);
		expect(outer()?.dataset.value).toBe('a');
		await delay(350);
		expect(outer()?.dataset.value).toBe('b');
	});

	it('reuses the outgoing root if selection reverses before the nested outro finishes', async () => {
		const { component } = await render(ReviewPresence);
		await delay(350);
		const initial = outer();
		component.select('b');
		await tick();
		await delay(80);
		component.select('a');
		await tick();
		await delay(400);
		expect(outer()).toBe(initial);
		expect(outer()?.dataset.value).toBe('a');
	});

	it('coalesces changes to the latest value and does not resurrect after disposal', async () => {
		const { component, unmount } = await render(ReviewPresence);
		await delay(350);
		component.select('b');
		await tick();
		await delay(60);
		component.select('c');
		await tick();
		await delay(400);
		expect(outer()?.dataset.value).toBe('c');
		component.select('d');
		await tick();
		await unmount();
		await delay(400);
		expect(outer()).toBeNull();
	});

	it('sequences content without consumer lifecycle attachments', async () => {
		const { component } = await render(ReviewPresence);
		await delay(350);
		component.select('b');
		await tick();
		await delay(450);
		expect(outer()?.dataset.value).toBe('b');
	});

	it('advances when the initial snippet renders no element', async () => {
		const { component } = await render(ReviewEmptyPresence);
		component.select('b');
		await tick();
		await delay(450);
		expect(outer()?.dataset.value).toBe('b');
	});
});
