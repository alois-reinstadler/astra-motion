import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, relative, dirname } from 'node:path';
import { createRequire } from 'node:module';
const root = import.meta.dirname;
const repo = resolve(root, '../..');
const require = createRequire(import.meta.url);
function sourceHash(directory) {
	const hash = createHash('sha256');
	function walk(dir) {
		for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
			a.name.localeCompare(b.name)
		)) {
			const p = resolve(dir, e.name);
			if (e.isDirectory()) {
				if (!['node_modules', 'dist', 'results'].includes(e.name)) walk(p);
			} else if (/\.(ts|svelte|js|mjs|jsx|css|html|json)$/.test(e.name))
				hash.update(relative(directory, p)).update(readFileSync(p));
		}
	}
	walk(directory);
	return hash.digest('hex');
}
function version(name) {
	let dir = dirname(require.resolve(name));
	while (!existsSync(resolve(dir, 'package.json'))) dir = dirname(dir);
	return JSON.parse(readFileSync(resolve(dir, 'package.json'))).version;
}
const versions = Object.fromEntries(
	['react', 'react-dom', 'framer-motion', 'motion-dom', 'motion-utils', 'svelte', 'vite'].map(
		(name) => [name, version(name)]
	)
);
if (versions['framer-motion'] !== '13.4.4' || versions['motion-dom'] !== '13.4.4')
	throw new Error('Expected the pinned Motion 13.4.4 baseline');
const provenance = {
	builtAt: new Date().toISOString(),
	commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
	harnessSourceSha256: sourceHash(root),
	astraSourceSha256: sourceHash(resolve(repo, 'src/lib/motion')),
	versions,
	production: true
};
await build({
	root,
	base: './',
	configFile: false,
	plugins: [svelte({ configFile: false, compilerOptions: { dev: false } })],
	define: { __PROVENANCE__: JSON.stringify(provenance) },
	resolve: {
		alias: {
			'@astra': resolve(repo, 'src/lib/motion'),
			react: resolve(root, 'node_modules/react'),
			'react-dom': resolve(root, 'node_modules/react-dom')
		},
		dedupe: ['svelte', 'motion-dom', 'motion-utils']
	},
	build: { outDir: 'dist', emptyOutDir: true, minify: false, sourcemap: true }
});
