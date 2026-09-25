# Authoring Astra motion

For simple enter/exit effects, prefer Svelte's native `transition:fade`, `transition:fly`
or `transition:slide`. When new markup needs Astra capabilities, start with
`motion.div`, `motion.button` or another tag component from `astra-motion`.
Use `createMotion` when an existing native element or component owns the markup. These
complete recipes are also available with copy buttons and links to live scenarios
at [/motion-lab/guide](/motion-lab/guide). This is a beta adapter over pinned Motion
13.4.3; see the [upgrade qualification](research/motion-upgrade-13.4.md).

## Install a local build

The repository is an unpublished beta. In a checkout, run `pnpm install`,
`pnpm run prepack` and `pnpm pack`. From the consuming Svelte app, run
`pnpm add /absolute/path/to/astra-motion/astra-motion-0.0.1.tgz`, replacing the path
with the generated archive. The package includes one qualified DOM-only Motion
engine; no app overrides or separate Motion installation are required, and strict
declarations are checked with
`skipLibCheck: false`.
Svelte 5.57.0 or newer within Svelte 5 is a peer dependency. Only the routes entry
requires SvelteKit (2.70.3 or newer within Kit 2).

Package imports in this guide refer to that local build. The public site’s
Getting started guide includes the same installation path. See the
[current scope and release work](research/motion-focus.md) before adopting it.

## Choose an authoring path

| Need                                                             | Start with                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Simple enter/exit fade, fly or intrinsic-height slide            | Native Svelte transitions from `svelte/transition`                     |
| New HTML markup, state, gestures and optional layout             | `motion.div`, `motion.button`, `motion.input`, etc.                    |
| Existing native markup, headless components or native directives | `createMotion` and its props/transition                                |
| Layout only, grouped or shared identities                        | `createLayout` attachments                                             |
| Exit before replacing a branch                                   | `Presence`; ordinary if/each blocks already support simultaneous exits |
| Scoped sequences or scroll-linked motion                         | `createAnimate` or `createScroll`                                      |
| Visibility without an animation owner                            | `createInView`                                                         |
| Shared content across SvelteKit routes                           | `astra-motion/routes`                                                  |

Use root imports first. Feature entries and `/state/lite` are optional bundle
optimizations, described below; they should not be the first authoring decision.
Each component or binding owns one simultaneously mounted element. Tag components
work directly in a keyed list; native bindings belong in a per-item component when
each item needs an independent owner.

`presence()` is Astra's small standalone opacity transition. `binding.transition`
connects a `createMotion` binding's enter/exit targets and live policy to Svelte's
retention lifecycle; tag components wire it up internally. `Presence` coordinates
branch replacement, including waiting for exits. Use the one the interaction needs.

## Tag components

A tag component renders its named native HTML element and creates its binding,
SSR styles and native transition. A button is a real button; no wrapper is added.

```svelte
<script lang="ts">
	import { motion, MotionConfig, createLayout } from 'astra-motion';
	let items = $state([1, 2, 3]);
	const group = createLayout();
</script>

<MotionConfig transition={{ duration: 0.24 }}>
	<ul>
		{#each items as item (item)}
			<motion.li
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -12 }}
				layout
				layoutGroup={group}
			>
				<button onclick={() => (items = items.filter((value) => value !== item))}>
					Remove item {item}
				</button>
			</motion.li>
		{/each}
	</ul>
</MotionConfig>
```

Pass animation targets, transitions, gestures and callbacks directly as component
props. `style` accepts a native CSS string or a Motion style object, including
MotionValues. Normal attributes, native event callbacks and children stay on the
same component.
Nested tag components inherit variant ancestry during SSR as well as after mounting.
They must remain DOM descendants of that parent; portals need an independently created native binding rather than implicit
cross-portal variant inheritance.

`Motion` remains available for compatible `<Motion as="button">` authoring. Its
`as` defaults to `div` and must stay stable while mounted; use `{#key tag}` for
intentional element replacement. Its dynamic element supports `bind:ref`, but does
not provide the native value bindings implemented by tag components.

