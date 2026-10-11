import type { Component } from 'svelte';
import { learningExamples } from './examples/learning-examples.js';
import { compositionExamples } from './examples/composition-examples.js';
import { coreExamples } from './examples/core-examples.js';
import { gesturesLayoutExamples } from './examples/gestures-layout-examples.js';
import { presenceViewExamples } from './examples/presence-view-examples.js';
import { valuesHelpersExamples } from './examples/values-helpers-examples.js';

export interface LiveExample {
	id: string;
	title: string;
	filename: string;
	description: string;
	category: string;
	guide: string;
	anchor: string;
	snippet?: string;
	snippetLabel?: string;
	component: Component;
	source: string;
	additionalSources?: { filename: string; source: string }[];
}

const registeredExamples = {
	...learningExamples,
	...compositionExamples,
	...coreExamples,
	...gesturesLayoutExamples,
	...presenceViewExamples,
	...valuesHelpersExamples
} satisfies Record<string, LiveExample>;
export const exampleCategories = [
	'All examples',
	'Basics',
	'Gestures',
	'Layout & presence',
	'Scroll',
	'Values'
] as const;
export type ExampleCategory = (typeof exampleCategories)[number];
function categoryFor(example: LiveExample): ExampleCategory {
	if (['Layout', 'Presence', 'View Transitions'].includes(example.category))
		return 'Layout & presence';
	if (example.category === 'Gestures') return 'Gestures';
	if (example.category === 'Motion values' || example.category === 'Motion Values') return 'Values';
	if (
		example.guide.includes('scroll') ||
		example.guide.includes('in-view') ||
		example.id === 'scroll-composition'
	)
		return 'Scroll';
	return 'Basics';
}
export const liveExamples: Record<string, LiveExample> = Object.fromEntries(
	Object.entries(registeredExamples).map(([id, example]) => [
		id,
		{ ...example, category: categoryFor(example) }
	])
);
export type LiveExampleId = keyof typeof registeredExamples;
export const exampleAliases: Record<string, string> = {
	layout: 'player-layout',
	shared: 'tab-highlight',
	'list-composition': 'animate-presence-list',
	wait: 'animate-presence-sequence',
	gestures: 'gesture-feedback',
	timeline: 'use-animate',
	'in-view': 'viewport-reveal'
};
export const getExample = (id: string): LiveExample | undefined => {
	const canonical = Object.hasOwn(exampleAliases, id) ? exampleAliases[id] : id;
	return Object.hasOwn(liveExamples, canonical) ? liveExamples[canonical] : undefined;
};
/** The first collection follows the learning path; reference demos remain available below it. */
export const featuredExampleIds = [
	'state',
	'motion-component',
	'transition-picker',
	'variants',
	'gesture-feedback',
	'drag-playground',
	'tab-highlight',
	'layout-expand',
	'reorder-list-grid',
	'animate-presence-sequence',
	'animate-presence-list',
	'animate-activity',
	'animate-view',
	'scroll-composition',
	'scroll'
];
const ordered = [
	...featuredExampleIds.map((id) => liveExamples[id]),
	...Object.values(liveExamples).filter((example) => !featuredExampleIds.includes(example.id))
];
export const exampleCatalog = ordered.map((example) => ({
	id: example.id,
	title: example.title,
	description: example.description,
	category: example.category,
	slug: example.guide,
	anchor: example.anchor,
	example: example.id
}));
