import type { LiveExample } from '../examples.js';
import { publicExampleSource } from '../public-example-source.js';
import Feedback from './ParityGestureFeedback.svelte';
import FeedbackSource from './ParityGestureFeedback.svelte?raw';
import Drag from './ParityGestureDrag.svelte';
import DragSource from './ParityGestureDrag.svelte?raw';
import Hover from './ParityGestureHover.svelte';
import HoverSource from './ParityGestureHover.svelte?raw';
import Controls from './ParityGestureControls.svelte';
import ControlsSource from './ParityGestureControls.svelte?raw';
import Reorder from './ParityGestureReorder.svelte';
import ReorderSource from './ParityGestureReorder.svelte?raw';
import Layout from './ParityLayoutExpand.svelte';
import LayoutSource from './ParityLayoutExpand.svelte?raw';
import Group from './ParityLayoutGroup.svelte';
import GroupSource from './ParityLayoutGroup.svelte?raw';
import Namespaces from './ParityLayoutNamespaces.svelte';
import NamespacesSource from './ParityLayoutNamespaces.svelte?raw';
import Arc from './ParityLayoutArc.svelte';
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
		component: Feedback,
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
		component: Drag,
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
		component: Hover,
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
		component: Controls,
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
		component: Reorder,
		source: publicExampleSource(ReorderSource)
	},
	'layout-expand': {
		id: 'layout-expand',
		title: 'Animate real size changes',
		filename: 'ExpandableNote.svelte',
		description: 'Resize with CSS and keep the inner text from stretching.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'automatic',
		component: Layout,
		source: publicExampleSource(LayoutSource)
	},
	'layout-curved-path': {
		id: 'layout-curved-path',
		title: 'Curve a layout transition',
		filename: 'CurvedLayout.svelte',
		description: 'Follow an arc between layout positions and reverse it while it is moving.',
		category: 'Layout',
		guide: 'layout',
		anchor: 'curved-paths',
		component: Arc,
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
		component: Group,
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
		component: Namespaces,
		source: publicExampleSource(NamespacesSource)
	}
} satisfies Record<string, LiveExample>;