## Component props, styles and migration

Both `motion.tag` and generic `Motion` accept top-level animation props. Move each
option out of the older nested `motion` object:

```svelte
<!-- Existing syntax remains supported. -->
<motion.div motion={{ animate: { x: 120 }, transition: { duration: 0.3 } }} />

<!-- Preferred syntax. -->
<motion.div animate={{ x: 120 }} transition={{ duration: 0.3 }} />

<!-- Reuse options and override the target. -->
<motion.div {...options} animate={{ x: expanded ? 120 : 0 }} />
```

When using both forms, each **defined top-level option wins** over the same nested
option. `undefined` falls back to the nested option; `false` is an explicit value.
An object option such as `animate`, `transition` or `variants` replaces that entire
nested option; it is not deeply merged. Spread order follows ordinary Svelte rules:
put an explicit override after `{...options}`.

`style` is the exception: a Motion style object merges its keys over
`motion.style`, preserving MotionValues. A CSS string remains native CSS alongside
any nested Motion styles. `null` clears the native style string. Motion owns
animated properties; do not combine raw `transform` with decomposed `x`, `y`,
`rotate` or `scale` values.

On tags that support it, top-level `disabled` sets the native attribute and disables
gestures. `false` enables both; `null` removes the attribute and enables gestures.
The compatibility option `motion.disabled` is gesture-only and never adds a native
disabled attribute. An undefined top-level `disabled` preserves that nested gesture
setting. Native handlers such as `onclick` and animation callbacks such as
`onAnimationComplete` remain separate.

`createMotion(options)`, layout/controller options and reusable components accepting
`motion={binding}` keep their existing contracts. This change does not add Motion
React props that Astra does not otherwise support, or new Svelte native bindings.

## Native bindings and forwarding

```svelte
<script lang="ts">
	import { motion } from 'astra-motion';
	let name = $state('');
	let enabled = $state(true);
	let input = $state<HTMLInputElement | null>(null);
</script>

<label for="motion-name">Name</label>
<motion.input
	id="motion-name"
	name="name"
	bind:value={name}
	bind:ref={input}
	whileFocus={{ scale: 1.02 }}
/>
<label for="motion-enabled">Enable notifications</label>
<motion.input id="motion-enabled" type="checkbox" bind:checked={enabled} />
<motion.button
	type="button"
	disabled={!enabled}
	onclick={() => input?.focus()}
	whileTap={{ scale: 0.98 }}
>
	Focus name
</motion.button>
<p>{name || 'Your name'}: {enabled ? 'enabled' : 'disabled'}</p>
```

Tag-specific attributes and callback types follow Svelte’s native HTML types.
`onclick`, `oninput` and other event callbacks receive events from the real element;
`event.currentTarget` has that element’s type. Attribute spreads, `aria-*`, `data-*`
and forwarded attachments reach the same element. `bind:ref` exposes its typed DOM
reference and clears on destruction. Children snippets render inside non-void tags.
The `style` prop supports CSS strings and Motion style objects; both compose with
Motion’s current and initial SSR styles as described above.

| Component                              | Supported bindings in addition to `ref`                     |
| -------------------------------------- | ----------------------------------------------------------- |
| `motion.input` with a value input type | `value`; number/range use numeric values                    |
| `motion.input type="checkbox"`         | `checked`, `indeterminate`                                  |
| `motion.input type="file"`             | `files`                                                     |
| `motion.textarea`                      | `value`                                                     |
| `motion.select`                        | `value`, including object values and arrays with `multiple` |
| `motion.details`                       | `open`                                                      |

These are compiled Svelte components, so native directives do not automatically
become component props. Use native markup with `createMotion` for `bind:group`,
media bindings, readonly dimensions, `class:`/`style:` directives or parent-scoped
CSS element selectors. Radio groups especially need their native inputs in the same
Svelte component. Supported tags are HTML; SVG, custom tags and arbitrary component
factories are outside this component API.

