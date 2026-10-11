import { documentationGroups, type DocPage } from './doc-types.js';
import { coreDocs } from './content/core.js';
import { gesturesLayoutPages } from './content/gestures-layout.js';
import { presenceViewDocs } from './content/presence-view.js';
import { valuesHelpersDocs } from './content/values-helpers.js';
import { startDocs } from './content/start.js';
import { presenceDocs } from './content/presence.js';
import { guidesDocs } from './content/guides.js';
export type { DocPage, DocSection, DocGroup } from './doc-types.js';
export const docGroups = documentationGroups;
const pages = [
	...startDocs,
	...presenceDocs,
	...coreDocs,
	...gesturesLayoutPages,
	...presenceViewDocs,
	...valuesHelpersDocs,
	...guidesDocs
];
const order = [
	'quick-start',
	'animations',
	'transitions',
	'presence',
	'layout',
	'scroll',
	'svg',
	'gestures',
	'drag',
	'hover',
	'motion',
	'animate-activity',
	'animate-presence',
	'animate-view',
	'layout-group',
	'lazy-motion',
	'motion-config',
	'reorder',
	'motion-values',
	'use-motion-template',
	'use-motion-value-event',
	'use-scroll',
	'use-spring',
	'use-time',
	'use-transform',
	'use-velocity',
	'use-animate',
	'use-animation-frame',
	'use-drag-controls',
	'use-in-view',
	'use-page-in-view',
	'use-reduced-motion',
	'recipes',
	'coming-from-react',
	'accessibility',
	'reduce-bundle-size',
	'text-animation'
];
const historicalAnchors: Record<string, Record<string, string[]>> = {
	'quick-start': {
		installation: [
			'install-local-package',
			'use-the-workspace',
			'requirements',
			'qualified-dependencies',
			'current-status',
			'lite-or-full',
			'choose-your-entry'
		],
		'first-animation': ['first-component', 'motion-component', 'a-small-set-of-tools'],
		'make-it-yours': ['reactivity', 'the-contract'],
		'keep-the-element': ['native-svelte', 'existing-markup', 'native-bindings'],
		'where-next': [
			'build-with-confidence',
			'migration',
			'coming-from-react',
			'troubleshooting',
			'configuration',
			'ssr',
			'panel-recipes',
			'accordion-recipe',
			'dialog-recipe',
			'headless-recipe',
			'distortion',
			'missing-exit',
			'ownership',
			'api-status'
		]
	},
	presence: {
		replacement: ['simultaneous', 'wait'],
		choose: ['pop-layout', 'nested-exits']
	},
	recipes: {
		troubleshooting: ['distortion', 'missing-exit', 'ownership', 'api-status']
	},
	animations: {
		'first-animation': ['targets'],
		variants: ['inheritance'],
		composition: ['gestures'],
		lifecycles: ['ownership']
	},
	'animate-presence': {
		usage: ['simultaneous'],
		sequencing: ['wait'],
		nested: ['nested-exits']
	},
	layout: {
		measurement: ['explicit-updates', 'scroll'],
		'modes-and-transitions': ['modes'],
		'shared-elements': ['identity', 'groups', 'across-pages']
	},
	motion: {
		'custom-components': ['existing-markup', 'forward-a-binding', 'headless-components'],
		lifecycle: [
			'lifetimes',
			'ssr',
			'create-layout',
			'presence',
			'create-scroll',
			'create-in-view',
			'create-animate',
			'routes-and-policy',
			'qualified-dependencies',
			'lite-or-full'
		],
		usage: ['tag-components'],
		'animation-props': ['create-motion']
	},
	'animate-view': {
		navigation: ['coordinator', 'shared-route-elements'],
		'browser-lifecycle': ['fallbacks']
	},
	scroll: {
		usage: ['container'],
		linked: ['target'],
		choices: ['in-view'],
		performance: ['ownership-and-policy', 'limits']
	},
	'use-animate': {
		lifecycle: ['boundaries']
	},
	accessibility: {
		'reduced-motion': ['policy', 'live-preferences'],
		meaning: ['accessibility']
	}
};
export const docs: DocPage[] = order.map((slug) => {
	const page = pages.find((page) => page.slug === slug);
	if (!page) throw new Error(`Missing documentation page: ${slug}`);
	return {
		...page,
		sections: page.sections.map((section) => ({
			...section,
			aliases: [...(section.aliases ?? []), ...(historicalAnchors[slug]?.[section.id] ?? [])]
		}))
	};
});
/** Legacy locations render the canonical document while retaining incoming URL fragments. */
export const docAliases: Record<string, { slug: string; anchor?: string }> = {
	introduction: { slug: 'quick-start' },
	'getting-started': { slug: 'quick-start' },
	state: { slug: 'animations' },
	'shared-layout': { slug: 'layout' },
	timelines: { slug: 'use-animate' },
	routes: { slug: 'animate-view' },
	components: { slug: 'motion' },
	api: { slug: 'motion' },
	troubleshooting: { slug: 'recipes', anchor: 'troubleshooting' }
};
export const getDoc = (slug: string) =>
	docs.find((doc) => doc.slug === (docAliases[slug]?.slug ?? slug));

/** Lightweight navigation metadata; prose and source stay on the server. */
export const docCatalog = docs.map(({ slug, title, group, summary }) => ({
	slug,
	title,
	group,
	summary
}));
/** Preserve substring search across all editorial content, including collapsed notes. */
export const docSearchIndex = docs.map((doc) => ({
	slug: doc.slug,
	text: [
		doc.title,
		doc.summary,
		doc.learning,
		...doc.sections.flatMap((section) => [
			section.title,
			...section.text,
			...(section.points ?? []),
			section.note?.title,
			...(section.note?.text ?? []),
			section.code?.source,
			JSON.stringify(section.table ?? []),
			...(section.links ?? []).flatMap((link) => [link.title, link.detail])
		])
	]
		.join(' ')
		.toLowerCase()
}));
