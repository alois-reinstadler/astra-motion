import type { Component } from 'svelte';
import { authoringExamples } from '$lib/motion-lab/authoring-examples.js';
import StateExample from './examples/StateExample.svelte';
import StateExampleSource from './examples/StateExample.svelte?raw';
import LayoutExample from './examples/LayoutExample.svelte';
import LayoutExampleSource from './examples/LayoutExample.svelte?raw';
import SharedExample from './examples/SharedExample.svelte';
import SharedExampleSource from './examples/SharedExample.svelte?raw';
import ListExample from './examples/ListExample.svelte';
import ListExampleSource from './examples/ListExample.svelte?raw';
import PresenceExample from './examples/PresenceExample.svelte';
import PresenceExampleSource from './examples/PresenceExample.svelte?raw';
import VariantsExample from './examples/VariantsExample.svelte';
import VariantsExampleSource from './examples/VariantsExample.svelte?raw';
import TimelineExample from './examples/TimelineExample.svelte';
import TimelineExampleSource from './examples/TimelineExample.svelte?raw';
import ScrollExample from './examples/ScrollExample.svelte';
import ScrollExampleSource from './examples/ScrollExample.svelte?raw';
import InViewExample from './examples/InViewExample.svelte';
import InViewExampleSource from './examples/InViewExample.svelte?raw';
import GestureExample from './examples/GestureExample.svelte';
import GestureExampleSource from './examples/GestureExample.svelte?raw';

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

/** Display the exact component being previewed, using the public package import. */
const publicSource = (source: string) =>
	source.replaceAll("'$lib/motion/index.js'", "'astra-motion'");