## State and presence

Use an ordinary conditional. The tag component already installs its native exit:

```svelte
<script lang="ts">
	import { motion } from 'astra-motion';
	let open = $state(true);
</script>

<button onclick={() => (open = !open)}>Toggle</button>
{#if open}
	<motion.section
		initial={{ opacity: 0, y: 12 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: -12 }}
		transition={{ duration: 0.24 }}
	>
		Still a section.
	</motion.section>
{/if}
```

Motion transitions use **seconds**. The standalone `presence()` helper is an opacity
fade using Svelte’s **milliseconds**; it samples explicit/OS reduced-motion policy
when starting and does not inherit `MotionConfig`. `Presence` controls branch
sequencing and adds no animation by itself. `popLayout` frees an outgoing element’s
space and still needs a native outro. These helpers have different jobs.

## Keep existing native markup

```svelte
<script lang="ts">
	import { createMotion } from 'astra-motion';
	let open = $state(true);
	const panel = createMotion({
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 }
	});
	const enterExit = panel.transition;
</script>

<button onclick={() => (open = !open)}>Toggle</button>
{#if open}
	<section {...panel.props} style={'color: steelblue;' + panel.props.style} transition:enterExit>
		Existing native markup.
	</section>
{/if}
```

Spread `binding.props` to install its attachment and SSR style. If the element has
an authored style string, merge it after the spread as above; either unmerged style
prop would overwrite the other. Preserve your native attributes, event callbacks,
`bind:this` and form bindings on that element.

An `exit` option alone does not retain native markup. Add its bidirectional
`transition:` directive, with `|global` when it must participate in removal of an
enclosing block. The alias keeps tooling consistent. Split `in:`/`out:` directives
have different reversal semantics. Use one transition implementation per element.

Bindings belong in component initialization so SSR and inherited context are
available. A getter such as `createMotion(() => ({ animate: { x: offset } }))` reads
changing state; a plain object containing the primitive `offset` captures its value
at construction. Reactive options objects can also be passed without replacing
MotionValues or recreating the binding.

## Automatic layout

Change ordinary state. CSS chooses the destination; the shared projection scheduler animates it.

Each participant observes its parent subtree by default, plus direct ancestor changes
and ancestor resizes. For position-only reflow caused outside that subtree, use a wider
`createLayout({ observationRoot: () => root })` with `bind:this={root}`, or wrap the
change in `layout.update`. An explicit observation root must contain its participants.
Automatic batches select affected participants; explicit transactions coordinate all groups.

Matching `layout.id` values share only within a controller's scope. Supply the same
`layoutGroup` to both state bindings or tag components, or use controllers with the
same explicit `id`. This avoids accidental sharing across independent widgets.

```svelte
<script lang="ts">
	import { createLayout } from 'astra-motion';
	const layout = createLayout();
	let wide = $state(false);
</script>

<button onclick={() => (wide = !wide)}>Resize</button>
<article style:width={wide ? '100%' : '65%'} {@attach layout()}>
	<div {@attach layout({ mode: 'position' })}>
		<h2>Text keeps its proportions.</h2>
		<p>An existing content host compensates for the surface scaling.</p>
	</div>
</article>

<style>
	article {
		padding: 24px;
		background: #ecebe5;
		border-radius: 16px;
	}
</style>
```

layout.update(() => change()) explicitly captures fresh geometry before a synchronous change. Automatic observation normally makes it unnecessary.

Try [Automatic layout](/motion-lab/updates).

## Wait for the outgoing branch

Presence renders the latest requested value after the whole outgoing Svelte transition group finishes.

```svelte
<script lang="ts">
	import { Presence, presence } from 'astra-motion';
	let chapter = $state(1);
</script>

<button onclick={() => chapter++}>Next chapter</button>
<Presence value={chapter}>
	{#snippet children(current)}
		<h2 transition:presence={{ duration: 240 }}>Chapter {current}</h2>
	{/snippet}
</Presence>
```

