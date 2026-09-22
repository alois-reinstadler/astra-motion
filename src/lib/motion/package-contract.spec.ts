import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const reviewed = JSON.parse(
	readFileSync(resolve(root, 'tests/production/reviewed-exports.json'), 'utf8')
);

it('keeps the package entry points aligned with the reviewed consumer contract', () => {
	expect(Object.keys(manifest.exports).sort()).toEqual(Object.keys(reviewed).sort());
});

it('ships a typed Svelte entry backed by source for every reviewed entry point', () => {
	for (const entry of Object.keys(reviewed)) {
		const conditions = manifest.exports[entry];
		expect(conditions.types, entry).toMatch(/^\.\/dist\/.*\.d\.ts$/);
		expect(conditions.svelte, entry).toBe(conditions.default);
		const source = conditions.svelte.replace('./dist/', 'src/lib/').replace(/\.js$/, '.ts');
		expect(existsSync(resolve(root, source)), `${entry}: ${source}`).toBe(true);
	}
});

it('keeps generated declaration paths distinct on case-insensitive filesystems', () => {
	const paths = readdirSync(resolve(root, 'src/lib'), { recursive: true })
		.map(String)
		.filter((file) => /\.(svelte|ts)$/.test(file) && !/\.(test|spec)\.ts$/.test(file))
		.map((file) => (file.endsWith('.svelte') ? `${file}.d.ts` : file.replace(/\.ts$/, '.d.ts')));
	const seen = new Map<string, string>();
	for (const file of paths) {
		const key = file.toLowerCase();
		expect(seen.get(key), `Declaration collision: ${seen.get(key)} and ${file}`).toBeUndefined();
		seen.set(key, file);
	}
});
