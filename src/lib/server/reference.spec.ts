import { expect, it } from 'vitest';
import { docs, getDoc } from '$lib/site/docs.js';
import { liveExamples } from '$lib/site/examples.js';
import {
	apiIndex,
	documentMarkdown,
	referenceIndex,
	referenceDocument,
	referenceDocuments,
	referenceVersion
} from './reference.js';
import { GET } from '../../routes/reference/[version]/[...document]/+server.js';

it('exports canonical sources with version, aliases and deployment base preserved', () => {
	const doc = getDoc('getting-started')!;
	const text = documentMarkdown(doc, '/astra-motion');
	expect(text).toContain(`Astra Motion ${referenceVersion}`);
	expect(text).toContain('/astra-motion/docs/quick-start');
	expect(text).toContain(liveExamples.state.source);
	expect(text).not.toContain("from '$lib/");
	expect(referenceIndex('/astra-motion')).toContain(
		`/astra-motion/reference/${referenceVersion}/api.json`
	);
	expect(apiIndex().runtimeExports).toContain('motion');
});

it('serves all registered documents and fails closed on unknown paths and versions', async () => {
	for (const name of referenceDocuments) expect(referenceDocument(name), name).toBeDefined();
	for (const doc of docs)
		expect(referenceDocument(`docs/${doc.slug}.md`)?.body).toContain(doc.title);
	expect(referenceDocument('docs/unknown.md')).toBeUndefined();
	expect(referenceDocument('../package.json')).toBeUndefined();
	const event = { params: { version: 'not-this-release', document: 'api.json' } } as Parameters<
		typeof GET
	>[0];
	await expect(async () => GET(event)).rejects.toMatchObject({ status: 404 });
});

it('keeps complete migration sources and the recipe manifest in the versioned reference', () => {
	const migration = documentMarkdown(getDoc('coming-from-react')!);
	expect(migration).toContain('Five complete migration recipes');
	expect(migration).toContain(liveExamples['reorder-list-grid'].source);
	expect(referenceDocument('recipes.json')?.type).toBe('application/json');
	const manifest = JSON.parse(referenceDocument('recipes.json')!.body);
	expect(manifest.version).toBe(referenceVersion);
	expect(
		manifest.recipes.find((recipe: { id: string }) => recipe.id === 'decorative-tilt').files[0]
			.source
	).toContain('Tilt');
});
