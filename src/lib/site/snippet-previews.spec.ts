import { describe, expect, it } from 'vitest';
import { compile } from 'svelte/compiler';
import { docs } from './docs.js';
import { codeOnlySnippets, getSnippetPreview } from './snippet-previews.js';

const snippets = docs.flatMap((doc) =>
	doc.sections
		.filter((section) => section.code)
		.map((section) => ({
			doc,
			section,
			key: `${doc.slug}/${section.id}`
		}))
);

describe('documentation snippet previews', () => {
	it('requires a runnable preview or a documented nonvisual exception for every snippet', () => {
		for (const { doc, section, key } of snippets) {
			const preview = getSnippetPreview(doc, section);
			expect(Boolean(preview) !== Boolean(codeOnlySnippets[key]), key).toBe(true);
			if (preview) {
				expect(preview.snippet, key).toBe(section.code!.source);
				expect(preview.component, key).toBeTypeOf('function');
			}
		}
		for (const key of Object.keys(codeOnlySnippets)) {
			expect(
				snippets.some((snippet) => snippet.key === key),
				key
			).toBe(true);
			expect(codeOnlySnippets[key].length).toBeGreaterThan(20);
		}
	});

	it('provides copyable public source and all local child components for every preview', () => {
		for (const { doc, section, key } of snippets) {
			const preview = getSnippetPreview(doc, section);
			if (!preview) continue;
			const files = [
				{ filename: preview.filename, source: preview.source },
				...(preview.additionalSources ?? [])
			];
			for (const file of files) {
				expect(file.source, key).not.toContain('$lib/');
				for (const match of file.source.matchAll(/from ['"]\.\/([^'"]+)['"]/g)) {
					expect(
						files.some((child) => child.filename === match[1]),
						`${key}: ${match[1]}`
					).toBe(true);
				}
				for (const generate of ['client', 'server'] as const) {
					expect(compile(file.source, { filename: file.filename, generate }).warnings, key).toEqual(
						[]
					);
				}
			}
		}
	});
});
