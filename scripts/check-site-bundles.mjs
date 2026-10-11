import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

// Initial JS modulepreloads only: deferred demo/highlighter chunks are excluded.
// Gzip is calculated per file, not a claim about the hosting server's encoding.
const budgets = {
	'index.html': 400_000,
	'docs/quick-start.html': 400_000,
	'examples.html': 200_000
};
const build = resolve(process.argv[2] ?? 'build');
let exceeded = false;
for (const [route, maxBytes] of Object.entries(budgets)) {
	const html = readFileSync(resolve(build, route), 'utf8');
	const paths = new Set();
	for (const match of html.matchAll(/<link\b[^>]*>/g)) {
		if (!/\brel=["']modulepreload["']/.test(match[0])) continue;
		const href = match[0].match(/\bhref=["']([^"']+)["']/)?.[1];
		if (!href) throw new Error(`Missing preload href in ${route}`);
		const pathname = new URL(href, 'https://preview.invalid/').pathname;
		const asset = pathname.indexOf('/_app/');
		if (asset === -1) throw new Error(`Unexpected preload in ${route}: ${href}`);
		paths.add(pathname.slice(asset + 1));
	}
	if (!paths.size) throw new Error(`No modulepreloads found in ${route}`);
	let bytes = 0;
	let gzipBytes = 0;
	for (const path of paths) {
		const content = readFileSync(resolve(build, path));
		bytes += content.length;
		gzipBytes += gzipSync(content).length;
	}
	const pass = bytes <= maxBytes;
	console.log(JSON.stringify({ route, files: paths.size, bytes, gzipBytes, maxBytes, pass }));
	if (!pass) exceeded = true;
}
if (exceeded) process.exitCode = 1;
