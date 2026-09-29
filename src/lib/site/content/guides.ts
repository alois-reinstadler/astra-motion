import type { DocPage } from '../doc-types.js';

export const guidesDocs: DocPage[] = [
	{
		slug: 'getting-started',
		title: 'Getting started',
		group: 'Guides',
		summary:
			'Install Astra in a Svelte 5 application, animate a native element, and build from a small working interaction.',
		sections: [
			{
				id: 'installation',
				title: 'Install the package',
				text: [
					'Astra connects Motion’s animation engine to Svelte 5. Use direct props on motion elements for targets, variants, gestures and layout; use managed helpers when values, scrolling or imperative playback need their own lifecycle.',
					'Evaluate the local release candidate by installing the supplied astra-motion-0.1.0-rc.1.tgz artifact into your application. No repository checkout or consumer-side library build is needed. This is a local package artifact, not a registry publication.'
				],
				code: {
					label: 'Install the supplied release-candidate archive',
					source:
						'# Run from your application directory:\npnpm add /absolute/path/to/astra-motion-0.1.0-rc.1.tgz'
				}
			},
			{
				id: 'requirements',
				title: 'Use Svelte 5',
				text: [
					'Astra requires Svelte 5.57.0 or newer within Svelte 5. Plain Svelte and SvelteKit applications can use the primary package. Only the routes and view-navigation adapters require SvelteKit 2.70.3 or newer within Kit 2. No compiler plugin or React dependency is required.',
					'Keep your normal Svelte build setup. The tarball includes one qualified DOM animation engine, shared by components and exported MotionValues. Import values from Astra so they participate in that identity; a separate Motion installation is not needed.'
				]
			},
			{
				id: 'first-component',
				title: 'Animate a notification',
				text: [
					'Import the motion namespace and set initial, animate and exit directly on a real element. Reactive props are ordinary Svelte expressions. This example uses a native conditional block: motion.div supplies its own Svelte outro, so removal waits for the exit.',
					'Use AnimatePresence when you need keyed replacement modes, dynamic exit data, nested removal coordination or manual completion. Its Svelte API owns explicit present, keyed items, or a single value. A native if block remains useful for a simple independent exit.'
				],
				example: 'state',
				related: ['motion', 'animate-presence']
			},
			{
				id: 'reactivity',
				title: 'Let Svelte own application state',
				text: [
					'Use $state for application decisions and bind:value for native inputs. A motion component forwards the element’s attributes and lowercase event props, such as onclick. bind:ref returns its typed DOM element; bind:this on a component refers to its component exports.',
					'Initialize use* helpers during component setup. A reactive getter, such as useScroll(() => ({ container })), follows a later element or option replacement. Do not destructure a .current value from a reactive helper into a one-time boolean. Read visible.current where you use it.'
				],
				code: {
					label: 'Complete reactive button',
					source:
						"<script lang=\"ts\">\n  import { motion } from 'astra-motion';\n  let selected = $state(false);\n</script>\n<motion.button\n  aria-pressed={selected}\n  onclick={() => selected = !selected}\n  animate={{ scale: selected ? 1.1 : 1 }}\n  whileTap={{ scale: 0.95 }}\n>\n  {selected ? 'Selected' : 'Choose item'}\n</motion.button>"
				},
				related: ['motion-values', 'gestures']
			},
			{
				id: 'coming-from-react',
				title: 'Coming from Motion for React',
				text: [
					'Keep familiar initial, animate, exit, variants and gesture targets. Replace JSX expressions and React state with ordinary Svelte expressions and $state. Motion helpers named use* are component setup helpers; Svelte runs setup once, so there is no React render call-order model or dependency array.',
					'AnimatePresence accepts explicit present, keyed items, or one value. Snippets are opaque, so the boundary cannot inspect child element keys. For a selected record, pass value={selected} and render the retained snippet argument. Use Reorder.Group bind:values for automatic Svelte state updates; supply onReorder when your application must validate proposals.',
					'Choose motion.* for new elements, motion.bind for existing native markup, and motion.create for reusable custom components that forward attachments. Set MotionConfig reducedMotion="user" when the application should follow device preferences.'
				]
			},
			{
				id: 'native-svelte',
				title: 'Using Astra with native Svelte',
				text: [
					'motion.bind shares the motion.* animation engine, defaults, variants, interruption and reduced-motion contract. Keep native bindings, directives and scoped CSS on the original element. The options getter follows changing Svelte inputs without recreating the binding.',
					'Spread binding.props: it includes both the SSR style and attachment. Do not add a second attachment. An attachment alone cannot render server styles or retain a Svelte outro; the native transition directive supplies removal retention. Use one binding per simultaneously mounted element.',
					'Initialize bindings in component setup. Configuration and variant context come from ancestor components at setup; a MotionConfig written around markup in the same component cannot configure an already-created binding. Use explicit options or a provider above that component. Native ancestry uses parent.child(options) when server-rendered child variants depend on a native parent.'
				],
				code: {
					label: 'Complete Svelte example',
					source:
						'<script lang="ts">\n  import { motion } from \'astra-motion\';\n  let shown = $state(true);\n  let selected = $state<string[]>([]);\n  const choice = motion.bind(() => ({\n    initial: { opacity: 0 },\n    animate: { opacity: 1, scale: selected.includes(\'news\') ? 1.1 : 1 },\n    exit: { opacity: 0 },\n    transition: { duration: 0.2 },\n    reducedMotion: \'user\'\n  }));\n  const enterExit = choice.transition;\n</script>\n\n<button onclick={() => shown = !shown}>Toggle choices</button>\n{#if shown}\n  <fieldset>\n    <legend>Subscriptions</legend>\n    <label><input class="choice" type="checkbox" value="news" bind:group={selected}\n      {...choice.props} transition:enterExit|global /> News</label>\n    <label><input type="checkbox" value="events" bind:group={selected} /> Events</label>\n  </fieldset>\n{/if}\n<p>Selected: {selected.join(\', \') || \'None\'}</p>\n\n<style>\n  .choice { accent-color: teal; outline-offset: 4px; }\n</style>'
				}
			},
			{
				id: 'panel-recipes',
				title: 'Tabs and changing panels',
				text: [
					'Keep navigation controls mounted while one selected panel changes. The single-value snippet retains the outgoing record, including its title and text. This example uses ordinary section buttons; when using a headless tabs primitive, preserve its roles, keyboard navigation, IDs and focus handling.',
					'Use AnimateActivity instead when inactive panels must retain drafts and DOM state. Motion does not supply the tabs interaction semantics.'
				],
				code: {
					label: 'Complete Svelte example',
					source:
						"<script lang=\"ts\">\n  import { AnimatePresence, motion } from 'astra-motion';\n  const panels = [\n    { id: 'overview', title: 'Overview', text: 'Your current project.' },\n    { id: 'history', title: 'History', text: 'Your saved changes.' }\n  ];\n  let selected = $state(panels[0]);\n</script>\n\n<nav aria-label=\"Project sections\">\n  {#each panels as panel (panel.id)}\n    <button aria-pressed={selected.id === panel.id} onclick={() => selected = panel}>\n      {panel.title}\n    </button>\n  {/each}\n</nav>\n<AnimatePresence value={selected} key={(panel) => panel.id} mode=\"wait\">\n  {#snippet children(panel)}\n    <motion.section aria-label={panel.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }}\n      exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>\n      <h2>{panel.title}</h2><p>{panel.text}</p>\n    </motion.section>\n  {/snippet}\n</AnimatePresence>"
				}
			},
			{
				id: 'accordion-recipe',
				title: 'Reveal an accordion panel',
				text: [
					'Preserve the existing trigger and its aria-expanded state. A native binding keeps the component’s scoped styles and conditional markup. The global transition waits for the finite height/opacity exit and can reverse a rapid toggle. For a simple reveal, Svelte’s slide transition is also a suitable choice.'
				],
				code: {
					label: 'Complete Svelte example',
					source:
						'<script lang="ts">\n  import { motion } from \'astra-motion\';\n  let open = $state(false);\n  const panel = motion.bind({\n    initial: { height: 0, opacity: 0 },\n    animate: { height: \'auto\', opacity: 1 },\n    exit: { height: 0, opacity: 0 },\n    transition: { duration: 0.2 },\n    reducedMotion: \'user\'\n  });\n  const reveal = panel.transition;\n</script>\n\n<button aria-expanded={open} aria-controls="answer" onclick={() => open = !open}>\n  How does removal work?\n</button>\n{#if open}\n  <div id="answer" class="answer" {...panel.props} transition:reveal|global>\n    <p>The native branch remains mounted until its exit finishes.</p>\n  </div>\n{/if}\n\n<style>\n  .answer { overflow: hidden; }\n</style>'
				}
			},
			{
				id: 'dialog-recipe',
				title: 'Close a dialog after a settled exit',
				text: [
					'The browser dialog retains modal behavior and focus handling. Animate its close while the dialog is still open; close only after successful completion. settled also resolves when playback is interrupted or its owner detaches, so the close handler cannot wait forever. Preserve the headless primitive’s equivalent lifecycle when using a dialog library.'
				],
				code: {
					label: 'Complete Svelte example',
					source:
						'<script lang="ts">\n  import { useAnimate } from \'astra-motion\';\n  const [scope, animate] = useAnimate<HTMLDialogElement>();\n  let closing = $state(false);\n  function open() {\n    scope.current?.showModal();\n  }\n  async function close() {\n    const dialog = scope.current;\n    if (!dialog || closing) return;\n    closing = true;\n    const result = await animate(dialog, { opacity: [1, 0] }, { duration: 0.15 }).settled;\n    if (result.status === \'finished\' && dialog.isConnected) dialog.close();\n    dialog.style.removeProperty(\'opacity\');\n    closing = false;\n  }\n</script>\n\n<button onclick={open}>Edit profile</button>\n<dialog {@attach scope.attach} aria-labelledby="profile-title"\n  oncancel={(event) => { event.preventDefault(); void close(); }}>\n  <h2 id="profile-title">Edit profile</h2>\n  <label>Name <input /></label>\n  <button onclick={close} disabled={closing}>Close</button>\n</dialog>'
				}
			},
			{
				id: 'headless-recipe',
				title: 'Keep a headless component’s behavior',
				text: [
					'This recipe assumes Bits UI is installed in your application. Its primitive continues to own focus trapping, Escape, IDs, ARIA and return focus. mergeProps preserves its events, refs and attachments while adding the native motion binding.',
					'forceMount exposes the primitive’s open state to a child snippet; the native if block and transition own the animated removal. Keep that branch when enabling forceMount. The portaled surface has its own binding; do not declare a native visual parent outside the portal. Verify Escape, return focus, rapid reopen and owner removal in your application.'
				],
				code: {
					label: 'Complete Svelte example',
					source:
						"<script lang=\"ts\">\n  import { Dialog, mergeProps } from 'bits-ui';\n  import { motion } from 'astra-motion';\n  const panel = motion.bind({\n    initial: { opacity: 0, scale: 0.96 },\n    animate: { opacity: 1, scale: 1 },\n    exit: { opacity: 0, scale: 0.96 },\n    transition: { duration: 0.15 },\n    reducedMotion: 'user'\n  });\n  const enterExit = panel.transition;\n</script>\n\n<Dialog.Root>\n  <Dialog.Trigger>Open settings</Dialog.Trigger>\n  <Dialog.Portal>\n    <Dialog.Content forceMount>\n      {#snippet child({ props, open })}\n        {#if open}\n          <div {...mergeProps(props, panel.props)} class=\"panel\" transition:enterExit|global>\n            <Dialog.Title>Settings</Dialog.Title>\n            <Dialog.Description>Motion preserves this dialog’s interaction contract.</Dialog.Description>\n            <label>Name <input /></label>\n            <Dialog.Close>Close</Dialog.Close>\n          </div>\n        {/if}\n      {/snippet}\n    </Dialog.Content>\n  </Dialog.Portal>\n</Dialog.Root>\n\n<style>\n  .panel { position: fixed; inset: 0; margin: auto; width: min(90vw, 320px); height: fit-content; padding: 24px; background: white; color: black; }\n</style>"
				}
			},
			{
				id: 'configuration',
				title: 'Choose an accessible policy',
				text: [
					'Place MotionConfig reducedMotion="user" around the application’s animated content. The primary motion API otherwise defaults to never, matching the qualified upstream behavior. User policy removes transform and layout travel when the device requests reduced motion; paint effects can still animate.',
					'Use useReducedMotion to choose a different technique when automatic transform reduction is not enough. Supply pause controls for continuing decoration and keep the interaction meaningful without animation.'
				],
				code: {
					label: 'Application layout wrapper · excerpt',
					source:
						'<MotionConfig reducedMotion="user" transition={{ duration: 0.25 }}>\n  {@render children()}\n</MotionConfig>'
				},
				related: ['motion-config', 'accessibility']
			},
			{
				id: 'ssr',
				title: 'Render and hydrate useful content',
				text: [
					'Initial targets are rendered into the server HTML. Browser effects, pointer listeners and frame loops start after mounting and are released on destruction. initial={false} renders the animate destination immediately and suppresses the first entrance.',
					'Server code cannot know the device’s media preference or viewport measurements. Keep essential content available in the initial output; avoid hiding the only way to understand or operate the page. Imperative animation must start after its browser scope is attached.'
				]
			},
			{
				id: 'migration',
				title: 'Migrate existing Astra components',
				text: [
					'createMotion has been removed. Replace it with motion.bind and retain the props spread and native exit directive. Bindings now share motion.* initial styles, transform precedence, drag behavior and reducedMotion: never; choose user explicitly to follow the OS. createLayout controllers, createAnimate scopes, createScroll and Presence remain supported. The motion={{ ... }} prop still works; defined direct props override it.',
					'Presence keeps its historical wait default. AnimatePresence defaults to sync and uses present, items with a stable key, or value with an optional key selector. Replace a legacy Presence only when you need the new coordination contract. Reuse real item identity rather than array positions for reorderable collections.',
					'HTML and SVG are both supported. Custom Svelte components must forward the attachment props to one native root when wrapped with motion.create. The generic Motion component remains available; native value bindings belong to the generated tag components.'
				],
				related: ['animate-presence', 'motion', 'layout-group']
			},
			{
				id: 'troubleshooting',
				title: 'Resolve the first integration issue',
				text: [
					'If an import is missing, check the documented public entry and reinstall the supplied archive. Package maintainers should rebuild before creating a replacement archive. If a helper reports a lifecycle error, move its initialization into component setup and start playback only after mounting. If an exit is missing, check which boundary actually removes the content.',
					'For CSS selector rules, motion.bind keeps the actual element in your component’s scoped selector set. A motion.* component root is outside that set; pass a class with an intentional :global selector or use a shared stylesheet. Ordinary inline text needs inline-block or block display before transforms can move it.'
				]
			},
			{
				id: 'related',
				title: 'Continue learning',
				text: [],
				related: ['animations', 'motion', 'accessibility', 'reduce-bundle-size']
			}
		]
	},
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
					'Focus appearance must remain visible throughout an animation. Native buttons already handle keyboard activation. whileFocus follows focus-visible; whileTap supports the upstream Enter interaction. Use native click behavior for actions rather than treating pointer callbacks as a keyboard implementation.',
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
				title: 'Reveal words with variants',
				text: [
					'Split a plain message into words and whitespace, render the words as inline-block motion spans, and let a parent variant stagger them. Whitespace remains text so wrapping and punctuation follow the original message. The example is finite and provides a replay button.',
					'A complete visually hidden message supplies the semantic text. The animated duplicate is aria-hidden, which prevents a screen reader from encountering each visual fragment as a separate piece. Keep interactive text such as links in the semantic reading flow instead of putting it in the decorative duplicate.'
				],
				example: 'text-animation',
				related: ['animations', 'transitions', 'accessibility']
			},
			{
				id: 'segments',
				title: 'Choose the right segmentation',
				text: [
					'Word animation is often easier to read than moving each character. For grapheme-level animation, use Intl.Segmenter with granularity="grapheme" rather than splitting UTF-16 strings. That keeps emoji sequences, combining marks and many writing systems intact. Set the correct lang and preserve the source reading order.',
					'Line animation depends on fonts, container width and wrapping. Use explicit lines when the design permits, or measure after fonts load and update after resize with useActivityEffect cleanup. Astra does not include a DOM text-splitting plugin in this surface; rendering Svelte-owned spans is the supported approach.'
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
					'Use AnimatePresence with a stable label key when old text should leave before its replacement enters. mode="wait" coordinates one replacement at a time; sync overlaps both. Keep the surrounding semantic control mounted so a label animation does not replace its focusable button.',
					'Short vertical movement and opacity often communicate a label change clearly. Match the inline or block host to the text layout, and reserve enough space so controls do not jump unexpectedly.'
				],
				code: {
					label: 'Label replacement · focused excerpt',
					source:
						'<button onclick={advance}>\n  <AnimatePresence value={label} mode="wait">\n    {#snippet children(text)}\n      <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>\n        {text}\n      </motion.span>\n    {/snippet}\n  </AnimatePresence>\n</button>'
				},
				related: ['animate-presence']
			},
			{
				id: 'reduced-motion',
				title: 'Reduce movement and preserve content',
				text: [
					'The word example uses MotionConfig reducedMotion="user". Transform travel settles when reduction is requested; its short opacity reveal can continue. For a long stagger, choose one immediate appearance instead. Read useReducedMotion when the whole technique should change.',
					'On the server, choose initial content that remains useful if scripts fail. Do not animate an entire article from opacity zero without an accessible fallback. For decorative headings, a hidden duplicate can preserve reading semantics while the visible spans enter.'
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
