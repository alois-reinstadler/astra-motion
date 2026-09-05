/** Isolated in-memory feature-size experiment; does not build the application. */
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { compile, compileModule } from 'svelte/compiler';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const { rolldown } = await import(
	require.resolve('rolldown', { paths: [dirname(require.resolve('vite/package.json'))] })
);
const features = {
	policy: 'src/lib/motion/policy.ts',
	presence: 'src/lib/motion/presence.ts',
	waitPresence: 'src/lib/motion/presence-entry.ts',
	routes: 'src/lib/motion/routes.ts',
	layout: 'src/lib/motion/layout.ts',
	state: 'src/lib/motion/motion.svelte.ts',
	liteState: 'src/lib/motion/lite.svelte.ts',
	values: 'src/lib/motion/values.ts',
	animate: 'src/lib/motion/animate.ts',
	scroll: 'src/lib/motion/scroll.svelte.ts',
	localFull: 'src/lib/motion/index.ts',
	presenceFromRoot: 'virtual:presence',
	full: 'virtual:full'
};
const virtualEntries = {
	'virtual:presence': `export { presence, popLayout } from ${JSON.stringify(resolve('src/lib/index.ts'))}`,
	'virtual:full': `export * from ${JSON.stringify(resolve('src/lib/index.ts'))}; export * from ${JSON.stringify(resolve('src/lib/motion/routes.ts'))};`
};
const results = {};
for (const [name, input] of Object.entries(features)) {
	const bundle = await rolldown({
		input,
		transform: {
			define: { 'import.meta.hot': 'undefined', 'process.env.NODE_ENV': '"production"' }
		},
		external: (id) => id === 'svelte' || id.startsWith('svelte/') || id.startsWith('$app/'),
		plugins: [
			{
				name: 'svelte-feature-size',
				resolveId(id) {
					if (id in virtualEntries) return id;
				},
				load(id) {
					return virtualEntries[id];
				},
				transform(code, id) {
					if (id.endsWith('.svelte.ts'))
						return {
							code: compileModule(
								ts.transpileModule(code, {
									compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }
								}).outputText,
								{ filename: id, generate: 'client', dev: false }
							).js.code,
							map: null
						};
					if (id.endsWith('.svelte'))
						return {
							code: compile(code, { filename: id, generate: 'client', dev: false }).js.code,
							map: null
						};
				}
			}
		]
	});
	const { output } = await bundle.generate({ format: 'es', minify: true });
	const code = output
		.filter((item) => item.type === 'chunk')
		.map((item) => item.code)
		.join('\n');
	results[name] = {
		minifiedBytes: Buffer.byteLength(code),
		gzipBytes: gzipSync(code).byteLength,
		brotliBytes: brotliCompressSync(code).byteLength,
		containsReact:
			output.some(
				(chunk) =>
					chunk.type === 'chunk' &&
					Object.keys(chunk.modules).some((id) => /node_modules\/(react|react-dom)\//.test(id))
			) || /from["'](?:react|framer-motion|motion\/react)/.test(code)
	};
	await bundle.close();
}
const result = {
	date: new Date().toISOString(),
	methodology:
		'Rolldown in-memory ESM minify. All feature exports retained. Svelte and SvelteKit external/shared with host. No app build. Full=local runtime+wait+routes. PresenceFromRoot verifies unused projection tree-shakes.',
	motion: JSON.parse(readFileSync('node_modules/motion/package.json', 'utf8')).version,
	motionDom: JSON.parse(readFileSync('node_modules/motion-dom/package.json', 'utf8')).version,
	results
};
writeFileSync('docs/research/bundle-sizes.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
