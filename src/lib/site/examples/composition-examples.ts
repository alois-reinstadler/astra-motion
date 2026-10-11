import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import playerSource from './LayoutExample.svelte?raw';
import tabsSource from './SharedExample.svelte?raw';
import viewportSource from './InViewExample.svelte?raw';

export const compositionExamples = {
	'player-layout': {
		id: 'player-layout',
		title: 'Expand a player',
		description: 'Resize a music player with layout while protecting its artwork and text.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'automatic',
		snippet:
			'<motion.div layout>\n  <motion.div layout="position">\n    <!-- Artwork and title keep their proportions. -->\n  </motion.div>\n  {#if expanded}\n    <motion.div layout="position">Track details</motion.div>\n  {/if}\n</motion.div>',
		filename: 'Player.svelte',
		component: './examples/LayoutExample.svelte',
		source: publicExampleSource(playerSource)
	},
	'tab-highlight': {
		id: 'tab-highlight',
		title: 'Move a selection between tabs',
		description: 'Share one layoutId across mood buttons; focus and click move the highlight.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'shared-elements',
		filename: 'MoodPicker.svelte',
		component: './examples/SharedExample.svelte',
		source: publicExampleSource(tabsSource)
	},
	'viewport-reveal': {
		id: 'viewport-reveal',
		title: 'Reveal a discovery card',
		description: 'Use useInView in a scroll container and let a native binding animate its state.',
		category: 'Scroll',
		guide: 'use-in-view',
		anchor: 'usage',
		filename: 'Discovery.svelte',
		component: './examples/InViewExample.svelte',
		source: publicExampleSource(viewportSource)
	}
} satisfies Record<string, LiveExample>;
