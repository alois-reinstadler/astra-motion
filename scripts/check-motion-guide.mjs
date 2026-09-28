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
const publicModule = ts.transpileModule(
	readFileSync('src/lib/site/public-example-source.ts', 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.ESNext } }
).outputText;
const { publicExampleSource } = await import(
	`data:text/javascript;base64,${Buffer.from(publicModule).toString('base64')}`
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
		const source = publicExampleSource(
			readFileSync(join('src/lib/site/examples', filename), 'utf8')
		);
		writeFileSync(join(directory, filename), source);
	}
	// Complete inline components are reference examples too; excerpts stay clearly labelled.
	for (const filename of readdirSync('src/lib/site/content').filter((name) =>
		name.endsWith('.ts')
	)) {
		const module = ts.transpileModule(
			readFileSync(join('src/lib/site/content', filename), 'utf8'),
			{ compilerOptions: { module: ts.ModuleKind.ESNext } }
		).outputText;
		const exports = await import(
			`data:text/javascript;base64,${Buffer.from(module).toString('base64')}`
		);
		for (const pages of Object.values(exports))
			for (const page of pages)
				for (const section of page.sections) {
					if (section.code && /complete|\.svelte$/i.test(section.code.label))
						writeFileSync(
							join(directory, `${page.slug}-${section.id}.svelte`),
							section.code.source
						);
				}
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
