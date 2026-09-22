import { expect, it } from 'vitest';
import '../../routes/layout.css';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Components from '../../routes/motion-lab/components/+page.svelte';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
function node(id: string): HTMLElement {
	const result = document.querySelector<HTMLElement>(`[data-testid="component-${id}"]`);
	if (!result) throw new Error(`Missing component-${id}`);
	return result;
}
async function click(id: string) {
	node(id).click();
	await tick();
}

it('reverses the actual accordion without stretching text or losing expanded state', async () => {
	await render(Components);
	await click('accordion-toggle');
	await expect
		.poll(() => node('accordion-content').getBoundingClientRect().height)
		.toBeGreaterThan(0);
	const content = node('accordion-content');
	expect(content.getBoundingClientRect().height).toBeGreaterThan(0);
	await click('accordion-toggle');
	await wait(30);
	await click('accordion-toggle');
	await wait(350);
	expect(node('accordion-content')).toBe(content);
	expect(node('accordion-trigger').getAttribute('aria-expanded')).toBe('true');
	const text = content.querySelector('p')!;
	expect(new DOMMatrix(getComputedStyle(text).transform).a).toBe(1);
	expect(new DOMMatrix(getComputedStyle(text).transform).d).toBe(1);
	await click('extra');
	expect(node('extra-content').textContent).toContain('extra paragraph');
});

it('preserves actual dialog focus, labeling, centering and Escape dismissal', async () => {
	await render(Components);
	const started = performance.now();
	const samples: unknown[] = [];
	const events: unknown[] = [];
	const recordIntro = (event: Event) => {
		if (
			!(event.target instanceof HTMLElement) ||
			event.target.dataset.testid !== 'component-dialog'
		)
			return;
		events.push({ type: event.type, elapsed: performance.now() - started });
	};
	const sample = () => {
		const dialog = document.querySelector<HTMLElement>('[data-testid="component-dialog"]');
		const opacity = dialog ? Number(getComputedStyle(dialog).opacity) : null;
		samples.push({
			elapsed: performance.now() - started,
			opacity,
			scroll: [scrollX, scrollY],
			visibility: document.visibilityState,
			focused: document.activeElement?.getAttribute('data-testid'),
			animations: dialog?.getAnimations().map((animation) => ({
				playState: animation.playState,
				pending: animation.pending,
				startTime: animation.startTime,
				currentTime: animation.currentTime,
				timing: animation.effect?.getComputedTiming()
			}))
		});
		return opacity;
	};
	document.addEventListener('introstart', recordIntro, true);
	document.addEventListener('introend', recordIntro, true);
	try {
		sample();
		node('dialog-trigger').focus();
		await click('dialog-trigger');
		try {
			await expect.poll(sample).toBe(1);
		} catch (error) {
			// Observe briefly after failure without turning eventual settlement into a pass.
			// Native intro clocks and scroll positions distinguish delayed frames from a stuck pose.
			for (let index = 0; index < 10; index++) {
				await wait(50);
				sample();
			}
			console.error(
				'Dialog intro failure diagnostics',
				JSON.stringify({
					viewport: { width: innerWidth, height: innerHeight, framed: window !== window.top },
					events,
					samples
				})
			);
			throw error;
		}
	} finally {
		document.removeEventListener('introstart', recordIntro, true);
		document.removeEventListener('introend', recordIntro, true);
	}
	const dialog = node('dialog');
	expect(dialog.getAttribute('role')).toBe('dialog');
	expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
	expect(dialog.contains(document.activeElement)).toBe(true);
	const before = dialog.getBoundingClientRect();
	expect(Math.abs(before.x + before.width / 2 - innerWidth / 2)).toBeLessThan(2);
	expect(Math.abs(before.y + before.height / 2 - innerHeight / 2)).toBeLessThan(2);
	await click('dialog-expand');
	await expect.poll(() => dialog.getBoundingClientRect().height).toBeGreaterThan(before.height + 2);
	expect(node('dialog-extra')).toBeTruthy();
	await wait(350);
	const after = dialog.getBoundingClientRect();
	expect(after.height).toBeGreaterThan(before.height);
	expect(Math.abs(after.y + after.height / 2 - innerHeight / 2)).toBeLessThan(2);
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
	await tick();
	expect(document.activeElement).toBe(node('dialog-trigger'));
	await expect.poll(() => document.querySelector('[data-testid="component-dialog"]')).toBeNull();
});

it('reopens the same dialog during exit and cleans up a destroyed owner', async () => {
	await render(Components);
	node('dialog-trigger').focus();
	await click('dialog-trigger');
	await expect.poll(() => Number(getComputedStyle(node('dialog')).opacity)).toBeGreaterThan(0.3);
	const original = node('dialog');
	await click('dialog-close');
	await wait(30);
	await click('dialog-trigger');
	await wait(300);
	expect(node('dialog')).toBe(original);
	await click('dialog-destroy');
	await expect.poll(() => document.querySelector('[data-testid="component-dialog"]')).toBeNull();
	expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull();
	node('dialog-reset').focus();
	expect(document.activeElement).toBe(node('dialog-reset'));
});

it('removes cards from flow during filter exits and restores current keyed cards under reversal', async () => {
	await render(Components);
	await expect.poll(() => Number(getComputedStyle(node('card-2')).opacity)).toBe(1);
	const original = node('card-2');
	await click('filter');
	await expect.poll(() => original.style.position).toBe('absolute');
	expect(node('card-2')).toBe(original);
	expect(original.style.position).toBe('absolute');
	await click('reorder');
	await click('filter');
	await wait(600);
	expect(node('card-2')).toBe(original);
	expect(original.style.position).toBe('');
	expect(document.querySelectorAll('[data-testid^="component-card-"]')).toHaveLength(6);
	const ids = [...node('grid').children].map((element) => element.getAttribute('data-testid'));
	expect(ids).toEqual([6, 5, 4, 3, 2, 1].map((id) => `component-card-${id}`));
});

it('keeps form text unscaled throughout an interrupted dialog resize', async () => {
	await render(Components);
	await click('dialog-trigger');
	await expect.poll(() => Number(getComputedStyle(node('dialog')).opacity)).toBe(1);
	await wait(250);
	let worstScaleError = 0;
	for (let cycle = 0; cycle < 3; cycle++) {
		await click('dialog-expand');
		for (let frame = 0; frame < 7; frame++) {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
			let scaleY = 1;
			for (
				let element: HTMLElement | null = node('dialog-input');
				element;
				element = element.parentElement
			) {
				scaleY *= new DOMMatrix(getComputedStyle(element).transform).d;
			}
			worstScaleError = Math.max(worstScaleError, Math.abs(scaleY - 1));
		}
	}
	expect(worstScaleError).toBeLessThan(0.025);
});
