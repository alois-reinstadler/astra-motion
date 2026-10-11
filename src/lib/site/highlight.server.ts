import {
	codeLanguage,
	highlightKey,
	packHighlight,
	type HighlightSource,
	type PreparedHighlights
} from './highlight.js';
import { highlightCode } from './highlight-runtime.js';

/** Prepare only the code and theme used by this page, once during prerendering. */
export function prepareHighlights(sources: HighlightSource[]): PreparedHighlights {
	const highlights: PreparedHighlights = {};
	for (const { source, label = 'Example.svelte', language, dark = false } of sources) {
		const lang = language ?? codeLanguage(source, label);
		const key = highlightKey(source, lang, dark);
		highlights[key] ??= packHighlight(highlightCode(source, lang, dark));
	}
	return highlights;
}
