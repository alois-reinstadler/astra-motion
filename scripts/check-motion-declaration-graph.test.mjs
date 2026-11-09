import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { declarationRoots, inspectDeclarationGraph } from './check-motion-declaration-graph.mjs';

function fixture(manifest, files) {
	const directory = mkdtempSync(join(tmpdir(), 'astra-declaration-graph-'));
	writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest));
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(directory, path)), { recursive: true });
		writeFileSync(join(directory, path), content);
	}
	return directory;
}

test('roots come from every exports types condition, not one hardcoded entry', () => {
	assert.deepEqual(
		declarationRoots({
			types: './dist/index.d.ts',
			exports: {
				'.': { types: './dist/index.d.ts', default: './dist/index.js' },
				'./layout': { import: { types: './dist/layout.d.ts', default: './dist/layout.js' } },
				'./package.json': './package.json'
			}
		}),
		['./dist/index.d.ts', './dist/layout.d.ts']
	);
});

test('reports a missing transitive edge with its root, file and specifier', () => {
	const directory = fixture(
		{ exports: { '.': { types: './dist/index.d.ts' } } },
		{
			'dist/index.d.ts': "export * from './a.js';",
			'dist/a.d.ts': "export type { B } from './b.js';"
		}
	);
	assert.deepEqual(inspectDeclarationGraph(directory).missing, [
		{ root: './dist/index.d.ts', file: 'dist/a.d.ts', specifier: './b.js' }
	]);
});

test('reaches an edge only visible through a second export root', () => {
	const directory = fixture(
		{
			exports: {
				'.': { types: './dist/index.d.ts' },
				'./reorder': { types: './dist/reorder.d.ts' }
			}
		},
		{
			'dist/index.d.ts': 'export declare const x: 1;',
			'dist/reorder.d.ts': "export type Item = import('./Item.svelte').default;"
		}
	);
	const report = inspectDeclarationGraph(directory);
	assert.deepEqual(report.missing, [
		{ root: './dist/reorder.d.ts', file: 'dist/reorder.d.ts', specifier: './Item.svelte' }
	]);
});

test('terminates on cycles and resolves Svelte, index and explicit declaration specifiers', () => {
	const directory = fixture(
		{ types: './dist/index.d.ts', exports: { '.': { types: './dist/index.d.ts' } } },
		{
			'dist/index.d.ts': [
				"export * from './a.js';",
				"export { default as Card } from './Card.svelte';",
				"export * from './nested';",
				"export type { D } from './d.d.ts';"
			].join('\n'),
			'dist/a.d.ts': "import type { X } from './b.js'; export type A = X;",
			'dist/b.d.ts': "import type { A } from './a.js'; export type X = A | any;",
			'dist/Card.svelte.d.ts': 'declare const Card: unknown; export default Card;',
			'dist/nested/index.d.ts': 'export declare const nested: true;',
			'dist/d.d.ts': 'export type D = 1;'
		}
	);
	const report = inspectDeclarationGraph(directory);
	assert.deepEqual(report.missing, []);
	assert.equal(report.files, 6);
	assert.deepEqual(report.explicitAny, [{ file: 'dist/b.d.ts', line: 1 }]);
});

test('a missing root declaration is reported against package.json', () => {
	const directory = fixture({ exports: { '.': { types: './dist/index.d.ts' } } }, {});
	assert.deepEqual(inspectDeclarationGraph(directory).missing, [
		{ root: './dist/index.d.ts', file: 'package.json', specifier: './dist/index.d.ts' }
	]);
});
