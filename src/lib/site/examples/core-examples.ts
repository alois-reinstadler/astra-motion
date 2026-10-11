import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import MotionExampleSource from './MotionExample.svelte?raw';
import SVGExampleSource from './SVGExample.svelte?raw';
import TransitionExampleSource from './TransitionExample.svelte?raw';
import MotionConfigExampleSource from './MotionConfigExample.svelte?raw';
import LazyMotionExampleSource from './LazyMotionExample.svelte?raw';
import TextAnimationExampleSource from './TextAnimationExample.svelte?raw';

export const coreExamples = {
	'motion-component': {
		id: 'motion-component',
		title: 'Change a reactive destination',
		description: 'Move, rotate and reshape the same element as Svelte state changes.',
		filename: 'MotionExample.svelte',
		component: './examples/MotionExample.svelte',
		source: publicExampleSource(MotionExampleSource),
		guide: 'animations',
		anchor: 'first-animation',
		category: 'State & gestures'
	},
	'svg-drawing': {
		id: 'svg-drawing',
		title: 'Draw a vector path',
		description: 'Animate a line, change circle geometry and zoom an SVG viewBox.',
		filename: 'SVGExample.svelte',
		component: './examples/SVGExample.svelte',
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
		component: './examples/TransitionExample.svelte',
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
		component: './examples/MotionConfigExample.svelte',
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
		component: './examples/LazyMotionExample.svelte',
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
		component: './examples/TextAnimationExample.svelte',
		source: publicExampleSource(TextAnimationExampleSource),
		guide: 'text-animation',
		anchor: 'words',
		category: 'Text'
	}
} satisfies Record<string, LiveExample>;
