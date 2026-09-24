import { describe, expect, it } from 'vitest';
import { compile } from 'svelte/compiler';
import { docs, getDoc, getRecipe } from './docs.js';
import { liveExamples, exampleCatalog } from './examples.js';

describe('documentation sources', () => {
	it('every catalog preview has one canonical guide section and matching source', () => {
		for (const example of Object.values(liveExamples)) {
			const owners = docs.flatMap((doc) =>
				doc.sections
					.filter((section) => section.example === example.id)
					.map((section) => ({ doc, section }))
			);
			expect(owners).toHaveLength(1);
			expect(owners[0].doc.slug).toBe(example.guide);
			expect(owners[0].section.id).toBe(example.anchor);
			expect(exampleCatalog.find((entry) => entry.id === example.id)).toMatchObject({
				title: example.title,
				slug: example.guide,
				anchor: example.anchor
			});
		}
	});
	it('onboarding introduces one working component immediately after installation', () => {
		const start = getDoc('getting-started')!;
		expect(start.sections[0].id).toBe('install-local-package');
		expect(start.sections[1].example).toBe('state');
		expect(liveExamples.state.snippetLabel).toBe('Notification.svelte');
		for (const generate of ['client', 'server'] as const) {
			expect(
				compile(liveExamples.state.snippet, { filename: 'Notification.svelte', generate }).warnings
			).toEqual([]);
		}
		expect(start.sections.filter((section) => section.example)).toHaveLength(1);
		expect(start.sections[1].aliases).toContain('motion-component');
		expect(getDoc('')!.sections.every((section) => !section.example && !section.recipe)).toBe(true);
	});

	it('every live example has standalone public source that compiles for client and server', () => {
		for (const example of Object.values(liveExamples)) {
			expect(example.source).toContain("from 'astra-motion'");
			expect(example.source).not.toContain('$lib/');
			for (const generate of ['client', 'server'] as const) {
				expect(compile(example.source, { filename: example.filename, generate }).warnings).toEqual(
					[]
				);
			}
		}
	});
	it('every guide has a unique route and valid anchors and recipe references', () => {
		expect(new Set(docs.map((doc) => doc.slug)).size).toBe(docs.length);
		for (const doc of docs) {
			expect(getDoc(doc.slug)).toBe(doc);
			expect(new Set(doc.sections.map((section) => section.id)).size).toBe(doc.sections.length);
			for (const section of doc.sections) {
				if (section.recipe) expect(getRecipe(section.recipe).source).toContain('<script');
				for (const slug of section.related ?? []) expect(getDoc(slug)).toBeDefined();
			}
		}
		expect(getDoc('not-a-guide')).toBeUndefined();
	});

	it('additional complete Svelte examples compile for the client and server', () => {
		const examples = docs.flatMap((doc) =>
			doc.sections.flatMap((section) =>
				section.code?.label.endsWith('.svelte') ? [section.code] : []
			)
		);
		expect(examples.length).toBeGreaterThan(0);
		for (const example of examples) {
			for (const generate of ['client', 'server'] as const) {
				const result = compile(example.source, { filename: example.label, generate });
				expect(result.warnings).toEqual([]);
			}
		}
	});
});
