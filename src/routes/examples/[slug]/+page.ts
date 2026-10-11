import { error, redirect } from '@sveltejs/kit';
import { getExample, liveExamples, exampleAliases } from '$lib/site/examples.js';
import { resolve } from '$app/paths';
import type { EntryGenerator, PageLoad } from './$types.js';
export const entries: EntryGenerator = () => [
	...Object.values(liveExamples).map((example) => ({ slug: example.id })),
	...Object.keys(exampleAliases).map((slug) => ({ slug }))
];
export const load: PageLoad = ({ params }) => {
	const canonical = Object.hasOwn(exampleAliases, params.slug)
		? exampleAliases[params.slug]
		: undefined;
	if (canonical) redirect(308, resolve('/examples/[slug]', { slug: canonical }));
	const example = getExample(params.slug);
	if (!example) error(404, 'This example does not exist. Choose one from the examples collection.');
	return { example };
};
