import { prepareHighlights } from '$lib/site/highlight.server.js';
import type { DocPage } from '$lib/site/doc-types.js';
import { getExample } from '$lib/site/examples.js';
import { getSnippetPreview } from '$lib/site/snippet-previews.js';

export function prepareDocPage(doc: DocPage) {
	const examples = Object.fromEntries(
		doc.sections.map((section) => [
			section.id,
			{
				example: getExample(section.example ?? ''),
				snippet: getSnippetPreview(doc, section)
			}
		])
	);
	const sources = doc.sections.flatMap((section) => (section.code ? [section.code] : []));
	for (const entry of Object.values(examples)) {
		for (const example of [entry.example, entry.snippet]) {
			if (!example) continue;
			sources.push({ source: example.source, label: example.filename });
			if (example.snippet)
				sources.push({
					source: example.snippet,
					label: example.snippetLabel ?? 'Key idea · excerpt'
				});
			for (const file of example.additionalSources ?? [])
				sources.push({ source: file.source, label: file.filename });
		}
	}
	return { doc, examples, highlights: prepareHighlights(sources) };
}
