# Authoring Astra motion

Current primary API: [34-page documentation](https://alois-reinstadler.github.io/astra-motion/docs),
[parity matrix](parity/MATRIX.md), and [migration guide](migration.md).
`motion.bind` and `motion.*` share one animation contract. `createMotion` has been
removed; migrate native bindings to `motion.bind` using the migration guide.

For simple enter/exit effects, prefer Svelte's native `transition:fade`, `transition:fly`
or `transition:slide`. When new markup needs Astra capabilities, start with
`motion.div`, `motion.button` or another tag component from `astra-motion`.
Use `motion.bind` when an existing native element or component owns the markup. These
complete recipes are also available with copy buttons and links to live scenarios
at [/motion-lab/guide](/motion-lab/guide). This is a beta adapter over pinned Motion
13.4.4; see the [release checklist](release-checklist.md) for the current engine pins.

## Install the supplied release candidate

From your application directory, install the archive supplied in the release-candidate
handoff. No checkout or consumer-side library build is needed:

```sh
pnpm add /absolute/path/to/astra-motion-0.1.0-rc.2.tgz
```

This artifact is prepared locally; no registry publication is implied. Match its hash
to the handoff verification record. The package contains one qualified Motion engine;
no separate Motion installation or dependency overrides are required. Svelte 5.57.0
or newer within Svelte 5 is required. Only `/routes` and `/view-navigation` require
SvelteKit 2.70.3 or newer within Kit 2. Strict declarations use `skipLibCheck: false`.

## Choose an authoring path

The table below includes the supported compatibility controllers used by this guide’s
recipes. For new code, the primary references also cover `AnimatePresence`,
`LayoutGroup`, `useAnimate`, `useScroll`, `useInView` and `AnimateView`. See the
[migration guide](migration.md) when moving between these contracts.

| Need                                                             | Start with                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| Simple enter/exit fade, fly or intrinsic-height slide            | Native Svelte transitions from `svelte/transition`    |
| New HTML markup, state, gestures and optional layout             | `motion.div`, `motion.button`, `motion.input`, etc.   |
| Existing native markup, headless components or native directives | `motion.bind` and its props/transition                |
| Reusable custom Svelte components                                | `motion.create(Component)` with attachment forwarding |
| Layout only, grouped or shared identities                        | `createLayout` attachments                            |
| Exit before replacing a branch                                   | `AnimatePresence value={selected} mode="wait"`        |
| Scoped sequences or scroll-linked motion                         | `createAnimate` or `createScroll`                     |
| Visibility without an animation owner                            | `createInView`                                        |
| Shared content across SvelteKit routes                           | `astra-motion/routes`                                 |

Use root imports first. Feature entries and `/state/lite` are optional bundle
optimizations, described below; they should not be the first authoring decision.
Each component or binding owns one simultaneously mounted element. Tag components
work directly in a keyed list; native bindings belong in a per-item component when
each item needs an independent owner.

`presence()` is Astra's small standalone opacity transition. `binding.transition`
connects a native binding's enter/exit targets and live policy to Svelte's
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
`motion.style`, preserving MotionValues. Within that object, an `undefined` value
clears the matching nested style; removing the key restores its nested fallback.
A CSS string supplies native declarations alongside nested Motion styles. Omitting
`style` or setting it to `null` leaves `motion.style` in effect. Motion owns animated
properties; do not combine raw `transform` with decomposed `x`, `y`, `rotate` or
`scale` values.

On tags that support it, top-level `disabled` sets the native attribute and disables
gestures. `false` or `null` removes that attribute and clears the component's gesture
gate. Native disabled fieldsets, `inert` and `aria-disabled="true"` ancestors still
prevent gestures. The compatibility option `motion.disabled` is gesture-only and
never adds a native disabled attribute. An undefined top-level `disabled` preserves
that nested gesture setting. Native handlers such as `onclick` and animation
callbacks such as `onAnimationComplete` remain separate.

Layout/controller options and reusable components accepting `motion={binding}`
keep their existing contracts. Create native bindings with `motion.bind(options)`.
This does not add Motion React props that Astra does not otherwise support, or new
Svelte native bindings.

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
become component props. Use native markup with `motion.bind` for `bind:group`,
media bindings, readonly dimensions, `class:`/`style:` directives or parent-scoped
CSS element selectors. Radio groups especially need their native inputs in the same
Svelte component. Generated tags now cover HTML and SVG. `motion.create` also supports custom tags and
Svelte components that forward attachment props to one native root. See the current
[motion reference](https://alois-reinstadler.github.io/astra-motion/docs/motion).

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
	import { motion } from 'astra-motion';
	let shown = $state(true);
	let selected = $state<string[]>([]);
	const choice = motion.bind(() => ({
		initial: { opacity: 0 },
		animate: { opacity: 1, scale: selected.includes('news') ? 1.1 : 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.2 },
		reducedMotion: 'user'
	}));
	const enterExit = choice.transition;
</script>

<button onclick={() => (shown = !shown)}>Toggle choices</button>
{#if shown}
	<fieldset>
		<legend>Subscriptions</legend>
		<label
			><input
				class="choice"
				type="checkbox"
				value="news"
				bind:group={selected}
				{...choice.props}
				transition:enterExit|global
			/> News</label
		>
		<label><input type="checkbox" value="events" bind:group={selected} /> Events</label>
	</fieldset>
{/if}
<p>Selected: {selected.join(', ') || 'None'}</p>

<style>
	.choice {
		accent-color: teal;
		outline-offset: 4px;
	}
</style>
```

`motion.bind` uses the component engine: defaults, targets, variants, transform
composition, reduced-motion policy, callbacks, interruption and cleanup match
`motion.*`. Its static options or getter belong in component setup. A getter follows
changing targets and options without recreating the binding.

The `.props` spread includes the attachment and server-rendered initial style. Do not
attach it again. Keep native directives, attributes and events on that same element.
If supplying a separate native style string, merge the binding’s generated style too;
a later unmerged style replaces it. Alternatively put authored animation styles in
the options’ `style` object.

An attachment cannot retain a Svelte outro. The aliased `transition:` directive above
supplies retention, with `|global` for removal of an enclosing block. Use one transition
implementation per element. Managed `AnimatePresence` coordinates registered exits;
keep its owner mounted while children exit. `initial: false` suppresses initial entry.

Configuration context is captured during setup. A provider around markup in this
same component cannot retroactively configure its binding; place the provider above
the component or pass explicit options. For native SSR variant ancestry, create
`const child = parent.child(options)` to declare its variant parent before rendering. Tag
components establish that ancestry themselves. Each binding owns one simultaneous root.
For SVG metadata, use the optional second argument:
`motion.bind(options, { namespace: 'svg', tag: 'circle', attributes: () => ({ cx: 20, cy: 20, r: 8 }) })`.

`motion.bind` and `motion.*` default to `reducedMotion: 'never'`, matching Motion.
Choose `'user'` explicitly to follow the OS. The removed `createMotion` helper is
not a compatibility option; specify initial targets and transition settings when
migrating code that relied on its different defaults.

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

The direct parent must be positioned. The retained item needs a native outro. Use a per-item component if each item also needs its own `motion.bind` binding.

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
	import { motion } from 'astra-motion';
	let open = $state(true);
	const panel = motion.bind({
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

`parent.child()` declares variant ancestry before mounting, including SSR. Keep the
parent binding mounted while its child uses that ancestry. Add `|global` when a
child transition must participate in removal of an enclosing block. `initial: false`
skips the first entrance.

Try [Coordinated children, including SSR](/motion-lab/inheritance).

## Your own component

For reusable components, `motion.create` adapts the component’s existing native root.
The root component must spread the entire rest object, including symbol-keyed
attachments. Reconstructing props from string-only keys loses those attachments.

```svelte
<!-- Card.svelte -->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	let { children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...props}>{@render children?.()}</div>
```

Create the wrapper once during setup: `const MotionCard = motion.create(Card)`.
Use `<AnimatePresence present={open}><MotionCard exit={{ opacity: 0 }}>…</MotionCard></AnimatePresence>`
for managed exit retention. A native Svelte outro directive cannot cross an opaque
component boundary automatically. If the custom component already owns native
conditional removal, forward the binding and directive explicitly as below. Existing
bindable props remain part of the wrapped component’s contract; preserve them in its
own props and root forwarding.

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
`motion.bind()`. Here `motion` is a binding, whereas a tag component’s `motion`
prop is an options object. `attributes` preserves native props and callbacks,
`bind:ref` forwards the real element, and the explicit style merge preserves both
owners. The type-only import does not load the engine for non-animated consumers.

Headless components also need their own lifetime integration. Keep the primitive’s
IDs, ARIA attributes, ref, attachments and composed event handlers on the same real
node; use its prop merger when available. For Bits UI, `forceMount` plus its child
snippet’s `open` state lets a native `{#if open}` own the transition. Disabling a
primitive’s built-in retention without that branch loses exits. Portals still own
focus and accessibility behavior; create an independent `motion.bind` binding inside the
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

Use the returned controls for pause, play, time and speed. Do not give a timeline a node already owned by a motion binding, layout or a scroll animation.

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
- Put authored rotation/scale into Motion’s `style` or animation targets. A nonempty raw
  `transform` masks independent transform targets. Reset that raw transform before
  switching to independent targets; use an outer element for a separately authored
  transform. Paint-only bindings preserve existing CSS transforms.
- Intrinsic-height accordions often suit Svelte’s reveal transition. The project’s
  accordion uses its existing content elements and keeps text away from surface scale.

## Defaults and reduced motion

Wrap the application's descendants in `MotionConfig` from `astra-motion` to set
`transition`, `layoutTransition` and `reducedMotion`. Both `motion.bind` and
`motion.*` default to `'never'`, matching Motion. Set `reducedMotion="user"`
explicitly to follow the OS; `'always'` and `'never'` provide explicit overrides.
Configuration is inherited by bindings created during descendant component setup.
A provider around markup in the same component cannot retroactively configure its
script's bindings. Move it above that component or pass explicit options. Tag
components rendered beneath the provider inherit it. Routes inherit the ancestor
policy; explicit options win.

Nested tag components inherit variants during SSR. Use `parent.child()` for native
binding ancestry; live DOM discovery cannot determine server styles. `initial: false`
renders the final animate pose and suppresses first entry. Without an initial target,
the binding preserves its authored initial styles. Reduced-motion policy settles
positional/layout animation while paint effects can continue.

## Ownership and cleanup

One visual owner per node keeps interruption predictable. Update a bound element
through reactive options, `binding.animate()`, or its MotionValues. Give a scoped
timeline or scroll animation a different element. Attachment cleanup releases
controllers and owned animation styles; user-owned MotionValues remain yours.

Motion components and native bindings share engine keyframes and repeats. Native
outro retention requires a finite total duration; intrinsic dimensions and CSS
variables are resolved from the mounted DOM.
`AnimatePresence` coordinates arbitrary async work through generation-scoped
`usePresence().safeToRemove`; an infinite exit intentionally never completes.
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

## Reactive inputs and output shapes

Call `use*` helpers during component setup. These are Svelte lifecycle helpers,
not React hooks executed on each render; no React call-order model or dependency
array applies. Inputs that may change accept a static value or a getter returning
that value. Use getters when replacing sources or options, for example
`useScroll(() => ({ container }))` or `useFollowValue(() => target, () => ({ type: 'tween', duration }))`.
`useMotionValue(initial)` deliberately takes only a starting value. Function-valued
callbacks remain callbacks; they are not automatically evaluated as getters.

| Output                                      | Read and write                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Reactive state readers, such as `useInView` | Read `.current` in markup/effects; destructuring once loses reactivity                                                   |
| MotionValue                                 | `.get()` reads; `.set()`/`.jump()` write. Pass the value directly to animated `style` so updates reach the engine        |
| Ordinary Svelte text, conditions and markup | `const valueStore = motionStore(value)` then use `$valueStore`; the bridge does not take ownership of the borrowed value |

`useAnimate` returns `[scope, animate]`. Attach `scope.attach`; its `.current` is a
read-only element reader. For interruption-aware application work, await the run’s
`controls.settled`: `{ status: 'finished' }` or `{ status: 'cancelled', reason }`.
Reasons are `stopped`, `cancelled`, `replaced` and `detached`. Pause remains pending;
resuming continues the run; replay after successful completion creates a new promise.
Sequences settle as one run. Repeated observers see the same cycle’s outcome.
Upstream `finished`/`then` remain completion-only and can stay pending on interruption.
Only owned playback is stopped on cleanup; borrowing a MotionValue does not transfer
its external animation ownership.

## Practical interaction recipes

The existing [Getting started guide](https://alois-reinstadler.github.io/astra-motion/docs/getting-started)
contains complete native-binding, dialog, changing-panel and accordion components.
The dialog keeps `showModal`/`close` semantics and awaits `settled`; the panel example
uses single-value presence while its controls stay mounted; the accordion preserves
native scoped CSS and aria-expanded. Use a headless tabs/dialog primitive when its
keyboard navigation and focus management are needed, and preserve that primitive’s
props and lifecycle instead of recreating its semantics in motion callbacks.

For removable lists, use `AnimatePresence items={items} key={(item) => item.id}`
with the retained child snippet and each child’s `exit`. Choose `popLayout` when
siblings should immediately fill the outgoing row’s space, and give the containing
list `position: relative`. The [presence reference](https://alois-reinstadler.github.io/astra-motion/docs/animate-presence)
shows the existing list recipe. For pointer sorting, the [Reorder reference](https://alois-reinstadler.github.io/astra-motion/docs/reorder)
uses `bind:values`; an explicit `onReorder` retains proposal authority even with binding.

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

Keep root imports while authoring. For a measured bundle need, import `{ motion }`
from `astra-motion/state` for full native binding features or from
`astra-motion/state/lite` for bindings without layout or gestures. Both expose the
same `motion.bind` spelling and animation contract; neither exports `createMotion`.
Other focused entries are `/layout`, `/presence`, `/values`, `/animate`, `/scroll`,
`/in-view` and `/policy`. `/routes` and `/view-navigation` require Kit.
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

### Check a custom root before wrapping it

The installed archive includes a conservative static checker:

```sh
pnpm exec astra-check-forwarding src/lib/Card.svelte
```

Pass only components intended for `motion.create`. The checker flags native markup
with no attachment/spread forwarding and explains the minimum correction. It does
not guess through delegated components or verify arbitrary spread dataflow, so a
clean result supplements the complete forwarding recipe and runtime tests.

### Partial replacement and completed controls

For `useAnimate`, replacing one sequence channel settles that run as
`cancelled/replaced`. Unaffected channels continue and remain owned until they finish
or the scope is removed. The old group cannot replay, seek or mutate those channels
after replacement; explicit `stop()`/`cancel()` can still stop its remaining work.
A new external animation remains owned by its caller.

Pausing completed controls keeps their completed settlement. Seeking completed controls
reacquires cleanup ownership but preserves that same result; `play()` begins a new
settlement cycle. Pausing a live run or hiding Activity keeps settlement pending without
polling for completion while playback is suspended. Upstream `finished` is not rewritten.

Modern native exits resolve intrinsic dimensions, CSS variables and relative units
through the same DOM resolver as components. Explicit first keyframes are honored,
and finite repeats include their repeat delay and final repeat direction. Native
outros require a finite total duration; an infinite repeat cannot supply a finite
Svelte removal clock.

### Resetting a raw transform

A nonempty raw `transform` masks independent targets such as `x` and `scale` in
both authoring paths. Clear it with `transform: ''` before using independent
targets again.

The pinned Motion 13.4.4 engine has a matrix-to-`none` interpolation limitation:
it can normalize the target to an all-zero matrix, which collapses the element.
Use an explicit identity matrix for a raw-transform reset. To retain the literal
CSS `none` endpoint, apply it through `transitionEnd`:

```ts
await binding.animate({
	transform: 'matrix(1, 0, 0, 1, 0, 0)',
	transitionEnd: { transform: 'none' }
});
```

This limitation also affects `motion.*`; it is not a difference between native
bindings and components. An independent transform target is usually simpler.
