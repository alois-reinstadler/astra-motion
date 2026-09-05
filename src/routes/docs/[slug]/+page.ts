import { error } from '@sveltejs/kit';
import { getDoc } from '$lib/site/docs.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = ({ params }) => {
	const doc = getDoc(params.slug);
	if (!doc) error(404, 'This guide does not exist. Choose a topic from the documentation.');
	return { doc };
};
