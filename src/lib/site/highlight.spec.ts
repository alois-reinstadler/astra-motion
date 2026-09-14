import { describe, expect, it } from 'vitest';
import { codeLanguage, highlightCode } from './highlight.js';

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
