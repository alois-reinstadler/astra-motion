import type { DocPage } from '../doc-types.js';

export const guidesDocs: DocPage[] = [
	{
		slug: 'accessibility',
		title: 'Accessibility',
		group: 'Guides',
		summary:
			'Use motion to explain an interface while preserving semantics, focus, device preferences and user control.',
		sections: [
			{
				id: 'meaning',
				title: 'Keep meaning available without movement',
				text: [
					'Animation can show where an item went or which panel changed. The same information must remain understandable through text, position and native state. Use actual buttons, links and inputs, and preserve labels, aria-expanded, aria-pressed and disabled behavior.',
					'Never make a hover or drag the only route to an action. Hover is absent on many touch devices. Dragging needs a keyboard alternative, such as the move buttons in the Reorder example or a native range input for a draggable slider.'
				],
				related: ['gestures', 'reorder', 'use-drag-controls']
			},
			{
				id: 'reduced-motion',
				title: 'Honor the device preference',
				text: [
					'Wrap the relevant subtree in MotionConfig reducedMotion="user". Primary motion elements use never by default, so the policy should be an explicit application choice. Nested providers and local props can override it; avoid overriding a user preference for decorative movement.',
					'Automatic reduction settles transforms and layout movement while allowing color and opacity to remain useful. It does not decide whether every effect is comfortable: blur, path drawing, large fades and continuously changing content still need design judgment.'
				],
				code: {
					label: 'Complete reduced-motion example',
					source:
						'<script lang="ts">\n  import { motion, useReducedMotion } from \'astra-motion\';\n  let open = $state(false);\n  const reduced = useReducedMotion();\n</script>\n<button aria-expanded={open} onclick={() => open = !open}>Details</button>\n<motion.div\n  animate={{ opacity: open ? 1 : 0.4, x: reduced.current || !open ? 0 : 24 }}\n  transition={{ duration: 0.2 }}\n>\n  The information is readable in both states.\n</motion.div>'
				},
				related: ['use-reduced-motion', 'motion-config']
			},
			{
				id: 'focus',
				title: 'Keep focus aligned with the interface',
				text: [
					'Focus appearance must remain visible throughout an animation. Native buttons already handle keyboard activation. whileFocus follows focus-visible; whileTap supports Motion’s Enter interaction. Use native click behavior for actions rather than treating pointer callbacks as a keyboard implementation.',
					'Before removing a focused panel, return focus to its trigger or the next meaningful control. AnimatePresence retains the DOM during exit; it does not choose application focus or modal semantics for you. AnimateActivity hides its retained host after exits and makes the final hidden subtree unavailable to interaction.',
					'A controlled Reorder list preserves focus through native keyed moves when the browser drops it. A deliberate application focus change wins. Provide explicit keyboard move controls and announce the resulting order in concise text when that information matters.'
				]
			},
			{
				id: 'pause',
				title: 'Provide a way to stop ongoing decoration',
				text: [
					'For a continuing animation, provide a visible pause or stop control. A page-visibility helper can stop unnecessary work when the tab is hidden, but it is not a user-facing pause mechanism. Start decorative loops on request when an automatic loop would distract from reading.',
					'useAnimationFrame accepts a reactive enabled option. useAnimate controls expose pause, play, stop and cancel. Hidden AnimateActivity pauses Astra-owned work; ordinary Svelte effects continue unless written with useActivityEffect.'
				],
				related: ['use-animation-frame', 'use-animate', 'use-page-in-view', 'animate-activity']
			},
			{
				id: 'text',
				title: 'Keep animated text readable',
				text: [
					'Keep the semantic message intact when splitting visual text into words or characters. One visually hidden complete string and aria-hidden animated fragments avoid making assistive technology read each fragment independently. Do not hide controls or interactive links inside that decorative copy.',
					'Preserve whitespace, language and reading order. Use a live region only for an actual status update, not every animation frame. Avoid flashing and rapid repeating contrast changes. The text guide uses a finite reveal with an explicit replay button.'
				],
				related: ['text-animation']
			},
			{
				id: 'verify',
				title: 'Verify with real interactions',
				text: [
					'Test keyboard tab order before, during and after exits, dragging and reorder. Enable the device reduced-motion preference and change it while the page is open. Resize and zoom; animation must not be necessary to discover hidden controls or recover clipped content.',
					'Check the initial server content with JavaScript unavailable, and verify a native fallback when View Transitions are unsupported. Use an accessibility tree or screen reader to confirm hidden retained panels and decorative split text are represented as intended.'
				],
				related: ['animate-view', 'animate-activity', 'getting-started']
			}
		]
	},
	{
		slug: 'reduce-bundle-size',
		title: 'Reduce bundle size',
		group: 'Guides',
		summary:
			'Choose an entry by capability, defer features when they are needed, and measure the production graph your application actually ships.',
		sections: [
			{
				id: 'choose',
				title: 'Start with the capabilities you use',
				text: [
					'The primary motion namespace is convenient for a screen with state animation, gestures and layout. Import only the values you use and let a production bundler remove unused exports. Measure that result before adding loading complexity.',
					'For an interactive island that does not need the animation runtime immediately, use m from astra-motion/m and LazyMotion from astra-motion/lazy. Importing the eager root motion namespace on the same route can bring its runtime into the initial graph even if another subtree is lazy.'
				],
				table: {
					columns: ['Entry', 'Use it for', 'Loading boundary'],
					rows: [
						[
							'astra-motion',
							'Primary components, managed values and helpers',
							'Tree-shaken eager capabilities'
						],
						[
							'astra-motion/m + astra-motion/lazy',
							'Lightweight elements and feature context',
							'Features supplied separately'
						],
						[
							'astra-motion/features/dom-animation',
							'Targets, variants, exit, hover/tap/focus/viewport',
							'No pan, drag or layout projection implementation'
						],
						[
							'astra-motion/features/dom-max',
							'Basic features plus pan, drag and layout',
							'Full feature bundle'
						],
						[
							'astra-motion/mini',
							'Native DOM-style useAnimate',
							'No hybrid subject/sequence engine'
						],
						[
							'astra-motion/view-navigation',
							'Coordinated SvelteKit navigation',
							'Kit integration isolated from plain Svelte'
						]
					]
				},
				related: ['lazy-motion', 'use-animate']
			},
			{
				id: 'defer',
				title: 'Create a real dynamic import boundary',
				text: [
					'Return the named feature bundle from the dynamic import. The loader runs after client mounting. Put a delay or user intent in your own loader if features should wait longer. Native content and initial styles stay mounted until the runtime attaches.',
					'The reference demonstration lets you type in an input before requesting the feature bundle. Changing the target while loading keeps the latest destination. Its component source is the same code shown beside the preview.'
				],
				code: {
					label: 'Complete deferred island',
					source:
						"<script lang=\"ts\">\n  import { LazyMotion } from 'astra-motion/lazy';\n  import * as m from 'astra-motion/m';\n  const features = () => import('astra-motion/features/dom-max').then(module => module.domMax);\n</script>\n<LazyMotion {features} strict>\n  <m.button layout whileHover={{ scale: 1.04 }}>Open collection</m.button>\n</LazyMotion>"
				},
				related: ['lazy-motion']
			},
			{
				id: 'strict',
				title: 'Catch accidental eager imports',
				text: [
					'Enable strict during development to catch an eager motion component under LazyMotion. ignoreStrict turns that specific diagnostic into a warning for a deliberate exception; it cannot remove the eager code from the bundle. Production builds omit the diagnostic.',
					'Keep shared visual components consistent: a component internally importing motion remains eager even when its parent imports m. Feature providers are contextual. A sibling using domMax does not make drag or layout available under a domAnimation provider.'
				]
			},
			{
				id: 'mini',
				title: 'Choose native imperative playback',
				text: [
					'Import useAnimate from astra-motion/mini when you need scoped CSS-style animations and native playback controls. Supply complete transform strings. Use the hybrid root helper for MotionValues, objects, independent transforms, sequences or curved paths.',
					'Mini manages scope cleanup and Activity suspension. It does not inherit MotionConfig transition or reduced-motion policy; select suitable timing/keyframes from useReducedMotion. The same [scope, animate] shape makes that distinction explicit without changing your element attachment.'
				],
				related: ['use-animate', 'use-reduced-motion']
			},
			{
				id: 'measurements',
				title: 'Measure Astra’s output',
				text: [
					'These measurements come from independent production applications installed from commit 93f06a3’s packed package on 28 September 2026, using Svelte 5.57.0, Vite 8.2.2 and Rolldown 1.2.11. They include Svelte and each fixture’s bootstrap code. They describe complete example applications, not library-only sizes.',
					'Each application counts its initial shared chunks once. Compressed totals sum separately compressed HTTP assets. Deferred bytes are requested when the feature loader runs; do not add figures from separate applications. The recorded module graphs verify that basic features exclude pan, drag and layout projection, while mini excludes the hybrid sequence engine.',
					'Use the repository’s bundle and installed-consumer checks to reproduce the measurements. Compare the same bundler, minifier, compression settings and shared dependencies. A docs page containing many live examples naturally imports more features than an isolated component.'
				],
				table: {
					columns: [
						'Application',
						'Initial minified bytes',
						'Initial gzip bytes',
						'Deferred gzip bytes'
					],
					rows: [
						['Eager motion', '201,607', '68,259', '0'],
						['Deferred domAnimation', '71,826', '26,462', '28,926'],
						['Deferred domMax', '71,937', '26,517', '46,767'],
						['Synchronous domAnimation', '147,628', '51,899', '0'],
						['Hybrid useAnimate', '96,316', '34,736', '0'],
						['Mini useAnimate', '42,330', '16,227', '0']
					]
				}
			},
			{
				id: 'runtime-cost',
				title: 'Budget layout work as well as downloads',
				text: [
					'Lazy loading reduces initial download and parsing; it does not make an active layout animation cheaper. Animate transforms and opacity for continuous gestures, give projected text its own layout="position" boundary, and keep the number of simultaneously measured layout elements small.',
					'The recorded desktop production benchmark found a real large-grid limit. Across three trials per configuration at normal CPU speed, automatic layout had a median p95 frame interval of 16.7 ms for 100 cells and 100 ms for 500 cells; explicit layout measured 49.9 ms for 500 cells. This used Linux Chromium on a Xeon E3-1275 v5 with software rendering. It is not an iPhone or Safari frame-rate guarantee. All 18 trials settled correctly with zero geometry/style reads in the measured idle windows.',
					'Profile your production build on the target phone, including interrupted animations, scrolling and reduced motion. For large collections, window the visible items, reduce simultaneous layout changes, or use an explicit layout transaction when you control the update. Preserve readable content and usable controls when motion is reduced.'
				],
				related: ['layout', 'accessibility']
			},
			{
				id: 'verify',
				title: 'Verify the network and lifecycle',
				text: [
					'Build the production consumer, open it with an empty browser cache, and inspect requested JavaScript. The deferred feature module should be requested when its loader runs. Check that the input, focused element and bind:ref identity survive installation of the feature runtime.',
					'Test a rejected loader through a Svelte boundary, removal before load completion, and a newer loader superseding an older promise. Keep useful native content available if loading fails. Full source and measured graphs are useful together; an export named lazy is not evidence of deferral.'
				],
				related: ['lazy-motion', 'getting-started']
			}
		]
	},
	{
		slug: 'text-animation',
		title: 'Text animation',
		group: 'Guides',
		summary:
			'Reveal words, animate numeric text, and coordinate typographic changes with readable semantics and predictable Svelte lifecycles.',
		sections: [
			{
				id: 'words',
				title: 'Reveal plain text',
				text: [
					'Import TextReveal from astra-motion/text. Choose fade, slide or blur independently from whole, words or graphemes segmentation and a stagger interval in seconds. The unstyled host accepts as="h2", as="p" or the default inline span. Use trigger="mount", trigger="viewport" with once, or trigger="state" with visible. The example provides a replay button.',
					'A complete visually hidden message supplies the semantic text. The animated duplicate is aria-hidden, which prevents a screen reader from encountering each visual fragment as a separate piece. Keep interactive text such as links in the semantic reading flow instead of putting it in the decorative duplicate.'
				],
				example: 'text-animation',
				related: ['animations', 'transitions', 'accessibility']
			},
			{
				id: 'segments',
				title: 'Choose the right segmentation',
				text: [
					'TextReveal and TextSwap use Intl.Segmenter with an explicit locale (default en). If Segmenter is unavailable, the entire message stays intact. SSR and initial hydration render visible unsplit text; segmentation happens after mounting, avoiding server/client ICU differences. Set lang and locale for your content. Fragment boundaries can affect ligatures and complex-script shaping.',
					'Automatic line splitting is outside this API. Whitespace stays literal text with inherited white-space rules; graphemes remain grouped within words. Choose whole when preserving font shaping matters more than fragment motion.'
				],
				code: {
					label: 'Grapheme segmentation · focused excerpt',
					source:
						"const segments = new Intl.Segmenter(locale, { granularity: 'grapheme' });\nconst graphemes = Array.from(segments.segment(message), part => part.segment);\n// Render these with stable keys and keep one complete accessible message."
				}
			},
			{
				id: 'numbers',
				title: 'Render an animated number',
				text: [
					'Pass children={value} to a motion component to render a MotionValue as live text. A Svelte {value} interpolation is an ordinary snippet and does not subscribe to the MotionValue. Derive a rounded or formatted string with useTransform so the displayed text remains readable while the underlying value changes smoothly. This avoids assigning application state for every frame.',
					'For a count that changes while the user works, announce only the meaningful final value if an announcement is needed. An aria-live region updated every frame creates noise. Keep the real value in your application state and use the animated value as its presentation.'
				],
				code: {
					label: 'Complete animated count',
					source:
						'<script lang="ts">\n  import { motion, useMotionValue, useSpring, useTransform } from \'astra-motion\';\n  const target = useMotionValue(24);\n  const animated = useSpring(target, { stiffness: 160, damping: 24 });\n  const label = useTransform(() => Math.round(animated.get()).toString());\n</script>\n<button onclick={() => target.set(target.get() + 10)}>Add ten</button>\n<motion.span children={label} />'
				},
				related: ['motion-values', 'use-spring', 'use-transform']
			},
			{
				id: 'replacement',
				title: 'Replace a label with presence',
				text: [
					'TextSwap reuses AnimatePresence. mode="wait" coalesces requests to the latest string and cancels an exit when the outgoing value returns. The default sync overlaps at most two visual layers; another request during exit snaps to the latest message. Repeated identical strings do nothing, and empty strings are supported. The surrounding native control remains mounted.',
					'size="content" can resize surrounding layout. Use size="reserve" with all alternatives to reserve the largest rendered string at the current font and width, or size="fixed" with explicit host dimensions. Both keep the reserved region stationary; fixed defaults to clipped overflow. live="polite" opts the single complete semantic message into announcements; the default is off.'
				],
				code: {
					label: 'Label replacement · focused excerpt',
					source:
						'<button onclick={advance}>\n  <TextSwap text={label} mode="wait" effect="slide" size="reserve" alternatives={["Continue", "Saving…", "Saved"]} />\n</button>'
				},
				related: ['animate-presence']
			},
			{
				id: 'reduced-motion',
				title: 'Reduce movement and preserve content',
				text: [
					'Both text components honor inherited MotionConfig and live preference changes. Reduced motion immediately settles opacity, blur, travel and every stagger delay. An explicit reducedMotion="never" overrides the device preference; reading useReducedMotion alone would miss that application policy.',
					'The server-rendered message stays visible if JavaScript fails. Each host exposes one complete semantic message and hides decorative visual layers from assistive technology. Hidden Activity cancels text playback and releases viewport and preference observers. Use these components for plain text, keeping interactive rich text in its native reading flow.'
				],
				related: ['motion-config', 'use-reduced-motion']
			},
			{
				id: 'troubleshooting',
				title: 'Fix common typography issues',
				text: [
					'If a word does not transform, check display: inline-block on its native span. If spaces disappear, keep whitespace tokens outside animated wrappers. If a dynamic sentence reuses the wrong word, choose keys that describe the intended identity or replace the sentence with a key block.',
					'If a reveal repeats unexpectedly, check the component’s key and the controlling variant state. If text stretches during layout projection, give its host layout="position" or use a stable text box. Font-loading layout shifts should be settled or deliberately measured before starting a staged reveal.'
				],
				related: ['layout', 'motion']
			}
		]
	}
];
