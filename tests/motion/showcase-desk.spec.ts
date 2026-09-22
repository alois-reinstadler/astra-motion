import { expect, test } from '@playwright/test';

test('editing desk preserves live edits through dock, format and inspector changes', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/showcase#editing-desk');
	const desk = page.getByTestId('editing-desk');
	await expect(desk.getByRole('button', { name: 'Hide inspector' })).toBeEnabled();
	await desk.getByRole('textbox', { name: 'Headline' }).fill('Something worth noticing');
	await desk
		.getByRole('textbox', { name: 'Deck', exact: true })
		.fill('A new perspective, closer to home.');
	await desk.getByRole('button', { name: 'Left', exact: false }).click();
	await desk.getByRole('button', { name: 'Cover', exact: true }).click();
	await desk.getByRole('button', { name: 'Coral paper' }).click();
	await desk.getByRole('button', { name: 'Hide inspector' }).click();
	await expect(desk.getByRole('textbox', { name: 'Headline' })).toHaveCount(0);
	await expect(desk.getByRole('heading', { name: 'Something worth noticing' })).toBeVisible();
	await desk.getByRole('button', { name: 'Show inspector' }).click();
	await expect(desk.getByRole('textbox', { name: 'Headline' })).toHaveValue(
		'Something worth noticing'
	);
	await expect(desk.getByRole('button', { name: 'Coral paper' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(errors).toEqual([]);
});

test('desk image and text retain proportions during large interrupted resizes', async ({
	page,
	browserName
}) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/showcase#editing-desk');
	const desk = page.getByTestId('editing-desk');
	await expect(desk.getByRole('button', { name: 'Hide inspector' })).toBeEnabled();
	const result = await desk.evaluate(async (scene) => {
		let textError = 0,
			imageError = 0;
		let pixelError = 0,
			imageScaleError = 0;
		let worst = {};
		for (let frame = 0; frame < 80; frame++) {
			if (frame % 10 === 0) scene.querySelector<HTMLButtonElement>('.desk-toolbar button')?.click();
			if (frame % 13 === 0) {
				const buttons = scene.querySelectorAll<HTMLButtonElement>('.canvas-tabs button');
				buttons[buttons[0].getAttribute('aria-pressed') === 'true' ? 1 : 0]?.click();
			}
			await new Promise(requestAnimationFrame);
			const heading = scene.querySelector('.cover-copy h3')!;
			let x = 1,
				y = 1;
			for (
				let node: Element | null = heading;
				node && scene.contains(node);
				node = node.parentElement
			) {
				const matrix = new DOMMatrix(getComputedStyle(node).transform);
				x *= Math.hypot(matrix.a, matrix.b);
				y *= Math.hypot(matrix.c, matrix.d);
			}
			textError = Math.max(textError, Math.abs(x - 1), Math.abs(y - 1));
			const imageNode = scene.querySelector('img')!;
			const image = imageNode.getBoundingClientRect();
			let imageX = 1,
				imageY = 1;
			for (
				let node: Element | null = imageNode;
				node && scene.contains(node);
				node = node.parentElement
			) {
				const matrix = new DOMMatrix(getComputedStyle(node).transform);
				imageX *= Math.hypot(matrix.a, matrix.b);
				imageY *= Math.hypot(matrix.c, matrix.d);
			}
			imageScaleError = Math.max(imageScaleError, Math.abs(imageX / imageY - 1));
			pixelError = Math.max(pixelError, Math.abs(image.width - image.height * 1.5));
			const currentError = Math.abs(image.width / image.height - 1.5);
			if (currentError > imageError)
				worst = {
					frame,
					width: image.width,
					height: image.height,
					cssWidth: getComputedStyle(imageNode).width,
					cssHeight: getComputedStyle(imageNode).height,
					imageX,
					imageY
				};
			imageError = Math.max(imageError, currentError);
		}
		return { textError, imageError, pixelError, imageScaleError, worst };
	});
	console.log('Editing desk frame measurements:', JSON.stringify(result));
	expect(result.textError).toBeLessThan(0.002);
	// Motion intentionally rounds Safari projection boxes; keep the error subpixel-sized.
	expect(result.pixelError).toBeLessThanOrEqual(1.25);
	expect(result.imageScaleError).toBeLessThan(browserName === 'webkit' ? 0.005 : 0.002);
	if (browserName !== 'webkit') expect(result.imageError).toBeLessThan(0.002);
	await expect
		.poll(() =>
			desk.locator('img').evaluate((image) => {
				const box = image.getBoundingClientRect();
				return Math.abs(box.width / box.height - 1.5);
			})
		)
		.toBeLessThan(0.0001);
});

test('inspector exit settles when inherited reduced motion changes live', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/showcase#editing-desk');
	await expect(
		page.getByTestId('editing-desk').getByRole('button', { name: 'Hide inspector' })
	).toBeEnabled();
	await expect
		.poll(() =>
			page.locator('.inspector').evaluate((node) => Number(getComputedStyle(node).opacity))
		)
		.toBe(1);
	await page
		.getByTestId('editing-desk')
		.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
	const result = await page.evaluate(async () => {
		// Let the native anchor scroll and rendering resume before starting a 140ms exit.
		await new Promise(requestAnimationFrame);
		await new Promise(requestAnimationFrame);
		const inspector = document.querySelector<HTMLElement>('.inspector')!;
		let exiting = false;
		inspector.addEventListener('outrostart', () => (exiting = true), { once: true });
		document
			.querySelector<HTMLButtonElement>('[data-testid=editing-desk] .desk-toolbar button')!
			.click();
		// Observe the real native outro before changing policy. On slow WebKit frames,
		// its clock advances even when no intermediate opacity has painted yet.
		let nativeExit: Animation | undefined;
		let activeExit: { state: string; time: number; duration: number } | null = null;
		for (let frame = 0; frame < 120 && inspector.isConnected; frame++) {
			await new Promise(requestAnimationFrame);
			if (!exiting) continue;
			for (const animation of inspector.getAnimations()) {
				const time = animation.currentTime;
				const duration = animation.effect?.getTiming().duration;
				if (
					animation.playState === 'running' &&
					typeof time === 'number' &&
					Number.isFinite(time) &&
					time >= 0 &&
					typeof duration === 'number' &&
					Number.isFinite(duration) &&
					time < duration
				) {
					activeExit = { state: animation.playState, time, duration };
					nativeExit = animation;
					break;
				}
			}
			if (nativeExit) break;
		}
		if (!nativeExit || !activeExit) throw new Error('No running native inspector outro observed');
		try {
			// Hold the real retention clock halfway through its authored duration. A slow
			// frame or a no-op policy handler must not pass by naturally finishing the exit.
			nativeExit.pause();
			nativeExit.currentTime = activeExit.duration / 2;
			await nativeExit.ready;
			const pausedTime = nativeExit.currentTime;
			await new Promise(requestAnimationFrame);
			await new Promise(requestAnimationFrame);
			const before = Number(getComputedStyle(inspector).opacity);
			const held = inspector.isConnected && nativeExit.playState === 'paused';
			const heldTime = nativeExit.currentTime;
			document.querySelector<HTMLInputElement>('[data-testid=showcase-reduced]')!.click();
			await new Promise(requestAnimationFrame);
			await new Promise(requestAnimationFrame);
			return {
				activeExit,
				before,
				held,
				pausedTime,
				heldTime,
				after: Number(getComputedStyle(inspector).opacity),
				afterTime: nativeExit.currentTime,
				stillPaused: nativeExit.playState === 'paused',
				retained: inspector.isConnected
			};
		} finally {
			// Svelte still owns retention; restore its clock even if an assertion fails.
			nativeExit.play();
		}
	});
	expect(result.before).toBeGreaterThan(0);
	expect(result.activeExit).toMatchObject({ state: 'running' });
	expect(result.activeExit!.time).toBeGreaterThanOrEqual(0);
	expect(result.activeExit!.time).toBeLessThan(result.activeExit!.duration);
	expect(result.held).toBe(true);
	expect(result.pausedTime).toBeGreaterThanOrEqual(0);
	expect(result.pausedTime).toBeLessThan(result.activeExit!.duration);
	expect(result.heldTime).toBe(result.pausedTime);
	expect(result.afterTime).toBe(result.pausedTime);
	expect(result.stillPaused).toBe(true);
	expect(result.retained).toBe(true);
	expect(result.after).toBe(0);
	await expect(page.locator('.inspector')).toHaveCount(0);
	await page.getByTestId('editing-desk').getByRole('button', { name: 'Show inspector' }).click();
	await expect(page.locator('.inspector')).toHaveCSS('opacity', '1');
});
