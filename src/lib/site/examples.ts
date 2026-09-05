import type { Component } from 'svelte';
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
	component: Component;
	source: string;
}

/** Display the exact component being previewed, using the public package import. */
const publicSource = (source: string) =>
	source.replaceAll("'$lib/motion/index.js'", "'astra-motion'");

export const liveExamples = {
	state: {
		id: 'state',
		title: 'A little good news',
		filename: 'StateExample.svelte',
		component: StateExample,
		source: publicSource(StateExampleSource)
	},
	layout: {
		id: 'layout',
		title: 'Room for the details',
		filename: 'LayoutExample.svelte',
		component: LayoutExample,
		source: publicSource(LayoutExampleSource)
	},
	shared: {
		id: 'shared',
		title: 'A selection that follows',
		filename: 'SharedExample.svelte',
		component: SharedExample,
		source: publicSource(SharedExampleSource)
	},
	'motion-component': {
		id: 'motion-component',
		title: 'Make room for what matters',
		filename: 'ListExample.svelte',
		component: ListExample,
		source: publicSource(ListExampleSource)
	},
	wait: {
		id: 'wait',
		title: 'One thought at a time',
		filename: 'PresenceExample.svelte',
		component: PresenceExample,
		source: publicSource(PresenceExampleSource)
	},
	inheritance: {
		id: 'inheritance',
		title: 'Everything in its own time',
		filename: 'VariantsExample.svelte',
		component: VariantsExample,
		source: publicSource(VariantsExampleSource)
	},
	timeline: {
		id: 'timeline',
		title: 'A small sequence',
		filename: 'TimelineExample.svelte',
		component: TimelineExample,
		source: publicSource(TimelineExampleSource)
	},
	scroll: {
		id: 'scroll',
		title: 'Follow the story',
		filename: 'ScrollExample.svelte',
		component: ScrollExample,
		source: publicSource(ScrollExampleSource)
	},
	'in-view': {
		id: 'in-view',
		title: 'A moment of discovery',
		filename: 'InViewExample.svelte',
		component: InViewExample,
		source: publicSource(InViewExampleSource)
	},
	gestures: {
		id: 'gestures',
		title: 'Made to be touched',
		filename: 'GestureExample.svelte',
		component: GestureExample,
		source: publicSource(GestureExampleSource)
	}
} satisfies Record<string, LiveExample>;

export type LiveExampleId = keyof typeof liveExamples;
export const getExample = (id: string): LiveExample | undefined =>
	Object.values(liveExamples).find(
		(example) => example.id === (id === 'pop' ? 'motion-component' : id)
	);
