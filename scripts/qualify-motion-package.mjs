import assert from 'node:assert/strict';
import { qualificationOrigin } from './qualification-origin.mjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import {
	buildIdentity,
	digest,
	identityPath,
	verifyPackedConsumer
} from './motion-consumer-provenance.mjs';

const origin = qualificationOrigin(process.argv[3], 'Second argument (preview origin)');
const setup = JSON.parse(
	readFileSync(process.argv[2] ?? '/tmp/astra-motion-production-current.json', 'utf8')
);
const result = {
	archive: setup.archive,
	sha256: setup.sha256,
	consumer: setup.consumer,
	browserCases: [],
	routes: []
};
const { files: archiveFiles, packed } = verifyPackedConsumer(setup);
const reviewed = JSON.parse(
	readFileSync(new URL('../tests/production/reviewed-exports.json', import.meta.url), 'utf8')
);
assert.deepEqual(
	Object.keys(packed.exports).sort(),
	Object.keys(reviewed).sort(),
	'Public entry points changed'
);
const identity = buildIdentity(setup);
assert.deepEqual(
	JSON.parse(readFileSync(join(setup.consumer, 'build/client', identityPath), 'utf8')),
	identity,
	'Build changed after identity stamp'
);
const servedIdentity = await fetch(origin + identityPath, { cache: 'no-store' });
assert(
	servedIdentity.ok,
	'Qualification identity is not served; stamp the build and restart its server'
);
assert.deepEqual(
	await servedIdentity.json(),
	identity,
	'Origin serves a different qualified build'
);
result.provenance = {
	buildId: identity.buildId,
	archiveVerified: true,
	installedFilesCompared: archiveFiles.length,
	servedIdentityVerified: true
};
for (const conditions of Object.values(packed.exports)) {
	for (const target of typeof conditions === 'string' ? [conditions] : Object.values(conditions))
		assert(archiveFiles.includes('package/' + target.slice(2)), `Missing export target: ${target}`);
}
const installed = readdirSync(join(setup.consumer, 'node_modules/.pnpm'));
assert(
	!installed.some((name) => /^(react|react-dom)@/.test(name)),
	'React installed in isolated consumer'
);
result.package = {
	files: archiveFiles.length,
	bytes: readFileSync(setup.archive).length,
	entries: Object.keys(packed.exports),
	reactInstalled: false
};
const ssr = await (await fetch(origin + '/ssr')).text();
assert.match(ssr, /data-testid="native-card" style="opacity:0\.75;transform:translateX\(40px\)"/);

for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
	const browser = await launcher.launch({ headless: true });
	const context = await browser.newContext({ reducedMotion: 'no-preference' });
	const page = await context.newPage();
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error' || /hydration_mismatch/.test(message.text()))
			errors.push(message.text());
	});
	const ready = async (path) => {
		await page.goto(origin + path);
		await expect(page.locator('main')).toHaveAttribute('data-hydrated', 'true');
	};
	try {
		await ready('/');
		await expect(page.locator('[data-export]')).toHaveCount(Object.keys(packed.exports).length);
		const actualExports = await page
			.locator('[data-export]')
			.evaluateAll((sections) =>
				Object.fromEntries(
					sections.map((section) => [
						section.getAttribute('data-export'),
						(section.querySelector('p')?.textContent ?? '').split(', ').filter(Boolean).sort()
					])
				)
			);
		assert.deepEqual(actualExports, reviewed, `${engine}: public runtime exports changed`);
		result.browserCases.push({
			engine,
			case: 'all public exports render and hydrate',
			passed: true
		});
		await ready('/ssr');
		const card = page.getByTestId('native-card');
		await expect(card).toHaveCSS('opacity', '0.75');
		await expect
			.poll(() => card.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41))
			.toBe(40);
		await page.getByRole('button', { name: 'Retarget', exact: true }).click();
		await expect
			.poll(() => card.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41))
			.toBe(120);
		const draft = page.getByRole('textbox', { name: 'Draft' });
		await draft.fill('Survives attachment changes');
		await draft.evaluate((node) => {
			node.dataset.original = 'true';
			node.focus();
		});
		for (let index = 0; index < 4; index++) {
			await page
				.getByRole('button', { name: 'Toggle binding' })
				.evaluate((button) => button.click());
			await expect(draft).toHaveValue('Survives attachment changes');
			await expect(draft).toHaveAttribute('data-original', 'true');
			await expect(draft).toBeFocused();
		}
		result.browserCases.push({
			engine,
			case: 'SSR initial=false, retarget, native component identity and focus',
			passed: true
		});
		for (const path of ['/state', '/state-lite']) {
			await ready(path);
			const panel = page.locator('section');
			await expect(panel).toHaveCSS('opacity', '1');
			for (let index = 0; index < 10; index++)
				await page
					.getByRole('button', { name: 'Toggle', exact: true })
					.evaluate((button) => button.click());
			await expect(panel).toHaveCount(1);
			await expect(panel).toHaveCSS('opacity', '1');
			await page.getByRole('button', { name: 'Toggle', exact: true }).click();
			await expect(panel).toHaveCount(0);
			result.browserCases.push({
				engine,
				case: `${path} native presence and rapid reversal`,
				passed: true
			});
		}
		await ready('/layout');
		await page.waitForTimeout(100);
		const projection = await page.evaluate(async () => {
			const surface = document.querySelector('article');
			const before = surface.getBoundingClientRect().width;
			document.querySelector('button').click();
			let projected = false;
			for (let index = 0; index < 12; index++) {
				await new Promise(requestAnimationFrame);
				projected ||= getComputedStyle(surface).transform !== 'none';
			}
			return { before, projected };
		});
		assert(
			projection.projected,
			`${engine}: production projection was tree-shaken or never started`
		);
		await expect
			.poll(() => page.locator('article').evaluate((node) => getComputedStyle(node).transform))
			.toBe('none');
		assert(
			(await page.locator('article').evaluate((node) => node.getBoundingClientRect().width)) >
				projection.before
		);
		result.browserCases.push({
			engine,
			case: 'automatic layout survives production optimization',
			passed: true
		});
		await ready('/values');
		await page.getByRole('button', { name: 'Increment' }).click();
		await expect(page.locator('output')).toHaveText('11');
		result.browserCases.push({ engine, case: 'MotionValue store binding', passed: true });
		assert.deepEqual(errors, [], `${engine} browser errors`);
		const noJS = await browser.newContext({ javaScriptEnabled: false });
		const serverPage = await noJS.newPage();
		await serverPage.goto(origin + '/ssr');
		await expect(serverPage.getByTestId('native-card')).toHaveCSS('opacity', '0.75');
		await expect(serverPage.getByRole('textbox', { name: 'Draft' })).toHaveValue('Unchanged draft');
		await noJS.close();
		result.browserCases.push({ engine, case: 'production SSR without JavaScript', passed: true });
	} finally {
		await browser.close();
	}
}

