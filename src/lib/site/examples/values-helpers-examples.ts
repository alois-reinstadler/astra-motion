import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import MotionValuesExample from './MotionValuesExample.svelte';
import motionValuesSource from './MotionValuesExample.svelte?raw';
import MotionTemplateExample from './MotionTemplateExample.svelte';
import templateSource from './MotionTemplateExample.svelte?raw';
import MotionValueEventExample from './MotionValueEventExample.svelte';
import eventSource from './MotionValueEventExample.svelte?raw';
import ScrollValuesExample from './ScrollValuesExample.svelte';
import scrollSource from './ScrollValuesExample.svelte?raw';
import SpringValueExample from './SpringValueExample.svelte';
import springSource from './SpringValueExample.svelte?raw';
import TimeValueExample from './TimeValueExample.svelte';
import timeSource from './TimeValueExample.svelte?raw';
import TransformValueExample from './TransformValueExample.svelte';
import transformSource from './TransformValueExample.svelte?raw';
import VelocityValueExample from './VelocityValueExample.svelte';
import velocitySource from './VelocityValueExample.svelte?raw';
import AnimateScopeExample from './AnimateScopeExample.svelte';
import animateSource from './AnimateScopeExample.svelte?raw';
import AnimationFrameExample from './AnimationFrameExample.svelte';
import frameSource from './AnimationFrameExample.svelte?raw';
import InViewStateExample from './InViewStateExample.svelte';
import inViewSource from './InViewStateExample.svelte?raw';
import PageVisibilityExample from './PageVisibilityExample.svelte';
import pageSource from './PageVisibilityExample.svelte?raw';
import ReducedMotionExample from './ReducedMotionExample.svelte';
import reducedSource from './ReducedMotionExample.svelte?raw';
import ScrollTechniquesExample from './ScrollTechniquesExample.svelte';
import techniquesSource from './ScrollTechniquesExample.svelte?raw';

const entries: [string, string, string, LiveExample['component'], string, string][] = [
	[
		'motion-values',
		'Share one value between elements',
		'A slider updates two markers and a derived opacity without duplicating their state.',
		MotionValuesExample,
		'MotionValuesExample.svelte',
		motionValuesSource
	],
	[
		'use-motion-template',
		'Compose a reactive CSS filter',
		'A numeric MotionValue becomes one part of a complete CSS filter string.',
		MotionTemplateExample,
		'MotionTemplateExample.svelte',
		templateSource
	],
	[
		'use-motion-value-event',
		'Observe animation events',
		'Start and stop an animated value while its managed listeners report changes and lifecycle events.',
		MotionValueEventExample,
		'MotionValueEventExample.svelte',
		eventSource
	],
	[
		'use-scroll',
		'Read both scroll axes',
		'Inspect pixel positions and normalized progress inside a scrollable container.',
		ScrollValuesExample,
		'ScrollValuesExample.svelte',
		scrollSource
	],
	[
		'use-spring',
		'Follow a target with a spring',
		'Change spring settings while preserving the value, or jump directly to the target.',
		SpringValueExample,
		'SpringValueExample.svelte',
		springSource
	],
	[
		'use-time',
		'Compose an elapsed-time dial',
		'Derive a rotation and a readable second count from one elapsed-time MotionValue.',
		TimeValueExample,
		'TimeValueExample.svelte',
		timeSource
	],
	[
		'use-transform',
		'Map one source to several outputs',
		'A shared input range produces independent scale and color MotionValues.',
		TransformValueExample,
		'TransformValueExample.svelte',
		transformSource
	],
	[
		'use-velocity',
		'Respond to movement speed',
		'The marker grows with its spring velocity and returns to normal when movement stops.',
		VelocityValueExample,
		'VelocityValueExample.svelte',
		velocitySource
	],
	[
		'use-animate',
		'Control a scoped sequence',
		'Replay, pause, resume, and finish a sequence targeting only descendants of its scope.',
		AnimateScopeExample,
		'AnimateScopeExample.svelte',
		animateSource
	],
	[
		'use-animation-frame',
		'Enable and pause frame work',
		'Advance a value with frame delta while reporting the elapsed clock.',
		AnimationFrameExample,
		'AnimationFrameExample.svelte',
		frameSource
	],
	[
		'use-in-view',
		'Observe a target in a container',
		'Require 75 percent visibility and compare repeated observation with once behavior.',
		InViewStateExample,
		'InViewStateExample.svelte',
		inViewSource
	],
	[
		'use-page-in-view',
		'Stop counting when the tab is hidden',
		'Combine document visibility with a reactive frame-loop enabled option.',
		PageVisibilityExample,
		'PageVisibilityExample.svelte',
		pageSource
	],
	[
		'use-reduced-motion',
		'Change the animation technique',
		'Honor the device preference by replacing movement with a fade.',
		ReducedMotionExample,
		'ReducedMotionExample.svelte',
		reducedSource
	],
	[
		'scroll',
		'Compare triggered and linked motion',
		'A progress bar tracks every scroll position while a note responds to entering its viewport.',
		ScrollTechniquesExample,
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
