import { release } from '../release.js';
import type { DocPage } from '../doc-types.js';

export const startDocs: DocPage[] = [
	{
		slug: 'quick-start',
		title: 'Quick start',
		group: 'Start',
		summary:
			'Install Astra, ship a first animation, and learn the three ideas the rest of the docs build on.',
		sections: [
			{
				id: 'installation',
				title: 'Install the package',
				text: [
					'Astra is Motion for Svelte 5. You tell an element where it should end up, and Astra’s engine — the one that powers Motion — animates it there from wherever it is now. When the destination changes mid-flight, the animation turns smoothly instead of restarting. Your state stays in Svelte; Astra never mirrors it.',
					'Use Svelte 5.57.0 or newer within Svelte 5. SvelteKit is optional; the routes and view-navigation adapters require Kit 2.70.3 or newer within Kit 2. The archive bundles its Motion engine; import MotionValues from Astra so they share that engine. Three ideas carry the whole library. Everything else — gestures, layout, scroll, values — hangs off them.'
				],
				points: [
					'Targets describe a destination: animate={{ opacity: 1 }}.',
					'Transitions describe the travel: springs, tweens, stagger.',
					'Presence describes appearing and disappearing: initial, exit, AnimatePresence.'
				],
				code: {
					label: 'Install Astra',
					source: `# Release candidate: install the supplied archive\n# from your application directory:\npnpm add /absolute/path/to/${release.archive}`
				},
				links: [
					{
						path: '/status',
						title: 'Release status',
						detail: 'Review candidate installation and supported behavior.'
					}
				]
			},
			{
				id: 'first-animation',
				title: 'Ship a first animation',
				text: [
					'This is a complete component. The notification animates in when it appears, and the browser waits for its exit before removing it.'
				],
				example: 'state',
				related: ['animate-presence', 'motion']
			},
			{
				id: 'notices',
				title: 'What just happened',
				text: [],
				points: [
					'State is ordinary: visible is $state and onclick is the native lowercase event. Astra reacts to Svelte assignments and owns no store of yours.',
					'The element stays native: motion.div renders a real div with your classes and attributes. Use motion.bind for native scoped CSS; motion.* roots need an intentional :global selector. There is no wrapper element.',
					'Exit is automatic here: a motion element inside an if block waits for its exit before removal. Sequencing, keyed replacement and manual completion are jobs for AnimatePresence.'
				],
				related: ['animations', 'animate-presence']
			},
			{
				id: 'make-it-yours',
				title: 'Change the destination from state',
				text: [
					'The same three props carry every interaction. animate is the destination; whileTap is a gesture — a temporary target that takes over while the pointer is down and hands control back when it ends. Hover, focus, drag and viewport reactions follow the same shape.'
				],
				related: ['gestures', 'transitions'],
				code: {
					label: 'Complete reactive button',
					source:
						"<script lang=\"ts\">\n import { motion } from 'astra-motion';\n let selected = $state(false);\n</script>\n<motion.button aria-pressed={selected} onclick={() => selected = !selected}\n animate={{ scale: selected ? 1.1 : 1 }} whileTap={{ scale: 0.95 }}>\n {selected ? 'Selected' : 'Choose item'}\n</motion.button>"
				}
			},
			{
				id: 'keep-the-element',
				title: 'Keep the element you have',
				text: [
					'Working with existing markup, or a component library that renders its own elements? motion.bind attaches the engine to an element you already own, keeping Svelte directives, bind:group and your scoped CSS.',
					'motion.create(Component) is the third path, for your own components. Both paths share the motion.* defaults and lifecycle.'
				],
				code: {
					label: 'Complete Svelte example',
					source:
						'<script lang="ts">\n  import { motion } from \'astra-motion\';\n  let shown = $state(true);\n  let selected = $state<string[]>([]);\n  const choice = motion.bind(() => ({\n    initial: { opacity: 0 },\n    animate: { opacity: 1, scale: selected.includes(\'news\') ? 1.1 : 1 },\n    exit: { opacity: 0 },\n    transition: { duration: 0.2 },\n    reducedMotion: \'user\'\n  }));\n  const enterExit = choice.transition;\n</script>\n\n<button onclick={() => shown = !shown}>Toggle choices</button>\n{#if shown}\n  <fieldset>\n    <legend>Subscriptions</legend>\n    <label><input class="choice" type="checkbox" value="news" bind:group={selected}\n      {...choice.props} transition:enterExit|global /> News</label>\n    <label><input type="checkbox" value="events" bind:group={selected} /> Events</label>\n  </fieldset>\n{/if}\n<p>Selected: {selected.join(\', \') || \'None\'}</p>\n\n<style>\n  .choice { accent-color: teal; outline-offset: 4px; }\n</style>'
				},
				related: ['motion', 'animate-presence']
			},
			{
				id: 'where-next',
				title: 'Where next',
				text: [
					'Learn is the ordered learning path. Guides holds recipes and the accessibility contract; the component and helper pages are reference.'
				],
				links: [
					{
						slug: 'animations',
						title: 'Animating targets',
						detail: 'Keyframes, variants and interruption: the vocabulary you just used, properly.'
					},
					{
						slug: 'transitions',
						title: 'Transitions',
						detail: 'Springs, durations, stagger, and sequencing a family of animations.'
					},
					{
						slug: 'presence',
						title: 'Presence',
						detail: 'Everything beyond the if-block exit you just used.'
					},
					{
						path: '/showcase',
						title: 'Fieldwork: a complete application',
						detail:
							'A contact sheet, editing desk, publishing queue and reading experience built with Astra.'
					},
					{
						slug: 'coming-from-react',
						title: 'Coming from Motion for React',
						detail: 'Your animate, variants and whileHover knowledge transfers directly.'
					}
				],
				related: ['layout', 'accessibility']
			}
		],
		learning:
			'Install the candidate, animate a notification, change a target and keep native markup.'
	},
	{
		slug: 'recipes',
		title: 'Recipes',
		group: 'Guides',
		summary:
			'Complete recipes for changing panels, accordion reveals, dialogs and headless primitives.',
		sections: [
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
				},
				related: ['animate-presence', 'animate-activity']
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
				},
				related: ['motion', 'accessibility']
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
				},
				related: ['use-animate', 'accessibility']
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
				},
				related: ['motion', 'accessibility']
			},
			{
				id: 'ssr',
				title: 'Render and hydrate useful content',
				text: [
					'Initial targets are rendered into the server HTML. Browser effects, pointer listeners and frame loops start after mounting and are released on destruction. initial={false} renders the animate destination immediately and suppresses the first entrance.',
					'Server code cannot know the device’s media preference or viewport measurements. Keep essential content available in the initial output; avoid hiding the only way to understand or operate the page. Imperative animation must start after its browser scope is attached.'
				],
				related: ['motion', 'accessibility']
			},
			{
				id: 'troubleshooting',
				title: 'Resolve the first integration issue',
				text: [
					'If an import is missing, check the documented public entry and reinstall the supplied archive. Package maintainers should rebuild before creating a replacement archive. If a helper reports a lifecycle error, move its initialization into component setup and start playback only after mounting. If an exit is missing, check which boundary actually removes the content.',
					'For CSS selector rules, motion.bind keeps the actual element in your component’s scoped selector set. A motion.* component root is outside that set; pass a class with an intentional :global selector or use a shared stylesheet. Ordinary inline text needs inline-block or block display before transforms can move it.'
				],
				related: ['motion', 'accessibility', 'coming-from-react']
			}
		]
	},
	{
		slug: 'coming-from-react',
		title: 'Coming from Motion for React',
		group: 'Guides',
		summary:
			'Transfer your Motion knowledge: what keeps its name, what changes shape, and which helpers remain supported.',
		sections: [
			{
				id: 'familiar',
				title: 'What transfers directly',
				text: [
					'Keep familiar initial, animate, exit, variants and gesture targets. Replace JSX expressions and React state with ordinary Svelte expressions and $state. Motion helpers named use* are component setup helpers; Svelte runs setup once, so there is no React render call-order model or dependency array.',
					'Set MotionConfig reducedMotion="user" when the application should follow device preferences, exactly as you would in React.'
				],
				related: ['animations', 'transitions']
			},
			{
				id: 'presence-api',
				title: 'Presence changes shape',
				text: [
					'AnimatePresence accepts explicit present, keyed items, or one value. Snippets are opaque, so the boundary cannot inspect child element keys. For a selected record, pass value={selected} and render the retained snippet argument. For a list, pass items and a stable key function.',
					'AnimatePresence defaults to sync. The older Presence component keeps its historical value-based API and wait default; replace it only when you need the new coordination contract.'
				],
				related: ['animate-presence', 'animate-activity']
			},
			{
				id: 'markup-choices',
				title: 'Choose your markup path',
				text: [
					'Choose motion.* for new elements, motion.bind for existing native markup, and motion.create for reusable custom components that forward attachments to one native root. Custom components must spread forwarded props, including attachment symbols, onto the actual root element.',
					'Native value bindings such as bind:value and bind:checked use the compiled tag components. For bind:group, use native inputs with motion.bind so Svelte owns the group in one component.'
				],
				related: ['motion', 'recipes']
			},
			{
				id: 'legacy-helpers',
				title: 'Earlier Astra APIs',
				text: [
					'createMotion has been removed. Replace it with motion.bind and retain the props spread and native exit directive. createLayout controllers, createAnimate scopes, createScroll, createInView and Presence remain supported for existing code; new code uses the layout prop, useAnimate, useScroll, useInView and AnimatePresence.',
					'The motion={{ ... }} component prop still works; defined direct props override matching object options. Legacy controls.set with several labels follows Motion’s first-label-wins order, while declarative target arrays use last-label-wins.'
				],
				related: ['motion', 'use-animate']
			},
			{
				id: 'helpers',
				title: 'Helpers and reactivity',
				text: [
					'Managed use* helpers initialize in component setup and dispose their work automatically. Accept reactive getters where arguments may change, such as useScroll(() => ({ container })). Reactive booleans expose a .current getter; read it where you use it instead of destructuring a one-time primitive.',
					'Reorder.Group bind:values={items} updates Svelte state automatically. Supplying onReorder preserves controlled acceptance and rejection, even alongside binding.'
				],
				related: ['motion-values', 'reorder']
			}
		]
	}
];
