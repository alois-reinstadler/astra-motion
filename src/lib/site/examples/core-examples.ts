import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import MotionExample from './MotionExample.svelte';
import MotionExampleSource from './MotionExample.svelte?raw';
import SVGExample from './SVGExample.svelte';
import SVGExampleSource from './SVGExample.svelte?raw';
import TransitionExample from './TransitionExample.svelte';
import TransitionExampleSource from './TransitionExample.svelte?raw';
import MotionConfigExample from './MotionConfigExample.svelte';
import MotionConfigExampleSource from './MotionConfigExample.svelte?raw';
import LazyMotionExample from './LazyMotionExample.svelte';
import LazyMotionExampleSource from './LazyMotionExample.svelte?raw';
import TextAnimationExample from './TextAnimationExample.svelte';
import TextAnimationExampleSource from './TextAnimationExample.svelte?raw';

export const coreExamples = {
	'motion-component': {
		id: 'motion-component',
		title: 'Change a reactive destination',
		description: 'Move, rotate and reshape the same element as Svelte state changes.',
		filename: 'MotionExample.svelte',
		component: MotionExample,
		source: publicExampleSource(MotionExampleSource),
		guide: 'motion',
		anchor: 'usage',
		category: 'State & gestures'
	},
	'svg-drawing': {
		id: 'svg-drawing',
		title: 'Draw a vector path',
		description: 'Animate a line, change circle geometry and zoom an SVG viewBox.',
		filename: 'SVGExample.svelte',
		component: SVGExample,
		source: publicExampleSource(SVGExampleSource),
		guide: 'svg',
		anchor: 'usage',
		category: 'SVG'
	},
	'transition-picker': {
		id: 'transition-picker',
		title: 'Compare motion timing',
		description: 'Choose a physics spring, linear tween or eased tween for the same destination.',
		filename: 'TransitionExample.svelte',
		component: TransitionExample,
		source: publicExampleSource(TransitionExampleSource),
		guide: 'transitions',
		anchor: 'usage',
		category: 'State & gestures'
	},
	'motion-config': {
		id: 'motion-config',
		title: 'Set a shared animation policy',
		description:
			'Adjust inherited duration and reduced motion while interacting with a descendant.',
		filename: 'MotionConfigExample.svelte',
		component: MotionConfigExample,
		source: publicExampleSource(MotionConfigExampleSource),
		guide: 'motion-config',
		anchor: 'usage',
		category: 'State & gestures'
	},
	'lazy-motion': {
		id: 'lazy-motion',
		title: 'Load animation around native content',
		description: 'Keep an editable draft and the same elements while features load.',
		filename: 'LazyMotionExample.svelte',
		component: LazyMotionExample,
		source: publicExampleSource(LazyMotionExampleSource),
		guide: 'lazy-motion',
		anchor: 'usage',
		category: 'Loading'
	},
	'text-animation': {
		id: 'text-animation',
		title: 'Reveal a sentence word by word',
		description: 'Keep one complete semantic message while its decorative words enter.',
		filename: 'TextAnimationExample.svelte',
		component: TextAnimationExample,
		source: publicExampleSource(TextAnimationExampleSource),
		guide: 'text-animation',
		anchor: 'words',
		category: 'Text'
	}
} satisfies Record<string, LiveExample>;
