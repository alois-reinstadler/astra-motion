/** Source-consumer checks only: no application build or package emission. */
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const catalog = ts.transpileModule(
	readFileSync('src/lib/motion-lab/authoring-examples.ts', 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.ESNext } }
).outputText;
const { authoringExamples } = await import(
	`data:text/javascript;base64,${Buffer.from(catalog).toString('base64')}`
);
const directory = mkdtempSync(join(tmpdir(), 'astra-guide-consumer-'));
try {
	const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
	const paths = {};
	for (const [entry, conditions] of Object.entries(manifest.exports)) {
		const target =
			typeof conditions === 'string' ? conditions : (conditions.svelte ?? conditions.default);
		const source = target.replace('./dist/', 'src/lib/').replace(/\.js$/, '.ts');
		paths[entry === '.' ? manifest.name : manifest.name + entry.slice(1)] = [resolve(source)];
	}
	paths.svelte = [resolve('node_modules/svelte/types/index.d.ts')];
	paths['svelte/*'] = [resolve('node_modules/svelte/*')];
	paths['$lib/*'] = [resolve('src/lib/*')];
	for (const example of authoringExamples) {
		writeFileSync(join(directory, `${example.id}.svelte`), example.source);
	}
	// Check the exact source shown alongside every live documentation preview.
	for (const filename of readdirSync('src/lib/site/examples').filter((name) =>
		name.endsWith('.svelte')
	)) {
		const source = readFileSync(join('src/lib/site/examples', filename), 'utf8').replaceAll(
			"'$lib/motion/index.js'",
			"'astra-motion'"
		);
		writeFileSync(join(directory, filename), source);
	}
	writeFileSync(
		join(directory, 'tsconfig.json'),
		JSON.stringify(
			{
				extends: join(root, 'tsconfig.json'),
				compilerOptions: { paths, module: 'ESNext', moduleResolution: 'Bundler' },
				include: [
					join(directory, '*.svelte'),
					join(root, 'src/app.d.ts'),
					join(root, '.svelte-kit/ambient.d.ts'),
					join(root, '.svelte-kit/non-ambient.d.ts')
				],
				exclude: []
			},
			null,
			2
		)
	);
	const result = spawnSync(
		'pnpm',
		[
			'exec',
			'svelte-check',
			'--workspace',
			root,
			'--tsconfig',
			join(directory, 'tsconfig.json'),
			'--fail-on-warnings'
		],
		{ stdio: 'inherit' }
	);
	process.exitCode = result.status ?? 1;
} finally {
	rmSync(directory, { recursive: true, force: true });
}
