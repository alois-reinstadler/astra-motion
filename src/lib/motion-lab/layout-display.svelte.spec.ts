import { expect, it, vi } from 'vitest';
import { visualElementStore } from 'motion-dom';
import { createLayout } from '../motion/layout.js';
import { flushSync } from 'svelte';

const frames = async () => {
	await new Promise(requestAnimationFrame);
	await new Promise(requestAnimationFrame);
};

it.each([
	{ tag: 'span', display: 'inline', parentDisplay: 'block', warning: true },
	{ tag: 'span', display: 'contents', parentDisplay: 'block', warning: true },
	{ tag: 'span', display: 'inline-block', parentDisplay: 'block', warning: false },
	{ tag: 'span', display: 'inline', parentDisplay: 'flex', warning: false },
	{ tag: 'span', display: 'inline', parentDisplay: 'grid', warning: false },
	{ tag: 'img', display: 'inline', parentDisplay: 'block', warning: false }
])(
	'diagnoses $tag with $display in $parentDisplay without changing its display',
	async ({ tag, display, parentDisplay, warning }) => {
		const expectedWarning = warning && process.env.NODE_ENV !== 'production';
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const host = document.createElement('div');
		host.style.display = parentDisplay;
		const child = document.createElement(tag);
		child.style.display = display;
		if (tag !== 'img') child.textContent = 'Keep text readable';
		host.append(child);
		document.body.append(host);
		const layout = createLayout();
		let release: (() => void) | void = undefined;
		try {
			release = layout({ mode: 'position' })(child);
			await frames();
			const warnings = () =>
				warn.mock.calls.filter(([message]) => String(message).includes('[layout-display]'));
			expect(warnings()).toHaveLength(expectedWarning ? 1 : 0);
			if (expectedWarning) expect(warnings()[0][0]).toContain('block or inline-block');
			expect(child.style.display).toBe(display);
			release?.();
			await frames();
			release = layout({ mode: 'position' })(child);
			await frames();
			expect(warnings()).toHaveLength(expectedWarning ? 1 : 0);
		} finally {
			release?.();
			host.remove();
			await frames();
			warn.mockRestore();
		}
	}
);

it('diagnoses an inline host when a retained registration starts animating', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const child = document.createElement('span');
	child.textContent = 'Previously measurement-only';
	document.body.append(child);
	const layout = createLayout();
	let release = layout({ measureOnly: true })(child);
	try {
		await frames();
		const visual = visualElementStore.get(child);
		expect(warn).not.toHaveBeenCalled();
		flushSync(() => {
			release?.();
			release = layout({ mode: 'position' })(child);
		});
		await frames();
		expect(visualElementStore.get(child)).toBe(visual);
		expect(visual?.projection?.options.layout).toBe(true);
		expect(
			warn.mock.calls.filter(([message]) => String(message).includes('[layout-display]'))
		).toHaveLength(process.env.NODE_ENV === 'production' ? 0 : 1);
		expect(getComputedStyle(child).display).toBe('inline');
	} finally {
		release?.();
		child.remove();
		await frames();
		warn.mockRestore();
	}
});

it('keeps inline-block text unscaled while the parent resizes in both axes', async () => {
	const host = document.createElement('div');
	host.style.cssText = 'width:200px;height:100px;position:fixed;top:20px;left:20px';
	const child = document.createElement('span');
	child.style.cssText = 'display:inline-block;font:20px monospace';
	child.textContent = 'Readable';
	host.append(child);
	document.body.append(host);
	const layout = createLayout({ transition: { duration: 1, ease: 'linear' } });
	const releaseParent = layout()(host);
	const releaseChild = layout({ mode: 'position' })(child);
	const range = document.createRange();
	range.selectNodeContents(child);
	try {
		await frames();
		const before = range.getBoundingClientRect();
		layout.update(() => {
			host.style.width = '400px';
			host.style.height = '50px';
		});
		await frames();
		const animation = visualElementStore.get(host)!.projection!.currentAnimation!;
		expect(animation).toBeDefined();
		animation.pause();
		for (const time of [0.05, 0.3, 0.7]) {
			animation.time = time;
			await frames();
			const current = range.getBoundingClientRect();
			expect(Math.abs(current.width - before.width)).toBeLessThan(0.5);
			expect(Math.abs(current.height - before.height)).toBeLessThan(0.5);
		}
	} finally {
		releaseChild?.();
		releaseParent?.();
		host.remove();
		await frames();
	}
});
