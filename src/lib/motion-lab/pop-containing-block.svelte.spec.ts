import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './PopContainingBlock.svelte';
import Cards from '../site/examples/SessionCards.svelte';
import { presenceMeasurements } from '../motion/commit.js';
import { popPresenceNodes } from '../motion/presence-pop.js';
import { createPresenceBoxes } from '../motion/presence-measure.js';
import { createLayout } from '../motion/layout.js';
import { frame as motionFrame } from 'motion-dom';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

it.each([true, false])(
	'preserves the outgoing box across containing-block changes (child projection=%s)',
	async (projectedChild) => {
		const view = render(Fixture, { projectedChild });
		await document.fonts.ready;
		await frame();
		await frame();
		const body = document.querySelector<HTMLElement>('.pop-body')!;
		const paragraph = document.querySelector<HTMLElement>('.outgoing')!;
		const before = paragraph.getBoundingClientRect();
		const parent = paragraph.offsetParent;
		const stylesBefore = document.querySelectorAll('style').length;
		document.querySelector('button')!.click();
		let earlyError = 0,
			lateError = 0,
			samples = 0,
			lateSamples = 0;
		let changedParent = false;
		const start = performance.now();
		while (performance.now() - start < 340) {
			await frame();
			const box = paragraph.getBoundingClientRect();
			const error = Math.max(
				Math.abs(box.x - before.x),
				Math.abs(box.y - before.y),
				Math.abs(box.width - before.width)
			);
			if (performance.now() - start < 80) earlyError = Math.max(earlyError, error);
			if (performance.now() - start > 230) {
				lateError = Math.max(lateError, error);
				lateSamples++;
			}
			changedParent ||= paragraph.offsetParent !== parent;
			samples++;
		}
		expect(samples).toBeGreaterThan(5);
		expect(lateSamples).toBeGreaterThan(2);
		expect(changedParent).toBe(true);
		expect(earlyError).toBeLessThan(2);
		expect(lateError).toBeLessThan(2);
		expect(body.style.position).toBe('');
		await expect.poll(() => paragraph.isConnected).toBe(false);
		expect(document.querySelectorAll('[data-astra-presence-pop]')).toHaveLength(0);
		expect(document.querySelectorAll('style').length).toBe(stylesBefore);
		await view.unmount();
	}
);

it('keeps the actual SessionCards outgoing detail at its captured position throughout the fade', async () => {
	const view = render(Cards);
	// Reproduce the desktop docs row even in the component runner's narrow viewport.
	const pair = document.querySelector<HTMLElement>('.pair')!;
	pair.style.width = '700px';
	pair.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
	await document.fonts.ready;
	await frame();
	await frame();
	const card = document.querySelectorAll<HTMLElement>('.pair .card')[1];
	const button = card.querySelector('button')!;
	button.click();
	await expect.poll(() => Number(getComputedStyle(card.querySelector('.detail')!).opacity)).toBe(1);
	await new Promise((resolve) => setTimeout(resolve, 600));
	const detail = card.querySelector<HTMLElement>('.detail')!;
	const before = detail.getBoundingClientRect();
	const body = detail.parentElement!;
	const bodyTop = body.offsetTop;
	button.click();
	let samples = 0;
	let fading = 0;
	while (detail.isConnected) {
		await frame();
		if (!detail.isConnected) break;
		const box = detail.getBoundingClientRect();
		expect(Math.abs(box.x - before.x)).toBeLessThan(2);
		// Firefox's heading can wrap on collapse, moving the body's destination.
		// The first frame must retain the origin; later frames may follow that move.
		if (samples === 0) expect(Math.abs(box.y - before.y)).toBeLessThan(2);
		const destinationY = before.y + body.offsetTop - bodyTop;
		expect(box.y).toBeGreaterThanOrEqual(Math.min(before.y, destinationY) - 2);
		expect(box.y).toBeLessThanOrEqual(Math.max(before.y, destinationY) + 2);
		expect(Math.abs(box.width - before.width)).toBeLessThan(1);
		if (Number(getComputedStyle(detail).opacity) < 0.9) fading++;
		samples++;
		expect(samples).toBeLessThan(100);
	}
	expect(samples).toBeGreaterThan(3);
	expect(fading).toBeGreaterThan(2);
	await view.unmount();
	expect(presenceMeasurements.size).toBe(0);
});

