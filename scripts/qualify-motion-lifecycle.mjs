import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, firefox, webkit } from 'playwright';

const argumentsList = process.argv.slice(2);
function option(name, fallback) {
	const index = argumentsList.indexOf(name);
	return index < 0 ? fallback : argumentsList[index + 1];
}
const productionURL = option('--url', 'http://127.0.0.1:5290');
const consumerDirectory = option('--consumer');
const output = path.resolve(option('--output', 'artifacts/production-lifecycle.json'));
const devPort = Number(option('--dev-port', '5291'));
const report = {
	date: new Date().toISOString(),
	productionURL,
	browserVersions: {},
	cases: [],
	physicalSafari: {
		tested: false,
		reason:
			'This runner uses locally installed Playwright engines. WebKit is not physical Safari or iOS.'
	}
};

async function check(name, callback) {
	try {
		const evidence = await callback();
		report.cases.push({ name, status: 'passed', evidence });
		console.log(`PASS ${name}: ${JSON.stringify(evidence)}`);
	} catch (error) {
		report.cases.push({ name, status: 'failed', error: String(error), stack: error.stack });
		console.error(`FAIL ${name}: ${error.stack}`);
	}
}

async function instrument(page) {
	await page.addInitScript(() => {
		const names = () =>
			[...document.querySelectorAll('[style]')]
				.filter((node) => node.style.viewTransitionName?.startsWith('astra_'))
				.map((node) => ({
					name: node.style.viewTransitionName,
					testid: node.getAttribute('data-testid')
				}));
		window.__motionLifecycle = {
			documentId: crypto.randomUUID(),
			shows: [],
			hides: [],
			transitions: []
		};
		addEventListener('pageshow', (event) =>
			window.__motionLifecycle.shows.push({ persisted: event.persisted, names: names() })
		);
		addEventListener('pagehide', (event) => {
			const record = { persisted: event.persisted, beforeNames: names(), names: null };
			window.__motionLifecycle.hides.push(record);
		});
		if (document.startViewTransition) {
			const start = document.startViewTransition.bind(document);
			document.startViewTransition = (update) => {
				const record = {
					oldNames: names(),
					newNames: [],
					ready: false,
					finished: false,
					rejected: null
				};
				window.__motionLifecycle.transitions.push(record);
				const callback = typeof update === 'function' ? update : update.update;
				const wrapped = async () => {
					await callback();
					record.newNames = names();
				};
				const transition = start(
					typeof update === 'function' ? wrapped : { ...update, update: wrapped }
				);
				transition.ready.then(
					() => {
						record.ready = true;
					},
					(error) => {
						record.rejected = error.name;
					}
				);
				transition.finished.then(
					() => {
						record.finished = true;
					},
					() => {
						record.finished = true;
					}
				);
				return transition;
			};
		}
	});
}
// Register after hydration so this observer runs after Astra's pagehide cleanup.
// A microtask from an init-script listener can run between native event listeners.
async function observeHideAfterMount(page) {
	await page.evaluate(() => {
		addEventListener('pagehide', () => {
			const record = window.__motionLifecycle.hides.at(-1);
			record.names = [...document.querySelectorAll('[style]')]
				.filter((node) => node.style.viewTransitionName?.startsWith('astra_'))
				.map((node) => ({
					name: node.style.viewTransitionName,
					testid: node.getAttribute('data-testid')
				}));
		});
	});
}

async function until(page, callback, arg) {
	await page.waitForFunction(callback, arg, { timeout: 10000 });
}

