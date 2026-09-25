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
	aliases?: string[];
	links?: {
		slug?: string;
		path?: '/status' | '/examples' | '/showcase' | '/motion-lab/product';
		title: string;
		detail: string;
	}[];
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
			'Learn to animate Svelte interfaces, from one element to coordinated layouts and complete applications.',
		sections: [
			{
				id: 'a-small-set-of-tools',
				title: 'Start with one element',
				text: [
					'Astra connects Motion’s animation engine to Svelte 5. Your state decides what appears; your CSS decides where it belongs. Astra animates the changes and lets Svelte retain elements until their exits finish.',
					'Start with motion.div or motion.button for new markup. The getting started guide installs the package and builds a notification you can show, dismiss and reverse.'
				],
				related: ['getting-started']
			},
			{
				id: 'choose-your-entry',
				title: 'Learn one interaction at a time',
				text: [
					'Each guide pairs a focused interaction with its explanation. Read the short example first, try the preview, then open the complete component source when you are ready to use it.'
				],
				links: [
					{
						slug: 'state',
						title: 'Animation state',
						detail: 'Change targets, add gestures and coordinate variants.'
					},
					{
						slug: 'presence',
						title: 'Presence & exits',
						detail: 'Sequence replacements and remove items without a jump.'
					},
					{
						slug: 'layout',
						title: 'Automatic layout',
						detail: 'Animate size and position as your CSS changes.'
					},
					{
						slug: 'shared-layout',
						title: 'Shared elements & groups',
						detail: 'Keep a selection connected across different elements.'
					},
					{
						slug: 'scroll',
						title: 'Scroll-linked motion',
						detail: 'Connect progress and visibility to animation.'
					},
					{
						slug: 'timelines',
						title: 'Scoped timelines',
						detail: 'Play a sequence across several elements.'
					},
					{
						slug: 'routes',
						title: 'SvelteKit routes',
						detail: 'Enhance navigation with browser View Transitions.'
					}
				]
			},
			{
				id: 'build-with-confidence',
				title: 'Bring it into your application',
				text: [
					'Use the component integration guide when existing markup or a headless UI library owns the element. Set a reduced-motion policy before building larger interactions. Keep the API reference nearby for options and the troubleshooting guide for boundaries.'
				],
				related: ['components', 'accessibility', 'api', 'troubleshooting']
			},
			{
				id: 'current-status',
				title: 'A working beta',
				text: [
					'Astra is available from this repository as a locally built package. A public registry release is pending. The examples describe the checked-in API; the project does not promise full Motion React parity.'
				],
				links: [
					{
						path: '/status',
						title: 'Project status',
						detail: 'Supported behavior, known limits and qualification records.'
					},
					{
						path: '/examples',
						title: 'Examples',
						detail: 'Find an interaction by the task you are building.'
					},
					{
						path: '/showcase',
						title: 'Showcase',
						detail: 'Explore Fieldwork, a complete interface built with Astra.'
					}
				]
			}
		]
	},
	{
		slug: 'getting-started',
		title: 'Getting started',
		group: 'Start here',
		summary: 'Install the beta and build one notification with an entrance, an exit and a spring.',
		sections: [
			{
				id: 'install-local-package',
				title: '1. Install the local package',
				text: [
					'A public registry release is pending. Build Astra from the repository, then add the resulting tarball to your Svelte app. The package includes its qualified Motion engine; no separate Motion installation is needed.',
					'Use Svelte 5.57.0 or newer within Svelte 5. Only the routes entry requires SvelteKit 2.70.3 or newer within Kit 2. Replace the tarball path below with the path on your machine.'
				],
				code: {
					label: 'Terminal — replace the tarball path with your own',
					source:
						'git clone https://github.com/alois-reinstadler/astra-motion.git\ncd astra-motion\npnpm install\npnpm run prepack\npnpm pack\n\n# In your Svelte app directory:\npnpm add /absolute/path/to/astra-motion/astra-motion-0.0.1.tgz'
				},
				aliases: ['use-the-workspace']
			},
			{
				id: 'first-component',
				title: '2. Animate your first component',
				text: [
					'Import the motion namespace. A motion.div renders a real div and accepts initial, animate, exit and transition directly as props. An ordinary if block controls whether it is present.',
					'initial sets the entrance pose, animate sets the destination, and exit sets the leaving pose. The component keeps the element alive until its exit finishes. Try dismissing the notification, then showing it again.'
				],
				aliases: ['motion-component'],
				example: 'state'
			},
			{
				id: 'the-contract',
				title: '3. Change the interaction',
				text: [],
				points: [
					'Change y to alter the travel distance, or the spring’s stiffness and damping to change its feel.',
					'Use a semantic motion.button for a button, motion.li for a list item, and the matching tag for your element. Native attributes and event handlers stay on that component.',
					'Motion transition durations use seconds. Reduced motion follows the user’s preference by default.'
				],
				related: ['state', 'presence', 'layout', 'accessibility']
			},
			{
				id: 'existing-markup',
				aliases: ['native-bindings', 'lite-or-full', 'qualified-dependencies'],
				title: 'When you need more control',
				text: [
					'Continue with the animation guides for new UI. Existing markup, form bindings and headless components have a separate integration guide; package entries and engine identity belong in the reference.'
				],
				related: ['components', 'api']
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
					'initial supplies the first rendered state, animate supplies the current destination, and exit supplies the target for a native outro. Targets can include opacity, transforms and supported styles. initial={false} starts at the animate target and skips the first intro.',
					'Update animate from reactive state to change the destination. A new target interrupts the current animation instead of queuing stale movement. The notification in Getting started demonstrates initial and exit targets; the examples below build on it.'
				],
				code: {
					label: 'Reactive target · excerpt',
					source:
						"<motion.div\n  animate={{ x: expanded ? 120 : 0 }}\n  transition={{ type: 'spring', stiffness: 300, damping: 30 }}\n/>"
				},
				related: ['getting-started']
			},
			{
				id: 'inheritance',
				title: 'Coordinate a family of elements',
				text: [
					'A parent’s variant label can coordinate its children. Give each child open and closed targets, then use staggerChildren on the parent to offset their start times.',
					'Nested tag components inherit their parent’s variants, including during server rendering. Keep them inside that parent in the DOM. Existing native bindings use parent.child() to declare the same relationship.'
				],
				example: 'inheritance'
			},
			{
				id: 'gestures',
				title: 'Respond to a touch',
				text: [
					'Give a button a little feedback on hover, press, and keyboard focus. Add drag to move an element within a set of bounds. Gesture targets use the same springs and values as ordinary animation state.',
					'This example uses createMotion bindings to add feedback to existing native button and drag markup. Your components explains that integration contract.'
				],
				example: 'gestures',
				related: ['components']
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
				related: ['getting-started']
			},
			{
				id: 'wait',
				title: 'Wait for the outgoing branch',
				text: [
					'Presence defaults to wait: it waits for the whole native outro group, then renders the latest requested value. Rapid changes do not form a queue.',
					'Use mode="sync" to mount replacements immediately while older branches exit. onExitComplete runs after all outgoing branches finish. Reversed exits and disposal of Presence itself do not notify.'
				],
				example: 'wait'
			},
			{
				id: 'pop-layout',
				title: 'Free the space before the exit ends',
				text: [
					'popLayout captures the old visual position and removes the outgoing node from flow. Its siblings can immediately reflow and project toward their new positions.',
					'Give the direct parent position: relative. The exiting item also needs a native outro; the attachment alone does not retain DOM.'
				],
				example: 'motion-component'
			},
			{
				id: 'nested-exits',
				title: 'Nested exits have a finite schedule',
				text: [
					'Child variants support ordering and stagger through native transition durations. This works with finite targets. Arbitrary asynchronous promises and infinite exit repeats cannot define the end of a Svelte outro.',
					'Use transition:...|global for a child that should animate when an enclosing block is destroyed. A local transition only responds to the block that directly owns it.'
				],
				related: ['state']
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
					'Add the layout prop to a motion element. When its size or position changes, Astra animates from the old rectangle to the new one. Open the player below to see the surface grow while its content keeps its proportions.',
					'Use createLayout to share a controller between related elements. Position-only attachments on the content compensate for the surface’s changing scale. The complete example shows where those attachments belong.'
				],
				example: 'layout'
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
				example: 'shared'
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
		summary: 'Add motion to existing markup, form controls and reusable or headless components.',
		sections: [
			{
				id: 'existing-markup',
				title: 'Keep existing native markup',
				text: [
					'Spread binding.props for its attachment and SSR style, then add its native transition for exit. Merge authored style after the spread. Native attributes, event callbacks, refs and directives remain on your element.'
				],
				recipe: 'native-binding'
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
				links: [
					{
						path: '/motion-lab/product',
						title: 'Try the two-page route demo',
						detail:
							'Open a product and return to its collection. This diagnostic scene uses the route setup below.'
					}
				],
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
				example: 'scroll'
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
					'Options can be a reactive reader. initial sets the value before the first measurement, including SSR. once disconnects after entry and resets for a replacement target. Component destruction disconnects the observer.',
					'The preview feeds visibility into a createMotion binding on its existing card. See Your components for the native binding contract.'
				],
				example: 'in-view',
				related: ['components']
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
				example: 'timeline'
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
					source:
						'<script lang="ts">\n  import type { Snippet } from \'svelte\';\n  import { MotionConfig } from \'astra-motion\';\n  let { children }: { children: Snippet } = $props();\n</script>\n\n<MotionConfig reducedMotion="user" transition={{ duration: 0.24 }}>\n  {@render children()}\n</MotionConfig>'
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
					'Import { motion } from astra-motion. Each named component renders one native HTML element. Pass initial, animate, exit, transition, variants, layout, layoutGroup, gesture options and animation callbacks directly as props, alongside native attributes, events, children where valid and a typed bind:ref. Supported form bindings are described in Your components.',
					'Nested components inherit variant ancestry during SSR and include global native transitions for enclosing-block exits. Descendants must stay inside their declared parent in the DOM. Generic Motion as remains available with its existing dynamic-tag and binding limitations.'
				],
				related: ['getting-started', 'components']
			},
			{
				id: 'component-props',
				title: 'Component props, styles and migration',
				text: [
					'Top-level animation props are the primary API for motion.tag and generic Motion components. Existing motion={{ ... }} options remain supported. Move each option to its own prop, or spread a reusable options object with {...options}. createMotion(options), layout attachments and custom components accepting motion={binding} keep their existing contracts.',
					'When both forms are supplied, each defined top-level animation prop wins over the same nested option. An undefined prop falls back to the nested option; false is an explicit value. Objects such as animate, transition and variants replace that option as a whole, without a deep merge.',
					'style accepts a native CSS string or a Motion style object. Use a $state object to update or delete individual style properties reactively; replacing the object also works. Object keys merge over motion.style keys, preserving MotionValues. An undefined object value clears the matching nested style; removing the key restores its nested fallback. A CSS string supplies native declarations alongside nested Motion styles. Omitting style or setting it to null leaves motion.style in effect. Motion owns the animated properties. A raw transform in a Motion style object is supported on its own; keep it separate from layout and decomposed x, y, rotate and scale values.',
					'disabled controls the native disabled attribute where the tag supports it and disables gesture recognition. false or null removes that attribute and clears the component’s gesture gate; native disabled fieldsets, inert and aria-disabled="true" ancestors still prevent gestures. The compatibility option motion.disabled only controls gestures; an undefined top-level disabled leaves that nested gesture setting in effect.',
					'Native events use Svelte names such as onclick; animation callbacks use names such as onAnimationComplete. bind:ref still returns the actual element, and supported form bindings keep their native behavior. Familiar prop syntax does not imply full Motion React API parity.'
				],
				code: {
					label: 'Migrating component props · excerpt',
					source:
						'<!-- Existing syntax remains supported. -->\n<motion.div motion={{ animate: { x: 120 }, transition: { duration: 0.3 } }} />\n\n<!-- Preferred syntax. -->\n<motion.div animate={{ x: 120 }} transition={{ duration: 0.3 }} />\n\n<!-- Reuse options; the explicit animate prop overrides options.animate. -->\n<motion.div {...options} animate={{ x: expanded ? 120 : 0 }} />'
				},
				related: ['components', 'state']
			},
			{
				id: 'create-motion',
				title: 'createMotion · native binding',
				text: [
					'Call during component initialization. Supply fixed options, a reactive options object, or a getter that reads changing state. Root imports are the default; state/lite is an optional bundle optimization without projection or gestures. Exported TypeScript types describe the complete target and transition shapes.'
				],
				code: {
					label: 'State binding · TypeScript',
					source:
						'createMotion(options?: MotionOptions | (() => MotionOptions)): MotionBinding\n\nbinding.props                 // SSR style + Svelte attachment; spread on one element\nbinding.transition            // native Svelte transition function\nbinding.child(options?)       // child binding with explicit variant ancestry\nbinding.animate(target, transition?): Promise<void>\nbinding.stop(): void          // stops state playback at its current pose\nbinding.update(change)        // synchronous update; full entry captures layout\nbinding.reducedMotion         // readonly resolved policy'
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
					source:
						'createLayout(options?: LayoutGroupOptions): LayoutController\n\nlayout(options?: LayoutOptions) // returns Attachment<HTMLElement>\nlayout.update(() => change())   // fresh snapshot, synchronous change\nlayout.stats()                 // { participants: number, active: number }\n\n// Group options\n{ id?, automatic?, transition?, reducedMotion? }\n\n// Participant options\n{ id?, mode?, scroll?, root?, style? }'
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
					source:
						'<Presence value={current} mode="wait" onExitComplete={done}>\n  {#snippet children(value)}...{/snippet}\n</Presence>\n\ntransition:presence={{ duration: 240 }}\n{@attach popLayout()}'
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
					source:
						"createScroll(options?: ScrollOptions | (() => ScrollOptions))\n\nreading.container            // Attachment<HTMLElement>\nreading.target               // Attachment<HTMLElement>\nreading.progress             // owned MotionValue<number>, selected axis\nreading.reducedMotion        // readonly resolved policy\nreading.animate(keyframes, options?) // Attachment<HTMLElement>\n\n// Common options\n{ axis: 'y', container?, target?, offset?, reducedMotion? }"
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
					source:
						"createInView(\n  target: () => Element | null | undefined,\n  options?: InViewOptions | (() => InViewOptions)\n) // { readonly current: boolean }\n\n// Options\n{ initial?: boolean, once?: boolean, root?: Element | Document | null,\n  margin?: string, amount?: 'some' | 'all' | number }"
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
					source:
						'createAnimate(policy?: MotionPolicy | (() => MotionPolicy)): AnimateScope\n\nscene.attach                  // Attachment<Element>\nscene.animate(target, keyframes, options?) // ScopedAnimationControls\nscene.sequence(segments, options?)         // ScopedAnimationControls\nscene.stop(): void\nscene.current                 // readonly Element | undefined\nscene.active                  // readonly active playback count\n\n// A segment is a label, a timed label, or:\n[target, keyframes, { at?, duration?, delay?, ... }]\n\ncontrols.play(); controls.pause(); controls.stop();\ncontrols.cancel(); controls.complete();\ncontrols.time = 0.2; controls.speed = 0.5;\nconst outcome = await controls.settled; // finished or cancelled'
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
					source:
						"// astra-motion/routes\nrouteTransitions(options?: { reducedMotion?, onDiagnostic? }): void\nrouteShared(id: string, options?: { scope?: string }): Attachment<HTMLElement>\n\n// astra-motion/policy\nshouldReduceMotion(policy?: { reducedMotion?: 'user' | 'always' | 'never' }): boolean\n\n// astra-motion/values\nmotionValue; springValue; transformValue; mapValue; stagger;\nmotionStore(value) // Svelte writable bridge; caller keeps value ownership"
				},
				points: [
					'MotionConfig is exported from astra-motion. Its props are transition, layoutTransition, automatic and reducedMotion, plus its children snippet.',
					'routeTransitions inherits policy and responds to live config/OS changes; explicit options win.',
					'Import MotionValue helpers from astra-motion or astra-motion/values so they share the packaged engine. Values from a separately installed engine have no promised identity match. motionStore adapts subscriptions and writes without destroying the supplied value.'
				],
				related: ['routes', 'accessibility']
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
				id: 'qualified-dependencies',
				title: 'One packaged Motion engine',
				text: [
					'The tarball contains the qualified DOM-only Motion engine. Consumers need no app-wide overrides or separate Motion installation. Strict declaration checking with skipLibCheck: false is part of packed consumer qualification.',
					'Get MotionValues from astra-motion or astra-motion/values. The packaged adapters and these helpers share one engine; an independently installed Motion package is outside that identity contract.'
				]
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
