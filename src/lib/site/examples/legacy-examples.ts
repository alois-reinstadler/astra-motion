import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import { authoringExamples } from '$lib/motion-lab/authoring-examples.js';
import StateExample from './StateExample.svelte';
import StateExampleSource from './StateExample.svelte?raw';
import LayoutExample from './LayoutExample.svelte';
import LayoutExampleSource from './LayoutExample.svelte?raw';
import SharedExample from './SharedExample.svelte';
import SharedExampleSource from './SharedExample.svelte?raw';
import ListExample from './ListExample.svelte';
import ListExampleSource from './ListExample.svelte?raw';
import PresenceExample from './PresenceExample.svelte';
import PresenceExampleSource from './PresenceExample.svelte?raw';
import VariantsExample from './VariantsExample.svelte';
import VariantsExampleSource from './VariantsExample.svelte?raw';
import TimelineExample from './TimelineExample.svelte';
import TimelineExampleSource from './TimelineExample.svelte?raw';
import ScrollExample from './ScrollExample.svelte';
import ScrollExampleSource from './ScrollExample.svelte?raw';
import InViewExample from './InViewExample.svelte';
import InViewExampleSource from './InViewExample.svelte?raw';
import GestureExample from './GestureExample.svelte';
import GestureExampleSource from './GestureExample.svelte?raw';

/** Display the exact component being previewed, using the public package import. */