No wrapper is added. The value determines branch identity; child transitions determine retention.
Use `mode="sync"` for immediate replacement while outgoing branches finish. Plain Svelte
`{#if}` and keyed `{#each}` blocks also support simultaneous entry and exit.
`onExitComplete={() => ...}` runs after the outgoing group is destroyed; in sync mode
it waits for all outgoing branches. Cancelled exits and parent disposal do not notify.

Try [Wait for the outgoing branch](/motion-lab/presence).

Changing Presence's mode resets its sequencing; completion callbacks from the abandoned
mode are suppressed. Keep the mode stable during a sequence when completion matters.

## Observe viewport visibility

`createInView` exposes a reactive boolean without an animation binding. Call it during
component initialization and read `current` directly in templates or effects.

```svelte
<script lang="ts">
	import { createInView } from 'astra-motion';
	let section = $state<HTMLElement>();
	const visibility = createInView(() => section, { amount: 0.5, once: true });
	function target(node: HTMLElement) {
		section = node;
		return () => {
			section = undefined;
		};
	}
</script>

<section {@attach target}>
	<p>{visibility.current ? 'Seen at least halfway.' : 'Waiting to enter the viewport.'}</p>
</section>
```

`initial` defaults to false, including SSR, and the first measurement replaces it.
`amount` accepts `'some'`, `'all'`, or a fraction from 0 to 1. Use `root` for a scroll
container and `margin` to adjust its observation boundary. Pass a reactive options
reader when these change. `once` disconnects after entry and resets for a replacement
target; component teardown always disconnects. Reduced motion does not change visibility.

Try [Visibility and presence](/motion-lab/presence).

## Remove from flow, finish the exit

popLayout captures the exiting element, frees its space, and lets projected siblings reflow immediately.

```svelte
<script lang="ts">
	import { createLayout } from 'astra-motion';
	import { popLayout, presence } from 'astra-motion';
	const layout = createLayout();
	let items = $state(['Alto', 'Brio', 'Coda', 'Dune']);
</script>

<div class="list">
	{#each items as item (item)}
		<button
			{@attach layout()}
			{@attach popLayout()}
			transition:presence={{ duration: 240 }}
			onclick={() => (items = items.filter((name) => name !== item))}
		>
			{item} ×
		</button>
	{/each}
</div>

<style>
	.list {
		position: relative;
		display: grid;
		gap: 12px;
	}
	button {
		padding: 16px;
		text-align: left;
	}
</style>
```

The direct parent must be positioned. The retained item needs a native outro. Use a per-item component if each item also needs its own createMotion binding.

Try [Remove from flow, finish the exit](/motion-lab).

## Shared elements & isolated groups

A controller is a layout group. Local IDs pair different nodes within that group, including across components.

```svelte
<script lang="ts">
	import { createLayout } from 'astra-motion';
	const tabs = createLayout({ id: 'product-tabs' });
	const labels = ['Overview', 'Details', 'Materials'];
	let selected = $state('Overview');
</script>

<nav aria-label="Product sections">
	{#each labels as label (label)}
		<button aria-pressed={selected === label} onclick={() => (selected = label)}>
			{label}
			{#if selected === label}
				<span {@attach tabs({ id: 'underline' })}></span>
			{/if}
		</button>
	{/each}
</nav>

<style>
	nav {
		display: flex;
		gap: 24px;
	}
	button {
		position: relative;
		padding: 12px 0;
	}
	span {
		position: absolute;
		inset: auto 0 0;
		height: 3px;
		background: currentColor;
	}
</style>
```

Pass a controller to children, or use the same explicit group ID across controllers to share a scope. Unnamed controllers are isolated. Reuse an element ID only for deliberate shared handoff.

Try [Shared elements & isolated groups](/motion-lab).

## Coordinated children, including SSR