it('releases retained measurements on rapid revival and unmount during an active exit', async () => {
	// Leave enough natural outro time for the late reversal at WebKit's 30Hz cadence.
	const view = render(Fixture, { exitDuration: 1.5 });
	await frame();
	await frame();
	const button = document.querySelector('button')!;
	const detail = document.querySelector<HTMLElement>('.outgoing')!;
	const styles = document.querySelectorAll('style').length;
	for (const delay of [1, 5, 14]) {
		button.click();
		for (let i = 0; i < delay; i++) await frame();
		expect(presenceMeasurements.has(detail)).toBe(true);
		button.click();
		await frame();
		await frame();
		expect(document.querySelector('.outgoing')).toBe(detail);
		expect(presenceMeasurements.size).toBe(0);
		expect(document.querySelectorAll('[data-astra-presence-pop]')).toHaveLength(0);
	}
	button.click();
	await frame();
	await frame();
	expect(presenceMeasurements.size).toBe(1);
	await view.unmount();
	for (let i = 0; i < 4; i++) await frame();
	expect(presenceMeasurements.size).toBe(0);
	expect(document.querySelectorAll('style').length).toBe(styles);
});

for (const direction of ['ltr', 'rtl'] as const) {
	for (const anchorX of ['left', 'right'] as const) {
		it(`rebases ${direction}/${anchorX}/bottom across bordered, scrolled and moving containing blocks`, async () => {
			const shell = document.createElement('div');
			shell.style.cssText =
				'position:relative;width:420px;height:300px;border:3px solid;padding:20px;';
			shell.innerHTML =
				'<div style="width:320px;height:180px;overflow:auto;border:2px solid;margin-top:23px"><div style="height:400px;padding:25px 13px"><p style="margin:7px 9px;width:170px;height:40px">Outgoing</p><div style="position:absolute;left:1px;top:2px">Unrelated</div></div></div>';
			shell.dir = direction;
			document.body.append(shell);
			const scroller = shell.firstElementChild as HTMLElement;
			const parent = scroller.firstElementChild as HTMLElement;
			const child = parent.firstElementChild as HTMLElement;
			scroller.scrollTop = 31;
			const before = child.getBoundingClientRect();
			const initialParent = child.offsetParent;
			const dispose = popPresenceNodes([child], { anchorX, anchorY: 'bottom' });
			try {
				await frame();
				await frame();
				for (const transform of ['translateX(0px)', 'none', 'translateX(0px)']) {
					parent.style.transform = transform;
					await frame();
					await frame();
					const box = child.getBoundingClientRect();
					expect(Math.abs(box.x - before.x)).toBeLessThan(1);
					expect(Math.abs(box.y - before.y)).toBeLessThan(1);
					expect(box.width).toBeCloseTo(before.width, 1);
					expect(child.offsetParent).toBe(transform === 'none' ? initialParent : parent);
				}
				parent.style.marginTop = '17px';
				scroller.scrollTop += 11;
				await frame();
				await frame();
				expect(child.getBoundingClientRect().y).toBeCloseTo(before.y + 6, 0);
				expect(parent.style.position).toBe('');
			} finally {
				dispose();
				shell.remove();
			}
			await frame();
			expect(presenceMeasurements.size).toBe(0);
		});
	}
}

it('rebases an unprojected outgoing child after a parent commit between animation frames', async () => {
	const outer = document.createElement('div');
	outer.style.cssText =
		'position:relative;width:360px;padding:20px;border:3px solid;box-sizing:border-box';
	outer.innerHTML =
		'<div style="height:30px">Heading</div><div style="padding:4px 6px;border:2px solid"><div style="height:30px">Prefix</div><p style="margin:12px 0;font-size:14px;line-height:20px">Room 2 · Coastal light — afternoons with nowhere else to be.</p></div>';
	document.body.append(outer);
	const body = outer.lastElementChild as HTMLElement;
	const child = body.lastElementChild as HTMLElement;
	const layout = createLayout({ automatic: false, transition: { duration: 0.16, ease: 'linear' } });
	const disposeOuter = layout()(outer);
	const disposeBody = layout({ mode: 'position' })(body);
	let release = () => {};
	try {
		await frame();
		await frame();
		const boxes = createPresenceBoxes();
		boxes.capture(child);
		const before = child.getBoundingClientRect();
		const after = await new Promise<DOMRect>((resolve) => {
			motionFrame.postRender(() => {
				layout.update(() => {
					outer.style.width = '260px';
					release = popPresenceNodes([child], {}, boxes);
				});
				// Drain commit microtasks without admitting another frame: postRender on the
				// next frame would hide the one-paint containing-block jump being checked.
				let count = 0;
				const sample = () => {
					if (count++ < 7) queueMicrotask(sample);
					else resolve(child.getBoundingClientRect());
				};
				queueMicrotask(sample);
			});
		});
		expect(child.offsetParent).toBe(body);
		expect(Math.abs(after.x - before.x)).toBeLessThan(1);
		expect(Math.abs(after.y - before.y)).toBeLessThan(1);
		expect(Math.abs(after.width - before.width)).toBeLessThan(1);
	} finally {
		release();
		disposeBody?.();
		disposeOuter?.();
		outer.remove();
	}
	await frame();
	expect(presenceMeasurements.size).toBe(0);
});
