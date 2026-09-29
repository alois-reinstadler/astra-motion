import assert from 'node:assert/strict';
import { expect } from '@playwright/test';

export async function hydrateTextFixture(page, url) {
	let release;
	const ready = new Promise((resolve) => {
		release = resolve;
	});
	await page.route('**/*.js', async (route) => {
		await ready;
		await route.continue();
	});
	try {
		await page.goto(url, { waitUntil: 'commit' });
		const button = page.locator('[data-swap-button]');
		await expect(button).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Packed text 👩🏽‍💻 é' })).toBeVisible();
		const original = await button.elementHandle();
		assert(original);
		await button.focus();
		release();
		await expect(page.locator('main')).toHaveAttribute('data-hydrated', 'true');
		assert.equal(
			await original.evaluate((node) => node === document.querySelector('[data-swap-button]')),
			true,
			'Hydration retains the native button host'
		);
		await expect(button).toBeFocused();
		await original.dispose();
	} finally {
		release();
	}
}

export async function verifyTextEntry(page) {
	await expect(page.getByRole('heading', { name: 'Packed text 👩🏽‍💻 é' })).toBeVisible();
	const button = page.locator('[data-swap-button]');
	await expect(button).toHaveAccessibleName('Save changes');
	const fixed = await page.locator('[data-fixed]').boundingBox();
	assert(fixed);
	assert.equal(fixed.width, 180, 'Default inline host honors explicit fixed width');
	assert.equal(fixed.height, 90, 'Default inline host honors explicit fixed height');
	const before = await button.boundingBox();
	assert(before);
	const original = await button.elementHandle();
	assert(original);
	await button.focus();
	await page.keyboard.press('Enter');
	await expect(button).toHaveAccessibleName('Saved successfully');
	await expect(button).toBeFocused();
	const widths = await button.evaluate(async (node) => {
		const samples = [];
		for (let index = 0; index < 20; index++) {
			await new Promise(requestAnimationFrame);
			samples.push(node.getBoundingClientRect().width);
		}
		return samples;
	});
	assert(
		widths.every((width) => Math.abs(width - before.width) < 1),
		'Reservation remains stable during swap'
	);
	await expect(button.locator('[data-text-layer]')).toHaveCount(1);
	await expect(button.locator('[data-text-layer]')).toHaveText('Saved successfully');
	await page.keyboard.press('Enter');
	await expect(button).toHaveAccessibleName('Save changes');
	await expect(button).toBeFocused();
	await expect(button.locator('[aria-live]')).toHaveCount(1);
	await expect(button.locator('[aria-live]')).toHaveAttribute('aria-live', 'off');
	assert.equal(
		await original.evaluate((node) => node === document.querySelector('[data-swap-button]')),
		true,
		'Swaps retain the native control host'
	);
	await original.dispose();
	await page.getByRole('button', { name: 'Toggle reveal' }).click();
	const visual = page.locator('[data-state-reveal] [data-text-fragment]');
	await expect(visual).toHaveCSS('opacity', '0');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect(visual).toBeVisible();
	await expect(visual).toHaveCSS('opacity', '1');
	return [
		'SSR/hydration of complete Unicode text',
		'hydration and swap host identity',
		'one accessible control label across interrupted swaps',
		'native keyboard focus retention',
		'reserved button width',
		'live reduced-motion state reveal'
	];
}

export async function verifyTiltEntry(page) {
	const host = page.locator('[data-tilt-fixture]');
	const content = host.locator('[data-astra-tilt-content]');
	const input = page.getByLabel('Retained tilt input');
	await input.fill('retained content');
	await page.getByRole('button', { name: 'Native action' }).click();
	await expect(page.locator('[data-clicks]')).toHaveText('1');
	const box = await host.boundingBox();
	assert(box);
	await page.mouse.move(box.x + box.width - 2, box.y + 2);
	await expect
		.poll(() => content.evaluate((node) => getComputedStyle(node).transform))
		.not.toBe('none');
	await page.getByRole('button', { name: 'Toggle tilt' }).click();
	await expect(content).toHaveCSS('transform', 'none');
	await expect(input).toHaveValue('retained content');
	await page.mouse.move(box.x + box.width - 2, box.y + 2);
	await expect(content).toHaveCSS('transform', 'none');
	await page.getByRole('button', { name: 'Toggle tilt' }).click();
	await page.mouse.move(box.x + box.width - 2, box.y + 2);
	await expect
		.poll(() => content.evaluate((node) => getComputedStyle(node).transform))
		.not.toBe('none');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect(content).toHaveCSS('transform', 'none');
	return [
		'SSR/hydration with native content',
		'pointer-driven shared spring playback',
		'disabling settles playback and retains input',
		'live reduced-motion neutralization',
		'native click behavior'
	];
}
