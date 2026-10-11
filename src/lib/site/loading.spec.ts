import { describe, expect, it } from 'vitest';
import type { Component } from 'svelte';
import { docs, docCatalog, docSearchIndex } from './docs.js';
import { liveExamples } from './examples.js';
import { getSnippetPreview } from './snippet-previews.js';
import { loadExampleComponent } from './example-components.js';
import { prepareDocPage } from '$lib/server/doc-page.js';

// Compile the fixture graph during suite import, outside runtime assertions.
// The production resolver must return precisely the corresponding compiled module.
const expectedComponents = import.meta.glob<Component>(
	['./examples/*.svelte', './snippet-previews/*--*.svelte'],
	{ eager: true, import: 'default' }
);

describe('selective documentation loading', () => {
	it('keeps navigation free of article bodies while preserving ordering', () => {
		expect(docCatalog.map((doc) => doc.slug)).toEqual(docs.map((doc) => doc.slug));
		expect(docCatalog.every((doc) => !('sections' in doc))).toBe(true);
	});
	it('indexes body, code, and table substrings as well as titles', () => {
		for (const doc of docs) {
			const indexed = docSearchIndex.find((entry) => entry.slug === doc.slug)!.text;
			expect(indexed).toContain(doc.title.toLowerCase());
			for (const section of doc.sections) {
				for (const paragraph of [
					...section.text,
					...(section.points ?? []),
					...(section.note?.text ?? [])
				])
					expect(indexed).toContain(paragraph.toLowerCase());
				if (section.note) expect(indexed).toContain(section.note.title.toLowerCase());
				for (const link of section.links ?? []) {
					expect(indexed).toContain(link.title.toLowerCase());
					expect(indexed).toContain(link.detail.toLowerCase());
				}
				if (section.code) expect(indexed).toContain(section.code.source.toLowerCase());
				if (section.table) expect(indexed).toContain(JSON.stringify(section.table).toLowerCase());
			}
		}
	});
	it('serializes only examples owned by the requested article', () => {
		const doc = docs.find((entry) => entry.slug === 'quick-start')!;
		const data = prepareDocPage(doc);
		expect(Object.keys(data.examples)).toEqual(doc.sections.map((section) => section.id));
		expect(
			Object.values(data.examples).flatMap((entry) => (entry.example ? [entry.example.id] : []))
		).toEqual(['state']);
		expect(JSON.parse(JSON.stringify(data)).examples['first-animation'].example.component).toBe(
			'./examples/StateExample.svelte'
		);
		expect(JSON.stringify(data)).not.toContain('Compare motion timing');
	});
	it('can resolve every registered lazy demo and snippet, including legacy overrides', async () => {
		const paths = new Set(Object.values(liveExamples).map((example) => example.component));
		for (const doc of docs)
			for (const section of doc.sections) {
				const snippet = getSnippetPreview(doc, section);
				if (snippet) paths.add(snippet.component);
			}
		for (const path of paths) {
			expect(expectedComponents[path], path).toBeTypeOf('function');
			expect(await loadExampleComponent(path), path).toBe(expectedComponents[path]);
		}
		await expect(loadExampleComponent('./missing.svelte')).rejects.toThrow('Unknown example');
	});
});
