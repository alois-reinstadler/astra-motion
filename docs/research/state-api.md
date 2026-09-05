# Native motion state: authoring and current boundaries

Try `/motion-lab/state`: reversible entry/exit combined with resizing, inherited staggered variants, a MotionValue slider and spring follower, keyboard/pointer feedback, and a bounded draggable card. The page follows the existing lab styling and includes expandable source examples.

## One binding, one native element

`createMotion` supplies an attachment and matching initial inline styles through `.props`. Spread those props on the actual element. A getter tracks Svelte state; ordinary assignments select new targets. Use the transition alias only when Svelte should retain the element through an outro.

```svelte
<script lang="ts">
	import { createMotion } from '$lib/motion/motion.svelte.js';
	let open = $state(true);
	let expanded = $state(false);
	const card = createMotion(() => ({
		initial: { opacity: 0, scale: 0.94, y: 16 },
		animate: {
			opacity: 1,
			scale: 1,
			y: 0,
			backgroundColor: expanded ? '#ece1cb' : '#f8f6ef'
		},
		exit: { opacity: 0, scale: 0.9, y: -20 },
		layout: true
	}));
	const cardPresence = card.transition;
</script>

<button onclick={() => (open = !open)}>Toggle</button>
<button onclick={() => (expanded = !expanded)}>Resize</button>
{#if open}
	<article {...card.props} transition:cardPresence class:expanded>Content</article>
{/if}

<style>
	article {
		width: 200px;
		padding: 24px;
	}
	article.expanded {
		width: 300px;
	}
</style>
```

This keeps an `article` as the DOM element. The binding is not a reusable attachment factory: create another binding for another simultaneous element. A fully removed conditional branch can mount its binding again.

For content inside a resizing surface, give text/image containers their own position or preserve-aspect layout binding as appropriate. Parent scaling alone cannot preserve unregistered child proportions. The lab's first example uses a position-projected content block.

## Shared defaults

`MotionConfig` establishes configuration for descendant components. Create bindings inside those descendants, so their initialization sees the provider's Svelte context.

```svelte
<script lang="ts">
	import MotionConfig from '$lib/motion/MotionConfig.svelte';
	import Cards from './Cards.svelte';
</script>

<MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
	<Cards />
</MotionConfig>
```

`reducedMotion="always"` selects immediate target changes. `user` follows the device preference; `never` is the application override. External MotionValues retain their own ownership: a separately created `springValue` is not automatically rewritten into a plain value by context. The lab switches the follower's binding to its direct value when motion is reduced.

## Named states and stagger

Each element owns its own binding. The parent's variant label flows through Motion's actual VisualElement tree to children that do not supply their own `animate` label.

Parent component:

```svelte
<script lang="ts">
	import { createMotion } from '$lib/motion/motion.svelte.js';
	import { stagger } from '$lib/motion/values.js';
	import Tile from './Tile.svelte';
	let lifted = $state(false);
	const group = createMotion(() => ({
		initial: 'rest',
		animate: lifted ? 'lifted' : 'rest',
		variants: { rest: { opacity: 1 }, lifted: { opacity: 1 } },
		transition: { delayChildren: stagger(0.075) }
	}));
</script>

<button onclick={() => (lifted = !lifted)}>Change state</button>
<div {...group.props}>
	<Tile /><Tile /><Tile />
</div>
```

`Tile.svelte`:

```svelte
<script lang="ts">
	import { createMotion } from '$lib/motion/motion.svelte.js';
	const tile = createMotion({
		style: { opacity: 0.5, y: 0 },
		variants: {
			rest: { opacity: 0.5, y: 0 },
			lifted: { opacity: 1, y: -24 }
		}
	});
</script>

<div {...tile.props}>Tile</div>
```

For SSR-safe inherited labels, create a descendant with `parent.child(options)` and attach it inside that parent's native element. This declares the same variant parent on server and client, including inherited `initial: false`. Explicit initial objects/styles remain useful without that declaration. See [coordinated presence and SSR examples](composition-scroll-timelines.md).

Arrays of labels merge per element before animating: the last label wins overlapping
properties, including conflicts with an earlier `transitionEnd`. Per-property
transitions are retained. Deferred child handoffs and final styles are versioned so
an obsolete sequence cannot overwrite the newer destination.

