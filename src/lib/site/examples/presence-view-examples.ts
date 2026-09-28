import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import AnimatePresenceExample from './AnimatePresenceExample.svelte';
import presenceSource from './AnimatePresenceExample.svelte?raw';
import AnimatePresenceSequenceExample from './AnimatePresenceSequenceExample.svelte';
import sequenceSource from './AnimatePresenceSequenceExample.svelte?raw';
import AnimatePresenceListExample from './AnimatePresenceListExample.svelte';
import listSource from './AnimatePresenceListExample.svelte?raw';
import AnimateActivityExample from './AnimateActivityExample.svelte';
import activitySource from './AnimateActivityExample.svelte?raw';
import AnimateViewExample from './AnimateViewExample.svelte';
import viewSource from './AnimateViewExample.svelte?raw';

export const presenceViewExamples = {
	'animate-presence': {
		id: 'animate-presence',
		title: 'Keep a note until its exit finishes',
		description: 'Toggle a conditional child while AnimatePresence coordinates its removal.',
		category: 'Presence',
		guide: 'animate-presence',
		anchor: 'usage',
		filename: 'AnimatePresenceExample.svelte',
		component: AnimatePresenceExample,
		source: publicExampleSource(presenceSource)
	},
	'animate-presence-sequence': {
		id: 'animate-presence-sequence',
		title: 'Compare sync and wait sequencing',
		description:
			'Change a stable key to replace a note, then choose whether entrance overlaps exit.',
		category: 'Presence',
		guide: 'animate-presence',
		anchor: 'sequencing',
		filename: 'AnimatePresenceSequenceExample.svelte',
		component: AnimatePresenceSequenceExample,
		source: publicExampleSource(sequenceSource)
	},
	'animate-presence-list': {
		id: 'animate-presence-list',
		title: 'Remove a list item and close its space',
		description:
			'Pop an exiting item out of flow while its remaining siblings animate their layout.',
		category: 'Presence',
		guide: 'animate-presence',
		anchor: 'pop-layout',
		filename: 'AnimatePresenceListExample.svelte',
		component: AnimatePresenceListExample,
		source: publicExampleSource(listSource)
	},
	'animate-activity': {
		id: 'animate-activity',
		title: 'Keep a draft while its panel is hidden',
		description: 'The same input element and its value survive repeated visibility changes.',
		category: 'Presence',
		guide: 'animate-activity',
		anchor: 'usage',
		filename: 'AnimateActivityExample.svelte',
		component: AnimateActivityExample,
		source: publicExampleSource(activitySource)
	},
	'animate-view': {
		id: 'animate-view',
		title: 'Open a field note with shared artwork and a title',
		description:
			'Choose a card: its artwork and title travel into a new detail view, then return to their places in the collection.',
		category: 'Routes',
		guide: 'animate-view',
		anchor: 'usage',
		filename: 'AnimateViewExample.svelte',
		component: AnimateViewExample,
		source: publicExampleSource(viewSource)
	}
} satisfies Record<string, LiveExample>;
