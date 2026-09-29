import { verifyRC } from './verify-rc-package.mjs';
import {
	hydrateTextFixture,
	verifyTextEntry,
	verifyTiltEntry
} from './verify-optional-motion-entries.mjs';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import { packedBundleEvidence } from './measure-packed-motion-bundles.mjs';
import { verifyPackedConsumer, digest } from './motion-consumer-provenance.mjs';

const setup = JSON.parse(
	readFileSync(process.argv[2] ?? '/tmp/astra-motion-production-current.json', 'utf8')
);
const output = resolve(process.argv[3] ?? 'artifacts/packed-consumer');
mkdirSync(output, { recursive: true });
const bundle = packedBundleEvidence(setup);
writeFileSync(join(output, 'bundle-results.json'), JSON.stringify(bundle, null, 2) + '\n');
verifyPackedConsumer({ ...setup, consumer: setup.plainConsumer });
const allFixtures = ['Parity', ...Object.keys(bundle.entries)];
const focusedFixture = process.argv
	.find((argument) => argument.startsWith('--fixture='))
	?.slice('--fixture='.length);
assert(!focusedFixture || allFixtures.includes(focusedFixture), 'Unknown --fixture selection');
const fixtures = focusedFixture ? [focusedFixture] : allFixtures;
const renderers = new Map();
for (const fixture of fixtures) {
	const serverFile = join(setup.plainConsumer, 'build', fixture, 'server/server.js');
	const { renderPage } = await import(pathToFileURL(serverFile).href);
	renderers.set(fixture, renderPage);
}
const failures = [];
const server = createServer(async (request, response) => {
	try {
		const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
		if (pathname === '/favicon.ico') {
			response.writeHead(204).end();
			return;
		}
		const [, fixture, ...segments] = pathname.split('/');
		if (!fixtures.includes(fixture) || segments.some((part) => part === '..')) {
			response.writeHead(404).end();
			return;
		}
		const client = join(setup.plainConsumer, 'build', fixture, 'client');
		response.setHeader('X-Astra-Archive', setup.sha256);
		response.setHeader('Cache-Control', 'no-store');
		if (!segments.join('') || segments.join('/') === 'index.html') {
			const result = await renderers.get(fixture)();
			const template = readFileSync(join(client, 'index.html'), 'utf8');
			response.setHeader('Content-Type', 'text/html');
			response.end(
				template.replace('<!--ssr-head-->', result.head).replace('<!--ssr-body-->', result.body)
			);
		} else {
			const file = join(client, ...segments);
			if (!existsSync(file) || !realpathSync(file).startsWith(realpathSync(client) + '/')) {
				response.writeHead(404).end();
				return;
			}
			response.setHeader(
				'Content-Type',
				{
					'.js': 'text/javascript',
					'.css': 'text/css',
					'.json': 'application/json',
					'.map': 'application/json'
				}[extname(file)] ?? 'application/octet-stream'
			);
			response.end(readFileSync(file));
		}
	} catch (error) {
		failures.push(String(error.stack ?? error));
		response.writeHead(500).end(String(error));
	}
});
await new Promise((resolve, reject) => {
	server.once('error', reject);
	server.listen(0, '127.0.0.1', resolve);
});
const origin = `http://127.0.0.1:${server.address().port}`;
const selected = process.env.MOTION_BROWSER
	? [process.env.MOTION_BROWSER]
	: ['chromium', 'firefox', 'webkit'];
const results = [];
const frameGap = (page, count = 3) =>
	page.evaluate(async (count) => {
		for (let index = 0; index < count; index++) await new Promise(requestAnimationFrame);
	}, count);
const translation = (locator) =>
	locator.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
