import { base } from '$app/paths';
import { error } from '@sveltejs/kit';
import { docs, docAliases, getDoc } from '$lib/site/docs.js';
import { documentMarkdown } from '$lib/server/reference.js';
import type { EntryGenerator, RequestHandler } from './$types.js';
export const prerender = true;
export const entries: EntryGenerator = () => [
	...docs.map(({ slug }) => ({ slug })),
	...Object.keys(docAliases).map((slug) => ({ slug }))
];
export const GET: RequestHandler = ({ params }) => {
	const doc = getDoc(params.slug);
	if (!doc) error(404, 'Unknown documentation page');
	return new Response(documentMarkdown(doc, base), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
};
