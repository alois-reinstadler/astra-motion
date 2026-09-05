import { authoringExamples } from '$lib/motion-lab/authoring-examples.js';
import type { LiveExampleId } from './examples.js';

export type RecipeId = (typeof authoringExamples)[number]['id'];
export interface DocSection {
	id: string;
	title: string;
	text: string[];
	points?: string[];
	recipe?: RecipeId;
	example?: LiveExampleId;
	related?: string[];
	code?: { label: string; source: string };
}
export interface DocPage {
	slug: string;
	title: string;
	group: 'Start here' | 'Make things move' | 'Build with confidence';
	summary: string;
	sections: DocSection[];
}

const pages: DocPage[] = [
	{
		slug: '',
		title: 'Introduction',
		group: 'Start here',
		summary:
			'Motion that belongs in Svelte. Native elements, ordinary state, and the right engine for each kind of movement.',
		sections: [
			{
				id: 'a-small-set-of-tools',
				title: 'A small set of tools. A connected system.',
				text: [
					'Astra gives Svelte 5 a motion layer for state, presence, layout and shared elements. Svelte owns mounting and destruction. Motion owns springs, interpolation and projection. Browser View Transitions handle page changes.',
					'Start with a Motion element, or add a binding to your existing markup. Try the examples here, then open View code to take the complete component with you.'
				],
				recipe: 'state'
			},
			{
				id: 'choose-your-entry',
				title: 'Choose the smallest entry point',
				text: [
					'Most interfaces begin with state/lite. Bring in layout, scroll or timelines when the interaction calls for them.'
				],
				points: [
					'state/lite — initial, animate, exit, variants and coordinated children.',
					'state — the same binding with layout and interaction support.',
					'layout — automatic projection and shared local IDs, through attachments.',
					'presence — a small fade, wait presence and removal from layout flow.',
					'scroll and animate — independent scroll and scoped timeline adapters.',
					'routes — SvelteKit navigation and shared route elements.'
				]
			},
			{
				id: 'current-status',
				title: 'An explicit beta',
				text: [
					'This repository is an active implementation, with real-browser and SSR regression coverage. The documentation describes the checked-in API, not a claim of complete Motion React parity or an already-published registry release.',
					'Projection uses framework-independent exports from pinned Motion 13.2.0. Those exports are undocumented upstream, so dependency upgrades need qualification. Start with Getting started, then use the examples directory to explore a specific interaction.'
				]
			}
		]
	},
	{
		slug: 'getting-started',
		title: 'Getting started',
		group: 'Start here',
		summary: 'Start with Motion elements, or use bindings directly on existing native elements.',
		sections: [
			{
				id: 'use-the-workspace',
				title: 'Use the checked-in workspace',
				text: [
					'Astra is currently developed in this repository. Do not assume that an npm package with this name is this implementation. The examples use the intended package entry points; inside this app, use the source paths below.',
					'Run pnpm install in a checkout, then pnpm dev for the local site and examples. The qualified baseline is Svelte 5.57.0, SvelteKit 2.70.3 and Motion 13.2.0. SvelteKit is only needed for the routes entry point.'
				],
				code: {
					label: 'Source imports in this repository',
					source:
						"import { createMotion } from '$lib/motion/lite.svelte.js';\nimport { createLayout } from '$lib/motion/layout.js';\nimport { createScroll } from '$lib/motion/scroll.svelte.js';\nimport { createAnimate } from '$lib/motion/animate.js';"
				}
			},
			{
				id: 'lite-or-full',
				title: 'Start light. Add features when needed.',
				text: [
					'Use astra-motion/state/lite for initial, animate, exit, variants, coordinated children and MotionValues. It leaves projection and gestures out of that entry’s dependency graph.',
					'Use astra-motion/state when the same binding also needs layout or interaction targets. In this workspace its source path is $lib/motion/motion.svelte.js. Both entries use the same props spread, transition and child authoring contract.'
				]
			},
			{
				id: 'motion-component',
				title: 'Start with a Motion element',
				text: [
					'Motion renders the native HTML element selected by as, creates its binding, and installs its exit transition. Use it directly inside keyed lists without a separate item component.',
					'Put animation options in motion. Native attributes, event handlers, children and CSS style are forwarded to the element, with Motion’s initial styles preserved. Motion is exported from astra-motion; its workspace import is $lib/motion/index.js.',
					'Keep as stable while mounted. Wrap Motion in {#key tag} when changing the native tag. Use bind:ref for the element, or a direct native binding when you need Svelte directives such as bind:value.'
				],
				recipe: 'motion-component'
			},
			{
				id: 'first-component',
				title: 'Give an element an entrance and an exit',
				text: [
					'Motion combines initial, animate, and exit targets on a native element. Toggle this notification to see it appear and leave. Toggle again during the animation to reverse it.',
					'The component includes the native Svelte transition that keeps its element alive until the exit finishes. Use createMotion bindings directly when integrating with existing markup.'
				],
				recipe: 'state'
			},
			{
				id: 'the-contract',
				title: 'Three things to remember',
				text: [],
				points: [
					'One binding owns one simultaneously mounted element. Use Motion in keyed lists, or create a binding inside your own item component.',
					'Pass a function to createMotion when its options depend on reactive state.',
					'Motion transition durations use seconds. The small presence() transition uses milliseconds.'
				]
			}
		]
	},
	{
		slug: 'state',
		title: 'Animation state',
		group: 'Make things move',
		summary: 'Describe where an element starts, where it belongs, and how it leaves.',
		sections: [
			{
				id: 'targets',
				title: 'Initial, animate and exit',
				text: [
					'initial supplies the first rendered state, animate supplies the current destination, and exit supplies the target for a native outro. Targets can include opacity, transforms and supported styles. initial: false starts at the animate target and skips the first intro.',
					'For changing targets, use createMotion(() => ({ animate: ... })). Updates replace the current destination. The binding uses Motion values and animation machinery rather than queuing stale animations.'
				],
				recipe: 'state'
			},
			{
				id: 'inheritance',
				title: 'Coordinate a family of elements',
				text: [
					'Name targets with variants. parent.child() declares ancestry before the DOM exists, so a child can inherit variant labels and initial state during SSR.',
					'The child must mount inside its declared parent. Add a global native transition when it should animate on removal of an enclosing branch.'
				],
				recipe: 'inheritance'
			},
			{
				id: 'gestures',
				title: 'Respond to a touch',
				text: [
					'Give a button a little feedback on hover, press, and keyboard focus. Add drag to move an element within a set of bounds. Gesture targets use the same springs and values as ordinary animation state.'
				],
				example: 'gestures'
			},
			{
				id: 'ownership',
				title: 'Give each element one animation owner',
				text: [
					'Put application rotation and scale in the binding’s style or targets. Avoid a second CSS transform, layout attachment, scroll animation or timeline trying to write the same node.',
					'Use binding.animate(target) for imperative state animation on a bound node. Use createAnimate for ordinary elements in an independent scope.'
				]
			}
		]
	},
	{
		slug: 'presence',
		title: 'Presence & exits',
		group: 'Make things move',
		summary: 'Keep the real DOM alive for its final frame. Let Svelte decide when it can leave.',
		sections: [
			{
				id: 'simultaneous',
				title: 'Simultaneous is ordinary Svelte',
				text: [
					'A plain if or keyed each block with native transitions lets incoming and outgoing branches animate together. No presence wrapper is needed for this mode.',
					'Svelte retains outgoing elements until their transition group finishes. Reversing the state before completion can reuse the retained branch and reverse its transition.'
				],
				recipe: 'state'
			},
			{
				id: 'wait',
				title: 'Wait for the outgoing branch',
				text: [
					'Presence defaults to wait: it waits for the whole native outro group, then renders the latest requested value. Rapid changes do not form a queue.',
					'Use mode="sync" to mount replacements immediately while older branches exit. onExitComplete runs after all outgoing branches finish. Reversed exits and disposal of Presence itself do not notify.'
				],
				recipe: 'wait'
			},
			{
				id: 'pop-layout',
				title: 'Free the space before the exit ends',
				text: [
					'popLayout captures the old visual position and removes the outgoing node from flow. Its siblings can immediately reflow and project toward their new positions.',
					'Give the direct parent position: relative. The exiting item also needs a native outro; the attachment alone does not retain DOM.'
				],
				recipe: 'pop'
			},
			{
				id: 'nested-exits',
				title: 'Nested exits have a finite schedule',
				text: [
					'Child variants support ordering and stagger through native transition durations. This works with finite targets. Arbitrary asynchronous promises and infinite exit repeats cannot define the end of a Svelte outro.',
					'Use transition:...|global for a child that should animate when an enclosing block is destroyed. A local transition only responds to the block that directly owns it.'
				],
				recipe: 'inheritance'
			}
		]
	},
	{
		slug: 'layout',
		title: 'Automatic layout',
		group: 'Make things move',
		summary: 'Change CSS or state. Let Motion project the old rectangle into the new one.',
		sections: [
			{
				id: 'automatic',
				title: 'Register elements, then write normal UI code',
				text: [
					'createLayout returns a controller and attachment factory. Its participants share measurement and projection scheduling. Layout changes can happen through flex, grid, resizing, content or sibling changes; they do not need to live inside a keyed each block.'
				],
				recipe: 'layout'
			},
			{
				id: 'explicit-updates',
				title: 'Why is layout.update optional?',
				text: [
					'Automatic observation compares current geometry against the last committed geometry. For normal Svelte state and CSS changes, that is enough to start projection without wrapping event handlers.',
					'layout.update(() => change()) captures fresh geometry immediately before a synchronous mutation. Use it when you need to control that boundary precisely. It does not make an async callback into one atomic layout change.',
					'automatic: false stops that controller from requesting automatic observation. The coordinator is shared: another automatic group still coordinates registered participants. It is not a group isolation switch.'
				]
			},
			{
				id: 'modes',
				title: 'Choose how the rectangle moves',
				text: [],
				points: [
					'both — position and size projection, the default.',
					'position — translate while compensating for projected ancestor scale; useful for an existing text content host.',
					'size — project size changes.',
					'preserve-aspect — preserve proportions during a change between differing aspect ratios.'
				]
			},
			{
				id: 'scroll',
				title: 'Measure the right coordinate space',
				text: [
					'Register a scroll container with layout({ scroll: true }) when it is part of the projection tree. Use root for an appropriate fixed layout root. These options inform Motion’s geometry measurements; they do not add scroll-linked animation.',
					'Arbitrary transformed ancestors, complex sticky layouts and 3D scenes are outside the current qualification. Test the actual clipping and scrolling context in the browser.'
				]
			}
		]
	},
	{
		slug: 'shared-layout',
		title: 'Shared elements & groups',
		group: 'Make things move',
		summary: 'Two nodes can be one visual idea. Give that idea a local identity.',
		sections: [
			{
				id: 'identity',
				title: 'An ID connects source and destination',
				text: [
					'A layout attachment’s id lets different elements represent the same visual entity. Motion handles their shared projection stack and handoff. Tabs, expanded cards and changing selections can use the same pattern.'
				],
				recipe: 'shared'
			},
			{
				id: 'groups',
				title: 'A controller is a group',
				text: [
					'Unnamed controllers are isolated. Pass one controller between components to share its scope, or give controllers the same explicit group id when they should coordinate shared identities.',
					'Reuse an element ID only for an intentional handoff. Two unrelated tab strips should have separate controllers or group IDs, even if both name an underline identically.'
				]
			},
			{
				id: 'across-pages',
				title: 'Page changes use a different backend',
				text: [
					'Local projection keeps live elements interactive. A route replaces unrelated DOM trees, so routeShared uses native browser snapshots instead. Use matching route identities on each page and install the SvelteKit coordinator once.',
					'Local layout IDs do not automatically opt an element into route transitions. Keeping these contracts explicit avoids unexpected route snapshots.'
				]
			}
		]
	},
	{
		slug: 'components',
		title: 'Your components',
		group: 'Build with confidence',
		summary: 'A component can accept motion without becoming a motion component factory.',
		sections: [
			{
				id: 'forward-a-binding',
				title: 'Accept a binding. Keep your real element.',
				text: [
					'A reusable component can accept motion={binding}, spread its props onto the real element and connect its transition. A type-only import keeps the engine out of consumers that do not use motion.',
					'Create the binding in the parent. The binding owns styles and lifecycle; the component owns its semantics and normal markup.'
				],
				recipe: 'component'
			},
			{
				id: 'headless-components',
				title: 'Headless primitives need lifecycle integration',
				text: [
					'The project’s Card, Dialog and Accordion examples use this contract. Dialog and Accordion coordinate Bits UI forceMount and its open state with a native Svelte branch. Simply spreading a motion prop onto an arbitrary third-party component is not sufficient.',
					'On close, interaction and focus must follow the logical component state even while the outgoing DOM remains visible. Test Escape, focus restoration, fast reversal and removal of the containing branch.'
				]
			},
			{
				id: 'ssr',
				title: 'Render a useful first frame',
				text: [
					'motion.props carries initial styles into SSR. Use parent.child() for inherited initial variants. Attachments alone do not invent server-rendered styles.',
					'Create bindings during component initialization. Do not share one binding between concurrently mounted elements or between server requests.'
				]
			}
		]
	},
	{
		slug: 'routes',
		title: 'SvelteKit routes',
		group: 'Make things move',
		summary:
			'Keep navigation native to Kit. Enhance the space between pages with browser snapshots.',
		sections: [
			{
				id: 'coordinator',
				title: 'Install once, in a persistent layout',
				text: [
					'routeTransitions integrates onNavigate with document.startViewTransition. SvelteKit still owns navigation, loading, history, focus and scroll restoration. Unsupported browsers navigate normally.'
				],
				recipe: 'routes'
			},
			{
				id: 'shared-route-elements',
				title: 'Name the same subject on both pages',
				text: [
					'Attach routeShared with the same ID and scope to the list and detail elements. The coordinator assigns temporary view-transition names around navigation, then removes them.',
					'Keep IDs unique within each rendered snapshot. Multiple different IDs can move together, such as an image and title. A repeated item elsewhere on the page needs a different identity or scope.'
				],
				recipe: 'route-shared'
			},
			{
				id: 'fallbacks',
				title: 'Transitions enhance navigation',
				text: [
					'Reduced-motion policy and unsupported View Transitions fall back to immediate navigation. Rapid navigation supersedes the earlier transition instead of waiting for old animation playback.',
					'Keep links and content useful without the enhancement. Test history, focus restoration, and streamed content in your own routes, especially when different layouts own the two pages.'
				]
			}
		]
	},
	{
		slug: 'scroll',
		title: 'Scroll-linked motion',
		group: 'Make things move',
		summary:
			'Map a real scroll position to progress and visual effects, using Motion’s vanilla APIs.',
		sections: [
			{
				id: 'container',
				title: 'Follow a container or the document',
				text: [
					'createScroll gives you a progress MotionValue and attachments for a container, target and linked animation. Omit the container attachment to follow the document. Use axis: x for horizontal scrolling.',
					'A controller owns one container and optional target, and can drive multiple visual attachments. Motion chooses a supported native or fallback path.'
				],
				recipe: 'scroll'
			},
			{
				id: 'target',
				title: 'Track a target through the viewport',
				text: [
					'Use offset: [start end, end start] with a target attachment to describe the travel range. In JavaScript these offsets are strings. Keep the measurement target separate from its animated content.',
					'Use CSS position: sticky for pinning. This API adds no scroll smoothing, virtual scrolling or separate animation clock.'
				]
			},
			{
				id: 'in-view',
				title: 'Read visibility as state',
				text: [
					'createInView follows a target getter and exposes a reactive current boolean. Use it to track viewport entry without an animation binding. Pass a root element for a scroll container, margin to adjust the boundary, and amount to choose the visible fraction.',
					'Options can be a reactive reader. initial sets the value before the first measurement, including SSR. once disconnects after entry and resets for a replacement target. Component destruction disconnects the observer.'
				],
				recipe: 'in-view'
			},
			{
				id: 'ownership-and-policy',
				title: 'Progress and decoration have different jobs',
				text: [
					'Semantic progress continues tracking under reduced motion, while linked decorative effects settle at their final target. Read progress through motionStore when Svelte markup needs the value.',
					'For scroll and layout on one element, feed a mapped MotionValue into an existing state binding. Do not attach a second visual owner. External MotionValues remain caller-controlled.'
				]
			},
			{
				id: 'limits',
				title: 'Plan for changing content',
				text: [
					'The pinned Motion version does not expose the newer trackContentSize option. Fallback measurement after a content-size change may require the next scroll or resize event. Target and custom-offset effects use a shared progress fallback.',
					'Scroll attachments start on mount. Provide a useful static CSS baseline for SSR. Cleanup stops linked animations when the owning component or attachment is removed.'
				]
			}
		]
	},
	{
		slug: 'timelines',
		title: 'Scoped timelines',
		group: 'Make things move',
		summary:
			'Sequence ordinary elements with labels, stagger and playback controls. Keep every selector in its own scene.',
		sections: [
			{
				id: 'sequence',
				title: 'Attach a scope, then play a sequence',
				text: [
					'createAnimate wraps Motion’s documented vanilla animate API. Its scope limits selectors to descendants of one root. A direct reference can also target the root itself.',
					'A new animation replaces an overlapping sequence as a whole. Disjoint elements can animate concurrently. This prevents stale later segments from taking control after a new interaction.'
				],
				recipe: 'timeline'
			},
			{
				id: 'controls',
				title: 'Playback stays in your hands',
				text: [
					'Both scene.animate and scene.sequence return Motion controls with play, pause, stop, cancel, complete, time and speed. scene.stop stops all active playback. The attachment cleans up when the scope disappears.',
					'Stopped or canceled controls cannot restart. Start a fresh animation. Completed controls revalidate membership and ownership before a seek or replay. Cancellation follows Motion promise semantics: a canceled finished promise need not resolve. Use a revision or abort guard for application async chains.'
				]
			},
			{
				id: 'boundaries',
				title: 'A DOM scope has deliberate boundaries',
				text: [
					'This adapter supports DOM and SVG targets. Use official Motion directly for arbitrary-object, callback or MotionValue sequences.',
					'Do not target a node already owned by state, layout or scroll. For a createMotion node, use its binding.animate method. Reduced-motion changes settle active finite or repeating timelines at their final target.'
				]
			}
		]
	},
	{
		slug: 'accessibility',
		title: 'Defaults & reduced motion',
		group: 'Build with confidence',
		summary: 'Set policy once. Make motion optional without making the interface incomplete.',
		sections: [
			{
				id: 'policy',
				title: 'Inherit defaults through the component tree',
				text: [
					'MotionConfig provides transition, layoutTransition, automatic and reducedMotion defaults to descendant components. Set reducedMotion to user, always or never. Local options override inherited values.',
					'Configuration belongs to the Svelte component tree and its SSR request. Bindings must be created in a descendant component to inherit a provider rendered above them.'
				],
				code: {
					label: '+layout.svelte',
					source: `<script lang="ts">\n  import type { Snippet } from 'svelte';\n  import { MotionConfig } from 'astra-motion';\n  let { children }: { children: Snippet } = $props();\n</script>\n\n<MotionConfig reducedMotion="user" transition={{ duration: 0.24 }}>\n  {@render children()}\n</MotionConfig>`
				}
			},
			{
				id: 'live-preferences',
				title: 'Respect changes while motion is running',
				text: [
					'The default user policy follows prefers-reduced-motion. State bindings, layout, scroll controllers and scoped animations observe live OS and inherited configuration changes. Scroll progress continues tracking, but decorative linked effects complete.',
					'The standalone presence() fade reads its explicit reducedMotion option or the OS preference when a transition starts. It does not read MotionConfig or subscribe to live changes. Use createMotion().transition when presence should inherit and react to application policy.',
					'The server cannot read a browser media query. Explicit always policy can produce a settled SSR target. Keep the initial state useful and let hydration apply the browser preference. Route transitions inherit the nearest ancestor MotionConfig and observe live configuration and OS changes; explicit route options override the inherited policy.'
				]
			},
			{
				id: 'accessibility',
				title: 'Preserve the interaction contract',
				text: [],
				points: [
					'Use semantic buttons, links and dialogs. Animation does not supply their keyboard behavior.',
					'Move and restore focus according to logical state, even when outgoing DOM is retained.',
					'Do not hide essential information behind animation completion.',
					'Test with reduced motion enabled, rapid input, keyboard navigation and browser history.'
				]
			}
		]
	},
	{
		slug: 'api',
		title: 'API reference',
		group: 'Build with confidence',
		summary:
			'The public surface in one place. Signatures, ownership and defaults, with guides alongside.',
		sections: [
			{
				id: 'create-motion',
				title: 'createMotion · state/lite or state',
				text: [
					'Call during component initialization. Supply an options object for fixed targets or a function for reactive options. Use the lite entry unless this binding needs projection or gestures. The signatures below are condensed; exported TypeScript types describe the complete Motion target and transition shapes.'
				],
				code: {
					label: 'State binding · TypeScript',
					source: `createMotion(options?: MotionOptions | (() => MotionOptions)): MotionBinding\n\nbinding.props                 // SSR style + Svelte attachment; spread on one element\nbinding.transition            // native Svelte transition function\nbinding.child(options?)       // child binding with explicit variant ancestry\nbinding.animate(target, transition?): Promise<void>\nbinding.stop(): void          // stops state playback at its current pose\nbinding.update(change)        // synchronous update; full entry captures layout\nbinding.reducedMotion         // readonly resolved policy`
				},
				points: [
					'initial: target | variant label(s) | false. false skips the first intro and renders the current animate target on a fresh mount.',
					'animate / exit: target or variant label(s). Exit requires a native transition on the element.',
					'variants / custom: named targets and data for dynamic variant resolution.',
					'style: Motion style values, including caller-owned MotionValues. Keep raw transform separate from decomposed x/y/rotate/scale across all targets.',
					'transition: Motion transition defaults in seconds. onAnimationStart, onAnimationComplete and onUpdate expose lifecycle callbacks.',
					'Full entry only: layout, layoutGroup, layoutTransition, automatic and interaction options. layout accepts true or LayoutOptions; layoutGroup accepts a controller.',
					'stop() does not stop layout projection. animate() requires a mounted, non-exiting node; canceled animation promises follow Motion semantics.'
				],
				related: ['state', 'presence', 'components']
			},
			{
				id: 'create-layout',
				title: 'createLayout · layout',
				text: [
					'The controller scopes shared identities. Unnamed controllers are isolated; matching explicit group IDs opt into the same shared scope. Attachments register native HTML elements.'
				],
				code: {
					label: 'Layout controller · TypeScript',
					source: `createLayout(options?: LayoutGroupOptions): LayoutController\n\nlayout(options?: LayoutOptions) // returns Attachment<HTMLElement>\nlayout.update(() => change())   // fresh snapshot, synchronous change\nlayout.stats()                 // { participants: number, active: number }\n\n// Group options\n{ id?, automatic?, transition?, reducedMotion? }\n\n// Participant options\n{ id?, mode?, scroll?, root?, style? }`
				},
				points: [
					'automatic defaults to true. Observation coordinates all registered groups while any group requests it.',
					'mode: both (default), position, size or preserve-aspect.',
					'scroll identifies a measured scroll ancestor; root identifies a fixed layout root.',
					'style exposes rotate, scale, scaleX, scaleY, x, y, borderRadius and boxShadow through Motion’s composition and correction pipeline.',
					'updateLayout(change) is also exported for a coordinated synchronous update without a particular controller.'
				],
				related: ['layout', 'shared-layout', 'troubleshooting']
			},
			{
				id: 'presence',
				title: 'Presence, presence & popLayout · presence',
				text: [
					'Presence supports wait sequencing (the default) and simultaneous replacement with mode="sync", without a DOM wrapper. Native transition groups determine when destruction is safe. Ordinary Svelte if/each blocks also support simultaneous entry and exit.'
				],
				code: {
					label: 'Presence tools',
					source: `<Presence value={current} mode="wait" onExitComplete={done}>\n  {#snippet children(value)}...{/snippet}\n</Presence>\n\ntransition:presence={{ duration: 240 }}\n{@attach popLayout()}`
				},
				points: [
					'Presence value is branch identity. Wait renders the latest requested value after the outgoing branch finishes; sync renders it immediately.',
					'onExitComplete runs after all outgoing branches have been destroyed. It does not run on initial render, reversed exits, or parent disposal.',
					'presence is the small opacity transition; its duration is milliseconds, unlike Motion transition options.',
					'presence accepts an explicit reducedMotion option and otherwise checks the OS preference at transition start. It does not inherit MotionConfig or settle itself when policy changes mid-transition; use a state binding’s transition for that behavior.',
					'popLayout requires a positioned direct parent and a native outro. Pair it with layout attachments on reflowing siblings.'
				],
				related: ['presence']
			},
			{
				id: 'create-scroll',
				title: 'createScroll · scroll',
				text: [
					'Call during component initialization. Options retain Motion’s scroll semantics and accept a reactive reader. Attachments take precedence over container and target elements supplied in options.'
				],
				code: {
					label: 'Scroll controller · TypeScript',
					source: `createScroll(options?: ScrollOptions | (() => ScrollOptions))\n\nreading.container            // Attachment<HTMLElement>\nreading.target               // Attachment<HTMLElement>\nreading.progress             // owned MotionValue<number>, selected axis\nreading.reducedMotion        // readonly resolved policy\nreading.animate(keyframes, options?) // Attachment<HTMLElement>\n\n// Common options\n{ axis: 'y', container?, target?, offset?, reducedMotion? }`
				},
				points: [
					'With no container, follow document scroll. axis supports x or y.',
					'animate accepts DOM keyframes and ScrollAnimationOptions; repeat, repeatType and repeatDelay are excluded.',
					'Destroying a container or target suspends tracking until remount; destroying the component disposes its progress and linked effects.'
				],
				related: ['scroll']
			},
			{
				id: 'create-in-view',
				title: 'createInView · in-view',
				text: [
					'Call during component initialization with a getter for an Element. The current getter is reactive; read it directly in templates or effects.'
				],
				code: {
					label: 'Viewport visibility · TypeScript',
					source: `createInView(\n  target: () => Element | null | undefined,\n  options?: InViewOptions | (() => InViewOptions)\n) // { readonly current: boolean }\n\n// Options\n{ initial?: boolean, once?: boolean, root?: Element | Document | null,\n  margin?: string, amount?: 'some' | 'all' | number }`
				},
				points: [
					'initial defaults to false. amount defaults to some; all means fully visible, and numeric amounts must be between 0 and 1.',
					'once latches after a measured entry for the current target. A replacement target starts a fresh observation.',
					'The in-view entry imports no animation or projection engine. Visibility tracking is independent of reduced-motion preferences.'
				],
				related: ['scroll']
			},
			{
				id: 'create-animate',
				title: 'createAnimate · animate',
				text: [
					'Attach a single scope before starting playback. Selectors resolve descendants; element references and iterables must belong to the scope. Targets outside it and selectors with no matches produce diagnostics.'
				],
				code: {
					label: 'Animation scope · TypeScript',
					source: `createAnimate(policy?: MotionPolicy | (() => MotionPolicy)): AnimateScope\n\nscene.attach                  // Attachment<Element>\nscene.animate(target, keyframes, options?) // Motion playback controls\nscene.sequence(segments, options?)         // Motion playback controls\nscene.stop(): void\nscene.current                 // readonly Element | undefined\nscene.active                  // readonly active playback count\n\n// A segment is a label, a timed label, or:\n[target, keyframes, { at?, duration?, delay?, ... }]\n\ncontrols.play(); controls.pause(); controls.stop();\ncontrols.cancel(); controls.complete();\ncontrols.time = 0.2; controls.speed = 0.5;`
				},
				points: [
					'target is a selector string, Element or Iterable<Element>. The scope currently supports DOM and SVG sequences.',
					'New playback targeting an owned element replaces that element’s previous sequence as a whole.',
					'Stopped or canceled controls cannot restart. Completed controls validate scope and ownership before replay or seeking.',
					'MotionConfig transition supplies defaults. The policy argument overrides inherited reducedMotion; reactive policy readers are read when playback starts.'
				],
				related: ['timelines']
			},
			{
				id: 'routes-and-policy',
				title: 'Routes, policy & values',
				text: [
					'Install one route coordinator in a persistent SvelteKit layout. Shared names are temporary and scoped. Policy defaults belong to the ancestor Svelte component tree.'
				],
				code: {
					label: 'Routes and values · TypeScript',
					source: `// astra-motion/routes\nrouteTransitions(options?: { reducedMotion?, onDiagnostic? }): void\nrouteShared(id: string, options?: { scope?: string }): Attachment<HTMLElement>\n\n// astra-motion/policy\nshouldReduceMotion(policy?: { reducedMotion?: 'user' | 'always' | 'never' }): boolean\n\n// astra-motion/values\nmotionValue; springValue; transformValue; mapValue; stagger;\nmotionStore(value) // Svelte writable bridge; caller keeps value ownership`
				},
				points: [
					'MotionConfig is exported from astra-motion. Its props are transition, layoutTransition, automatic and reducedMotion, plus its children snippet.',
					'routeTransitions inherits policy and responds to live config/OS changes; explicit options win.',
					'MotionValue helpers are upstream re-exports. motionStore adapts subscriptions and writes without destroying the supplied value.'
				],
				related: ['routes', 'accessibility']
			}
		]
	},
	{
		slug: 'troubleshooting',
		title: 'Troubleshooting & boundaries',
		group: 'Build with confidence',
		summary:
			'Understand what owns a transform, why an exit is missing, and which edges still need care.',
		sections: [
			{
				id: 'distortion',
				title: 'Text or images stretch during a resize',
				text: [
					'Layout projection scales a rectangle. Its children scale too unless their projection compensates. Give an existing block or flex content host position projection inside the resizing surface. Plain inline text is not a transformable host.',
					'For images, use a stable aspect ratio and intentional object-fit. preserve-aspect avoids stretching across differently shaped shared targets. Intrinsic-height accordions often read better with a native reveal transition than a scale-projected text box.'
				],
				recipe: 'layout'
			},
			{
				id: 'missing-exit',
				title: 'An element disappears without exiting',
				text: [
					'The binding’s exit target does not retain DOM by itself. Add its native transition to the actual element. If an enclosing block is removed, a child may need the global transition modifier.',
					'A third-party component may destroy its content before your transition can run. Integrate its forceMount or equivalent lifecycle API, as the component examples do.'
				]
			},
			{
				id: 'ownership',
				title: 'A transform ownership diagnostic appears',
				text: [
					'A projected or state-bound element cannot also have an independent CSS transform owner. Put rotation and scale in Motion style or targets. A raw transform may animate alone, but cannot mix with layout or decomposed x/y/rotate/scale in style, initial, animate, exit, interaction targets, transitionEnd or imperative targets. Use another existing element when independent systems need to animate different surfaces.',
					'Timeline and scroll attachments reject nodes already owned by another motion system, including conservative checks on paint-only writes. A clear failure is safer than two engines silently fighting over styles.'
				]
			},
			{
				id: 'api-status',
				title: 'What this beta does not promise',
				text: [],
				points: [
					'No compiler plugin is required. Bare layout and layoutId attributes are not the shipped API.',
					'Projection exports are framework-independent but undocumented upstream. A small native-animation handoff helper also reads two private fields to avoid stale completion writes and forced measurements. Keep the tested Motion version pinned and qualify upgrades.',
					'No full Motion React parity: advanced drag constraints, reorder, arbitrary async exit retention and all framework-specific features are not exposed.',
					'Complex transformed ancestors, 3D scenes, every sticky/clipping combination and every route/BFCache edge are not fully qualified.',
					'Runtime source HMR reloads the page. Component HMR and a production-device performance campaign are separate release work.'
				]
			}
		]
	}
];

export const docGroups = ['Start here', 'Make things move', 'Build with confidence'] as const;
/** Keep the reading sequence identical to the sidebar's grouped order. */
export const docs = docGroups.flatMap((group) => pages.filter((page) => page.group === group));
export const getDoc = (slug: string) => docs.find((doc) => doc.slug === slug);
export const getRecipe = (id: RecipeId) => authoringExamples.find((recipe) => recipe.id === id)!;
