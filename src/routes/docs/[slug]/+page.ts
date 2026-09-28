import { error } from '@sveltejs/kit';
import { docs, docAliases, getDoc } from '$lib/site/docs.js';
import type { PageLoad, EntryGenerator } from './$types.js';
export const entries: EntryGenerator = () => [
	...docs.map((doc) => ({ slug: doc.slug })),
	...Object.keys(docAliases).map((slug) => ({ slug }))
];
export const load: PageLoad = ({ params }) => {
	const doc = getDoc(docAliases[params.slug]?.slug ?? params.slug);
	if (!doc) error(404, 'This guide does not exist. Choose a topic from the documentation.');
	return { doc };
};
