import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import { authoringExamples } from '$lib/motion-lab/authoring-examples.js';
import StateExampleSource from './StateExample.svelte?raw';
import VariantsExampleSource from './VariantsExample.svelte?raw';
import ScrollExampleSource from './ScrollExample.svelte?raw';

/** Display the exact component being previewed, using the public package import. */

export const learningExamples = {
	state: {
		id: 'state',
		title: 'Show and dismiss a notification',
		description: 'Animate an entrance and exit with one motion.div and an if block.',
		category: 'State & gestures',
		guide: 'quick-start',
		anchor: 'first-animation',
		snippet: authoringExamples.find((example) => example.id === 'state')!.source,
		snippetLabel: 'Notification.svelte',
		filename: 'StateExample.svelte',
		component: './examples/StateExample.svelte',
		source: publicExampleSource(StateExampleSource)
	},
	variants: {
		id: 'variants',
		title: 'Stagger a menu',
		description: 'Use parent variants to reveal a group of child elements in order.',
		category: 'State & gestures',
		guide: 'animations',
		anchor: 'variants',
		snippet:
			"<motion.div\n  initial=\"closed\"\n  animate={open ? 'open' : 'closed'}\n  variants={{ open: { opacity: 1 }, closed: { opacity: 1 } }}\n  transition={{ delayChildren: stagger(0.12) }}\n>\n  <motion.div {...item}>Projects</motion.div>\n  <motion.div {...item}>Notes</motion.div>\n  <motion.div {...item}>Collection</motion.div>\n</motion.div>",
		filename: 'VariantsExample.svelte',
		component: './examples/VariantsExample.svelte',
		source: publicExampleSource(VariantsExampleSource)
	},
	'scroll-composition': {
		id: 'scroll-composition',

		title: 'Compose a scene on scroll',
		description:
			'Use useScroll and useTransform to scrub a pinned composition through scatter, assembly and release.',
		category: 'Scroll & timelines',
		guide: 'scroll',
		anchor: 'choices',
		filename: 'ScrollExample.svelte',
		component: './examples/ScrollExample.svelte',
		source: publicExampleSource(ScrollExampleSource)
	}
} satisfies Record<string, LiveExample>;
