import { documentationGroups, type DocPage } from './doc-types.js';
import { coreDocs } from './content/core.js';
import { gesturesLayoutPages } from './content/gestures-layout.js';
import { presenceViewDocs } from './content/presence-view.js';
import { valuesHelpersDocs } from './content/values-helpers.js';
import { guidesDocs } from './content/guides.js';
export type { DocPage, DocSection, DocGroup } from './doc-types.js';
export const docGroups = documentationGroups;
const pages = [
	...coreDocs,
	...gesturesLayoutPages,
	...presenceViewDocs,
	...valuesHelpersDocs,
	...guidesDocs
];
const order = [
	'animations',
	'layout',
	'scroll',
	'svg',
	'transitions',
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
	'getting-started',
	'accessibility',
	'reduce-bundle-size',
	'text-animation'
];
const historicalAnchors: Record<string, Record<string, string[]>> = {
	'getting-started': {
		installation: ['install-local-package', 'use-the-workspace'],
		'first-component': ['motion-component'],
		reactivity: ['the-contract'],
		migration: ['existing-markup', 'native-bindings', 'lite-or-full'],
		requirements: ['a-small-set-of-tools', 'choose-your-entry', 'qualified-dependencies'],
		troubleshooting: [
			'build-with-confidence',
			'current-status',
			'distortion',
			'missing-exit',
			'ownership',
			'api-status'
		]
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
	introduction: { slug: 'getting-started' },
	state: { slug: 'animations' },
	presence: { slug: 'animate-presence' },
	'shared-layout': { slug: 'layout' },
	timelines: { slug: 'use-animate' },
	routes: { slug: 'animate-view' },
	components: { slug: 'motion' },
	api: { slug: 'motion' },
	troubleshooting: { slug: 'getting-started' }
};
export const getDoc = (slug: string) => docs.find((doc) => doc.slug === slug);
