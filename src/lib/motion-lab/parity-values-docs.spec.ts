import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { valuesHelpersDocs } from '../site/content/values-helpers.js';
import { valuesHelpersExamples } from '../site/examples/values-helpers-examples.js';

it.each(Object.values(valuesHelpersExamples))(
	'renders the canonical $id example during SSR',
	(example) => {
		const { body } = render(example.component);
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
