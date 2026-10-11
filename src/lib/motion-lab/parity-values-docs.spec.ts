import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { expect, it } from 'vitest';
import { valuesHelpersDocs } from '../site/content/values-helpers.js';
import { valuesHelpersExamples } from '../site/examples/values-helpers-examples.js';

// Eager test-only imports put compilation in suite setup, as before lazy site loading.
// The separate loading suite exercises the production dynamic resolver.
const components = import.meta.glob<Component>('../site/examples/*.svelte', {
	eager: true,
	import: 'default'
});

it.each(Object.values(valuesHelpersExamples))(
	'renders the canonical $id example during SSR',
	(example) => {
		const { body } = render(components[`../site/${example.component.slice(2)}`]);
		expect(body).toContain('class="example');
		expect(body).not.toContain('undefined');
		expect(example.source).toContain("from 'astra-motion'");
		expect(example.source).not.toContain('$lib/motion');
	}
);

it('gives all fourteen references a canonical demo and distinct API or technique sections', () => {
	expect(valuesHelpersDocs).toHaveLength(14);
	expect(new Set(valuesHelpersDocs.map((doc) => doc.slug)).size).toBe(14);
	for (const doc of valuesHelpersDocs) {
		expect(valuesHelpersExamples[doc.slug]).toBeDefined();
		expect(doc.sections.find((section) => section.example === doc.slug)).toBeDefined();
		expect(
			doc.sections.find((section) => section.id === 'api' || section.id === 'choices')
		).toBeDefined();
		expect(new Set(doc.sections.map((section) => section.id)).size).toBe(doc.sections.length);
	}
});
