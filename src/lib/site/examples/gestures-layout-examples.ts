import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import FeedbackSource from './ParityGestureFeedback.svelte?raw';
import DragSource from './ParityGestureDrag.svelte?raw';
import HoverSource from './ParityGestureHover.svelte?raw';
import ControlsSource from './ParityGestureControls.svelte?raw';
import ReorderSource from './ParityGestureReorder.svelte?raw';
import LayoutSource from './SessionCards.svelte?raw';
import LayoutNoteSource from './ParityLayoutExpand.svelte?raw';
import GroupSource from './ParityLayoutGroup.svelte?raw';
import NamespacesSource from './ParityLayoutNamespaces.svelte?raw';
import ArcSource from './ParityLayoutArc.svelte?raw';

export const gesturesLayoutExamples = {
	'gesture-feedback': {
		id: 'gesture-feedback',
		title: 'Respond to hover, press, and focus',
		filename: 'Feedback.svelte',
		description: 'Keep a native button while adding gesture feedback and callbacks.',
		category: 'Gestures',
		guide: 'gestures',
		anchor: 'feedback',
		component: './examples/ParityGestureFeedback.svelte',
		source: publicExampleSource(FeedbackSource)
	},
	'drag-playground': {
		id: 'drag-playground',
		title: 'Feel constraints and elasticity',
		filename: 'BoundedDrag.svelte',
		description: 'Drag within an element, then adjust elasticity and release momentum.',
		category: 'Gestures',
		guide: 'drag',
		anchor: 'constraints',
		component: './examples/ParityGestureDrag.svelte',
		source: publicExampleSource(DragSource)
	},
	'hover-feedback': {
		id: 'hover-feedback',
		title: 'Share a hover variant with children',
		filename: 'HoverCard.svelte',
		description: 'Give pointer hover and keyboard focus the same visual treatment.',
		category: 'Gestures',
		guide: 'hover',
		anchor: 'variants',
		component: './examples/ParityGestureHover.svelte',
		source: publicExampleSource(HoverSource)
	},
	'drag-controls-handle': {
		id: 'drag-controls-handle',
		title: 'Start a drag from another element',
		filename: 'DragHandle.svelte',
		description:
			'An external button controls the thumb; a native range input supplies keyboard access.',
		category: 'Gestures',
		guide: 'use-drag-controls',
		anchor: 'handle',
		component: './examples/ParityGestureControls.svelte',
		source: publicExampleSource(ControlsSource)
	},
	'reorder-list-grid': {
		id: 'reorder-list-grid',
		title: 'Reorder a list or wrapped grid',
		filename: 'ReorderPlan.svelte',
		description: 'Use drag handles, automatic scrolling, and keyboard-friendly move buttons.',
		category: 'Layout',
		guide: 'reorder',
		anchor: 'list',
		component: './examples/ParityGestureReorder.svelte',
		source: publicExampleSource(ReorderSource)
	},
	'layout-expand': {
		id: 'layout-expand',
		title: 'Compare text during a resize',
		filename: 'SessionCards.svelte',
		description: 'Expand two session cards together and compare layout with layout="position".',
		category: 'Layout',
		guide: 'layout',
		anchor: 'automatic',
		component: './examples/SessionCards.svelte',
		source: publicExampleSource(LayoutSource)
	},
	'layout-note': {
		id: 'layout-note',
		title: 'Keep a note readable through collapse',
		filename: 'ExpandableNote.svelte',
		description:
			'Hold the painted card and text geometry while an interrupted exit fades, then collapse.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'readable-collapse',
		component: './examples/ParityLayoutExpand.svelte',
		source: publicExampleSource(LayoutNoteSource)
	},
	'layout-curved-path': {
		id: 'layout-curved-path',
		title: 'Curve a layout transition',
		filename: 'CurvedLayout.svelte',
		description: 'Follow an arc between layout positions and reverse it while it is moving.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'curved-paths',
		component: './examples/ParityLayoutArc.svelte',
		source: publicExampleSource(ArcSource)
	},
	'layout-group-coordination': {
		id: 'layout-group-coordination',
		title: 'Coordinate independently opened panels',
		filename: 'GroupedPanels.svelte',
		description:
			'Native details elements own their state while layout keeps their movement connected.',
		category: 'Layout',
		guide: 'layout-group',
		anchor: 'coordination',
		component: './examples/ParityLayoutGroup.svelte',
		source: publicExampleSource(GroupSource)
	},
	'layout-group-namespaces': {
		id: 'layout-group-namespaces',
		title: 'Keep repeated shared IDs independent',
		filename: 'NamespacedSelections.svelte',
		description: 'Two controls reuse one shared-layout name under distinct group namespaces.',
		category: 'Layout',
		guide: 'layout-group',
		anchor: 'namespaces',
		component: './examples/ParityLayoutNamespaces.svelte',
		source: publicExampleSource(NamespacesSource)
	}
} satisfies Record<string, LiveExample>;
