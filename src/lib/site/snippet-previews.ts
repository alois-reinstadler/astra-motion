import type { Component } from 'svelte';
import type { DocPage, DocSection } from './doc-types.js';
import type { LiveExample } from './examples.js';
import { publicExampleSource } from './public-example-source.js';

const components = import.meta.glob<Component>('./snippet-previews/*--*.svelte', {
	eager: true,
	import: 'default'
});
const sources = import.meta.glob<string>('./snippet-previews/*.svelte', {
	eager: true,
	query: '?raw',
	import: 'default'
});

/** Every code-only exception is intentional and checked by the documentation tests. */
export const codeOnlySnippets: Record<string, string> = {
	'getting-started/installation': 'Shell commands install the package without rendering a UI.',
	'motion/custom-components':
		'A forwarding-only shell needs application children and a motion.create caller.',
	'getting-started/configuration':
		'Application defaults wrap the caller’s children; see the MotionConfig demo.',
	'layout-group/api': 'An empty namespace wrapper configures IDs without rendering content.',
	'animate-view/asynchronous-content':
		'Application integration requires a real collection API and error handling.',
	'animate-view/navigation': 'Root layout navigation hooks require real route changes.'
};

/** Preserve historical fixtures while current guides select the modern authoring examples. */
const previewFiles: Record<string, string> = {
	'reorder/list': 'reorder--list-binding.svelte',
	'animate-presence/exit-data': 'animate-presence--exit-data-value.svelte',
	'text-animation/replacement': 'text-animation--replacement-value.svelte'
};

const childFiles: Record<string, string> = {
	'animate-presence/manual-removal': 'ManualExit.svelte',
	'animate-activity/component-sequencing': 'ActivityTab.svelte',
	'animate-activity/activity-effects': 'ActivityClock.svelte'
};

export function getSnippetPreview(doc: DocPage, section: DocSection): LiveExample | undefined {
	if (!section.code) return;
	const id = `${doc.slug}/${section.id}`;
	const path = `./snippet-previews/${previewFiles[id] ?? `${doc.slug}--${section.id}.svelte`}`;
	const component = components[path];
	if (!component) return;
	const child = childFiles[id];
	return {
		id: `snippet-${doc.slug}-${section.id}`,
		title: `${section.title} · preview`,
		filename: 'Example.svelte',
		description: section.title,
		category: doc.group,
		guide: doc.slug,
		anchor: section.id,
		component,
		source: publicExampleSource(sources[path]),
		snippet: section.code.source,
		snippetLabel: section.code.label,
		additionalSources: child
			? [{ filename: child, source: publicExampleSource(sources[`./snippet-previews/${child}`]) }]
			: undefined
	};
}
