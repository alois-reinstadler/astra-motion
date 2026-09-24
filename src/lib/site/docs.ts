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
			'Connect Motion to Svelte 5: animate native elements, coordinate exits and follow layout changes with ordinary reactive state.',
		sections: [
			{
				id: 'a-small-set-of-tools',
				title: 'A small set of tools. A connected system.',
				text: [
					'Astra gives Svelte 5 a motion layer for state, presence, layout and shared elements. Svelte owns mounting and destruction. Motion owns springs, interpolation and projection. Browser View Transitions handle page changes.',
					'Start with a tag component such as motion.div or motion.button. Use createMotion to add a binding to existing native markup. Try the examples here, then open View code to take the complete component with you.'
				],
				recipe: 'state'
			},
			{
				id: 'choose-your-entry',
				title: 'Choose an authoring path',
				text: [
					'Prefer native Svelte transitions for simple enter/exit effects. For new HTML needing Astra capabilities, begin with motion tag components from astra-motion. Existing native markup and headless components use createMotion. Feature and lite entries are later bundle optimizations.'
				],
				points: [
					'Svelte transition:fade, transition:fly and transition:slide — simple native enter/exit effects.',
					'motion.div, motion.button, motion.input — native tags with motion and supported Svelte bindings.',
					'createMotion — native directives, scoped styles and existing component integration.',
					'layout — automatic projection and shared local IDs, through attachments.',
					'presence() — a standalone opacity transition. binding.transition — a binding’s targets and live policy with native retention. Presence — coordinated branch replacement and waiting for exits.',
					'scroll and animate — independent scroll and scoped timeline adapters.',
					'routes — SvelteKit navigation and shared route elements.'
				]
			},
			{
				id: 'current-status',
				title: 'An explicit beta',
				text: [
					'This repository is an active implementation, with real-browser and SSR regression coverage. The documentation describes the checked-in API, not a claim of complete Motion React parity or an already-published registry release.',
					'Projection uses framework-independent exports from pinned Motion DOM 13.4.2. Those exports are undocumented upstream, so dependency upgrades need qualification. Start with Getting started, then use the examples directory to explore a specific interaction.'
				]
			}
		]
	},
	{
		slug: 'getting-started',
		title: 'Getting started',
		group: 'Start here',
		summary: 'Start with motion tag components, or use createMotion on existing native elements.',
		sections: [
			{
				id: 'use-the-workspace',
				title: 'Use the checked-in workspace',
				text: [
					'Astra is currently developed in this repository. Do not assume that an npm package with this name is this implementation. The examples use the public package entry points from the local tarball.',
					'Clone the repository and run pnpm install, then pnpm dev for the local site and examples. To use Astra in another app, build and install the local package below. The qualified baseline is Svelte 5.57.0, SvelteKit 2.70.3 and Motion 13.4.3. SvelteKit is only needed for the routes entry point.'
				],
				code: {
					label: 'Public package imports',
					source:
						"import { motion, createMotion, createLayout } from 'astra-motion';\nimport { routeTransitions } from 'astra-motion/routes';"
				}
			},
			{
				id: 'qualified-dependencies',
				title: 'One packaged Motion engine',
				text: [
					'The tarball contains the qualified DOM-only Motion engine. Consumers need no app-wide overrides or separate Motion installation. Strict declaration checking with skipLibCheck: false is part of packed consumer qualification.',
					'Get MotionValues from astra-motion or astra-motion/values. The packaged adapters and these helpers share one engine; an independently installed Motion package is outside that identity contract.'
				]
			},
			{
				id: 'install-local-package',
				title: 'Install it in your app',
				text: [
					'In the Astra checkout, run pnpm run prepack and pnpm pack. The first command builds the library and validates its package; the second creates astra-motion-0.0.1.tgz. pnpm may run prepack again as part of packing.',
					'From your app directory, install that file using its real path. Use Svelte 5.57.0 or newer within Svelte 5. SvelteKit 2.70.3 or newer within Kit 2 is needed only for astra-motion/routes. The package includes its qualified DOM engine; no Motion overrides or separate install are required.',
					'The package name in the examples refers to this local build. Check the project status before adopting it: Astra is MIT licensed, and a public registry release is still pending.'
				],
				code: {
					label: 'Terminal — replace the tarball path with your own',
					source:
						'git clone https://github.com/alois-reinstadler/astra-motion.git\ncd astra-motion\npnpm install\npnpm run prepack\npnpm pack\n\n# In your Svelte app directory:\npnpm add /absolute/path/to/astra-motion/astra-motion-0.0.1.tgz'
				}
			},
			{
				id: 'lite-or-full',
				title: 'Optimize entries when needed',
				text: [
					'Start with the root import. If bundle measurements justify a narrower binding entry, astra-motion/state/lite supports initial, animate, exit, variants and MotionValues without projection or gestures.',
					'astra-motion/state supports the same binding with layout and interaction targets. Both entries use the same props spread, transition and child authoring contract. The routes entry remains separate because it requires SvelteKit.'
				]
			},
			{
				id: 'motion-component',
				title: 'Start with a tag component',
				text: [
					'motion.button renders a real button; motion.div renders a div. Each tag component creates its binding and exit transition, so it can be used directly inside keyed lists.',
					'Put animation options in motion. Native attributes, typed event callbacks, children and CSS style reach the actual element, with initial SSR styles preserved. Import the motion namespace from astra-motion.',
					'Use bind:ref for the tag-specific DOM element. Input, textarea and select components support value binding. Generic Motion as remains compatible; its dynamic element does not implement native value bindings.'
				],
				recipe: 'motion-component'
			},
			{
				id: 'native-bindings',
				title: 'Bind values and keep native events',
				text: [
					'motion.input implements value binding for value inputs, checked and indeterminate for checkboxes, and files for file inputs. motion.textarea and motion.select support value; multiple selects use arrays. motion.details supports open.',
					'Tag components forward native props and event callbacks, but native directives are not all component props. Use createMotion on native markup for bind:group, media bindings, readonly dimensions and parent-scoped element selectors. bind:ref exposes the DOM element; bind:this refers to the component.'
				],
				recipe: 'form-bindings'
			},
			{
				id: 'existing-markup',
				title: 'Keep existing native markup',
				text: [
					'Spread binding.props for its attachment and SSR style, then add its native transition for exit. Merge authored style after the spread. Native attributes, event callbacks, refs and directives remain on your element.'
				],
				recipe: 'native-binding'
			},
			{
				id: 'first-component',
				title: 'Give an element an entrance and an exit',
				text: [
					'Tag components combine initial, animate, and exit targets on a native element. Toggle this notification to see it appear and leave. Toggle again during the animation to reverse it.',
					'The component includes the native Svelte transition that keeps its element alive until the exit finishes. Use createMotion bindings directly when integrating with existing markup.'
				],
				recipe: 'state'
			},
			{
				id: 'the-contract',
				title: 'Three things to remember',
				text: [],
				points: [
					'One binding owns one simultaneously mounted element. Use tag components in keyed lists, or create a binding inside your own item component.',
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
					'Nested tag components inherit variant ancestry during SSR. For native bindings, parent.child() declares that ancestry explicitly before the DOM exists. Children must mount inside their declared parent; portals need an independent createMotion binding.',
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
					'Put application rotation and scale in the binding’s style or targets. Paint-only bindings preserve existing CSS transforms. Once a binding uses transforms, layout or drag, avoid a second transform owner. Keep independently owned scroll or timeline animations on another element.',
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
					'Plain 2D transformed wrappers are measured automatically, including nested rotation, skew, nonuniform scale and custom origins. Nested scroll and sticky boundaries are covered while descendant layout animates. Changing wrapper transforms during projection, zero-scale transforms, perspective and 3D scenes remain outside this contract.'
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
					'Create the binding in the parent. Forward the component’s native attributes, events, ref and children, and merge authored style with binding.props.style after spreading both prop sets. A plain second style spread can discard SSR motion styles.'
				],
				recipe: 'component'
			},
			{
				id: 'headless-components',
				title: 'Headless primitives need lifecycle integration',
				text: [
					'The project’s Card, Dialog and Accordion use this contract. For Bits UI, forceMount and the child snippet’s open state let a native Svelte branch own exit retention. Preserve its IDs, ARIA props, ref and composed handlers on the same node; use the primitive’s prop merger. Portaled content needs its own createMotion binding.',
					'On close, interaction and focus must follow the logical component state even while the outgoing DOM remains visible. Test Escape, focus restoration, fast reversal and removal of the containing branch.'
				]
			},
			{
				id: 'lifetimes',
				title: 'Match setup to its owner',
				text: [
					'Create context-dependent bindings and controllers during component initialization so SSR can resolve their initial state. Attachments own node-specific work. Extra browser setup can use $effect with untrack and a returned cleanup; keep intended reactive targets and policies tracked.',
					'$effect.pre is not a global before-DOM-update snapshot: a parent may already have changed geometry before a child runs. untrack changes dependencies, not ordering. Automatic projection uses cached measurements; layout.update captures fresh geometry before a synchronous change. Keyed child order must come from DOM order rather than setup callback order.'
				]
			},
			{
				id: 'ssr',
				title: 'Render a useful first frame',
				text: [
					'binding.props carries initial styles into SSR. Nested tag components inherit server variants; native bindings use parent.child(). Attachments alone do not invent server-rendered styles.',
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
					'Stopped or canceled controls cannot restart. Start a fresh animation. Completed controls revalidate membership and ownership before a seek or replay. Await controls.settled for a finished or cancelled outcome, including stopped, cancelled, replaced and detached reasons. Replaying completed controls creates a new settlement promise. Motion’s existing then/finished promise can still remain pending on cancellation.'
				]
			},
			{
				id: 'boundaries',
				title: 'A DOM scope has deliberate boundaries',
				text: [
					'This adapter supports DOM and SVG targets. Use official Motion directly for arbitrary-object, callback or MotionValue sequences.',
					'Do not target a node already owned by state, layout or scroll. For a createMotion node, use its binding.animate method. Live local or inherited reduced-motion changes complete the original finite or repeating timeline. For lower-level controls.attachTimeline, cleanup, complete or policy reduction detaches and settles as cancelled because Motion disables its native completion callback. Prefer createScroll for scroll-linked motion.'
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
					'Configuration belongs to the Svelte component tree and its SSR request. A provider rendered in the same component cannot configure bindings already created in that component’s script. Put it above their owning component or pass explicit options; tag components below it inherit normally.'
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
				id: 'tag-components',
				title: 'motion.tag · HTML components',
				text: [
					'Import { motion } from astra-motion. Each named component renders one native HTML element and accepts that tag’s attributes and event callbacks, motion options, children where valid, and a typed bind:ref. Supported form bindings are described in Getting started.',
					'Nested components inherit variant ancestry during SSR and include global native transitions for enclosing-block exits. Descendants must stay inside their declared parent in the DOM. Generic Motion as remains available with its existing dynamic-tag and binding limitations.'
				],
				related: ['getting-started', 'components']
			},
			{
				id: 'create-motion',
				title: 'createMotion · native binding',
				text: [
					'Call during component initialization. Supply fixed options, a reactive options object, or a getter that reads changing state. Root imports are the default; state/lite is an optional bundle optimization without projection or gestures. Exported TypeScript types describe the complete target and transition shapes.'
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
					source: `createAnimate(policy?: MotionPolicy | (() => MotionPolicy)): AnimateScope\n\nscene.attach                  // Attachment<Element>\nscene.animate(target, keyframes, options?) // ScopedAnimationControls\nscene.sequence(segments, options?)         // ScopedAnimationControls\nscene.stop(): void\nscene.current                 // readonly Element | undefined\nscene.active                  // readonly active playback count\n\n// A segment is a label, a timed label, or:\n[target, keyframes, { at?, duration?, delay?, ... }]\n\ncontrols.play(); controls.pause(); controls.stop();\ncontrols.cancel(); controls.complete();\ncontrols.time = 0.2; controls.speed = 0.5;\nconst outcome = await controls.settled; // finished or cancelled`
				},
				points: [
					'target is a selector string, Element or Iterable<Element>. The scope currently supports DOM and SVG sequences.',
					'New playback targeting an owned element replaces that element’s previous sequence as a whole.',
					'Stopped or canceled controls cannot restart. Completed controls validate scope and ownership before replay or seeking.',
					'MotionConfig transition supplies defaults. The policy argument overrides inherited reducedMotion; reactive policy objects/getters are observed while attached and settle active playback when reduction turns on.'
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
					'Import MotionValue helpers from astra-motion or astra-motion/values so they share the packaged engine. Values from a separately installed engine have no promised identity match. motionStore adapts subscriptions and writes without destroying the supplied value.'
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
					'A binding that owns transforms, layout or drag cannot also have an independent CSS transform owner. Paint-only state bindings preserve authored CSS transforms; enabling a transform later checks ownership then. Put rotation and scale in Motion style or targets. A raw transform may animate alone, but cannot mix with layout or decomposed x/y/rotate/scale in style, initial, animate, exit, interaction targets, transitionEnd or imperative targets. Use another existing element when independent systems need to animate different surfaces.',
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
					'Static affine transformed wrappers and nested sticky/scroll/clipping boundaries have geometry regressions. Animated wrapper transforms, perspective, 3D scenes and every route/BFCache edge are not fully qualified.',
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
