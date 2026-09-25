# Astra Motion

Motion’s animation engine, connected to Svelte 5. Astra animates native elements,
coordinates exits through Svelte’s lifecycle, and follows layout changes with
Motion’s projection engine. A separate SvelteKit adapter connects route changes to
browser View Transitions.

**Working beta, version 0.0.1.** This repository has not announced a public registry
release. Astra is [MIT licensed](LICENSE). Evaluate the local package before
adopting it. [Motion 13.4 upgrade qualification](docs/research/motion-upgrade-13.4.md)
records the current engine graph. Motion DOM 13.4.2 is pinned because the layout
adapter uses undocumented upstream exports.

## Try it locally

Try the [live site](https://alois-reinstadler.github.io/astra-motion/) or
[Fieldwork showcase](https://alois-reinstadler.github.io/astra-motion/showcase) on your phone.
The GitHub Pages workflow deploys `main`.
It builds with `BASE_PATH=/astra-motion`; local development uses the root path.

```sh
git clone https://github.com/alois-reinstadler/astra-motion.git
cd astra-motion
pnpm install
pnpm dev
```

Open the URL printed by Vite. The site includes [guides](src/lib/site/docs.ts),
interactive examples, the Fieldwork showcase, and project background and status
pages. In the shared development container, use the preview manager described in
[AGENTS.md](AGENTS.md) instead of starting an unmanaged server.

To evaluate Astra in another Svelte app, build a tarball in this checkout:

```sh
pnpm run prepack
pnpm pack
```

The tarball includes one qualified DOM-only Motion engine. No consumer dependency
overrides or separate Motion installation are required. Its declarations are checked
with `skipLibCheck: false`.

Run this from your app directory, replacing the path with the generated file:

```sh
pnpm add /absolute/path/to/astra-motion/astra-motion-0.0.1.tgz
```

Use Svelte 5.57.0 or newer within Svelte 5. SvelteKit 2.70.3 or newer within Kit 2
is needed only for `astra-motion/routes`. Get MotionValues and their helpers from
`astra-motion` or `astra-motion/values`; interoperability with a separately installed
Motion engine is not part of Astra’s contract.
The commands above evaluate this repository’s package; a similarly named registry
package should not be assumed to be this project.

## Animate a native element

Prefer native Svelte transitions for simple enter/exit effects. For new HTML needing
Astra capabilities, start with a tag component such as `motion.section`, `motion.button`
or `motion.input`.
Each renders that real HTML element, includes SSR styles and its native exit
transition, and works directly in keyed lists:

```svelte
<script lang="ts">
	import { motion } from 'astra-motion';
	let visible = $state(true);
</script>

<button onclick={() => (visible = !visible)}>Toggle</button>
{#if visible}
	<motion.section
		initial={{ opacity: 0, y: 12 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: -12 }}
	>
		A native section, including its exit.
	</motion.section>
{/if}
```

Animation options are top-level props on both `motion.tag` and generic `Motion`.
`style` accepts a CSS string or a Motion style object, including MotionValues.
The older `motion={{ ... }}` form remains supported; defined top-level options take
precedence. See [styles and migration](docs/authoring.md#component-props-styles-and-migration)
for the full contract.

Tag components accept the corresponding HTML attributes and event callbacks.
`motion.input` supports value bindings, and `bind:ref` exposes its typed native DOM
node. Use `createMotion` on existing native markup when you need native directives,
`bind:group`, parent-scoped element selectors or headless component integration.
Generic `<Motion as="button">` remains available; its dynamic element does not add
native value bindings. See the [binding contract](docs/authoring.md#native-bindings-and-forwarding).

```svelte
<script lang="ts">
	import { createLayout } from 'astra-motion';
	const layout = createLayout();
	let open = $state(false);
</script>

<button onclick={() => (open = !open)}>Toggle</button>
<div {@attach layout()}>
	{#if open}<p {@attach layout({ mode: 'position' })}>Content determines the layout.</p>{/if}
</div>
```

**Layout observes ordinary Svelte updates automatically.** Motion's cached geometry
preserves the current visual pose across interrupted changes. Use `layout.update`
for an explicit transaction, or `createLayout({ automatic: false })` to opt out of
requesting observation. Automatic observation defaults to each participant's parent
subtree, direct ancestor changes and ancestor resizes. Supply
`observationRoot: () => root` to observe a wider subtree when external content can
move a participant without resizing its ancestors. Groups still share a coordinator:
observation stays active while any group requests it; explicit transactions cover all
groups. Text inside resizing surfaces needs a transformable position-projected
host, as above; images need a defined intrinsic aspect/crop contract.

This remains experimental: `motion-dom@13.4.2` is pinned because projection uses
framework-independent but undocumented root exports. A small adapter compatibility
listener handles detached shared sources in scroll containers; the dependency itself
is unpatched. See the documented transform and browser limits before adopting it.
Native animation handoffs additionally use a small, isolated compatibility helper
with two private-field accesses. The [aftercare and independent review](docs/research/aftercare-and-site.md)
documents why, the upgrade tests, and the fixes made after adversarial testing.

The [production qualification](docs/research/production-qualification.md) covers a
real build, packed installation in an independent SvelteKit app, production SSR and
hydration, cold asset sizes, BFCache, HMR, deferred route content, and sustained
CPU-throttled profiling. Physical Safari/iOS remains untested. The 500-participant
workload exposes a performance limit on throttled CPUs; explicit transactions help
but do not make that workload smooth.

- [Hands-on test tour: showcase and deeper lab scenarios](docs/try-it.md)
- [Authoring guide: complete examples and practical contracts](docs/authoring.md)
- [Research, architecture, complete API and limitations](docs/motion-system.md)
- [Automatic layout and cached snapshots](docs/research/automatic-layout.md)
- [Initial architecture decision](docs/research/decision.md)
- [Verification and benchmark results](docs/research/validation.md)
- [Independent reviews](docs/research/review-motion.md)
- [Humanspeak audit and reproducible findings](docs/research/humanspeak-audit.md)

The interactive lab lives at `/motion-lab`. The copyable recipes now appear in the
topic guides at `/docs`; `/motion-lab/guide` remains available. Try six more scenarios and rapid stress at
`/motion-lab/extended`, compare ordinary assignments and explicit transactions at
`/motion-lab/updates`, and route shared elements at `/motion-lab/product`.
Try state/variants/values/gestures at `/motion-lab/state`, and the actual shadcn
accordion, dialog and cards at `/motion-lab/components`. Additional labs: `/motion-lab/presence`,
`/motion-lab/scroll`, `/motion-lab/timelines`, and `/motion-lab/inheritance`.

```sh
pnpm run check
pnpm run test:motion
pnpm exec vitest run --config vitest.motion.config.ts
MOTION_LAB_URL="$DEV_LOCAL_URL" pnpm run test:e2e
node scripts/measure-motion-bundles.mjs
```

`test:unit` runs once; `test:server` runs only the Node suite. `test:e2e` and
`test:motion:e2e` run the same Motion suite against the existing server supplied in
`MOTION_LAB_URL`. They never build or start a server and fail clearly if that URL
is missing. In this container, use the local URL allocated by `dev-preview`.

On a development or CI machine permitted to launch test browsers, run
`pnpm run test:browsers:install` once to download Playwright browsers. CI installs
its selected browser explicitly; test commands do not download browsers. This
container uses its existing shared Chrome for browser verification.

The bundle-size script only creates isolated feature bundles in memory, with
host Svelte/SvelteKit externalized.

Runtime entry points: `astra-motion`, `/layout`, `/presence`, `/state/lite`, `/state`, `/values`,
`/animate`, `/scroll`, `/in-view`, `/policy`, and `/routes`. The routes entry requires SvelteKit; other entries do not.
`createInView(() => element, options)` exposes reactive viewport visibility without an
animation binding. `Presence` defaults to wait sequencing and also supports `mode="sync"`
and an `onExitComplete` callback after the outgoing branches finish.
Begin with the root import. When optimizing a binding’s bundle, choose `/state/lite`
for state, native presence, variants and MotionValues, or `/state` for layout and interactions. Both use the same
binding implementation. The lite entry excludes the projection-node engine and
gesture module (26,333 bytes gzip versus 40,780 bytes for full state in the September 21
measurement, host Svelte externalized).
The project-local shadcn components accept `motion={binding}` (and independent
`overlayMotion={binding}` on dialogs). They import only the binding type, so ordinary
widgets do not import the animation engine. Nested tag components inherit variant ancestry during SSR. Use `parent.child(options)`
for the equivalent native-binding contract. Descendants must remain inside their
declared parent in the DOM. The packaged Motion 13.4.3 DOM APIs power scroll and
timelines; React is neither installed nor imported by this runtime.

## Project scope and release work

Astra focuses on adapting Motion to Svelte. The [scope decision](docs/research/motion-focus.md)
and [independent review](docs/reviews/2026-09-21-motion-focus.md) record the September 21
baseline. Current changes and verification are documented in the
[Motion 13.4 migration](docs/research/motion-upgrade-13.4.md) and
[projection boundary review](docs/research/projection-boundaries.md).
Physical Safari/iOS and low-end-device testing remain
open; large animated layouts have known performance limits. Full Motion React API
parity is outside the current scope.

For an issue, include a small reproduction, dependency versions, browser, and the
steps that interrupt the animation. See the [authoring guide](docs/authoring.md)
for ownership and lifecycle contracts, and [site deployment notes](docs/site-deployment.md)
for configuring canonical URLs when a public domain is chosen.