export const legacyExamples = {
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
		source: publicExampleSource(StateExampleSource)
	},
	layout: {
		id: 'layout',
		title: 'Expand a player',
		description:
			'Use a createLayout controller to resize a player while preserving text and artwork proportions.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'automatic',
		snippet:
			"const layout = createLayout({\n  transition: { type: 'spring', stiffness: 300, damping: 30 }\n});\n\n<motion.div layout layoutGroup={layout}>\n  <div {@attach layout({ mode: 'position' })}>\n    <!-- Player content -->\n  </div>\n</motion.div>",
		filename: 'LayoutExample.svelte',
		component: LayoutExample,
		source: publicExampleSource(LayoutExampleSource)
	},
	shared: {
		id: 'shared',
		title: 'Move a selection between tabs',
		description: 'Move a shared highlight between tabs using an explicit createLayout controller.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'shared-elements',
		snippet:
			'const layout = createLayout();\n\n{#if selected === index}\n  <motion.div\n    class="selected"\n    layout={{ id: \'mood-selection\' }}\n    layoutGroup={layout}\n  />\n{/if}',
		filename: 'SharedExample.svelte',
		component: SharedExample,
		source: publicExampleSource(SharedExampleSource)
	},
	'list-composition': {
		id: 'list-composition',
		title: 'Remove and reflow list items',
		description:
			'Combine the compatibility popLayout attachment and native exits to reflow a task list.',
		category: 'Presence',
		guide: 'animate-presence',
		anchor: 'pop-layout',
		snippet:
			"const layout = createLayout();\nconst pop = { [createAttachmentKey()]: popLayout() };\n\n<motion.li\n  {...pop}\n  exit={{ opacity: 0, x: 32, scale: 0.96 }}\n  layout={{ mode: 'position' }}\n  layoutGroup={layout}\n>\n  <!-- Task content; the list has position: relative -->\n</motion.li>",
		filename: 'ListExample.svelte',
		component: ListExample,
		source: publicExampleSource(ListExampleSource)
	},
	wait: {
		id: 'wait',
		title: 'Sequence changing content',
		description:
			'Compare wait and sync modes using the supported compatibility Presence component.',
		category: 'Presence',
		guide: 'animate-presence',
		anchor: 'sequencing',
		snippet:
			'<Presence value={chapter} {mode}>\n  {#snippet children(index)}\n    <motion.article\n      initial={{ opacity: 0, y: 24, rotate: 3 }}\n      animate={{ opacity: 1, y: 0, rotate: 0 }}\n      exit={{ opacity: 0, y: -24, rotate: -3 }}\n    >\n      {chapters[index].title}\n    </motion.article>\n  {/snippet}\n</Presence>',
		filename: 'PresenceExample.svelte',
		component: PresenceExample,
		source: publicExampleSource(PresenceExampleSource)
	},
	variants: {
		id: 'variants',
		title: 'Stagger a menu',
		description: 'Use parent variants to reveal a group of child elements in order.',
		category: 'State & gestures',
		guide: 'animations',
		anchor: 'variants',
		snippet:
			"<motion.div\n  initial=\"closed\"\n  animate={open ? 'open' : 'closed'}\n  variants={{ open: { opacity: 1 }, closed: { opacity: 1 } }}\n  transition={{ staggerChildren: 0.12 }}\n>\n  <motion.div {...item}>Projects</motion.div>\n  <motion.div {...item}>Notes</motion.div>\n  <motion.div {...item}>Collection</motion.div>\n</motion.div>",
		filename: 'VariantsExample.svelte',
		component: VariantsExample,
		source: publicExampleSource(VariantsExampleSource)
	},
	timeline: {
		id: 'timeline',
		snippet:
			"const scene = createAnimate();\n\n// Call after the scope is mounted.\nconst playback = scene.sequence([\n  ['.disc', { x: [-72, 0], scale: [0.4, 1], opacity: [0, 1] }, { duration: 0.8 }],\n  ['.tile', { y: [60, 0], rotate: [-45, 0], opacity: [0, 1] }, { at: 0.35, duration: 0.8 }]\n]);\n\nplayback.pause();\nplayback.play();",
		title: 'Control an animation sequence',
		description:
			'Play, pause and replay a graphic composition using the compatibility createAnimate scope.',
		category: 'Scroll & timelines',
		guide: 'use-animate',
		anchor: 'usage',
		filename: 'TimelineExample.svelte',
		component: TimelineExample,
		source: publicExampleSource(TimelineExampleSource)
	},
	'scroll-composition': {
		id: 'scroll-composition',
		snippet:
			"const reading = createScroll();\nconst progress = motionStore(reading.progress);\nconst orbit = reading.animate({\n  transform: ['rotate(-90deg) scale(0.65)', 'rotate(90deg) scale(1.15)']\n});\n\n<section {@attach reading.container}>\n  <div {@attach orbit}></div>\n  <!-- Scrollable content -->\n</section>",
		title: 'Compose a scene on scroll',
		description:
			'Use createScroll to scrub a pinned composition through scatter, assembly and release.',
		category: 'Scroll & timelines',
		guide: 'scroll',
		anchor: 'choices',
		filename: 'ScrollExample.svelte',
		component: ScrollExample,
		source: publicExampleSource(ScrollExampleSource)
	},
	'in-view': {
		id: 'in-view',
		snippet:
			"const visible = createInView(\n  () => target,\n  () => ({ root: panel, amount: 0.6 })\n);\nconst card = createMotion(() => ({\n  initial: false,\n  animate: { opacity: visible.current ? 1 : 0, y: visible.current ? 0 : 24 },\n  transition: { type: 'spring', stiffness: 220, damping: 25 }\n}));",
		title: 'Reveal content in a scroll container',
		description:
			'Combine createInView and createMotion bindings to reveal a card in its own viewport.',
		category: 'Scroll & timelines',
		guide: 'use-in-view',
		anchor: 'usage',
		filename: 'InViewExample.svelte',
		component: InViewExample,
		source: publicExampleSource(InViewExampleSource)
	},
	gestures: {
		id: 'gestures',
		title: 'Add button and drag feedback',
		description:
			'Use createMotion bindings for hover, press and focus; move a tile by pointer or keyboard.',
		category: 'State & gestures',
		guide: 'gestures',
		anchor: 'feedback',
		snippet:
			"const button = createMotion({\n  whileHover: { y: -3, scale: 1.03 },\n  whileTap: { scale: 0.95 },\n  whileFocus: { scale: 1.03 },\n  transition: { type: 'spring', stiffness: 400, damping: 24 }\n});\n\n<button {...button.props}>Save to collection</button>",
		filename: 'GestureExample.svelte',
		component: GestureExample,
		source: publicExampleSource(GestureExampleSource)
	}
} satisfies Record<string, LiveExample>;
