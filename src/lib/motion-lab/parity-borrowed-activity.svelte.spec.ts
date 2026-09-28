import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { JSAnimation, motionValue } from 'motion-dom';
import BorrowedActivity from './ParityBorrowedActivity.svelte';

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
const element = (name: string) => document.querySelector<HTMLElement>(`[data-borrowed-${name}]`)!;
const position = (name: string) => new DOMMatrix(getComputedStyle(element(name)).transform).m41;

it('keeps borrowed playback running while hidden, but pauses playback explicitly started by that visual', async () => {
	const x = motionValue(0);
	const { component, unmount } = render(BorrowedActivity, { x });
	await frame();
	const external = new JSAnimation({
		keyframes: [0, 500],
		duration: 10000,
		ease: 'linear',
		onUpdate: (value) => x.set(value)
	});
	void x.start(() => external);
	try {
		await expect.poll(() => position('visible')).toBeGreaterThan(0);
		flushSync(() => component.hide());
		await expect.poll(() => element('host').dataset.astraActivity).toBe('hidden');
		const visible = position('visible');
		const hidden = element('hidden').style.transform;
		expect(external.state).toBe('running');
		await expect.poll(() => position('visible')).toBeGreaterThan(visible);
		expect(element('hidden').style.transform).toBe(hidden);
		flushSync(() => component.show());
		await frame();
		const completed = component.claim();
		await expect
			.poll(() =>
				Boolean(x.animation && x.animation !== external && x.animation.state === 'running')
			)
			.toBe(true);
		const owned = x.animation!;
		expect(owned).toBeDefined();
		flushSync(() => component.hide());
		await expect.poll(() => owned.state).toBe('paused');
		const held = x.get();
		await frame();
		await frame();
		expect(x.get()).toBe(held);
		flushSync(() => component.show());
		await completed;
		expect(x.get()).toBe(1000);
	} finally {
		await unmount();
		external.stop();
		x.destroy();
	}
});
