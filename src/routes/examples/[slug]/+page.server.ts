import { resolve } from '$app/paths';
import { prepareHighlights } from '$lib/site/highlight.server.js';
import { getDoc } from '$lib/site/docs.js';
import { error, redirect } from '@sveltejs/kit';
import { getExample, liveExamples, exampleAliases } from '$lib/site/examples.js';
import type { EntryGenerator, PageServerLoad } from './$types.js';
export const entries: EntryGenerator = () => [
	...Object.values(liveExamples).map((example) => ({ slug: example.id })),
	...Object.keys(exampleAliases).map((slug) => ({ slug }))
];
export const load: PageServerLoad = ({ params }) => {
	const canonical = Object.hasOwn(exampleAliases, params.slug)
		? exampleAliases[params.slug]
		: undefined;
	if (canonical) redirect(308, resolve('/examples/[slug]', { slug: canonical }));
	const example = getExample(params.slug);
	if (!example) error(404, 'This example does not exist. Choose one from the examples collection.');
	const sources = [
		{ source: example.source, label: example.filename },
		...(example.additionalSources ?? []).map((file) => ({
			source: file.source,
			label: file.filename
		}))
	];
	if (example.snippet)
		sources.push({ source: example.snippet, label: example.snippetLabel ?? 'Key idea · excerpt' });
	return {
		example,
		highlights: prepareHighlights(sources),
		guideTitle: getDoc(example.guide)?.title
	};
};