parent.child() declares variant ancestry before any DOM exists. Motion resolves trajectories; Svelte owns outro retention.

```svelte
<script lang="ts">
	import { createMotion } from 'astra-motion';
	let open = $state(true);
	const panel = createMotion({
		initial: 'hidden',
		animate: 'visible',
		exit: 'hidden',
		variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
		transition: { duration: 0.2, when: 'afterChildren', staggerChildren: 0.06 }
	});
	const title = panel.child({
		variants: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
	});
	const panelExit = panel.transition;
	const titleExit = title.transition;
</script>

<button onclick={() => (open = !open)}>Toggle group</button>
{#if open}
	<section {...panel.props} transition:panelExit>
		<h2 {...title.props} transition:titleExit|global>One coordinated branch.</h2>
	</section>
{/if}
```

The child must mount inside its declared parent. Add |global when a child transition must participate in removal of an enclosing block. initial: false skips the first intro.

Try [Coordinated children, including SSR](/motion-lab/inheritance).

## Your own component

A custom component accepts a binding and forwards it to its real element. It imports only a type.

```svelte
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { MotionBinding } from 'astra-motion';
	let {
		motion,
		ref = $bindable(null),
		style,
		children,
		...attributes
	}: HTMLAttributes<HTMLElement> & {
		motion?: MotionBinding;
		ref?: HTMLElement | null;
	} = $props();
	const transition = (node: HTMLElement) => motion?.transition(node) ?? { duration: 0 };
	function forwardRef(node: HTMLElement) {
		ref = node;
		return () => {
			if (ref === node) ref = null;
		};
	}
</script>

<article
	{...attributes}
	{...motion?.props}
	{@attach forwardRef}
	style={(style ?? '') + ';' + (motion?.props.style ?? '')}
	transition:transition|global
>
	{@render children?.()}
</article>
```

Save this as `MotionCard.svelte`, then pass `motion={card}` from a parent using
`createMotion()`. Here `motion` is a binding, whereas a tag component’s `motion`
prop is an options object. `attributes` preserves native props and callbacks,
`bind:ref` forwards the real element, and the explicit style merge preserves both
owners. The type-only import does not load the engine for non-animated consumers.

Headless components also need their own lifetime integration. Keep the primitive’s
IDs, ARIA attributes, ref, attachments and composed event handlers on the same real
node; use its prop merger when available. For Bits UI, `forceMount` plus its child
snippet’s `open` state lets a native `{#if open}` own the transition. Disabling a
primitive’s built-in retention without that branch loses exits. Portals still own
focus and accessibility behavior; create an independent `createMotion` binding inside the
portal. See the complete [Dialog adapter](../src/lib/components/ui/dialog/dialog-content.svelte).
Test Escape, focus restoration, rapid reversal and removal of the owning component.

Try [Your own component](/motion-lab/components).

## Scroll-linked motion

Attach a container, optionally a target, and a linked animation. Motion selects its native or fallback scroll implementation.

```svelte
<script lang="ts">
	import { createScroll } from 'astra-motion';
	const reading = createScroll();
	const fill = reading.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
</script>

<div class="scroller" {@attach reading.container}>
	<div class="meter" {@attach fill}></div>
	<p>Scroll through this reading surface.</p>
</div>

<style>
	.scroller {
		position: relative;
		height: 220px;
		overflow: auto;
	}
	.meter {
		position: sticky;
		top: 0;
		height: 4px;
		background: coral;
		transform-origin: left;
	}
	p {
		min-height: 700px;
		padding: 24px;
	}
</style>
```

With no container attachment, tracking uses the window. progress is a MotionValue for semantic UI; decorative linked motion settles when reduced motion is enabled.

Try [Scroll-linked motion](/motion-lab/scroll).

## Scoped timelines

Selectors stay inside the attached root. Replaying an overlapping sequence replaces stale playback and cleanup follows the scope.

