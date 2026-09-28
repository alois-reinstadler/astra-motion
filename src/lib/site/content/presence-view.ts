import type { DocPage } from '../doc-types.js';

export const presenceViewDocs: DocPage[] = [
	{
		slug: 'animate-presence',
		title: '<AnimatePresence>',
		group: 'Components',
		summary:
			'Keep outgoing content mounted until its exits finish, coordinate replacements, and remove list items without a layout jump.',
		sections: [
			{
				id: 'usage',
				title: 'Remove content after its exit',
				text: [
					'AnimatePresence owns the lifetime of content that is leaving your interface. Put the visibility condition on its present prop and give a descendant motion element an exit target. When present becomes false, the content stays mounted until all registered exits and application-owned removal work finish.',
					'The boundary adds no DOM wrapper. Keep AnimatePresence itself mounted: removing the boundary also removes its ability to retain its children. A plain Svelte if block is still useful for a single native outro; use AnimatePresence when the removal needs shared data, sequencing, nested coordination, or manual completion.',
					'Try dismissing and showing the note quickly. Returning content with the same key cancels removal and reuses its current instance. initial={false} suppresses entrance animation only for content present on the boundary’s first render.'
				],
				example: 'animate-presence',
				related: ['motion', 'animations', 'animate-activity']
			},
			{
				id: 'keyed-content',
				title: 'Replace content and retain list identity',
				text: [
					'For a list or keyed replacement, pass items and a key function. The children snippet receives one item. Each key must be a unique string, number, or symbol that stays associated with the same logical item. Use an item ID rather than its array position.',
					'Changing an item’s data while preserving its key updates the existing instance. Removing the key starts its exit and retains the last item data for that outgoing instance. Adding a different key creates an entering instance. Use items={[selected]} for a single keyed replacement.',
					'Svelte snippets are functions rather than inspectable child element descriptions. The explicit present or items/key boundary supplies the identity Astra needs to retain content. Do not place an if block inside a permanently present snippet and expect the outer boundary to infer its removal.'
				],
				code: {
					label: 'Focused list excerpt',
					source: `<AnimatePresence {items} key={(item) => item.id}>
  {#snippet children(item)}
    <motion.li exit={{ opacity: 0 }}>
      {item.title}
    </motion.li>
  {/snippet}
</AnimatePresence>`
				}
			},
			{
				id: 'sequencing',
				title: 'Choose when the next child enters',
				text: [
					'sync is the default. Incoming and outgoing records coexist, and their animations start as their state changes. The boundary does not position overlapping elements for you; use grid placement or absolute positioning where the composition requires it.',
					'wait holds the next child until the outgoing child has completed. It supports at most one requested child. A second change during the exit replaces the pending destination, so the latest requested item appears next. Returning the outgoing key reverses removal instead of creating a duplicate.',
					'An exit can use easeIn and the following entrance easeOut to produce a deliberate handoff. Use per-target transition options on the motion child when entrance and exit need different timing.'
				],
				example: 'animate-presence-sequence'
			},
			{
				id: 'pop-layout',
				title: 'Let remaining items fill the space',
				text: [
					'popLayout records outgoing root boxes and places those roots outside normal flow for the duration of their exits. The other items can occupy the freed space immediately. Add layout animation to the siblings and share their layout group when they must measure together.',
					'Use a positioned containing block, such as position: relative on the list. A transformed ancestor may also establish an absolute-position containing block. Size and position are captured before the temporary positioning styles are written, and those styles are removed on completion or re-entry.',
					'Motion elements register their roots automatically. For plain or custom content, call presenceRoot() inside the retained child component and attach it to the actual HTML root. Forward that attachment through your custom component when necessary. A fragment can register more than one root. SVG can animate its exit, but popLayout’s absolute-position extraction applies to HTML roots.'
				],
				example: 'animate-presence-list',
				related: ['layout', 'layout-group']
			},
			{
				id: 'exit-data',
				title: 'Pass current data into an outgoing child',
				text: [
					'An item’s ordinary props stop following the requested list once it has been removed. Use the boundary’s custom prop for data that must keep reaching that outgoing subtree, such as the latest navigation direction. Dynamic exit variants on motion descendants receive this custom value.',
					'usePresenceData<T>() returns a reactive object with a current property. Read current when rendering or inside a reactive computation; destructuring a value once does not keep it reactive. The generic describes your application data and does not validate it at runtime.',
					'When a direction changes during an active exit, Astra retains the removal generation while updating the exit data. Rapid re-entry creates a new generation, so a late completion from an earlier exit cannot remove the restored child.'
				],
				code: {
					label: 'Focused directional variant excerpt',
					source: `<AnimatePresence items={[slide]} key={(item) => item.id} custom={direction}>
  {#snippet children(item)}
    <motion.article
      variants={{
        exit: (direction: number) => ({ x: direction * -120, opacity: 0 })
      }}
      exit="exit"
    >
      {item.title}
    </motion.article>
  {/snippet}
</AnimatePresence>`
				}
			},
			{
				id: 'manual-removal',
				title: 'Coordinate application-owned exit work',
				text: [
					'useIsPresent().current reports whether the nearest retained record is still requested. It does not delay removal. usePresence() adds a removal registration and returns reactive isPresent plus safeToRemove. Call safeToRemove after your own animation or asynchronous cleanup finishes.',
					'Read safeToRemove when starting the current exit and retain that callback with the work it belongs to. It captures the exit generation. Cancel the work when the child returns or is destroyed. Every registered child must finish or release its registration before the enclosing record can disappear.',
					'Call these helpers during component initialization. Outside a presence boundary, isPresent is true, presence data is undefined, and safeToRemove is a no-op. A forgotten manual completion intentionally keeps the outgoing record mounted.'
				],
				code: {
					label: 'ManualExit.svelte — complete child component',
					source: `<script lang="ts">
  import { usePresence } from 'astra-motion';
  const presence = usePresence();
  let element = $state<HTMLDivElement>();

  $effect(() => {
    if (presence.isPresent || !element) return;
    const remove = presence.safeToRemove;
    const animation = element.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 200, fill: 'forwards' }
    );
    void animation.finished.then(remove, () => {});
    return () => animation.cancel();
  });
</script>

<div bind:this={element}>Application-owned exit</div>`
				}
			},
			{
				id: 'nested',
				title: 'Compose nested boundaries',
				text: [
					'A nested AnimatePresence normally defines a separate exit scope. Its children do not begin their own exits solely because an outer boundary starts removing the containing record. Set propagate on the inner boundary to forward that removal and make the parent wait for its descendants.',
					'Propagation composes with manual removal and with another nested boundary. Re-entry restores the requested inner items and invalidates old completion callbacks. Removing a child directly from the inner items list still runs that child’s exit independently.',
					'Use onExitComplete on the boundary for work that depends on all currently outgoing records being removed. It runs once when that exit batch finishes; an interrupted batch that becomes present again does not count as a completed exit.'
				],
				code: {
					label: 'Focused nested boundary excerpt',
					source: `<AnimatePresence present={open}>
  <motion.section exit={{ opacity: 0 }}>
    <AnimatePresence {items} key={(item) => item.id} propagate>
      {#snippet children(item)}
        <motion.p exit={{ y: 12, opacity: 0 }}>{item.label}</motion.p>
      {/snippet}
    </AnimatePresence>
  </motion.section>
</AnimatePresence>`
				}
			},
			{
				id: 'props',
				title: 'Props and defaults',
				text: ['Choose either present or items with key. All other props apply to both forms.'],
				table: {
					columns: ['Prop', 'Default', 'Contract'],
					rows: [
						[
							'present',
							'true',
							'Boolean visibility request for one retained snippet; mutually exclusive with items.'
						],
						[
							'items',
							'Not supplied',
							'Readonly array of items rendered as separate retained records.'
						],
						[
							'key',
							'Required with items',
							'(item) => string | number | symbol. Duplicate keys throw.'
						],
						[
							'children',
							'Required',
							'Snippet receiving the item; the present form receives undefined. No wrapper element is added.'
						],
						[
							'initial',
							'true',
							'false suppresses initial animations for records on the first render. Later entrants animate normally.'
						],
						[
							'mode',
							'sync',
							'sync overlaps records; wait sequences one requested child; popLayout removes outgoing HTML roots from flow.'
						],
						[
							'custom',
							'undefined',
							'Current exit data passed to retained descendants and dynamic exit variants.'
						],
						[
							'propagate',
							'false',
							'Runs this boundary’s exits when its outer retained record exits.'
						],
						[
							'presenceAffectsLayout',
							'true',
							'Invalidates coordinated layout measurement when presence changes. false omits this extra invalidation; real DOM layout changes still trigger measurement.'
						],
						[
							'onExitComplete',
							'undefined',
							'() => void, called after all outgoing records in the batch finish.'
						],
						[
							'anchorX / anchorY',
							'left / top',
							'Horizontal and vertical anchors for popLayout; anchorX accounts for the root’s text direction.'
						],
						[
							'root',
							'Element ownerDocument.head',
							'HTMLElement or ShadowRoot receiving temporary popLayout styles.'
						],
						[
							'nonce',
							'Inherited when configured',
							'CSP nonce applied to temporary popLayout style elements.'
						]
					]
				}
			},
			{
				id: 'lifecycle',
				title: 'Reactivity, SSR, and accessibility',
				text: [
					'Changes to present, items, mode, custom, and propagation are reactive. Outgoing records keep their Svelte component instances until completion. A boundary destroyed by its parent releases its registrations and temporary styles; it cannot retain content after its own lifetime ends.',
					'SSR renders the requested content without running browser animation or manual effects. Use the same initial state when hydrating. initial={false} is useful for content that should already be in its settled appearance on the first paint.',
					'An outgoing element is still in the DOM and can still contain focusable controls. For a dismissed dialog or menu, move focus to the appropriate trigger and disable outgoing interaction as part of your application state. Use MotionConfig to apply a reduced-motion policy; completion still coordinates removal when animation is reduced.'
				],
				related: ['motion-config', 'accessibility']
			},
			{
				id: 'troubleshooting',
				title: 'Troubleshooting and migration',
				text: [
					'If an exit never appears, keep the boundary mounted, put the condition on present or remove a key from items, and confirm the retained subtree contains an exit animation. If removal never finishes, inspect every usePresence registration and release any application-owned work.',
					'If a list item changes identity unexpectedly, replace index keys with stable IDs. wait with more than one requested item throws rather than silently rendering an ambiguous sequence. For popLayout positioning errors, check the containing block and register the real root of custom children.',
					'The existing Presence component remains available with its value-based API and wait default. AnimatePresence defaults to sync. A keyed Presence value={value} maps to AnimatePresence items={[value]} key={(item) => item}; its snippet continues to receive that value. Choose mode="wait" explicitly when retaining the older sequencing behavior.'
				],
				related: ['animate-activity', 'animate-view', 'layout-group']
			}
		]
	},
	{
		slug: 'animate-activity',
		title: '<AnimateActivity>',
		group: 'Components',
		summary:
			'Animate a panel out of view while preserving its component instances, input values, and DOM state for the next reveal.',
		sections: [
			{
				id: 'usage',
				title: 'Hide a panel without recreating it',
				text: [
					'AnimateActivity changes visibility while retaining its children. Set mode to visible or hidden and define entrance and exit targets on motion descendants. A hidden request first runs the coordinated exits; only after they finish does the retained host switch to display: none.',
					'Type in the input, hide the editor, and reveal it again. The same input node remains mounted, so its native value survives without copying it into parent state. This is useful for editor tabs, settings panels, and other expensive views that should resume where the user left them.',
					'Keep AnimateActivity mounted while switching its mode. An outer if block that removes the boundary also destroys the retained state. Use AnimatePresence when the content should eventually be removed.'
				],
				example: 'animate-activity',
				related: ['animate-presence', 'motion']
			},
			{
				id: 'phases',
				title: 'Understand visibility and exit phases',
				text: [
					'A visible panel responds to mode="hidden" by becoming inert and entering its exiting phase. Descendant motion exits and usePresence removal registrations finish together. Astra-owned animation work remains active during this phase so the exit can complete.',
					'After completion the phase becomes hidden, the host uses display: none, and activity-aware Astra work is suspended. Revealing it makes the retained subtree active and lets its animate targets run again. No initial entrance is replayed merely because the same child is shown again.',
					'An externally animated MotionValue keeps its original owner. Hiding a component that reads that value stops its rendering without pausing playback used by visible consumers. An animate target or animation-controls command that starts playback on the value owns that playback and pauses it with the component.',
					'If the panel is revealed before its exit finishes, it returns to visible immediately and its in-flight removal generation is invalidated. The input and component identities are retained through the reversal. A panel initially rendered hidden does not run an entrance or an exit before becoming hidden.'
				],
				table: {
					columns: ['Requested mode', 'Phase', 'Active'],
					rows: [
						['visible', 'visible', 'true, unless an ancestor Activity is hidden'],
						['hidden, exits unfinished', 'exiting', 'true, unless an ancestor Activity is hidden'],
						['hidden, exits finished', 'hidden', 'false']
					]
				}
			},
			{
				id: 'activity-effects',
				title: 'Suspend application effects deliberately',
				text: [
					'useActivity() returns reactive mode, phase, and active properties for the nearest boundary. active also accounts for hidden ancestors. Read these properties inside markup or reactive computations instead of destructuring their initial values.',
					'useActivityEffect(effect) runs an effect while its Activity is active, calls its cleanup when the panel becomes hidden, and reruns it on reveal. Reactive values read by the effect participate in normal Svelte dependency tracking. Use it for timers, event subscriptions, media work, or a resource that should stop while hidden.',
					'Call both helpers while initializing a descendant component. Without an Activity ancestor, useActivity reports visible/visible/true and useActivityEffect behaves as an ordinary lifecycle-managed effect. Activity effects do not execute during SSR.'
				],
				code: {
					label: 'PanelClock.svelte — complete child component',
					source: `<script lang="ts">
  import { useActivity, useActivityEffect } from 'astra-motion';
  const activity = useActivity();
  let seconds = $state(0);

  useActivityEffect(() => {
    const timer = setInterval(() => seconds++, 1000);
    return () => clearInterval(timer);
  });
</script>

<p>Active for {seconds} seconds. Phase: {activity.phase}.</p>`
				}
			},
			{
				id: 'svelte-lifecycle',
				title: 'The Svelte lifecycle contract',
				text: [
					'Ordinary Svelte $effects and onMount resources remain active while the panel is hidden. Svelte 5 does not provide a public primitive for disconnecting and recreating every effect in a mounted component subtree. Use useActivityEffect for application work that needs cleanup on hiding.',
					'This approved Svelte adaptation retains DOM and component state without changing Svelte’s scheduler priority, background rendering, or the lifecycle of arbitrary third-party resources.',
					'The upstream AnimateActivity reference was still a Motion+ alpha on 27 September 2026, requiring Motion 12.23.24 or later and React 19.2 or later. Astra’s documented contract is the Svelte behavior described here; no React dependency or Motion+ token is required.'
				]
			},
			{
				id: 'layout',
				title: 'Choose when the panel releases its space',
				text: [
					'layoutMode="preserve" keeps the exiting child roots in layout until their exits finish. layoutMode="pop" takes registered HTML roots out of flow during the exit so other content can move into place immediately. The panel is removed from layout when fully hidden in either mode.',
					'Motion descendants register roots automatically. Use presenceRoot() on plain or custom child roots when using pop mode. Coordinate surrounding layout animation with LayoutGroup or an existing layout group, and provide a positioned containing block for popped roots.',
					'AnimateActivity renders a retained HTML host. It uses display: contents while visible or exiting and display: none while hidden. The as prop chooses a semantic tag appropriate for the surrounding markup. Keep as stable: changing the host tag would recreate descendants and throws while the boundary is mounted.'
				],
				related: ['layout', 'layout-group', 'animate-presence']
			},
			{
				id: 'props',
				title: 'Props and defaults',
				text: [
					'Ordinary HTML attributes and event handlers apply to the retained host. Place visual layout styles on the child roots because the active host uses display: contents.'
				],
				table: {
					columns: ['Prop', 'Default', 'Contract'],
					rows: [
						[
							'mode',
							'visible',
							'visible or hidden; controls the visibility request without removing children.'
						],
						[
							'layoutMode',
							'preserve',
							'preserve or pop; decides whether exiting roots retain their layout space.'
						],
						[
							'as',
							'div',
							'Stable HTML host tag: div, span, section, article, aside, main, nav, ul, ol, li, tbody, thead, tfoot, tr, td, or th.'
						],
						['children', 'Required', 'Snippet kept mounted inside the retained host.'],
						[
							'initial',
							'true',
							'false suppresses initial entrance. An initially hidden Activity also suppresses initial animation.'
						],
						[
							'custom',
							'undefined',
							'Reactive data for descendant exit variants and usePresenceData.'
						],
						[
							'onExitComplete',
							'undefined',
							'() => void after an active exit finishes and the panel becomes hidden; not called for an interrupted exit or initial hidden render.'
						],
						['ref', 'undefined', 'bind:ref receives the retained HTMLElement.'],
						['anchorX / anchorY', 'left / top', 'Anchors used by layoutMode="pop".'],
						[
							'root',
							'Element ownerDocument.head',
							'Style insertion HTMLElement or ShadowRoot for popped roots.'
						],
						['nonce', 'Inherited when configured', 'CSP nonce for the temporary pop styles.'],
						[
							'style / inert / HTML attributes',
							'Not supplied',
							'Forwarded to the host. Astra owns its display value and enforces inert immediately after hidden is requested.'
						]
					]
				}
			},
			{
				id: 'ssr-accessibility',
				title: 'SSR, focus, and reduced motion',
				text: [
					'An initially hidden Activity is included in SSR output with a hidden, inert host. Hydration retains that DOM rather than creating an extra visible frame. Use matching server and client mode values.',
					'Hidden content is removed from layout and the accessibility tree. The exiting subtree is inert as soon as hiding is requested, so its controls cannot receive new interaction while it fades away. Move focus to a visible trigger before hiding a panel that currently owns focus; revealing it does not automatically restore focus.',
					'Use MotionConfig to reduce motion while keeping the same retention and completion behavior. A shorter or immediate exit still transitions through the same lifecycle and releases activity-aware resources once hidden.'
				],
				related: ['accessibility', 'motion-config']
			},
			{
				id: 'troubleshooting',
				title: 'Troubleshooting',
				text: [
					'If input state resets, confirm that the Activity itself, its as tag, and any inner keyed component identity stay mounted across mode changes. Hiding with an outer if block bypasses retention.',
					'If work continues while hidden, check whether it belongs to an ordinary $effect or third-party resource. Move that work into useActivityEffect or use activity.active to manage it explicitly. A child of a hidden Activity remains inactive even if its own nested Activity requests visible.',
					'If the panel never reaches hidden, inspect manual usePresence registrations. Every such holder must call its captured safeToRemove callback or be destroyed. If the layout shifts unexpectedly, check layoutMode and the containing block for popped roots.'
				],
				related: ['animate-presence', 'animate-view']
			}
		]
	},
	{
		slug: 'animate-view',
		title: '<AnimateView>',
		group: 'Components',
		summary:
			'Coordinate browser snapshots for page changes, content updates, and shared elements across different DOM trees.',
		sections: [
			{
				id: 'usage',
				title: 'Name a view and coordinate its update',
				text: [
					'AnimateView animates browser snapshots. Wrap a root in its children snippet, attach the supplied view attachment to that root, and change ordinary Svelte state inside startViewTransition. The component adds no wrapper and preserves the element’s native attributes, bindings, and semantics.',
					'The example replaces one article with another. Both boundaries use the same name, so the browser connects their positions and sizes. The entering boundary supplies shared-transition options. Omit name when the boundary only needs its own enter, exit, or update animation.',
					'Explicit coordination is the Svelte counterpart to React transition scheduling: an arbitrary state assignment outside startViewTransition remains an ordinary immediate update. Choose snapshot transitions for route changes or full-view swaps. Use motion layout animation for continuous interactions that must change direction from their current animated position.'
				],
				example: 'animate-view',
				related: ['layout', 'animate-presence']
			},
			{
				id: 'animation-types',
				title: 'Enter, exit, update, and share',
				text: [
					'enter runs when a registered root appears, exit when it disappears, update when the same boundary changes its content, visual style, size, or position, and share when one boundary leaves and a different boundary with the same name enters in the same transaction.',
					'The default uses the browser’s crossfade plus geometry animation. The transition prop configures timing for every type, and transition.layout overrides size and position timing. Each type accepts its own target and transition overrides.',
					'Names must be unique within each before and after view. Duplicate names are diagnosed through onDiagnostic and excluded from Astra’s named pair so the application update can still finish. A single boundary can attach to multiple roots; their order pairs the roots and its callbacks are grouped by animation type.'
				],
				code: {
					label: 'Focused boundary configuration excerpt',
					source: `<AnimateView
  name="cover"
  transition={{ duration: 0.3, layout: { duration: 0.5 } }}
  enter={{ opacity: 1, clipPath: ['inset(0 50%)', 'inset(0 0%)'] }}
  exit={{ opacity: 0 }}
  update={{ transition: { ease: 'easeInOut' } }}
  share={{ transition: { duration: 0.45 } }}
>
  {#snippet children(view)}
    <article {@attach view}>A named snapshot</article>
  {/snippet}
</AnimateView>`
				}
			},
			{
				id: 'keyframes',
				title: 'Customize the snapshot layers',
				text: [
					'Use CSS keyframes such as opacity, transform, filter, or clipPath. Supplying custom values replaces the old/new crossfade while preserving the group’s size and position animation. Add opacity explicitly when you want a custom effect and a fade together.',
					'A scalar enter opacity starts at 0; scalar opacity for exit, update, or share starts at 1. Arrays supply explicit endpoints. Custom enter values animate the new snapshot, while exit, update, and share values animate the old snapshot.',
					'These are CSS snapshot layers rather than motion elements. Use a complete CSS transform string instead of x, y, or scale aliases. transitionEnd is rejected because a snapshot has no persistent application style to update. Commit final element styles in the state update itself.',
					'For springs, import the spring generator and pass type: spring. AnimateView uses Motion’s native animation path, which samples that generator for the browser. Per-property transitions override defaults; layout timing remains separate from custom opacity or filter timing.'
				],
				code: {
					label: 'Focused spring configuration excerpt',
					source: `import { spring } from 'astra-motion';

// Pass this object to AnimateView's transition prop.
const transition = {
  duration: 0.2,
  layout: { type: spring, duration: 0.6, bounce: 0.2 }
};`
				},
				related: ['transitions']
			},
			{
				id: 'context',
				title: 'Pass contextual transition types',
				text: [
					'Pass types in the transaction options or call context.addType inside the update callback. Every enter, exit, update, and share definition can be a function receiving the transaction’s type strings. Queued updates that share a capture contribute to the same combined type list.',
					'Types are useful for navigation direction, filtering, or a change initiated by a particular interaction. They are contextual labels, not animation variant names. The returned handle exposes the labels added by that request through its readonly types property.'
				],
				code: {
					label: 'Focused directional transition excerpt',
					source: `startViewTransition(({ addType }) => {
  addType('next');
  selected = nextItem;
});

// Pass to enter on the boundary.
const enter = (types: string[]) => ({
  opacity: 1,
  transform: [
    'translateX(' + (types.includes('next') ? 80 : -80) + 'px)',
    'translateX(0px)'
  ]
});`
				}
			},
			{
				id: 'asynchronous-content',
				title: 'Coordinate asynchronous content',
				text: [
					'The update callback can return a promise. Astra waits for it and for Svelte’s pending updates before measuring the new view. This lets ordinary application state, awaited data, and asynchronous component work participate in one capture.',
					'Cancellation releases the visual transition and aborts context.signal. It cannot roll back arbitrary application code. Pass that signal to cancellable requests or check signal.aborted before committing a result that should be discarded after replacement.',
					'New visible eager images and fonts introduced by the committed update receive a wait of up to 500 ms before the final snapshot. Existing unrelated image loads, offscreen images, lazy images, and images opting into asynchronous decoding do not block this wait. Use explicit image dimensions to keep loading from changing the layout.',
					'To animate a loading placeholder and then resolved content, make two coordinated updates: one that displays the placeholder, and one that commits the result. Awaiting the data inside a single transaction instead retains the old screenshot until the new content is ready.'
				],
				code: {
					label: 'Focused asynchronous application excerpt',
					source: `const transition = startViewTransition(async ({ signal, addType }) => {
  const response = await fetch('/api/collection', { signal });
  if (!response.ok) throw new Error('Could not load the collection');
  const next = await response.json();
  if (signal.aborted) return;
  addType('loaded');
  collection = next;
});

// Handle data errors in your application UI.
void transition.finished.catch(showLoadError);`
				}
			},
			{
				id: 'coordination',
				title: 'Queue, replace, and cancel',
				text: [
					'One native capture can own a document at a time. The default queue policy lets the active transition finish, then coalesces pending requests into the next capture. Their update callbacks run in order; none are discarded. A burst from A to B, then C and D, can therefore animate A to B followed by B to D.',
					'policy: replace skips the older visual transition and allows the next capture to proceed. cancel() and skipTransition() have the same visual cancellation behavior. The update callback still runs exactly once, including when cancellation happens before the browser invokes it.',
					'Cancellation is a new snapshot decision rather than a physical reversal of the previous animation. If an old asynchronous callback continues after replacement, it can still change application state unless it cooperates with the supplied signal. finished waits for that callback’s result even after the snapshot has been released.'
				]
			},
			{
				id: 'props',
				title: 'AnimateView props',
				text: [
					'All animation definitions accept either a target object or a function of the active type strings. Options are read for each capture, including inherited MotionConfig values.'
				],
				table: {
					columns: ['Prop', 'Default', 'Contract'],
					rows: [
						[
							'children',
							'Required',
							'Snippet receiving an Attachment<HTMLElement | SVGElement>. Attach it to each intended snapshot root.'
						],
						['name', 'Automatic identity', 'Shared matching name, unique within a view.'],
						[
							'transition',
							'Native timing, 0.3 seconds for browser layers',
							'Default Motion transition; per-value options and transition.layout override it.'
						],
						[
							'enter / exit',
							'Browser fade in / fade out',
							'CSS keyframes plus optional transition, or (types: string[]) => definition.'
						],
						[
							'update / share',
							'Browser crossfade and geometry animation',
							'CSS keyframes plus optional transition; shared options come from the entering boundary.'
						],
						[
							'onAnimationStart',
							'undefined',
							'(controls, type) => void, where type is enter, exit, update, or share. Receives grouped playback controls.'
						],
						[
							'onAnimationComplete',
							'undefined',
							'(type) => void after successful completion. Cancelled layers do not call it.'
						],
						[
							'reducedMotion',
							'Inherited policy; never without a provider',
							'user, always, or never. Reduced boundaries use immediate timing; a live change to reduced motion skips the active document snapshot.'
						],
						[
							'nonce',
							'Inherited when configured',
							'CSP nonce for the transaction’s temporary reset stylesheet. Supply it on the coordinator when the first view is only entering.'
						]
					]
				}
			},
			{
				id: 'coordinator-api',
				title: 'startViewTransition API',
				text: [
					'startViewTransition(update, options?) returns a handle immediately. update receives { signal, addType } and returns void or a promise. It can mutate any ordinary Svelte state; it does not require a special store.'
				],
				table: {
					columns: ['Option or return', 'Default', 'Contract'],
					rows: [
						[
							'options.types',
							'[]',
							'Readonly string array of contextual labels. addType adds more during the update.'
						],
						[
							'options.policy',
							'queue',
							'queue coalesces pending requests; replace skips the active visual transition.'
						],
						[
							'options.document',
							'Current document when available',
							'Document to coordinate; enables independent captures in separate documents.'
						],
						[
							'options.reducedMotion',
							'Per-boundary policy',
							'An explicit reduced transaction skips native capture while applying its update.'
						],
						[
							'options.nonce',
							'Captured boundary nonce when available',
							'CSP nonce for the temporary reset stylesheet.'
						],
						[
							'options.onDiagnostic',
							'undefined',
							'(message: string) => void for duplicate names or browser capture failures. Logging errors never discard updates.'
						],
						[
							'handle.ready',
							'Promise<void>',
							'Resolves when animations have been configured, or after an immediate fallback update. Rejects if an active capture is skipped or setup fails.'
						],
						[
							'handle.updateCallbackDone',
							'Promise<void>',
							'Resolves after the callback and Svelte updates settle; rejects on application update failure.'
						],
						[
							'handle.finished',
							'Promise of outcome',
							'Resolves to finished, skipped, or unsupported. Rejects on update, animation resolver, or callback failure.'
						],
						['handle.types', 'Readonly string array', 'Contextual labels added by this request.'],
						[
							'handle.cancel() / skipTransition()',
							'Methods',
							'Release the visual capture, abort the signal, and preserve exactly-once execution of the update.'
						]
					]
				}
			},
			{
				id: 'controls',
				title: 'Playback and completion callbacks',
				text: [
					'onAnimationStart receives one control group for the boundary and animation type. You can pause, play, complete, cancel, or stop the group, and inspect or change its time and speed. The grouped controls’ finished promise settles on cancellation as well as completion.',
					'onAnimationComplete runs after the controlled layers finish successfully. It does not run after cancel, stop, owner cleanup during animation, or a skipped native transition. Do not make application state correctness depend on this callback: the unsupported-browser fallback still applies state but creates no animation callbacks.',
					'Nested boundaries isolate their own content updates. A change confined to an inner boundary does not trigger an outer update callback unless the outer boundary’s geometry or its own visual content also changes. Exiting snapshots survive natural component destruction during the transaction; later owner disposal cancels active layers.'
				]
			},
			{
				id: 'navigation',
				title: 'Integrate SvelteKit navigation',
				text: [
					'Install viewTransitionsForNavigation once in a persistent SvelteKit layout. The helper releases navigation from inside the native update callback and waits for navigation.complete before capturing the next route. It defaults to replace for superseded navigations and reads the inherited configuration for each navigation.',
					'The navigation helper has a separate package entry so importing AnimateView or startViewTransition does not import SvelteKit. Use it as the document’s route snapshot coordinator; do not install it alongside another route coordinator that also calls the native View Transitions API.',
					'Place matching AnimateView names on outgoing and incoming route elements for shared snapshots. The normal route content still renders when the browser cannot capture a transition. A destroyed layout cancels its active snapshot and releases its installation.'
				],
				links: [
					{
						path: '/motion-lab/product',
						title: 'Try the two-page route demo',
						detail:
							'An existing SvelteKit route composition with shared elements and navigation fallback.'
					}
				],
				code: {
					label: '+layout.svelte — focused navigation setup',
					source: `<script lang="ts">
  import type { Snippet } from 'svelte';
  import { viewTransitionsForNavigation } from 'astra-motion/view-navigation';
  let { children }: { children: Snippet } = $props();
  viewTransitionsForNavigation({ types: ['navigation'] });
</script>

{@render children()}`
				}
			},
			{
				id: 'browser-lifecycle',
				title: 'Browser support, SSR, and accessibility',
				text: [
					'When the native API is unavailable, the update still runs and finished resolves to unsupported. Browser rejection, duplicate captures, hidden-page cancellation, and explicit cancellation release owned names and styles. Authored view-transition-name values and their priorities are restored when Astra still owns the temporary value. Cleanup from a skipped capture cannot remove a replacement capture’s names, even if the browser invokes the older update late.',
					'SSR renders only the snippet’s real elements, with no wrapper or injected browser styles. A server-side coordinator call performs its update through the immediate unsupported path. Browser attachments register after mounting and unregister on teardown.',
					'Snapshots are visual copies; application focus and semantics belong to the live DOM. Preserve focus for a persistent control or move it to the new page’s heading according to your navigation pattern. Provide accessible loading and error announcements independently of animation callbacks.',
					'MotionConfig inheritance applies to each view boundary, including reactive reduced-motion changes. The default is never, matching the component configuration default. Set reducedMotion="user" on your application provider or on an individual boundary to honor the operating system preference. A reduced snapshot uses immediate timing while preserving state updates.'
				],
				related: ['motion-config', 'accessibility']
			},
			{
				id: 'troubleshooting',
				title: 'Troubleshooting and baseline',
				text: [
					'If a state change does not animate, confirm that it runs inside startViewTransition, that the real root has the supplied attachment, and that the browser supports native View Transitions. Check the returned finished outcome and onDiagnostic before assuming the update failed.',
					'If shared elements do not connect, make their names equal and unique on each side of one transaction. Reusing a single mounted boundary is an update; changing component identity with the same name is a share. Entering-side options control a shared pair.',
					'If a custom target behaves differently from motion.div, use CSS snapshot properties and complete transform strings. If rapidly replaced data arrives late, use the update context’s AbortSignal and handle rejected data requests in your UI.',
					'This contract was researched against Motion 13.4.4 and stable React 19.3.0 on 27 September 2026. AnimateView had moved from Motion+ early access to Motion’s public separate entry by that date. Astra uses the native browser API with its own Svelte coordinator and has no React runtime dependency. Future changes to browser snapshot behavior or the upstream integration are tracked separately from this documented Svelte API.'
				],
				related: ['animate-presence', 'animate-activity', 'layout']
			}
		]
	}
];
