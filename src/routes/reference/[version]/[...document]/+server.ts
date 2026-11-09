import { base } from '$app/paths';
import { error } from '@sveltejs/kit';
import { referenceVersion, referenceDocuments, referenceDocument } from '$lib/server/reference.js';
import type { EntryGenerator, RequestHandler } from './$types.js';
export const prerender = true;
export const entries: EntryGenerator = () =>
	referenceDocuments.map((document) => ({ version: referenceVersion, document }));
export const GET: RequestHandler = ({ params }) => {
	if (params.version !== referenceVersion)
		error(404, 'This build does not contain that reference version');
	const result = referenceDocument(params.document, base);
	if (!result) error(404, 'Unknown reference document');
	return new Response(result.body, {
		headers: { 'content-type': `${result.type}; charset=utf-8` }
	});
};
