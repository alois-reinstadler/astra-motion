# Astra Motion

Motion’s animation engine, connected to Svelte 5. Animate native HTML and SVG,
coordinate presence and layout, add gestures and drag, and compose reactive values
without a React runtime.

**Local release candidate: 0.1.0-rc.1.** Registry publication is not implied.
Astra is [MIT licensed](LICENSE). Start with the
[documentation](https://alois-reinstadler.github.io/astra-motion/docs/getting-started),
try the [examples](https://alois-reinstadler.github.io/astra-motion/examples), or explore
[Fieldwork](https://alois-reinstadler.github.io/astra-motion/showcase).

```svelte
<script lang="ts">
	import { MotionConfig, motion } from 'astra-motion';
	let selected = $state(false);
</script>

<MotionConfig reducedMotion="user">
	<motion.button
		aria-pressed={selected}
		onclick={() => (selected = !selected)}
		animate={{ scale: selected ? 1.1 : 1 }}
		whileTap={{ scale: 0.95 }}
	>
		{selected ? 'Selected' : 'Choose item'}
	</motion.button>
</MotionConfig>
```

Use direct animation props on `motion.*`. Native attributes, lowercase event handlers,
form bindings and `bind:ref` retain Svelte’s conventions. Use `motion.bind` on existing
native markup to preserve scoped CSS and native directives such as `bind:group`.
`motion.create` adapts custom components that forward attachments to one native root. `initial` renders on the server;
browser subscriptions and animation work are disposed with their owners.

## Choose your markup

| Existing component shape                     | Authoring path                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| A new animated element                       | `motion.button`, `motion.div`, or another typed tag                                             |
| Native markup, scoped CSS, native directives | `motion.bind(() => options)`; spread `.props` and add its transition for native exits           |
| A reusable custom component                  | `motion.create(Component)`; forward all props, including attachment symbols, to its native root |

See the [complete native recipe](docs/authoring.md#keep-existing-native-markup),
[custom forwarding](docs/authoring.md#your-own-component), and
[React migration guidance](docs/migration.md#coming-from-motion-for-react).

## Install the local package

Use the supplied versioned archive from the release-candidate handoff. No checkout
or library build is required. From your application directory:

```sh
pnpm add /absolute/path/to/astra-motion-0.1.0-rc.1.tgz
```

Use Svelte 5.57.0 or newer within Svelte 5. SvelteKit 2.70.3 or newer within Kit 2
is needed only for the `routes` and `view-navigation` adapters. The tarball includes
one qualified DOM engine: Motion/Framer Motion/Motion DOM 13.4.4 and Motion Utils
13.3.0. Consumers need no separate Motion installation or dependency overrides.
Get MotionValues from Astra to share that engine identity.

A similarly named registry package should not be assumed to be this project.

## Learn the surface

| Section                                                                              | Topics                                                                                                |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [Animations](https://alois-reinstadler.github.io/astra-motion/docs/animations)       | Overview, layout/shared layout, scroll, SVG, transitions                                              |
| [Gestures](https://alois-reinstadler.github.io/astra-motion/docs/gestures)           | Hover, tap, focus, pan, viewport, drag and controls                                                   |
| [Components](https://alois-reinstadler.github.io/astra-motion/docs/motion)           | motion, AnimateActivity, AnimatePresence, AnimateView, LayoutGroup, LazyMotion, MotionConfig, Reorder |
| [Motion Values](https://alois-reinstadler.github.io/astra-motion/docs/motion-values) | Values, templates, events, scroll, springs, time, transforms and velocity                             |
| [Hooks](https://alois-reinstadler.github.io/astra-motion/docs/use-animate)           | Scoped animation, frame callbacks, drag controls, in-view/page visibility and reduced motion          |
| [Guides](https://alois-reinstadler.github.io/astra-motion/docs/getting-started)      | Getting started, accessibility, bundle size and text animation                                        |

Each reference has an interactive example with its canonical complete Svelte source.
Larger compositions live in the examples area and link back to their primary concepts.
The [parity matrix](docs/parity/MATRIX.md) records options, source versions,
observable behavior, evidence and precise differences. The
[reference manifest](docs/parity/references.json) and subsystem audits record the
27 September 2026 upstream baseline, including documentation/source discrepancies.

## Svelte adaptations

- `AnimatePresence` receives `present`, keyed `items`, or one `value` and a child snippet. It cannot
  inspect an opaque Svelte snippet as a React child array. Its default is `sync`;
  legacy `Presence` keeps its `wait` default.
- `AnimateActivity` retains component and DOM state, coordinates exits and visibility,
  and pauses Astra-owned work while hidden. `useActivityEffect` opts application effects
  into cleanup/restart. Ordinary Svelte effects remain active. See the
  [Activity lifecycle contract](https://alois-reinstadler.github.io/astra-motion/docs/animate-activity#svelte-lifecycle)
  for this Svelte adaptation.
- `AnimateView` registers snapshot boundaries. `startViewTransition` coordinates normal
  state changes, including async updates; `viewTransitionsForNavigation` integrates
  SvelteKit navigation through a separate entry. Unsupported browsers still apply state.
- Managed `use*` helpers initialize in component setup, accept reactive getters where
  arguments may change, and dispose their work automatically. Reactive booleans expose
  `.current`; MotionValue helpers return the shared engine’s actual MotionValues.
- `Reorder.Group bind:values={items}` updates Svelte state automatically. Supplying
  `onReorder` preserves controlled acceptance/rejection, even alongside binding.
- `useAnimate` adds `controls.settled` for completion, cancellation, replacement and
  detachment. Its upstream completion-only `finished` behavior remains unchanged.
- A live MotionValue text child uses `children={value}`. An ordinary Svelte `{value}`
  interpolation remains a snippet and does not subscribe to that value.

The 27 September 2026 reference baseline records AnimateActivity as a Motion+ alpha
and AnimateView as a public separate Motion entry. Astra documents their Svelte
lifecycle and fallback contracts explicitly. Projection
uses upstream exports that require qualification on every dependency update. Native
View Transitions depend on browser support. Physical-device performance, animated
external 3D transforms and perspective are not general guarantees.

## Text and pointer tilt

`astra-motion/text` provides unstyled `TextReveal` and `TextSwap`: plain text,
Unicode segmentation, independent reveal effects/stagger, accessible replacement,
and explicit sizing. `astra-motion/tilt` provides `Tilt` with shared springs and
separate measurement/perspective/rotation ownership. Both honor MotionConfig and
Activity lifecycle. See the [text contract](docs/text-motion.md), [tilt contract](docs/tilt.md)
and the [Text and Tilt demo](http://100.64.0.2:4083/motion-lab/text-tilt) for interactive compositions
on the local evaluation preview.

## Smaller entries and compatibility

Use `astra-motion/m` with `astra-motion/lazy` and an eager or deferred bundle from
`astra-motion/features/dom-animation` or `astra-motion/features/dom-max`. Strict
mode catches accidental eager components during development. `astra-motion/mini`
provides the smaller native DOM-style `useAnimate`; use the root helper for hybrid
subjects and sequences. Actual production measurements and their import fixtures
belong to the bundle-size guide and package qualification record.

`createMotion` has been removed. Use `motion.bind` for existing native markup;
`motion.*` and `motion.bind` share Motion's animation defaults and lifecycle.
Both default to `reducedMotion: 'never'`; select `'user'` explicitly to follow the OS.
`createLayout`, `createAnimate`, `createScroll`, `createInView`, `Presence`, route
helpers and the `motion={{ ... }}` component prop remain available. Defined direct
props override matching motion-object props. See [migration guidance](docs/migration.md)
for the required import, initial-style, transform and drag changes.

## Development and verification

Use pnpm. Run the site with the repository’s managed preview instructions in
[AGENTS.md](AGENTS.md); outside the shared container, `pnpm dev` prints the local URL.
GitHub Pages builds `main` with `BASE_PATH=/astra-motion`.

```sh
pnpm check
pnpm check:guide
pnpm lint
pnpm test:server
pnpm test:browsers
pnpm build
pnpm check:package
```

Browser checks require the repository’s installed Playwright browsers. End-to-end
checks use an existing preview through `MOTION_LAB_URL`; their config does not start
another server. CI also checks the packed consumer and production import graph.
Strict declarations use `skipLibCheck: false`.

Report a small reproduction, package/browser versions, and the steps that interrupt
or compose the behavior. See the [delivery record](docs/parity/PROGRESS.md),
[architecture](docs/motion-system.md), and [deployment notes](docs/site-deployment.md).