await check('adapter-node sends pending SSR markup before deferred data', async () => {
	const start = performance.now();
	const response = await fetch(`${productionURL}/lifecycle/streamed?mode=late`);
	assert.equal(response.status, 200);
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let html = '',
		pendingAt = null;
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		html += decoder.decode(value, { stream: true });
		if (pendingAt === null && html.includes('data-testid="stream-pending"'))
			pendingAt = performance.now() - start;
	}
	const completedAt = performance.now() - start;
	assert.notEqual(pendingAt, null, 'No pending SSR markup was streamed');
	assert.ok(html.includes('Late photograph arrived'));
	assert.ok(
		completedAt - pendingAt > 400,
		`Response was buffered: pending ${pendingAt}, completed ${completedAt}`
	);
	return {
		pendingMarkupMs: Math.round(pendingAt),
		completeMs: Math.round(completedAt),
		bytes: Buffer.byteLength(html)
	};
});

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
	let browser;
	try {
		browser = await engine.launch(
			name === 'chromium'
				? { channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] }
				: {}
		);
		report.browserVersions[name] = browser.version();
	} catch (error) {
		report.cases.push({ name: `${name} launch`, status: 'failed', error: String(error) });
		continue;
	}
	try {
		if (name === 'chromium') {
			await check('Chrome actual BFCache restores heap and route registrations', async () => {
				const page = await browser.newPage();
				const errors = [];
				page.on('pageerror', (error) => errors.push(error.message));
				await instrument(page);
				const cdp = await page.context().newCDPSession(page);
				const notRestored = [];
				await cdp.send('Page.enable');
				cdp.on('Page.backForwardCacheNotUsed', (event) => notRestored.push(event));
				await page.goto(`${productionURL}/lifecycle/cache`);
				await page.getByRole('button', { name: 'Move before leaving' }).click();
				const documentId = await page.evaluate(() => window.__motionLifecycle.documentId);
				await observeHideAfterMount(page);
				await page.getByTestId('leave-document').click();
				await page.getByTestId('outside-document').waitFor();
				await page.goBack({ waitUntil: 'commit' });
				await page.getByTestId('cache-count').waitFor();
				await until(
					page,
					(id) =>
						window.__motionLifecycle.documentId !== id ||
						window.__motionLifecycle.shows.some((event) => event.persisted),
					documentId
				);
				const restored = await page.evaluate(() => ({
					...window.__motionLifecycle,
					count: document.querySelector('[data-testid=cache-count]').textContent,
					reasons: performance.getEntriesByType('navigation')[0]?.notRestoredReasons?.toJSON?.()
				}));
				assert.ok(
					restored.shows.some((event) => event.persisted),
					`BFCache was not used: ${JSON.stringify({ restored, notRestored })}`
				);
				assert.equal(restored.documentId, documentId);
				assert.equal(restored.count, '1');
				assert.ok(restored.hides.every((event) => event.names?.length === 0));
				await page.getByRole('button', { name: 'Move before leaving' }).click();
				await until(
					page,
					() =>
						new DOMMatrix(
							getComputedStyle(document.querySelector('[data-testid=cache-tile]')).transform
						).m41 < 0.1
				);
				await page.getByTestId('ready-link').click();
				await page.getByTestId('awaited-host').waitFor();
				await until(page, () => window.__motionLifecycle.transitions.at(-1)?.finished);
				const after = await page.evaluate(() => window.__motionLifecycle.transitions.at(-1));
				assert.equal(after.ready, true);
				assert.equal(after.newNames[0]?.testid, 'awaited-host');
				assert.deepEqual(errors, []);
				await page.close();
				return {
					persisted: true,
					heapPreserved: true,
					hideNamesClean: true,
					routeAfterRestore: after,
					defaultArgumentRemoved: '--disable-back-forward-cache',
					notRestored
				};
			});
			await check(
				'Chrome pagehide cancels a real active native route transition before BFCache',
				async () => {
					const page = await browser.newPage();
					await instrument(page);
					await page.goto(`${productionURL}/lifecycle/cache`);
					await page.addStyleTag({
						content: '::view-transition-group(*){animation-duration:3s!important}'
					});
					await page.getByTestId('ready-link').click();
					await until(page, () => window.__motionLifecycle.transitions.at(-1)?.ready);
					const active = await page.evaluate(() => ({
						...window.__motionLifecycle,
						named: document.querySelector('[data-testid=awaited-host]').style.viewTransitionName
					}));
					assert.equal(active.transitions.at(-1).finished, false);
					assert.ok(active.named.startsWith('astra_'));
					await observeHideAfterMount(page);
					await page.evaluate(() => location.assign('/lifecycle/outside'));
					await page.getByTestId('outside-document').waitFor();
					await page.goBack({ waitUntil: 'commit' });
					await page.getByTestId('awaited-host').waitFor();
					const restored = await page.evaluate(() => ({
						...window.__motionLifecycle,
						currentName: document.querySelector('[data-testid=awaited-host]').style
							.viewTransitionName
					}));
					assert.ok(
						restored.shows.some((event) => event.persisted),
						`Active-route page was not restored: ${JSON.stringify(restored)}`
					);
					assert.equal(restored.documentId, active.documentId);
					assert.equal(restored.currentName, '');
					assert.equal(restored.hides.at(-1).names.length, 0);
					await page.close();
					return { persisted: true, activeBeforeLeave: true, temporaryNamesAfterRestore: 0 };
				}
			);
		}
		for (const mode of ['late', 'reserved', 'awaited']) {
			await check(`${name} ${mode} shared-route content contract`, async () => {
				const page = await browser.newPage();
				const errors = [];
				page.on('pageerror', (error) => errors.push(error.message));
				await instrument(page);
				await page.goto(`${productionURL}/lifecycle/cache`);
				const supported = await page.evaluate(
					() => typeof document.startViewTransition === 'function'
				);
				await page.getByTestId(mode === 'awaited' ? 'ready-link' : `streamed-${mode}-link`).click();
				if (mode !== 'awaited') await page.getByTestId('stream-pending').waitFor();
				if (supported) await until(page, () => window.__motionLifecycle.transitions.at(-1)?.ready);
				const captured = await page.evaluate(() =>
					structuredClone(window.__motionLifecycle.transitions.at(-1))
				);
				if (mode !== 'awaited') await page.getByTestId('stream-result').waitFor();
				else await page.getByTestId('awaited-host').waitFor();
				if (supported) {
					assert.equal(captured.oldNames[0]?.testid, 'shared-source');
					assert.equal(captured.newNames.length, mode === 'late' ? 0 : 1);
					if (mode !== 'late') assert.equal(captured.oldNames[0].name, captured.newNames[0].name);
					await until(page, () => window.__motionLifecycle.transitions.at(-1)?.finished);
					assert.equal(
						await page.evaluate(() => window.__motionLifecycle.transitions.length),
						1,
						'Late data should not start an unrequested second route transition'
					);
				}
				await page.getByTestId('return-cache').click();
				await page.getByTestId('shared-source').waitFor();
				if (supported)
					await until(page, () => window.__motionLifecycle.transitions.at(-1)?.finished);
				assert.equal(await page.getByTestId('route-diagnostics').textContent(), '');
				assert.deepEqual(errors, []);
				await page.close();
				return { nativeViewTransitions: supported, captured, lateDataReplaysTransition: false };
			});
		}
	} finally {
		await browser.close();
	}
}