## MotionValues and Svelte stores

Motion supplies value tracking, mapping, derived values and spring physics. `motionStore` adapts an existing value to Svelte's subscription and writable-store contract. It does not own or destroy that value.

```svelte
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createMotion } from '$lib/motion/motion.svelte.js';
	import { motionValue, motionStore, mapValue } from '$lib/motion/values.js';
	const value = motionValue(0);
	const position = motionStore(value);
	const x = mapValue(value, [0, 100], [0, 180]);
	const marker = createMotion({ initial: false, style: { x } });
	onDestroy(() => {
		x.destroy();
		value.destroy();
	});
</script>

<label>Position <input type="range" min="0" max="100" bind:value={$position} /></label>
<div {...marker.props}>Marker</div>
```

`motionValue`, `springValue`, `transformValue`, `mapValue` and `stagger` are direct official Motion DOM exports. Animated visual properties stay in Motion's renderer; subscribe a Svelte store when the UI itself needs the value.

## Gestures

```svelte
<script lang="ts">
	import { createMotion } from '$lib/motion/motion.svelte.js';
	const button = createMotion({
		initial: false,
		animate: { scale: 1 },
		whileHover: { scale: 1.055 },
		whileTap: { scale: 0.94 },
		whileFocus: { scale: 1.04 }
	});
	const card = createMotion({
		initial: false,
		drag: 'x',
		dragConstraints: { left: 0, right: 180 },
		whileDrag: { scale: 1.06 },
		dragTransition: { timeConstant: 180 }
	});
</script>

<button {...button.props}>Press me</button><div {...card.props}>Drag me</div>
```

Hover and press use official Motion gesture recognizers. Focus feedback uses native `:focus-visible`; viewport feedback uses IntersectionObserver with cleanup. Pointer sessions, capture, cancellation and numeric constraint translation are adapter glue because Motion DOM 13.2.0 does not export its complete React drag/pan controllers. MotionValues and Motion's inertia generator own velocity and release animation. A new drag stops its prior inertia. Reduced motion disables release inertia; direct user-controlled dragging still follows the pointer.

The lab adds arrow-key movement and Home reset to its draggable button. These keyboard controls are application semantics; the low-level drag recognizer does not invent keyboard behavior for arbitrary draggable elements.

## Boundaries that matter

- No React, Svelte Motion wrapper or custom physics engine was added. Motion's undocumented root-exported integration APIs remain tied to the exact engine pin.
- Drag supports numeric CSS-pixel `x`/`y` values and numeric bounds. It does not claim reference-element constraints, transformed-coordinate correction, elasticity, direction locking, programmatic drag controls or a reorder abstraction.
- Feed animated transforms through the binding's targets or `style` MotionValues. Do not add a competing application `transform` writer to the same element.
- Dynamic gesture targets and callbacks are read live. The binding refreshes recognizers when their availability or viewport configuration changes, rather than rebuilding them for every target update.
- Native button activation remains native. Motion's public press recognizer supplies Enter press callbacks; our Space feedback does not synthesize a click.
- The public Motion press recognizer in the pinned version leaves an inert anonymous focus listener after abort. It cannot run the cancelled interaction, but unnecessary repeated reattachment should be avoided.
- `initial` rendering is shared between server markup and the first client appearance. Complex inherited initial variants, delayed hydration and route interruption still need their own qualification; this page alone does not prove those cases.

The isolated gesture/value suite passed 45 cases across Chromium, Firefox and WebKit, including a real browser pointer-capture drag. The state lab passed 12 integration cases across the same three engines, including rapid presence reversal, stagger ordering, reduced-motion value feedback and narrow-screen keyboard drag bounds. Desktop and 390 px Chrome views were inspected through agent-browser MCP; a fresh browser session reported no page errors. See the current validation report for the combined suite rather than treating a demo as full parity certification.

## Scroll and scoped timelines

Optional `astra-motion/scroll` and `astra-motion/animate` entries now expose `createScroll` and `createAnimate`. See the [scroll API](scroll-support.md), [scoped timeline API](scoped-timelines.md), and [current composition/integration report](composition-scroll-timelines.md).
