# Authoring Astra motion

Use native Svelte elements and the smallest feature entry that fits the job. These
complete recipes are also available with copy buttons and links to live scenarios
at [/motion-lab/guide](/motion-lab/guide). This is a beta adapter over pinned Motion
13.2.0; see the [qualification report](research/composition-scroll-timelines.md).

## Choose an entry

| Need                                                                     | Import                    |
| ------------------------------------------------------------------------ | ------------------------- |
| State, variants, MotionValues and native presence; no layout or gestures | `astra-motion/state/lite` |
| The same binding plus layout and interaction states                      | `astra-motion/state`      |
| Layout only, groups and local shared elements                            | `astra-motion/layout`     |
| Lightweight fade, wait and popLayout helpers                             | `astra-motion/presence`   |
| Scoped imperative animation and sequences                                | `astra-motion/animate`    |
| Window/container scroll progress and linked animation                    | `astra-motion/scroll`     |
| SvelteKit route coordination and shared route elements                   | `astra-motion/routes`     |

The full `astra-motion` entry also exports `Motion`, `MotionConfig` and utilities. Route
coordination stays in its Kit-specific entry. The lite binding uses the same authoring
contract and works with component binding props; unsupported layout/gesture options
are rejected. No compiler plugin is necessary.

Bindings and scroll controllers belong in component initialization. Attachments do
no server DOM work; `binding.props` includes initial SSR styles. A binding owns one
simultaneously mounted element. Use `Motion` directly in a keyed list, or create
the binding in your own item component.

Motion transitions use **seconds**. The small native `presence()` helper follows
Svelte’s **milliseconds**. Native `transition:` is bidirectional; split `in:` /
`out:` directives have different interruption semantics. Use one transition
implementation per element, and aliases such as `const enterExit = panel.transition`.

The standalone `presence()` fade reads an explicit `reducedMotion` option, or the OS
preference, when a transition starts. It does not inherit `MotionConfig` or subscribe
to policy changes during playback. Use `createMotion().transition` when entry and
exit should inherit application defaults and react to live reduced-motion changes.

## Motion component

`Motion` renders a native HTML element and creates its binding and native transition.
Each keyed instance owns its own binding, so exits work without another directive:

```svelte
<script lang="ts">
	import { Motion, MotionConfig } from 'astra-motion';
	let items = $state([1, 2, 3]);
</script>

<MotionConfig transition={{ duration: 0.24 }}>
	<ul>
		{#each items as item (item)}
			<Motion
				as="li"
				motion={{
					initial: { opacity: 0 },
					animate: { opacity: 1 },
					exit: { opacity: 0 }
				}}
			>
				<button onclick={() => (items = items.filter((value) => value !== item))}>
					Remove {item}
				</button>
			</Motion>
		{/each}
	</ul>
</MotionConfig>
```

`as` defaults to `div`. Native attributes, event handlers and children are forwarded;
`bind:ref` exposes the native element. The ordinary CSS `style` prop is merged with
Motion's owned styles, including SSR initial values. Animation targets, transitions,
gestures and MotionValue styles belong in the `motion` options object. A `Motion`
inside `MotionConfig` inherits that provider even when both appear in one template.

Keep `as` stable for an instance's lifetime. To change the native tag, wrap the
component in `{#key tag}` so its old and new elements get independent bindings.
Native value bindings such as `bind:value` are not component props; use native events
and `bind:ref`, or attach a binding directly to an input when those directives are needed.

Bindings remain useful for existing native elements and custom component integrations.
With a binding, `exit` requires the native transition directive shown below.

## State & presence

A binding supplies SSR styles and an attachment. A native transition retains the real element for exit.

```svelte
<script lang="ts">
	import { createMotion } from 'astra-motion/state/lite';
	let open = $state(true);
	const panel = createMotion({
		initial: { opacity: 0, y: 12 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -12 },
		transition: { duration: 0.24 }
	});
	const enterExit = panel.transition;
</script>

<button onclick={() => (open = !open)}>Toggle</button>
{#if open}
	<section {...panel.props} transition:enterExit>Still a section.</section>
{/if}
```

