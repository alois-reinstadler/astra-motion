import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { gesturesLayoutPages } from '../site/content/gestures-layout.js';

const examples = [
	['gesture-feedback', 'ParityGestureFeedback.svelte'],
	['drag-playground', 'ParityGestureDrag.svelte'],
	['hover-feedback', 'ParityGestureHover.svelte'],
	['drag-controls-handle', 'ParityGestureControls.svelte'],
	['reorder-list-grid', 'ParityGestureReorder.svelte'],
	['layout-expand', 'ParityLayoutExpand.svelte'],
	['layout-curved-path', 'ParityLayoutArc.svelte'],
	['layout-group-coordination', 'ParityLayoutGroup.svelte'],
	['layout-group-namespaces', 'ParityLayoutNamespaces.svelte']
];

describe('canonical gesture and layout documentation', () => {
	it('compiles every complete reference snippet for client and SSR', () => {
		const complete = gesturesLayoutPages.flatMap((page) =>
			page.sections.flatMap((section) =>
				section.code && /^(Smallest|Complete)/.test(section.code.label)
					? [{ page: page.slug, section: section.id, ...section.code }]
					: []
			)
		);
		expect(complete.length).toBeGreaterThan(0);
		for (const snippet of complete)
			for (const generate of ['client', 'server'] as const)
				expect(
					compile(snippet.source, {
						filename: `${snippet.page}-${snippet.section}.svelte`,
						generate,
						runes: true
					}).warnings
				).toEqual([]);
	});
	it('gives each runnable example one primary section and unique page/section identities', () => {
		expect(new Set(gesturesLayoutPages.map((page) => page.slug)).size).toBe(7);
		for (const page of gesturesLayoutPages)
			expect(new Set(page.sections.map((section) => section.id)).size).toBe(page.sections.length);
		const referenced = gesturesLayoutPages.flatMap((page) =>
			page.sections.flatMap((section) => (section.example ? [section.example] : []))
		);
		for (const [id] of examples) expect(referenced.filter((value) => value === id)).toHaveLength(1);
		expect(referenced).toHaveLength(examples.length);
	});
	it.each(examples)(
		'compiles %s from its actual component source for client and SSR',
		(_, filename) => {
			const canonical = readFileSync(
				new URL(`../site/examples/${filename}`, import.meta.url),
				'utf8'
			);
			const source = canonical.replaceAll("'$lib/motion/index.js'", "'astra-motion'");
			expect(source).not.toContain('$lib/');
			expect(source).toContain("from 'astra-motion'");
			for (const generate of ['client', 'server'] as const) {
				const result = compile(source, { filename, generate, runes: true });
				expect(result.warnings).toEqual([]);
				expect(result.js.code.length).toBeGreaterThan(0);
			}
		}
	);
});
