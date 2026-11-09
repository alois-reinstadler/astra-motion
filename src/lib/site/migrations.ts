import type { DocSection } from './doc-types.js';
import { liveExamples } from './examples.js';

export const migrationRecipes = [
	{
		id: 'enter-exit',
		title: 'Enter and exit',
		example: 'animate-presence',
		from: 'React AnimatePresence inspects keyed children.',
		to: 'Pass present explicitly and render the retained snippet. The boundary owns removal; ordinary Svelte state owns visibility.'
	},
	{
		id: 'responsive-layout',
		title: 'Responsive layout',
		example: 'player-layout',
		from: 'React layout props are often attached to rerendering wrappers.',
		to: 'Keep ordinary Svelte state changes and layout on the animated surface. Protect text and artwork with layout="position"; no render wrapper is required.'
	},
	{
		id: 'controlled-reorder',
		title: 'Controlled reorder',
		example: 'reorder-list-grid',
		from: 'React passes values and onReorder to a controlled group.',
		to: 'Use bind:values for acceptance by default. Supply onReorder when the app must accept or reject a proposed order. Keep native move buttons for keyboard operation.'
	},
	{
		id: 'native-elements',
		title: 'Existing native elements',
		example: 'gesture-feedback',
		from: 'React event handlers and wrappers commonly own interaction.',
		to: 'Use lowercase onclick and native attributes. New motion tags remain native elements; choose motion.bind for scoped CSS, native directives, or a headless component that already owns markup.'
	},
	{
		id: 'motion-policy',
		title: 'Reduced motion and shared defaults',
		example: 'motion-config',
		from: 'React uses a provider plus helper calls during render.',
		to: 'Place MotionConfig around descendants and choose reducedMotion="user" explicitly. Set up managed helpers once; pass getters when options change.'
	}
] as const;

export const migrationRecipeSections: DocSection[] = [
	{
		id: 'migration-recipes',
		title: 'Five complete migration recipes',
		text: [
			'Each recipe below uses the same complete source as its live example. Install the supplied Astra archive, then replace React state and lifecycle assumptions with the explicit Svelte contract.'
		]
	},
	...migrationRecipes.map((recipe) => {
		const example = liveExamples[recipe.example];
		return {
			id: `migrate-${recipe.id}`,
			title: recipe.title,
			text: [recipe.from, recipe.to],
			code: { label: example.filename, source: example.source },
			related: [example.guide]
		};
	})
];
