import { browser } from '$app/environment';
import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, url }) => {
	// This delay exercises client navigation; query strings do not change static HTML.
	const delay = browser
		? Math.min(2000, Math.max(0, Number(url.searchParams.get('delay')) || 0))
		: 0;
	if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));
	return { id: params.id };
};