if (consumerDirectory) {
	await check(
		'Svelte component HMR remounts package motion and cleans scoped playback',
		async () => {
			const consumer = await realpath(consumerDirectory);
			const template = path.resolve('tests/production/consumer');
			assert.notEqual(
				consumer,
				template,
				'Pass an isolated copied consumer, never the source template'
			);
			const component = path.join(consumer, 'src/routes/lifecycle/hmr/HmrTile.svelte');
			const original = await readFile(component, 'utf8');
			const server = spawn(
				path.join(consumer, 'node_modules/.bin/vite'),
				['dev', '--host', '127.0.0.1', '--port', String(devPort), '--strictPort'],
				{ cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'] }
			);
			let serverLog = '';
			server.stdout.on('data', (chunk) => {
				serverLog += chunk;
			});
			server.stderr.on('data', (chunk) => {
				serverLog += chunk;
			});
			let browser;
			try {
				let available = false;
				for (let attempt = 0; attempt < 80; attempt++) {
					try {
						available = (await fetch(`http://127.0.0.1:${devPort}/lifecycle/hmr`)).ok;
					} catch {
						/* server starting */
					}
					if (available) break;
					await delay(100);
				}
				assert.ok(available, `Dev consumer did not start: ${serverLog}`);
				browser = await chromium.launch();
				const page = await browser.newPage();
				const errors = [];
				page.on('pageerror', (error) => errors.push(error.message));
				await instrument(page);
				await page.goto(`http://127.0.0.1:${devPort}/lifecycle/hmr`);
				await until(page, () => document.body.dataset.hmrLive === '1');
				const documentId = await page.evaluate(() => window.__motionLifecycle.documentId);
				const revisions = [];
				for (const revision of ['B', 'C', 'D']) {
					await page.getByRole('button', { name: 'Start scoped playback' }).click();
					await page.getByRole('button', { name: 'Retarget after edit' }).click();
					await writeFile(
						component,
						original
							.replace("const revision = 'A'", `const revision = '${revision}'`)
							.replace('HMR content alpha', `HMR content ${revision}`)
					);
					await page
						.getByTestId('hmr-revision')
						.filter({ hasText: `Fixture revision ${revision}` })
						.waitFor();
					assert.equal(
						await page.evaluate(() => window.__motionLifecycle.documentId),
						documentId,
						'Component edit caused a document reload'
					);
					await until(page, () => document.body.dataset.hmrLive === '1');
					assert.equal(await page.getByTestId('hmr-owner').count(), 1);
					await page.getByRole('button', { name: 'Retarget after edit' }).click();
					await until(
						page,
						() =>
							Math.abs(
								new DOMMatrix(
									getComputedStyle(document.querySelector('[data-testid=hmr-tile]')).transform
								).m41 - 120
							) < 0.1
					);
					revisions.push({
						revision,
						live: await page.evaluate(() => document.body.dataset.hmrLive),
						activeAnimations: await page
							.getByTestId('hmr-tile')
							.evaluate((node) => node.getAnimations().length)
					});
				}
				await page.getByRole('button', { name: 'Start scoped playback' }).click();
				const oldPulse = await page.getByTestId('hmr-pulse').elementHandle();
				await page.getByTestId('leave-hmr').click();
				await page.getByTestId('shared-source').waitFor();
				await until(page, () => document.body.dataset.hmrLive === '0');
				assert.equal(await oldPulse.evaluate((node) => node.getAnimations().length), 0);
				assert.deepEqual(errors, []);
				return {
					documentPreserved: true,
					revisions,
					liveAfterDestroy: 0,
					detachedScopeAnimations: 0
				};
			} finally {
				await writeFile(component, original);
				await browser?.close();
				server.kill('SIGTERM');
			}
		}
	);
} else
	report.cases.push({
		name: 'Svelte HMR',
		status: 'not-run',
		reason: '--consumer isolated directory was not supplied'
	});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Lifecycle evidence: ${output}`);
if (report.cases.some((entry) => entry.status === 'failed')) process.exitCode = 1;
