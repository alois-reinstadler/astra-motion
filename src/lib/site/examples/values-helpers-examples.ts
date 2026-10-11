import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import motionValuesSource from './MotionValuesExample.svelte?raw';
import templateSource from './MotionTemplateExample.svelte?raw';
import eventSource from './MotionValueEventExample.svelte?raw';
import scrollSource from './ScrollValuesExample.svelte?raw';
import springSource from './SpringValueExample.svelte?raw';
import timeSource from './TimeValueExample.svelte?raw';
import transformSource from './TransformValueExample.svelte?raw';
import velocitySource from './VelocityValueExample.svelte?raw';
import animateSource from './AnimateScopeExample.svelte?raw';
import frameSource from './AnimationFrameExample.svelte?raw';
import inViewSource from './InViewStateExample.svelte?raw';
import pageSource from './PageVisibilityExample.svelte?raw';
import reducedSource from './ReducedMotionExample.svelte?raw';
import techniquesSource from './ScrollTechniquesExample.svelte?raw';

const entries: [string, string, string, LiveExample['component'], string, string][] = [
	[
		'motion-values',
		'Share one value between elements',
		'A slider updates two markers and a derived opacity without duplicating their state.',
		'./examples/MotionValuesExample.svelte',
		'MotionValuesExample.svelte',
		motionValuesSource
	],
	[
		'use-motion-template',
		'Compose a reactive CSS filter',
		'A numeric MotionValue becomes one part of a complete CSS filter string.',
		'./examples/MotionTemplateExample.svelte',
		'MotionTemplateExample.svelte',
		templateSource
	],
	[
		'use-motion-value-event',
		'Hide a reading header on scroll',
		'Compare current and previous scroll values to hide a reading header on the way down and restore it on the way up.',
		'./examples/MotionValueEventExample.svelte',
		'MotionValueEventExample.svelte',
		eventSource
	],
	[
		'use-scroll',
		'Read both scroll axes',
		'Inspect pixel positions and normalized progress inside a scrollable container.',
		'./examples/ScrollValuesExample.svelte',
		'ScrollValuesExample.svelte',
		scrollSource
	],
	[
		'use-spring',
		'Follow a target with a spring',
		'Change spring settings while preserving the value, or jump directly to the target.',
		'./examples/SpringValueExample.svelte',
		'SpringValueExample.svelte',
		springSource
	],
	[
		'use-time',
		'Compose an elapsed-time dial',
		'Derive a rotation and a readable second count from one elapsed-time MotionValue.',
		'./examples/TimeValueExample.svelte',
		'TimeValueExample.svelte',
		timeSource
	],
	[
		'use-transform',
		'Map one source to several outputs',
		'A shared input range produces independent scale and color MotionValues.',
		'./examples/TransformValueExample.svelte',
		'TransformValueExample.svelte',
		transformSource
	],
	[
		'use-velocity',
		'Respond to movement speed',
		'The marker grows with its spring velocity and returns to normal when movement stops.',
		'./examples/VelocityValueExample.svelte',
		'VelocityValueExample.svelte',
		velocitySource
	],
	[
		'use-animate',
		'Control a scoped sequence',
		'Replay, pause, resume, and finish a sequence targeting only descendants of its scope.',
		'./examples/AnimateScopeExample.svelte',
		'AnimateScopeExample.svelte',
		animateSource
	],
	[
		'use-animation-frame',
		'Enable and pause frame work',
		'Advance a value with frame delta while reporting the elapsed clock.',
		'./examples/AnimationFrameExample.svelte',
		'AnimationFrameExample.svelte',
		frameSource
	],
	[
		'use-in-view',
		'Observe a target in a container',
		'Require 75 percent visibility and compare repeated observation with once behavior.',
		'./examples/InViewStateExample.svelte',
		'InViewStateExample.svelte',
		inViewSource
	],
	[
		'use-page-in-view',
		'Stop counting when the tab is hidden',
		'Combine document visibility with a reactive frame-loop enabled option.',
		'./examples/PageVisibilityExample.svelte',
		'PageVisibilityExample.svelte',
		pageSource
	],
	[
		'use-reduced-motion',
		'Change the animation technique',
		'Honor the device preference by replacing movement with a fade.',
		'./examples/ReducedMotionExample.svelte',
		'ReducedMotionExample.svelte',
		reducedSource
	],
	[
		'scroll',
		'Compare triggered and linked motion',
		'A progress bar tracks every scroll position while a note responds to entering its viewport.',
		'./examples/ScrollTechniquesExample.svelte',
		'ScrollTechniquesExample.svelte',
		techniquesSource
	]
];

export const valuesHelpersExamples: Record<string, LiveExample> = Object.fromEntries(
	entries.map(([id, title, description, component, filename, source]) => [
		id,
		{
			id,
			title,
			description,
			component,
			filename,
			source: publicExampleSource(source),
			category:
				id === 'use-animate' || id.includes('scroll') || id.includes('view')
					? 'Scroll & timelines'
					: id === 'motion-values' ||
						  [
								'use-motion-template',
								'use-motion-value-event',
								'use-spring',
								'use-time',
								'use-transform',
								'use-velocity'
						  ].includes(id)
						? 'Motion values'
						: 'State & gestures',
			guide: id,
			anchor: 'usage'
		}
	])
);
