import type { Component } from 'svelte';
import { legacyExamples } from './examples/legacy-examples.js';
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
}

export const liveExamples = {
	...legacyExamples,
	...coreExamples,
	...gesturesLayoutExamples,
	...presenceViewExamples,
	...valuesHelpersExamples
} satisfies Record<string, LiveExample>;
export type LiveExampleId = keyof typeof liveExamples;
export const getExample = (id: string): LiveExample | undefined =>
	Object.values(liveExamples).find((example) => example.id === id);
export const exampleCategories = [
	'All examples',
	...new Set(Object.values(liveExamples).map((example) => example.category)),
	'Complete application'
];
export const exampleCatalog = [
	...Object.values(liveExamples).map((example) => ({
		id: example.id,
		title: example.title,
		description: example.description,
		category: example.category,
		slug: example.guide,
		anchor: example.anchor,
		example: example.id
	})),
	{
		id: 'showcase',
		title: 'Fieldwork: a complete application',
		description:
			'Explore a contact sheet, editing desk, publishing queue and reading experience together.',
		category: 'Complete application',
		slug: 'showcase',
		anchor: '',
		example: undefined
	}
];
