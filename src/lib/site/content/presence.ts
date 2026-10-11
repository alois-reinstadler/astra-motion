import type { DocPage } from '../doc-types.js';

export const presenceDocs: DocPage[] = [
	{
		slug: 'presence',
		title: 'Presence',
		group: 'Learn',
		summary:
			'Animate an entrance, retain an exit, and choose how changing content shares the stage.',
		learning: 'Native exits, keyed replacement and the difference between sync and wait.',
		sections: [
			{
				id: 'replacement',
				title: 'Choose how content changes',
				text: [
					'An exit needs time to finish before its element disappears. A motion element in a native if block supplies that retention for a simple show/hide interaction.',
					'For changing records, AnimatePresence adds coordination. Try sync to overlap the notes; choose wait to finish the outgoing note before showing the latest request.'
				],
				example: 'animate-presence-sequence',
				related: ['quick-start', 'animate-presence']
			},
			{
				id: 'identity',
				title: 'Give each record an identity',
				text: [
					'Pass one value and a key function for replacement, or items and a stable key function for a list. Render the retained snippet argument so outgoing text still belongs to the outgoing record.',
					'Re-requesting an outgoing key can reverse its exit. Avoid array indexes when items can move or disappear.'
				],
				related: ['animate-presence']
			},
			{
				id: 'choose',
				title: 'Choose the boundary for the task',
				text: [],
				points: [
					'Native if block: one independent entrance and exit.',
					'AnimatePresence: keyed records, sync/wait sequencing, popLayout and manual completion.',
					'AnimateActivity: inactive content keeps its DOM state and draft.',
					'AnimateView: a browser snapshot connects a whole view change.'
				],
				related: ['animate-presence', 'animate-activity', 'animate-view']
			},
			{
				id: 'troubleshooting',
				title: 'When an exit does not finish',
				text: [
					'Keep exit transitions finite and keep the owning boundary mounted. Removing the boundary itself removes the place that coordinates its children.',
					'usePresence().safeToRemove is stable: capturing it during component setup is safe. Call it when your application-owned exit work finishes. Cancel that work on re-entry or destruction.'
				],
				note: {
					title: 'Manual removal',
					text: [
						'The callback completes the current exit; it does not identify historical asynchronous work. Cancel application-owned timers or animations when their exit is interrupted. Astra releases its own registrations and animation work. Follow the manual-removal recipe in the AnimatePresence reference.'
					]
				},
				related: ['animate-presence', 'accessibility']
			},
			{
				id: 'where-next',
				title: 'Where next',
				text: ['Now connect the size and position changes around those entrances and exits.'],
				links: [
					{
						slug: 'layout',
						title: 'Layout & shared elements',
						detail: 'Animate the layout your CSS already describes.'
					},
					{
						slug: 'animate-presence',
						title: 'AnimatePresence reference',
						detail: 'Props, collection forms, nested exits and manual removal.'
					}
				]
			}
		]
	}
];