Create one binding per simultaneously mounted element. Motion durations are seconds; the small presence() helper uses milliseconds.

Try [State & presence](/motion-lab/state).

## Automatic layout

Change ordinary state. CSS chooses the destination; the shared projection scheduler animates it.

Each participant observes its parent subtree by default, plus direct ancestor changes
and ancestor resizes. For position-only reflow caused outside that subtree, use a wider
`createLayout({ observationRoot: () => root })` with `bind:this={root}`, or wrap the
change in `layout.update`. An explicit observation root must contain its participants.
Automatic batches select affected participants; explicit transactions coordinate all groups.

Matching `layout.id` values share only within a controller's scope. Supply the same
`layoutGroup` to both state bindings or `Motion` elements, or use controllers with the
same explicit `id`. This avoids accidental sharing across independent widgets.

```svelte
<script lang="ts">
	import { createLayout } from 'astra-motion/layout';
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
	import { Presence, presence } from 'astra-motion/presence';
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
	import { createInView } from 'astra-motion/in-view';
	let section = $state<HTMLElement>();
	const visibility = createInView(() => section, { amount: 0.5, once: true });
</script>

<section bind:this={section}>
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
	import { createLayout } from 'astra-motion/layout';
	import { popLayout, presence } from 'astra-motion/presence';
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
	import { createLayout } from 'astra-motion/layout';
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
	import { createMotion } from 'astra-motion/state';
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
	import type { Snippet } from 'svelte';
	import type { MotionBinding } from 'astra-motion/state';
	let { motion, children }: { motion?: MotionBinding; children: Snippet } = $props();
	const transition = (node: HTMLElement) => motion?.transition(node) ?? { duration: 0 };
</script>

<article {...motion?.props} transition:transition|global>
	{@render children()}
</article>
```

Save this as MotionCard.svelte, then pass motion={card} from a parent using createMotion(). The project’s shadcn Card, Dialog and Accordion implement this contract.

Try [Your own component](/motion-lab/components).

## Scroll-linked motion

Attach a container, optionally a target, and a linked animation. Motion selects its native or fallback scroll implementation.

```svelte
<script lang="ts">
	import { createScroll } from 'astra-motion/scroll';
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
	import { createAnimate } from 'astra-motion/animate';
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
  CSS transforms on a Motion-owned node are diagnosed because two transform owners
  cannot reliably compose. Ordinary transforms elsewhere remain ordinary CSS.
- Intrinsic-height accordions often suit Svelte’s reveal transition. The project’s
  accordion uses its existing content elements and keeps text away from surface scale.

## Defaults and reduced motion

Wrap the application’s descendants in `MotionConfig` from `astra-motion` to set
`transition`, `layoutTransition` and `reducedMotion`. The default reduction policy
follows the OS; `'always'` and `'never'` provide explicit overrides. Configuration
is inherited by bindings created in descendant component initialization, not by
bindings already created in the same component that renders the provider. Route
coordination accepts its own policy options.

Use `parent.child()` for SSR-safe variant inheritance. Live DOM ancestry alone cannot
determine child server styles. `initial: false` renders the final initial pose and
suppresses the first intro. Existing animations settle when reduced motion turns on;
a Svelte outro clock already running still owns its original retention duration.

## Ownership and cleanup

One visual owner per node keeps interruption predictable. Update a bound element
through reactive options, `binding.animate()`, or its MotionValues. Give a scoped
timeline or scroll animation a different element. Attachment cleanup releases
controllers and owned animation styles; user-owned MotionValues remain yours.

Finite presence targets need resolved values: repeated exits, unresolved `auto`
and CSS variables, and arbitrary async safe-to-remove callbacks are not supported.
A stopped Motion playback promise may remain pending; do not make teardown await it.
Runtime source HMR intentionally reloads the page.

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
