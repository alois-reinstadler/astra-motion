import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const root = resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
process.chdir(root);
function version(name) {
	let directory = dirname(require.resolve(name));
	while (directory !== dirname(directory)) {
		const path = resolve(directory, 'package.json');
		if (existsSync(path)) {
			const pkg = JSON.parse(readFileSync(path, 'utf8'));
			if (pkg.name === name) return pkg.version;
		}
		directory = dirname(directory);
	}
	throw new Error(`Missing package version: ${name}`);
}
function run(args) {
	const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
	if (result.status !== 0)
		throw new Error(`Command failed: node ${args.join(' ')} (${result.status})`);
}
function hashTree(directory) {
	const hash = createHash('sha256');
	function walk(path) {
		for (const file of readdirSync(path, { withFileTypes: true }).sort((a, b) =>
			a.name.localeCompare(b.name)
		)) {
			if (file.name.startsWith('.') || file.name === 'results.json') continue;
			const absolute = resolve(path, file.name);
			if (file.isDirectory()) walk(absolute);
			else hash.update(relative(directory, absolute)).update(readFileSync(absolute));
		}
	}
	walk(directory);
	return hash.digest('hex');
}
run(['node_modules/@sveltejs/kit/svelte-kit.js', 'sync']);
run(['experiments/unstaged-rendering/build.mjs']);
const provenance = {
	createdAt: new Date().toISOString(),
	commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	versions: Object.fromEntries(
		['svelte', 'motion-dom', 'motion-utils', 'vite', 'vitest'].map((name) => [name, version(name)])
	),
	astraSourceSha256: hashTree(resolve(root, 'src/lib/motion')),
	experimentSourceSha256: hashTree(import.meta.dirname),
	bundleSha256: createHash('sha256')
		.update(readFileSync(resolve(import.meta.dirname, '.generated/probe.js')))
		.digest('hex'),
	browserExecutable: process.env.BROWSER_EXECUTABLE_PATH ?? '/usr/bin/google-chrome',
	browser: execFileSync(
		process.env.BROWSER_EXECUTABLE_PATH ?? '/usr/bin/google-chrome',
		['--version'],
		{ encoding: 'utf8' }
	).trim(),
	mode: 'production bundle, Chromium geometry diagnostics; not a timing benchmark'
};
writeFileSync(
	resolve(import.meta.dirname, '.generated/provenance.json'),
	JSON.stringify(provenance, null, 2)
);
run([
	'node_modules/vitest/vitest.mjs',
	'run',
	'--config',
	'experiments/unstaged-rendering/vitest.config.mjs'
]);
const resultsPath = process.env.PROBE_RESULTS ?? resolve(import.meta.dirname, 'results.json');
const result = JSON.parse(readFileSync(resultsPath));
result.status = 'passed';
writeFileSync(resultsPath, JSON.stringify(result, null, 2) + '\n');
