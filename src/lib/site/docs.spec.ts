import { describe, expect, it } from 'vitest';
import { compile } from 'svelte/compiler';
import { docs, docGroups, docAliases, getDoc } from './docs.js';
import { liveExamples, exampleCatalog } from './examples.js';
import { legacyExamples } from './examples/legacy-examples.js';

const compositions = new Set(
	Object.values(legacyExamples)
		.filter((example) => !['state', 'variants'].includes(example.id))
		.map((example) => example.id)
);

describe('documentation sources', () => {
	it('covers the exact requested navigation surface in the requested order', () => {
		expect(docGroups).toEqual([
			'Animations',
			'Gestures',
			'Components',
			'Motion Values',
			'Hooks',
			'Guides'
		]);
		expect(docs.map((doc) => doc.slug)).toEqual([
			'animations',
			'layout',
			'scroll',
			'svg',
			'transitions',
			'gestures',
			'drag',
			'hover',
			'motion',
			'animate-activity',
			'animate-presence',
			'animate-view',
			'layout-group',
			'lazy-motion',
			'motion-config',
			'reorder',
			'motion-values',
			'use-motion-template',
			'use-motion-value-event',
			'use-scroll',
			'use-spring',
			'use-time',
			'use-transform',
			'use-velocity',
			'use-animate',
			'use-animation-frame',
			'use-drag-controls',
			'use-in-view',
			'use-page-in-view',
			'use-reduced-motion',
			'getting-started',
			'accessibility',
			'reduce-bundle-size',
			'text-animation'
		]);
		expect(docGroups.map((group) => docs.filter((doc) => doc.group === group).length)).toEqual([
			5, 3, 8, 8, 6, 4
		]);
	});
	it('each reference demo has one canonical section; larger compositions link to their concept', () => {
		for (const example of Object.values(liveExamples)) {
			const owners = docs.flatMap((doc) =>
				doc.sections
					.filter((section) => section.example === example.id)
					.map((section) => ({ doc, section }))
			);
			expect(owners, example.id).toHaveLength(compositions.has(example.id) ? 0 : 1);
			if (owners.length) {
				expect(owners[0].doc.slug).toBe(example.guide);
				expect(owners[0].section.id).toBe(example.anchor);
			}
			expect(
				getDoc(example.guide)?.sections.some((section) => section.id === example.anchor),
				example.id
			).toBe(true);
			expect(exampleCatalog.find((entry) => entry.id === example.id)).toMatchObject({
				title: example.title,
				slug: example.guide,
				anchor: example.anchor,
				example: example.id
			});
		}
	});
	it('onboarding gives install requirements followed by one working component', () => {
		const start = getDoc('getting-started')!;
		expect(start.sections.slice(0, 3).map((section) => section.id)).toEqual([
			'installation',
			'requirements',
			'first-component'
		]);
		expect(start.sections[2].example).toBe('state');
		expect(liveExamples.state.snippetLabel).toBe('Notification.svelte');
		for (const generate of ['client', 'server'] as const) {
			expect(
				compile(liveExamples.state.snippet!, { filename: 'Notification.svelte', generate }).warnings
			).toEqual([]);
		}
		expect(start.sections.filter((section) => section.example)).toHaveLength(1);
	});
	it('all live examples have standalone public source that compiles for client and server', () => {
		for (const example of Object.values(liveExamples)) {
			expect(example.source, example.id).toMatch(/from 'astra-motion(?:\/[^']+)?'/);
			expect(example.source).not.toContain('$lib/');
			for (const generate of ['client', 'server'] as const) {
				expect(
					compile(example.source, { filename: example.filename, generate }).warnings,
					example.id
				).toEqual([]);
			}
		}
	});
	it('every page, alias, cross-link, table and example reference resolves', () => {
		expect(new Set(docs.map((doc) => doc.slug)).size).toBe(docs.length);
		for (const doc of docs) {
			expect(getDoc(doc.slug)).toBe(doc);
			expect(
				new Set(doc.sections.flatMap((section) => [section.id, ...(section.aliases ?? [])])).size
			).toBe(
				doc.sections.reduce((count, section) => count + 1 + (section.aliases?.length ?? 0), 0)
			);
			for (const section of doc.sections) {
				if (section.example)
					expect(
						Object.values(liveExamples).find((example) => example.id === section.example),
						section.example
					).toBeDefined();
				for (const slug of section.related ?? [])
					expect(getDoc(slug), `${doc.slug} links ${slug}`).toBeDefined();
				for (const link of section.links ?? [])
					if (link.slug) expect(getDoc(link.slug)).toBeDefined();
				for (const row of section.table?.rows ?? [])
					expect(row).toHaveLength(section.table!.columns.length);
			}
		}
		for (const alias of Object.values(docAliases)) {
			const target = getDoc(alias.slug);
			expect(target).toBeDefined();
			if (alias.anchor)
				expect(target!.sections.some((section) => section.id === alias.anchor)).toBe(true);
		}
		expect(getDoc('not-a-guide')).toBeUndefined();
	});
	it('all additional complete components compile for the client and server', () => {
		const examples = docs.flatMap((doc) =>
			doc.sections.flatMap((section) =>
				section.code && /complete|\.svelte$/i.test(section.code.label)
					? [{ ...section.code, filename: `${doc.slug}-${section.id}.svelte` }]
					: []
			)
		);
		expect(examples.length).toBeGreaterThan(10);
		for (const example of examples)
			for (const generate of ['client', 'server'] as const) {
				expect(
					compile(example.source, { filename: example.filename, generate }).warnings,
					example.filename
				).toEqual([]);
			}
	});
});
