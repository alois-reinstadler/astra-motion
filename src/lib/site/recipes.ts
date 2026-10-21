import { liveExamples } from './examples.js';
import { release } from './release.js';
import packageInfo from '../../../package.json' with { type: 'json' };

const definitions = [
	{
		id: 'readable-text',
		example: 'text-animation',
		category: 'Text',
		accessibility:
			'One complete semantic message; decorative fragments are hidden from assistive technology.',
		motion: 'The example follows the device preference through MotionConfig.',
		cost: 'Optional text entry plus the shared Motion engine.'
	},
	{
		id: 'decorative-tilt',
		example: 'tilt-card',
		category: 'Pointer',
		accessibility:
			'Tilt is decorative; a native checkbox disables it. Content needs no pointer interaction.',
		motion: 'The example follows the device preference through MotionConfig.',
		cost: 'Optional tilt entry plus the shared Motion engine.'
	},
	{
		id: 'responsive-player',
		example: 'player-layout',
		category: 'Layout',
		accessibility:
			'A native button controls expansion. Position-only boundaries protect text and artwork.',
		motion: 'Wrap the recipe in MotionConfig reducedMotion="user" to follow device preferences.',
		cost: 'Root entry with layout projection; no second animation engine.'
	},
	{
		id: 'presence-sequence',
		example: 'animate-presence-sequence',
		category: 'Presence',
		accessibility: 'Native controls choose sync/wait; a stable key controls replacement identity.',
		motion: 'Wrap the recipe in MotionConfig reducedMotion="user" to follow device preferences.',
		cost: 'Root entry with presence coordination.'
	},
	{
		id: 'button-feedback',
		example: 'gesture-feedback',
		category: 'Gestures',
		accessibility:
			'Native button activation and pressed semantics; focus gets feedback alongside hover.',
		motion: 'Wrap the recipe in MotionConfig reducedMotion="user" to follow device preferences.',
		cost: 'Root entry with gestures; no GSAP or canvas dependency.'
	},
	{
		id: 'controlled-reorder',
		example: 'reorder-list-grid',
		category: 'Layout',
		accessibility: 'Move buttons provide a keyboard alternative to dragging.',
		motion: 'Wrap the recipe in MotionConfig reducedMotion="user" to follow device preferences.',
		cost: 'Root entry with reorder and drag.'
	}
] as const;

/** Metadata references canonical runnable examples; source is never maintained twice. */
export const recipes = definitions.map((definition) => {
	const example = liveExamples[definition.example];
	if (!example) throw new Error(`Recipe ${definition.id} has no example ${definition.example}`);
	return { ...definition, title: example.title, description: example.description };
});

export function recipeManifest(base = '') {
	return {
		schemaVersion: 1,
		package: packageInfo.name,
		version: release.version,
		installation: `pnpm add /absolute/path/to/${release.archive}`,
		recipes: recipes.map((recipe) => {
			const example = liveExamples[recipe.example];
			const files = [
				{ filename: example.filename, source: example.source },
				...(example.additionalSources ?? [])
			];
			const specifiers = [
				...new Set(
					files.flatMap(({ source }) =>
						[...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
					)
				)
			].filter((specifier) => !specifier.startsWith('.'));
			return {
				...recipe,
				preview: `${base}/examples/${recipe.example}`,
				reference: `${base}/docs/${example.guide}#${example.anchor}`,
				dependencies: specifiers.map((specifier) => ({
					specifier,
					version: specifier.startsWith('astra-motion')
						? release.version
						: ((packageInfo.peerDependencies as Record<string, string>)[specifier] ??
							(packageInfo.devDependencies as Record<string, string>)[specifier])
				})),
				files
			};
		})
	};
}
