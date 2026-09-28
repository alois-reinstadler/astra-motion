import { expect, type Locator } from '@playwright/test';

// Native scrolling can outlive Playwright's two-frame actionability check in Firefox and WebKit.
// Wait before the action being tested, without retrying that action or disabling motion.
export async function settlePointerTarget(target: Locator, options: { focus?: boolean } = {}) {
	await target.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
	// Drag tests must let pointer-down establish focus so their focus assertion
	// still verifies the real interaction rather than this setup helper.
	if (options.focus !== false) await target.focus();
	await target.hover();
	const settled = await target.evaluate(async (node) => {
		let previous = '';
		let unchangedSince = performance.now();
		const deadline = unchangedSince + 3000;
		while (performance.now() < deadline) {
			await new Promise(requestAnimationFrame);
			const { x, y, width, height } = node.getBoundingClientRect();
			const position = [scrollX, scrollY, x, y, width, height].join(',');
			if (position !== previous) {
				previous = position;
				unchangedSince = performance.now();
			} else if (performance.now() - unchangedSince >= 100) return true;
		}
		return false;
	});
	expect(settled).toBe(true);
}
