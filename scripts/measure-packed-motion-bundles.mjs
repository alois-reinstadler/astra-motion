import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { digest } from './motion-consumer-provenance.mjs';
import { verifyConsumerDependencies } from './motion-consumer-dependencies.mjs';

const fixtures = ['Eager', 'LazyBasic', 'LazyFull', 'LazySync', 'Hybrid', 'Mini', 'Text', 'Tilt'];
export function packedBundleEvidence(setup) {
	const consumer = setup.plainConsumer;
	assert(consumer, 'Prepare the plain consumer first');
	assert.equal(digest(readFileSync(setup.archive)), setup.sha256, 'Packed archive changed');
	const dependencies = verifyConsumerDependencies(consumer);
	for (const name of [
		'@sveltejs/kit',
		'react',
		'react-dom',
		'motion',
		'motion-dom',
		'framer-motion'
	]) {
		assert(
			!existsSync(join(consumer, 'node_modules', name)),
			`${name} must not be installed in plain consumer`
		);
	}
	const packages = Object.fromEntries(
		['svelte', 'vite', '@sveltejs/vite-plugin-svelte', 'typescript'].map((name) => [
			name,
			JSON.parse(readFileSync(join(consumer, 'node_modules', name, 'package.json'), 'utf8')).version
		])
	);
	const vitePackage = realpathSync(join(consumer, 'node_modules/vite/package.json'));
	packages.rolldown = JSON.parse(
		readFileSync(join(dirname(vitePackage), '../rolldown/package.json'), 'utf8')
	).version;
	const entries = {};
	for (const fixture of fixtures) {
		const directory = join(consumer, 'build', fixture, 'client');
		const graph = JSON.parse(readFileSync(join(directory, 'module-graph.json'), 'utf8'));
		const byName = new Map(graph.map((chunk) => [chunk.fileName, chunk]));
		const initial = new Set();
		const visit = (name) => {
			if (initial.has(name)) return;
			initial.add(name);
			assert(byName.has(name), `Missing built static import ${name}`);
			byName.get(name).imports.forEach(visit);
		};
		graph.filter((chunk) => chunk.isEntry).forEach((chunk) => visit(chunk.fileName));
		const chunks = graph.map((chunk) => {
			const bytes = readFileSync(join(directory, chunk.fileName));
			const modules = chunk.modules.map((id) => id.replaceAll('\\', '/'));
			return {
				file: chunk.fileName,
				phase: initial.has(chunk.fileName)
					? chunk.isEntry
						? 'initial-entry'
						: 'initial-shared'
					: 'deferred',
				bytes: bytes.length,
				gzip: gzipSync(bytes).length,
				brotli: brotliCompressSync(bytes).length,
				sha256: digest(bytes),
				imports: chunk.imports,
				dynamicImports: chunk.dynamicImports,
				modules: modules.map((id) => id.replace(realpathSync(consumer) + '/', '<consumer>/')),
				svelteModules: modules.filter((id) => /\/svelte\/(?:src|internal)\//.test(id)).length
			};
		});
		const modules = graph.flatMap((chunk) => chunk.modules);
		const initialModules = graph
			.filter((chunk) => initial.has(chunk.fileName))
			.flatMap((chunk) => chunk.modules);
		const reject = (ids, expression, label) =>
			assert.deepEqual(
				ids.filter((id) => expression.test(id)),
				[],
				`${fixture}: ${label}`
			);
		reject(modules, /\/(?:react|react-dom)(?:\/|@)/, 'React runtime leaked');
		reject(
			modules,
			/(?:\/\.pnpm\/(?:motion(?:-dom|-utils)?|framer-motion)@|\/@sveltejs\/kit\/|\$app\/)/,
			'second engine or Kit leaked'
		);
		if (fixture === 'Text' || fixture === 'Tilt') {
			reject(
				modules,
				/\/astra-motion\/dist\/(?:index\.js|motion\/(?:index\.js|elements\/index\.js|m\/index\.js|create-(?:lazy-)?motion\.js|routes\.js|view-navigation\.js))$/,
				'root factory barrel or routing adapter in optional entry'
			);
			reject(
				modules,
				fixture === 'Text'
					? /\/motion\/(?:Tilt\.svelte|tilt[^/]*\.js)(?:\?|$)/
					: /\/motion\/(?:Text(?:Reveal|Swap)\.svelte|text[^/]*\.js)(?:\?|$)/,
				'unrelated optional entry runtime'
			);
			if (fixture === 'Tilt')
				reject(
					modules,
					/(?:\/projection\/node\/|\/motion\/drag-gestures\.js|\/gestures\/drag\/(?!state\/is-active\.mjs$))/,
					'drag or projection-node runtime in tilt'
				);
		}
		if (fixture === 'LazyBasic' || fixture === 'LazyFull') {
			reject(
				initialModules,
				/(?:\/render\/(?:.*\/)?\w*VisualElement\.mjs|\/projection\/node\/|\/animation\/(?:JSAnimation|NativeAnimation\w*|AsyncMotionValueAnimation|FollowAnimation|GroupAnimation\w*)\.mjs|\/motion\/(?:visual|animation|motion-core\.svelte|base-gestures|drag-gestures|gesture-session)\.js)/,
				'heavy runtime in deferred initial graph'
			);
			assert(
				chunks.some((chunk) => chunk.phase === 'deferred'),
				`${fixture}: no deferred feature chunk`
			);
		}
		if (fixture === 'LazyBasic' || fixture === 'LazySync')
			reject(
				modules,
				/(?:\/projection\/node\/|\/motion\/(?:drag-gestures)\.js|\/gestures\/drag\/(?!state\/is-active\.mjs$))/,
				'drag or projection-node runtime in basic features'
			);
		if (fixture === 'Mini')
			reject(
				modules,
				/(?:\/animation\/JSAnimation\.mjs|\/render\/(?:.*\/)?\w*VisualElement\.mjs|\/animation\/(?:animate\/sequence\.mjs|sequence\/))/,
				'hybrid engine in mini'
			);
		if (fixture === 'LazyFull') {
			assert(
				modules.some((id) => /\/motion\/drag-gestures\.js$/.test(id)),
				'Full bundle lost drag implementation'
			);
			assert(
				modules.some((id) => /\/projection\/node\/create-projection-node\.mjs$/.test(id)),
				'Full bundle lost projection implementation'
			);
		}
		const totals = (selected) =>
			Object.fromEntries(
				['bytes', 'gzip', 'brotli'].map((key) => [
					key,
					chunks.filter(selected).reduce((sum, chunk) => sum + chunk[key], 0)
				])
			);
		entries[fixture] = {
			fixture: `tests/production/plain-consumer/src/fixtures/${fixture}.svelte`,
			initial: totals((chunk) => chunk.phase !== 'deferred'),
			deferred: totals((chunk) => chunk.phase === 'deferred'),
			total: totals(() => true),
			chunks
		};
	}
	return {
		date: new Date().toISOString(),
		archiveSha256: setup.sha256,
		source: setup.source,
		tools: {
			node: process.version,
			pnpm: execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim(),
			zlib: process.versions.zlib,
			brotli: process.versions.brotli,
			...packages
		},
		engine: dependencies.versions,
		accounting:
			'Independent production applications, minified Vite output. Svelte runtime and fixture bootstrap are included. Each initial shared chunk is counted once per application; gzip/Brotli totals sum separately compressed HTTP assets. Do not add totals from independent applications or interpret them as library-only bytes. Module lists show which chunks also contain Svelte. Small geometry and scale-corrector utilities are allowed before feature loading; projection-node runtime is excluded from deferred initial and basic feature graphs. Basic hover/press retain the small shared isDragActive flag used for gesture arbitration, without the drag/pan implementation.',
		entries
	};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const setup = JSON.parse(
		readFileSync(process.argv[2] ?? '/tmp/astra-motion-production-current.json', 'utf8')
	);
	const result = packedBundleEvidence(setup);
	const output = process.argv[3] ?? join(setup.plainConsumer, '..', 'packed-bundle-results.json');
	writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
	console.log(
		JSON.stringify(
			{
				output,
				archiveSha256: result.archiveSha256,
				entries: Object.fromEntries(
					Object.entries(result.entries).map(([name, entry]) => [
						name,
						{ initial: entry.initial, deferred: entry.deferred }
					])
				)
			},
			null,
			2
		)
	);
}