try {
	for (const name of selected) {
		const engine = { chromium, firefox, webkit }[name];
		assert(engine, `Unknown MOTION_BROWSER ${name}`);
		const browser = await engine.launch({ headless: true });
		const cases = [];
		try {
			for (const fixture of fixtures) {
				const context = await browser.newContext({ viewport: { width: 1000, height: 900 } });
				await context.addInitScript(() =>
					Object.defineProperty(document, 'startViewTransition', {
						configurable: true,
						value: undefined
					})
				);
				const page = await context.newPage();
				const errors = [];
				const requests = [];
				page.on('pageerror', (error) => errors.push(error.message));
				page.on('console', (message) => {
					if (['warning', 'error'].includes(message.type())) errors.push(message.text());
				});
				page.on('response', (response) => {
					if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
				});
				page.on('request', (request) => {
					if (request.resourceType() === 'script') requests.push(new URL(request.url()).pathname);
				});
				const url = `${origin}/${fixture}/`;
				const ssrResponse = await fetch(url);
				assert.equal(ssrResponse.status, 200, `${fixture} SSR status`);
				assert.equal(ssrResponse.headers.get('x-astra-archive'), setup.sha256);
				assert.match(
					await ssrResponse.text(),
					/data-hydrated="false"/,
					`${fixture} rendered on server`
				);
				try {
					if (fixture === 'LazyBasic' || fixture === 'LazyFull') {
						let release;
						const hydrate = new Promise((resolve) => {
							release = resolve;
						});
						await page.route('**/*.js', async (route) => {
							await hydrate;
							await route.continue();
						});
						await page.goto(url, { waitUntil: 'commit' });
						await expect(page.getByLabel('Lazy input')).toBeVisible();
						await page.getByLabel('Lazy input').fill('typed before hydration');
						await page.evaluate(() => {
							window.__original = document.querySelector('input');
						});
						assert.equal(
							await translation(page.locator('[data-box]')),
							20,
							'SSR initial:false renders target'
						);
						release();
						await expect(page.locator('main')).toHaveAttribute('data-hydrated', 'true');
						await expect(page.getByLabel('Lazy input')).toHaveValue('typed before hydration');
						const deferred = bundle.entries[fixture].chunks
							.filter((chunk) => chunk.phase === 'deferred')
							.map((chunk) => `/${fixture}/${chunk.file}`);
						assert(
							!requests.some((path) => deferred.includes(path)),
							'Feature chunks requested before load'
						);
						await page.getByRole('button', { name: 'Change pending target' }).click();
						await page.getByRole('button', { name: 'Load features' }).click();
						await expect(page.locator('main')).toHaveAttribute('data-ready', 'true');
						await expect.poll(() => translation(page.locator('[data-box]'))).toBe(80);
						await page.getByRole('button', { name: 'Check identity' }).click();
						await expect(page.locator('main')).toHaveAttribute('data-identity', 'true');
						await expect(page.getByLabel('Lazy input')).toHaveValue('typed before hydration');
						assert(
							deferred.every((path) => requests.includes(path)),
							'Deferred feature chunks were not all requested'
						);
						cases.push({
							fixture,
							assertions: [
								'SSR initial:false',
								'typed hydration state',
								'DOM/ref identity',
								'no early feature request',
								'deferred chunk request',
								'latest pending target'
							],
							requests
						});
					} else {
						if (fixture === 'Text') await hydrateTextFixture(page, url);
						else await page.goto(url);
						await expect(page.locator('main[data-hydrated]')).toHaveAttribute(
							'data-hydrated',
							'true'
						);
						if (fixture === 'Parity') {
							await verifyRC(page);
							await expect(page.locator('[data-derived]')).toHaveText('4');
							await expect(page.locator('[data-smil]')).toHaveAttribute('values', '5;10;5');
							await page.evaluate(() => window.__astra.set(7));
							await expect(page.locator('[data-derived]')).toHaveText('14');
							await page.getByRole('button', { name: 'Toggle presence' }).click();
							await expect(page.locator('[data-present]')).toHaveCount(0);
							await expect(page.locator('[data-exited]')).toHaveText('1');
							await page.getByRole('button', { name: 'Toggle presence' }).click();
							await expect(page.locator('[data-present]')).toBeVisible();
							await page.getByLabel('Retained input').fill('keep my state');
							await page.getByRole('button', { name: 'Start owned animation' }).click();
							await expect.poll(() => page.evaluate(() => window.__astra.active())).toBe(1);
							await page.getByRole('button', { name: 'Toggle activity' }).click();
							await expect(page.getByLabel('Retained input')).toBeHidden();
							await frameGap(page);
							const hidden = await page.evaluate(() => [
								window.__astra.readTime(),
								window.__astra.frames()
							]);
							await page.evaluate(() => window.__astra.springSet(80));
							await frameGap(page, 6);
							assert.equal(
								await page.evaluate(() => window.__astra.springAnimating()),
								false,
								'Hidden scalar spring does not start playback'
							);
							assert.equal(
								await page.evaluate(() => window.__astra.springRead()),
								0,
								'Hidden scalar spring holds its value'
							);
							assert.deepEqual(
								await page.evaluate(() => [window.__astra.readTime(), window.__astra.frames()]),
								hidden,
								'Hidden activity cancels owned frame work'
							);
							await page.getByRole('button', { name: 'Toggle activity' }).click();
							await expect(page.getByLabel('Retained input')).toHaveValue('keep my state');
							await expect.poll(() => page.evaluate(() => window.__astra.springRead())).toBe(80);
							await expect
								.poll(() => page.evaluate(() => window.__astra.frames()))
								.toBeGreaterThan(hidden[1]);
							await page.getByRole('button', { name: 'Toggle owner' }).click();
							await expect.poll(() => page.evaluate(() => window.__astra.destroyed())).toBe(1);
							assert.equal(
								await page.evaluate(() => window.__astra.active()),
								0,
								'Destroyed scope releases animations'
							);
							const removed = await page.evaluate(() => [
								window.__astra.readTime(),
								window.__astra.frames(),
								window.__astra.read()
							]);
							await page.evaluate(() => window.__astra.set(99));
							await frameGap(page, 6);
							assert.deepEqual(
								await page.evaluate(() => [
									window.__astra.readTime(),
									window.__astra.frames(),
									window.__astra.read()
								]),
								removed,
								'Removed owner releases frame and derivation subscriptions'
							);
							await page.getByRole('button', { name: 'Swap view' }).click();
							await expect(page.locator('[data-view]')).toHaveText('second');
							await expect(page.locator('[data-outcome]')).toHaveText('unsupported');
							await page.locator('[data-handle]').scrollIntoViewIfNeeded();
							const handle = await page.locator('[data-handle]').boundingBox();
							assert(handle);

							await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
							await page.mouse.down();
							await page.mouse.move(
								handle.x + handle.width / 2 + 150,
								handle.y + handle.height / 2,
								{ steps: 12 }
							);

							await expect.poll(() => translation(page.locator('[data-drag]'))).toBe(100);
							await page.mouse.up();

							await expect(page.locator('[data-drag-end]')).toHaveText('1');
							assert.equal(
								await translation(page.locator('[data-drag]')),
								100,
								'External drag handle respects hard constraints'
							);
							await page.locator('[data-item="Alpha"]').scrollIntoViewIfNeeded();
							const item = await page.locator('[data-item="Alpha"]').boundingBox();
							assert(item);
							await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2);
							await page.mouse.down();
							await page.mouse.move(item.x + item.width / 2, item.y + 75, { steps: 8 });
							await expect
								.poll(() => page.locator('[data-item]').allTextContents())
								.toEqual(['Beta', 'Alpha', 'Gamma']);
							await frameGap(page);
							await page.mouse.move(item.x + item.width / 2, item.y + 145, { steps: 8 });
							await expect
								.poll(() => page.locator('[data-item]').allTextContents())
								.toEqual(['Beta', 'Gamma', 'Alpha']);
							await page.mouse.up();
							await expect
								.poll(() => page.locator('[data-item]').allTextContents())
								.toEqual(['Beta', 'Gamma', 'Alpha']);
							await page.screenshot({ path: join(output, `${name}-parity.png`) });
							cases.push({
								fixture,
								assertions: [
									'SSR/hydration',
									'MotionValue derivation',
									'managed presence exits',
									'activity state/frame pause/reveal and hidden scalar spring targets',
									'owner animation/frame/subscription cleanup',
									'async view fallback',
									'external constrained drag',
									'bound Reorder and RC APIs, native/fallback views'
								],
								requests
							});
						} else if (fixture === 'Text' || fixture === 'Tilt') {
							const assertions = await (fixture === 'Text' ? verifyTextEntry : verifyTiltEntry)(
								page
							);
							cases.push({ fixture, assertions, requests });
						} else if (fixture === 'Eager') {
							assert.equal(await translation(page.locator('[data-box]')), 20);
							await page.getByRole('button', { name: 'Animate', exact: true }).click();
							await expect.poll(() => translation(page.locator('[data-box]'))).toBe(80);
							cases.push({
								fixture,
								assertions: ['SSR/hydration initial:false', 'reactive target animation'],
								requests
							});
						} else if (fixture === 'LazySync') {
							await expect(page.locator('[data-box]')).toHaveCSS('opacity', '1');
							cases.push({
								fixture,
								assertions: ['SSR/hydration', 'synchronous basic features'],
								requests
							});
						} else {
							await page.getByRole('button', { name: 'Animate', exact: true }).click();
							await expect(page.locator('[data-box]')).toHaveCSS('opacity', '1');
							await expect(page.locator('[data-active]')).toHaveText('0');
							cases.push({
								fixture,
								assertions: ['SSR/hydration', 'scoped playback', 'completed controls released'],
								requests
							});
						}
					}
					assert.deepEqual(errors, [], `${name}/${fixture} browser console/network errors`);
					for (const path of requests) {
						const bytes = Buffer.from(await (await fetch(origin + path)).arrayBuffer());
						assert.equal(
							digest(bytes),
							digest(
								readFileSync(
									join(
										setup.plainConsumer,
										'build',
										fixture,
										'client',
										path.slice(fixture.length + 2)
									)
								)
							),
							'Served JS differs from built asset'
						);
					}
					console.log(`${name}/${fixture}: passed`);
				} catch (error) {
					await page.screenshot({ path: join(output, `${name}-${fixture}-failure.png`) });
					writeFileSync(join(output, `${name}-${fixture}-failure.html`), await page.content());
					console.error({ fixture, errors });
					throw error;
				} finally {
					await context.close();
				}
			}
			results.push({ browser: name, version: browser.version(), cases });
		} finally {
			await browser.close();
		}
	}
	assert.deepEqual(failures, [], 'Consumer server failures');
	writeFileSync(
		join(
			output,
			`runtime-results-${selected.join('-')}${focusedFixture ? `-${focusedFixture}` : ''}.json`
		),
		JSON.stringify(
			{
				status: 'passed',
				date: new Date().toISOString(),
				archiveSha256: setup.sha256,
				source: setup.source,
				results
			},
			null,
			2
		) + '\n'
	);
	console.log(
		JSON.stringify(
			{
				status: 'passed',
				output,
				archiveSha256: setup.sha256,
				browsers: results.map(({ browser, cases }) => ({ browser, fixtures: cases.length }))
			},
			null,
			2
		)
	);
} finally {
	await new Promise((resolve) => server.close(resolve));
}