export const liveExamples = {
	state: {
		id: 'state',
		title: 'Show and dismiss a notification',
		description: 'Animate an entrance and exit with one motion.div and an if block.',
		category: 'State & gestures',
		guide: 'getting-started',
		anchor: 'first-component',
		snippet: authoringExamples.find((example) => example.id === 'state')!.source,
		snippetLabel: 'Notification.svelte',
		filename: 'StateExample.svelte',
		component: StateExample,
		source: publicSource(StateExampleSource)
	},
	layout: {
		id: 'layout',
		title: 'Expand a player',
		description: 'Resize a surface while its text and artwork keep their proportions.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'automatic',
		snippet:
			"const layout = createLayout({\n  transition: { type: 'spring', stiffness: 300, damping: 30 }\n});\n\n<motion.div motion={{ layout: true, layoutGroup: layout }}>\n  <div {@attach layout({ mode: 'position' })}>\n    <!-- Player content -->\n  </div>\n</motion.div>",
		filename: 'LayoutExample.svelte',
		component: LayoutExample,
		source: publicSource(LayoutExampleSource)
	},
	shared: {
		id: 'shared',
		title: 'Move a selection between tabs',
		description: 'Give one highlight a shared identity as the active tab changes.',
		category: 'Layout',
		guide: 'shared-layout',
		anchor: 'identity',
		snippet:
			'const layout = createLayout();\n\n{#if selected === index}\n  <motion.div class="selected" motion={{\n    layout: { id: \'mood-selection\' }, layoutGroup: layout\n  }} />\n{/if}',
		filename: 'SharedExample.svelte',
		component: SharedExample,
		source: publicSource(SharedExampleSource)
	},
	'motion-component': {
		id: 'motion-component',
		title: 'Remove and reflow list items',
		description: 'Let an item exit while the remaining items fill its space.',
		category: 'Presence',
		guide: 'presence',
		anchor: 'pop-layout',
		snippet:
			"const layout = createLayout();\nconst pop = { [createAttachmentKey()]: popLayout() };\n\n<motion.li {...pop} motion={{\n  exit: { opacity: 0, x: 32, scale: 0.96 },\n  layout: { mode: 'position' }, layoutGroup: layout\n}}>\n  <!-- Task content; the list has position: relative -->\n</motion.li>",
		filename: 'ListExample.svelte',
		component: ListExample,
		source: publicSource(ListExampleSource)
	},
	wait: {
		id: 'wait',
		title: 'Sequence changing content',
		description: 'Compare waiting for an exit with overlapping the next card.',
		category: 'Presence',
		guide: 'presence',
		anchor: 'wait',
		snippet:
			'<Presence value={chapter} {mode}>\n  {#snippet children(index)}\n    <motion.article motion={{\n      initial: { opacity: 0, y: 24, rotate: 3 },\n      animate: { opacity: 1, y: 0, rotate: 0 },\n      exit: { opacity: 0, y: -24, rotate: -3 }\n    }}>\n      {chapters[index].title}\n    </motion.article>\n  {/snippet}\n</Presence>',
		filename: 'PresenceExample.svelte',
		component: PresenceExample,
		source: publicSource(PresenceExampleSource)
	},
	inheritance: {
		id: 'inheritance',
		title: 'Stagger a menu',
		description: 'Use parent variants to reveal a group of child elements in order.',
		category: 'State & gestures',
		guide: 'state',
		anchor: 'inheritance',
		snippet:
			"<motion.div motion={{\n  initial: 'closed', animate: open ? 'open' : 'closed',\n  variants: { open: { opacity: 1 }, closed: { opacity: 1 } },\n  transition: { staggerChildren: 0.12 }\n}}>\n  <motion.div motion={item}>Projects</motion.div>\n  <motion.div motion={item}>Notes</motion.div>\n  <motion.div motion={item}>Collection</motion.div>\n</motion.div>",
		filename: 'VariantsExample.svelte',
		component: VariantsExample,
		source: publicSource(VariantsExampleSource)
	},
	timeline: {
		id: 'timeline',
		snippet:
			"const scene = createAnimate();\n\n// Call after the scope is mounted.\nconst playback = scene.sequence([\n  ['.disc', { x: [-72, 0], scale: [0.4, 1], opacity: [0, 1] }, { duration: 0.8 }],\n  ['.tile', { y: [60, 0], rotate: [-45, 0], opacity: [0, 1] }, { at: 0.35, duration: 0.8 }]\n]);\n\nplayback.pause();\nplayback.play();",
		title: 'Control an animation sequence',
		description: 'Play, pause and replay a scoped graphic composition.',
		category: 'Scroll & timelines',
		guide: 'timelines',
		anchor: 'sequence',
		filename: 'TimelineExample.svelte',
		component: TimelineExample,
		source: publicSource(TimelineExampleSource)
	},
	scroll: {
		id: 'scroll',
		snippet:
			"const reading = createScroll();\nconst progress = motionStore(reading.progress);\nconst orbit = reading.animate({\n  transform: ['rotate(-90deg) scale(0.65)', 'rotate(90deg) scale(1.15)']\n});\n\n<section {@attach reading.container}>\n  <div {@attach orbit}></div>\n  <!-- Scrollable content -->\n</section>",
		title: 'Compose a scene on scroll',
		description: 'Scrub a pinned composition through scatter, assembly and release.',
		category: 'Scroll & timelines',
		guide: 'scroll',
		anchor: 'container',
		filename: 'ScrollExample.svelte',
		component: ScrollExample,
		source: publicSource(ScrollExampleSource)
	},
	'in-view': {
		id: 'in-view',
		snippet:
			"const visible = createInView(\n  () => target,\n  () => ({ root: panel, amount: 0.6 })\n);\nconst card = createMotion(() => ({\n  initial: false,\n  animate: { opacity: visible.current ? 1 : 0, y: visible.current ? 0 : 24 },\n  transition: { type: 'spring', stiffness: 220, damping: 25 }\n}));",
		title: 'Reveal content in a scroll container',
		description: 'Observe a card as it enters and leaves its own viewport.',
		category: 'Scroll & timelines',
		guide: 'scroll',
		anchor: 'in-view',
		filename: 'InViewExample.svelte',
		component: InViewExample,
		source: publicSource(InViewExampleSource)
	},
	gestures: {
		id: 'gestures',
		title: 'Add button and drag feedback',
		description: 'Respond to hover, press and focus; move a tile by pointer or keyboard.',
		category: 'State & gestures',
		guide: 'state',
		anchor: 'gestures',
		snippet:
			"const button = createMotion({\n  whileHover: { y: -3, scale: 1.03 },\n  whileTap: { scale: 0.95 },\n  whileFocus: { scale: 1.03 },\n  transition: { type: 'spring', stiffness: 400, damping: 24 }\n});\n\n<button {...button.props}>Save to collection</button>",
		filename: 'GestureExample.svelte',
		component: GestureExample,
		source: publicSource(GestureExampleSource)
	}
} satisfies Record<string, LiveExample>;

export type LiveExampleId = keyof typeof liveExamples;
export const getExample = (id: string): LiveExample | undefined =>
	Object.values(liveExamples).find((example) => example.id === id);

export const exampleCategories = [
	'All examples',
	'State & gestures',
	'Layout',
	'Presence',
	'Scroll & timelines',
	'Routes',
	'Complete application'
] as const;

/** One map for catalogue copy, canonical guide anchors and the source beside each preview. */
export const exampleCatalog = [
	...Object.values(liveExamples).map((example) => ({
		id: example.id,
		title: example.title,
		description: example.description,
		category: example.category,
		slug: example.guide,
		anchor: example.anchor
	})),
	{
		id: 'routes',
		title: 'Motion between pages',
		description: 'Open an object from a collection and return with a shared route transition.',
		category: 'Routes',
		slug: 'routes',
		anchor: 'coordinator'
	},
	{
		id: 'showcase',
		title: 'Fieldwork: a complete application',
		description:
			'Explore a contact sheet, editing desk, publishing queue and reading experience together.',
		category: 'Complete application',
		slug: 'showcase',
		anchor: ''
	}
];
