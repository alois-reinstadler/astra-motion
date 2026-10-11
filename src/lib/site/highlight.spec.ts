import { describe, expect, it } from 'vitest';
import { codeLanguage, highlightKey, packHighlight, unpackHighlight } from './highlight.js';
import { highlightCode } from './highlight-runtime.js';
import { prepareHighlights } from './highlight.server.js';

describe('site code highlighting', () => {
	it('preserves Svelte markup, runes, CSS and literal HTML while adding token colors', () => {
		const source =
			'<script lang="ts">\n  let count = $state(0);\n</script>\n<button onclick={() => count++}>{count} & more</button>\n<style>button { color: red; }</style>\n';
		const lines = highlightCode(source, 'svelte');
		expect(lines.map((line) => line.map((token) => token.content).join('')).join('\n')).toBe(
			source
		);
		expect(new Set(lines.flat().map((token) => token.color)).size).toBeGreaterThan(4);
	});
	it('recognizes the source labels used by guides and supports dark homepage code', () => {
		expect(codeLanguage('const x = 1;', 'State binding · TypeScript')).toBe('typescript');
		expect(codeLanguage('<script>let x = 1;</script>', 'Demo.svelte')).toBe('svelte');
		expect(codeLanguage('pnpm install', 'Terminal')).toBe('shellscript');
		const source = 'const message = "<img onerror=alert(1)>";';
		const tokens = highlightCode(source, 'typescript', true).flat();
		expect(tokens.map((token) => token.content).join('')).toBe(source);
		expect(tokens.some((token) => token.color)).toBe(true);
	});
});

describe('prepared highlighting', () => {
	it('round trips exact Unicode source, blank lines and trailing newline with theme styling', () => {
		const source = 'const message = "<img onerror=alert(1)> 🪐";\n\n// comment\n';
		for (const dark of [false, true]) {
			const original = highlightCode(source, 'typescript', dark);
			const restored = unpackHighlight(source, packHighlight(original));
			expect(restored.map((line) => line.map((token) => token.content).join('')).join('\n')).toBe(
				source
			);
			expect(
				restored.map((line) =>
					line.map(({ content, color, fontStyle }) => ({
						content,
						color,
						fontStyle: fontStyle || 0
					}))
				)
			).toEqual(
				original.map((line) =>
					line.map(({ content, color, fontStyle }) => ({
						content,
						color,
						fontStyle: fontStyle || 0
					}))
				)
			);
		}
	});
	it('deduplicates repeated snippets, distinguishes language and theme, and stores no source text', () => {
		const source = 'const answer = 42;';
		const highlights = prepareHighlights([
			{ source, label: 'answer.ts' },
			{ source, label: 'answer.ts' }
		]);
		expect(Object.keys(highlights)).toEqual([highlightKey(source, 'typescript')]);
		expect(highlightKey(source, 'typescript', true)).not.toBe(highlightKey(source, 'typescript'));
		expect(highlightKey(source, 'text')).not.toBe(highlightKey(source, 'typescript'));
		expect(JSON.stringify(highlights)).not.toContain(source);
	});
});