// Measure the immutable files a fresh page actually requests, including SvelteKit.
// Compression is calculated per file. This is not a claim about CDN transfer settings.
const browser = await chromium.launch({ headless: true });
try {
	for (const path of [
		'/blank',
		'/policy',
		'/presence',
		'/layout',
		'/state-lite',
		'/state',
		'/values',
		'/animate',
		'/scroll',
		'/routes',
		'/'
	]) {
		const context = await browser.newContext();
		const page = await context.newPage();
		const assets = new Set();
		const bodies = [];
		page.on('response', (response) => {
			const url = new URL(response.url());
			if (url.origin === origin && /\/_app\/immutable\/.*\.(js|css)$/.test(url.pathname)) {
				assets.add(url.pathname);
				bodies.push(
					response
						.body()
						.then((body) => ({ asset: url.pathname, hash: digest(body) }))
						.catch((error) => ({ asset: url.pathname, error: String(error) }))
				);
			}
		});
		await page.goto(origin + path);
		await expect(page.locator('main')).toHaveAttribute('data-hydrated', 'true');
		await page.waitForLoadState('networkidle');
		for (const fetched of await Promise.all(bodies)) {
			assert(!fetched.error, `Could not read fetched asset ${fetched.asset}: ${fetched.error}`);
			assert.equal(
				fetched.hash,
				identity.assets[fetched.asset],
				`Served asset differs from qualified build: ${fetched.asset}`
			);
		}
		const files = [...assets].sort().map((asset) => {
			const body = readFileSync(join(setup.consumer, 'build/client', asset));
			return {
				asset,
				raw: body.length,
				gzip: gzipSync(body).length,
				brotli: brotliCompressSync(body).length
			};
		});
		result.routes.push({
			path,
			files,
			totals: files.reduce(
				(sum, file) => ({
					raw: sum.raw + file.raw,
					gzip: sum.gzip + file.gzip,
					brotli: sum.brotli + file.brotli
				}),
				{ raw: 0, gzip: 0, brotli: 0 }
			)
		});
		await context.close();
	}
} finally {
	await browser.close();
}
result.measurement =
	'Cold production route JS+CSS assets, including SvelteKit; per-file gzip/default Brotli; maps and HTML excluded. Route totals are not additive.';
result.provenance.fetchedAssetHashesVerified = true;
const output = resolve('docs/research/production-package-validation.json');
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(
	JSON.stringify(
		{
			output,
			package: result.package,
			passed: result.browserCases.length,
			bundles: result.routes.map(({ path, totals }) => ({ path, ...totals }))
		},
		null,
		2
	)
);