```svelte
<script lang="ts">
	import { createAnimate } from 'astra-motion';
	const scene = createAnimate();
	function play() {
		scene.sequence([
			['.tile', { y: -24, opacity: 0.5 }, { duration: 0.2 }],
			'return',
			['.tile', { y: 0, opacity: 1 }, { at: 'return', duration: 0.3 }]
		]);
	}
</script>

<button onclick={play}>Play / replace</button>
<section {@attach scene.attach}>
	<div class="tile">Only this tile moves.</div>
</section>

<style>
	section {
		padding: 40px;
	}
	.tile {
		padding: 20px;
		background: #ecebe5;
	}
</style>
```

Use the returned controls for pause, play, time and speed. Do not give a timeline a node already owned by createMotion, layout or a scroll animation.

Try [Scoped timelines](/motion-lab/timelines).

## Install route transitions once

Call the coordinator in your persistent SvelteKit root layout. Kit owns navigation; native View Transitions capture the two pages.

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { routeTransitions } from 'astra-motion/routes';
	let { children }: { children: Snippet } = $props();
	routeTransitions();
</script>

{@render children()}
```

This is +layout.svelte. Unsupported browsers and reduced-motion users navigate immediately. Install one coordinator, not one per page.

Try [Install route transitions once](/motion-lab/product).

## Shared identity across routes

Use the same ID and scope on the list image and detail image. Temporary browser names are assigned only during navigation.

```svelte
<script lang="ts">
	import { routeShared } from 'astra-motion/routes';
	let { product }: { product: { id: string; image: string; name: string } } = $props();
</script>

<img
	src={product.image}
	alt={product.name}
	width="640"
	height="480"
	{@attach routeShared(product.id, { scope: 'products' })}
/>

<style>
	img {
		display: block;
		width: 100%;
		height: auto;
		object-fit: cover;
	}
