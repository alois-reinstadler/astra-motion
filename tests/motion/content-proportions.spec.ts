import { expect, test } from '@playwright/test';

const scenes = [
	{
		name: 'homepage',
		route: '/',
		root: '#layout-playground',
		trigger: 'Stack',
		reverse: 'Grid',
		text: '.piece-symbol, strong'
	},
	{
		name: 'player',
		route: '/examples/layout',
		root: '.layout-example',
		trigger: 'Open player',
		reverse: 'Close player',
		text: '.record h3, .record p, .times span'
	},
	{
		name: 'note',
		route: '/examples/layout-expand',
		root: '[data-example="layout-expand"] .demo',
		trigger: 'Read the note',
		reverse: 'Close the note',
		text: '.card h3, .card p, .card button'
	},
	{
		name: 'panels',
		route: '/examples/layout-group-coordination',
		root: '[data-example="layout-group-coordination"] .demo',
		trigger: 'What should move?',
		reverse: 'What should move?',
		text: '.panel summary, .panel p'
	},
	{
		name: 'reorder',
		route: '/examples/reorder-list-grid',
		root: '[data-example="reorder-list-grid"] .demo',
		trigger: 'Use grid',
		reverse: 'Use list',
		text: '.item button'
	},
	{
		name: 'desk',
		route: '/showcase',
		root: '[data-testid="editing-desk"]',
		trigger: 'Cover',
		reverse: 'Story',
		text: '.paper-top span, .cover-copy h3, .paper-bottom span'
	},
	{
		name: 'queue',
		route: '/showcase',
		root: '[data-testid="queue-list"]',
		trigger: 'Compact',
		reverse: 'Comfortable',
		text: '.caption h4, .caption p, .sequence'
	}
];

for (const width of [1280, 393]) {
	for (const scene of scenes) {
		test(`${scene.name} preserves glyph proportions through resize and reversal at ${width}px`, async ({
			page
		}) => {
			await page.setViewportSize({ width, height: 900 });
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await page.goto(scene.route);
			const root = page.locator(scene.root);
			await expect(root).toBeVisible();
			await page.evaluate(() => document.fonts.ready);
			await root.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
			// The public preview enables its controls after hydration.
			const trigger =
				scene.name === 'panels'
					? root.locator('summary').first()
					: scene.name === 'queue'
						? page.getByTestId('queue-density')
						: root.getByRole('button', { name: scene.trigger, exact: scene.name !== 'player' });
			await expect(trigger).toBeEnabled();
			const originalCard = scene.name === 'note' ? await root.locator('.card').boundingBox() : null;
			const result = await root.evaluate(async (root, scene) => {
				const reference = document.createElement('span');
				reference.style.cssText =
					'all:initial;position:fixed;left:-10000px;top:0;white-space:pre;visibility:hidden;';
				document.body.append(reference);
				const range = document.createRange();
				const errors: string[] = [];
				let samples = 0;
				let projectedFrames = 0;
				let detailFrames = 0;
				const click = (label: string) => {
					const button =
						scene.name === 'queue'
							? document.querySelector<HTMLButtonElement>('[data-testid="queue-density"]')
							: [...root.querySelectorAll<HTMLElement>('button, summary')].find((node) =>
									node.textContent!.trim().startsWith(label)
								);
					if (!button) throw new Error(`Missing control: ${label}`);
					button.click();
				};
				try {
					click(scene.trigger);
					for (let frame = 0; frame < 150; frame++) {
						await new Promise(requestAnimationFrame);
						if (root.querySelector('.detail')) detailFrames++;
						if (frame === 7) click(scene.reverse);
						if (frame === 12) click(scene.trigger);
						// Also let a full close finish, including presence cleanup and collapse.
						if (frame === 75) click(scene.reverse);
						if (
							[...root.querySelectorAll('*')].some((node) => {
								const matrix = new DOMMatrix(getComputedStyle(node).transform);
								return Math.abs(matrix.a - 1) > 0.01 || Math.abs(matrix.d - 1) > 0.01;
							})
						)
							projectedFrames++;
						for (const element of root.querySelectorAll<HTMLElement>(scene.text)) {
							if (!element.checkVisibility()) continue;
							const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
							let text: Node | null;
							while ((text = walker.nextNode())) {
								const offset = text.textContent!.search(/\S/);
								if (offset < 0) continue;
								const style = getComputedStyle(text.parentElement!);
								for (const property of [
									'font-family',
									'font-size',
									'font-weight',
									'font-style',
									'font-stretch',
									'font-variation-settings',
									'font-feature-settings',
									'font-kerning',
									'font-optical-sizing',
									'font-variant',
									'letter-spacing',
									'line-height',
									'text-transform'
								]) {
									reference.style.setProperty(property, style.getPropertyValue(property));
								}
								// Keep neighbouring characters for kerning, ligatures and numeric variants.
								reference.textContent = text.textContent;
								range.setStart(reference.firstChild!, offset);
								range.setEnd(reference.firstChild!, offset + 1);
								const expected = range.getBoundingClientRect();
								range.setStart(text, offset);
								range.setEnd(text, offset + 1);
								const actual = range.getBoundingClientRect();
								if (!actual.width || !actual.height) continue;
								samples++;
								if (
									Math.abs(actual.width - expected.width) > 0.5 ||
									Math.abs(actual.height - expected.height) > 0.5
								) {
									if (errors.length < 10)
										errors.push(
											`${frame}: ${element.textContent!.trim().slice(0, 35)} (${actual.width.toFixed(2)} x ${actual.height.toFixed(2)}, expected ${expected.width.toFixed(2)} x ${expected.height.toFixed(2)})`
										);
								}
								break;
							}
						}
					}
				} finally {
					reference.remove();
				}
				return { errors, samples, projectedFrames, detailFrames };
			}, scene);
			expect(result.samples).toBeGreaterThan(100);
			expect(result.projectedFrames).toBeGreaterThan(0);
			expect(result.errors).toEqual([]);
			if (scene.name === 'note') {
				expect(result.detailFrames).toBeGreaterThan(0);
				await expect(root.locator('.detail')).toHaveCount(0);
				await expect(trigger).toHaveAttribute('aria-expanded', 'false');
				await expect
					.poll(async () => {
						const box = (await root.locator('.card').boundingBox())!;
						return Math.max(
							Math.abs(box.width - originalCard!.width),
							Math.abs(box.height - originalCard!.height)
						);
					})
					.toBeLessThan(0.5);
			}
		});
	}
}
