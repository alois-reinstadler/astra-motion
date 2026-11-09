import packageInfo from '../../../package.json' with { type: 'json' };
import reviewed from '../../../tests/upstream-motion/reviewed-exports.json' with { type: 'json' };
import * as api from '$lib/motion/index.js';
import { docs, getDoc } from '$lib/site/docs.js';
import type { DocPage } from '$lib/site/doc-types.js';
import { liveExamples } from '$lib/site/examples.js';
import { recipeManifest } from '$lib/site/recipes.js';
import { release } from '$lib/site/release.js';

const fence = (source: string, language = 'svelte') => {
	const marker = source.includes('```') ? '````' : '```';
	return `${marker}${language}\n${source}\n${marker}`;
};
const cell = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');
const url = (base: string, path: string) => `${base}${path}`;
export const referenceVersion = release.version;

export function apiIndex(base = '') {
	return {
		name: packageInfo.name,
		version: release.version,
		engine: reviewed.pins,
		installation: `pnpm add /absolute/path/to/${release.archive}`,
		status: 'Local release candidate; registry publication is not implied.',
		entries: packageInfo.exports,
		runtimeExports: Object.keys(api).sort(),
		documents: docs.map(({ slug, title, summary, sections }) => ({
			slug,
			title,
			summary,
			url: url(base, `/docs/${slug}`),
			markdown: url(base, `/reference/${release.version}/docs/${slug}.md`),
			sections: sections.map(({ id, title }) => ({ id, title }))
		}))
	};
}

export function documentMarkdown(doc: DocPage, base = ''): string {
	const lines = [
		`# ${doc.title}`,
		'',
		`Astra Motion ${release.version} · Motion ${reviewed.pins.motion}`,
		'',
		doc.summary,
		'',
		`Canonical page: ${url(base, `/docs/${doc.slug}`)}`,
		''
	];
	if (doc.learning) lines.push(doc.learning, '');
	for (const section of doc.sections) {
		lines.push(
			`## ${section.title}`,
			'',
			`Anchor: ${section.id}`,
			'',
			...section.text.flatMap((text) => [text, ''])
		);
		if (section.points) lines.push(...section.points.map((point) => `- ${point}`), '');
		if (section.note)
			lines.push(
				`### ${section.note.title}`,
				'',
				...section.note.text.flatMap((text) => [text, ''])
			);
		if (section.code)
			lines.push(
				`### ${section.code.label}`,
				'',
				fence(section.code.source, /install/i.test(section.code.label) ? 'sh' : 'svelte'),
				''
			);
		if (section.table) {
			lines.push(
				`| ${section.table.columns.map(cell).join(' | ')} |`,
				`| ${section.table.columns.map(() => '---').join(' | ')} |`,
				...section.table.rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
				''
			);
		}
		if (section.example) {
			const example = liveExamples[section.example];
			if (!example) throw new Error(`Unknown reference example: ${section.example}`);
			lines.push(
				`### ${example.title}`,
				'',
				`Live example: ${url(base, `/examples/${example.id}`)}`,
				'',
				fence(example.source),
				''
			);
			for (const extra of example.additionalSources ?? [])
				lines.push(`### ${extra.filename}`, '', fence(extra.source), '');
		}
		for (const related of section.related ?? []) {
			const page = getDoc(related);
			if (page) lines.push(`- [${page.title}](${url(base, `/docs/${page.slug}`)})`);
		}
		for (const link of section.links ?? []) {
			lines.push(
				`- [${link.title}](${url(base, link.slug ? `/docs/${link.slug}` : (link.path ?? '/docs'))}): ${link.detail}`
			);
		}
		lines.push('');
	}
	return lines.join('\n').trimEnd() + '\n';
}

export function referenceIndex(base = '') {
	return [
		'# Astra Motion',
		'',
		`Version: ${release.version}. Engine: Motion ${reviewed.pins.motion}.`,
		'',
		'Local release candidate: install the supplied archive. Do not assume a similarly named registry package is this project.',
		'',
		`Install: pnpm add /absolute/path/to/${release.archive}`,
		'',
		'Use Svelte 5.57+. AnimatePresence uses explicit present/items/value and a snippet, not React child inspection. Select MotionConfig reducedMotion="user" to follow device preferences.',
		'',
		`- [Complete reference](${url(base, `/reference/${release.version}/llms-full.txt`)})`,
		`- [API index](${url(base, `/reference/${release.version}/api.json`)})`,
		`- [Recipes](${url(base, '/recipes')})`,
		'',
		'## Documentation',
		'',
		...docs.map(
			(doc) =>
				`- [${doc.title}](${url(base, `/reference/${release.version}/docs/${doc.slug}.md`)}): ${doc.summary}`
		),
		''
	].join('\n');
}

export function fullReference(base = '') {
	return (
		referenceIndex(base) + '\n' + docs.map((doc) => documentMarkdown(doc, base)).join('\n---\n\n')
	);
}

export const referenceDocuments = [
	'llms.txt',
	'llms-full.txt',
	'api.json',
	'recipes.json',
	...docs.map((doc) => `docs/${doc.slug}.md`)
];
export function referenceDocument(
	name: string,
	base = ''
): { body: string; type: string } | undefined {
	if (name === 'recipes.json')
		return { body: JSON.stringify(recipeManifest(base), null, 2) + '\n', type: 'application/json' };
	if (name === 'api.json')
		return { body: JSON.stringify(apiIndex(base), null, 2) + '\n', type: 'application/json' };
	if (name === 'llms.txt') return { body: referenceIndex(base), type: 'text/plain' };
	if (name === 'llms-full.txt') return { body: fullReference(base), type: 'text/plain' };
	const match = /^docs\/([^/]+)\.md$/.exec(name);
	const doc = match && getDoc(match[1]);
	if (doc) return { body: documentMarkdown(doc, base), type: 'text/markdown' };
}
