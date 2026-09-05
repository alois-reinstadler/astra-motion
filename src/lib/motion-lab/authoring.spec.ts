import { describe, expect, it } from 'vitest';
import { compile, parse } from 'svelte/compiler';
import { authoringExamples } from './authoring-examples.js';

describe('published authoring recipes', () => {
	for (const example of authoringExamples) {
		it(`${example.id} compiles as a client component and for SSR`, () => {
			const ast = parse(example.source, { modern: true });
			expect(ast.type).toBe('Root');
			for (const generate of ['client', 'server'] as const) {
				const result = compile(example.source, { filename: `${example.id}.svelte`, generate });
				expect(result.js.code.length).toBeGreaterThan(0);
				expect(result.warnings).toEqual([]);
			}
		});
	}
});
