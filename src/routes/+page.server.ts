import { homeSource, homeSnippet } from '$lib/site/home-code.js';
import { prepareHighlights } from '$lib/site/highlight.server.js';

export function load() {
	return {
		highlights: prepareHighlights([
			{ source: homeSnippet, label: 'Layout and readable content · excerpt' },
			{ source: homeSource, label: 'HomeLayoutExample.svelte' }
		])
	};
}