</style>
```

Use this component on both pages with the same product. The route coordinator above is required. Local layout IDs and route identities use separate backends.

Try [Shared identity across routes](/motion-lab/product).

## Keep text and images natural

Layout projection temporarily scales a surface to its previous rectangle. Its
contents need an intentional response:

- Put position projection on an existing **block or flex content host** inside a
  resizing surface. Unregistered text inherits parent scale; a plain inline span
  is not a suitable transform host.
- Give images a stable intrinsic aspect ratio or deliberate `object-fit` crop.
  `mode: 'preserve-aspect'` avoids scaling between different aspect ratios by
  choosing position-only projection for that change. It does not morph the crop.
- Put authored rotation/scale into Motion’s `style` or animation targets. Independent
  CSS transforms conflict when the binding owns transforms, layout or drag. A
  paint-only opacity/color binding preserves existing CSS transforms; adding a
  transform target later checks ownership at that point.
- Intrinsic-height accordions often suit Svelte’s reveal transition. The project’s
  accordion uses its existing content elements and keeps text away from surface scale.

## Defaults and reduced motion

Wrap the application’s descendants in `MotionConfig` from `astra-motion` to set
`transition`, `layoutTransition` and `reducedMotion`. The default reduction policy
follows the OS; `'always'` and `'never'` provide explicit overrides. Configuration
is inherited by bindings created in descendant component initialization. A provider
rendered around markup in the same component cannot retroactively configure bindings
created in that component’s script. Move it above the component
that creates the binding, or supply explicit options. Tag components rendered beneath
the provider inherit it. Routes inherit the ancestor policy; explicit options win.

Nested tag components inherit variants during SSR. Use `parent.child()` for the
equivalent native-binding ancestry; children must mount inside their declared parent.
Live DOM ancestry alone cannot determine child server styles. `initial: false` renders the final initial pose and
suppresses the first intro. Existing animations settle when reduced motion turns on;
a Svelte outro clock already running still owns its original retention duration.

## Ownership and cleanup

One visual owner per node keeps interruption predictable. Update a bound element
through reactive options, `binding.animate()`, or its MotionValues. Give a scoped
timeline or scroll animation a different element. Attachment cleanup releases
controllers and owned animation styles; user-owned MotionValues remain yours.

Finite presence targets need resolved values: repeated exits, unresolved `auto`
and CSS variables, and arbitrary async safe-to-remove callbacks are not supported.
For scoped timelines, `await controls.settled` resolves to `{ status: 'finished' }`
or `{ status: 'cancelled', reason }`. Reasons are `stopped`, `cancelled`, `replaced`
and `detached`. Capture this promise for the playback cycle you started: replaying
completed controls creates a new settlement promise. Motion's existing `then` and
`finished` cancellation semantics remain unchanged and can stay pending on stop.

Local reactive policy objects and getters passed to `createAnimate` are observed
while attached. Turning reduction on completes the original ordinary timeline,
including repeats, so existing completion listeners observe it. A lower-level
external `controls.attachTimeline()` disables Motion's completion callback: its
cleanup, explicit `complete()` or policy reduction instead detaches and settles
as cancelled. Use `createScroll` for Astra-owned scroll-linked motion.
Runtime source HMR intentionally reloads the page.

## Lifecycle and measurement

Create controllers and context-dependent bindings during component initialization,
not inside a browser effect: SSR needs their initial state too. Attachments own work
for individual DOM nodes, including nodes replaced by conditionals or keyed lists.
For additional browser-only setup, prefer `$effect(() => untrack(() => { ... }))`
and return cleanup from the untracked callback. The effect must return that cleanup;
`$effect(() => { untrack(setup); })` would discard it.

Keep intended dependencies tracked. A reactive animation target or a live policy
reader should not be hidden inside `untrack`. Effects rerun when their tracked inputs
change and clean up before rerunning or when their owner is destroyed. `onMount`
remains valid, but is not required for setup with incidental state reads.

`$effect.pre` is not a snapshot hook before every DOM update. A parent may already
have changed the DOM before a child’s pre-effect runs; async block updates add
another ordering boundary. `untrack` changes dependency tracking, not that timing.
Astra uses cached projection measurements for automatic updates, or `layout.update`
for a fresh snapshot before a synchronous change. See [Svelte issue #16648](https://github.com/sveltejs/svelte/issues/16648).
Keyed DOM order also cannot be inferred from setup callback order; see
[issue #8547](https://github.com/sveltejs/svelte/issues/8547).

## Optional feature entries

Keep root imports while authoring. For a measured bundle need, `/state/lite` exposes
the same `createMotion` contract without layout or gestures; `/state` retains those
capabilities. Other focused entries are `/layout`, `/presence`, `/values`, `/animate`,
`/scroll`, `/in-view` and `/policy`. `/routes` stays separate because it requires Kit.
No compiler plugin is needed.

Create MotionValues through `astra-motion` or `astra-motion/values`, which share the
packaged animation engine. Values from a separately installed Motion engine do not
have a promised type or runtime identity match. The caller owns values it creates,
including disposal of derived values; passing them to a binding does not transfer
that ownership.

## Verify a change

Try reversal before an exit finishes, resize during a layout animation, remove
while reordering, and navigate away while a sequence runs. The labs linked above
cover each feature; [extended scenarios](/motion-lab/extended) include rapid stress,
scroll and nested layout. Browser suites qualify Chromium, Firefox and WebKit, but
physical mobile profiling and exhaustive route/BFCache behavior remain release work.

The guide recipes are a shared source catalog in
`src/lib/motion-lab/authoring-examples.ts`. Compiler tests parse their modern Svelte
AST and compile both client and server output. Those syntax checks complement the
runtime lab tests; they do not claim every copied consumer environment is qualified.

Run `node scripts/check-motion-guide.mjs` for a source-consumer TypeScript check of
all guide snippets. It maps public package entries to source in isolated temporary
fixtures, runs svelte-check, and removes the fixtures. It does not build or emit a
package, so packaged tarball resolution remains a separate release check.
