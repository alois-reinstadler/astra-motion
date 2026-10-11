import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import Player from './LayoutExample.svelte';
import playerSource from './LayoutExample.svelte?raw';
import Tabs from './SharedExample.svelte';
import tabsSource from './SharedExample.svelte?raw';
import Viewport from './InViewExample.svelte';
import viewportSource from './InViewExample.svelte?raw';

export const compositionExamples = {
	'player-layout': {
		id: 'player-layout',
		title: 'Expand a player',
		description: 'Resize a music player with layout while protecting its artwork and text.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'automatic',
		filename: 'Player.svelte',
		component: Player,
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
		component: Tabs,
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
		component: Viewport,
		source: publicExampleSource(viewportSource)
	}
} satisfies Record<string, LiveExample>;
