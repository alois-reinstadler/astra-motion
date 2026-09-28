import { error } from '@sveltejs/kit';
import { getExample, liveExamples } from '$lib/site/examples.js';
import type { EntryGenerator, PageLoad } from './$types.js';
export const entries: EntryGenerator = () =>
	Object.values(liveExamples).map((example) => ({ slug: example.id }));
export const load: PageLoad = ({ params }) => {
	const example = getExample(params.slug);
	if (!example) error(404, 'This example does not exist. Choose one from the examples collection.');
	return { example };
};
