# Astra motion

An experimental Svelte-native presence and layout adapter over Motion DOM, with
native View Transitions for SvelteKit routes. Native elements, native outro ownership,
no React runtime and no production preprocessor.

Open the local site at `/`: the homepage leads to `/docs` for guided authoring and
`/examples` for a searchable catalogue. Try `/showcase` for Fieldwork: shared photo
transitions, an adaptable editing desk, an editable queue and a scroll journal with
complete source. The existing `/motion-lab` URLs remain the
stress and experiment area, with navigation back to the site. Start at
`/docs/getting-started`; this is a locally qualified beta, not a published package.

The adapter now includes typed `initial` / `animate` / `exit` targets, SSR initial
styles, inherited variants and stagger, MotionValues, interaction states and bounded
dragging, coordinated native exits, scoped timelines and scroll-linked motion. State and projection share one VisualElement. See the
[state API and examples](docs/research/state-api.md) and
[current implementation report](docs/research/state-implementation.md).
The [composition and scroll report](docs/research/composition-scroll-timelines.md) covers
the earlier API changes, browser fixes, and qualification. The
[latest development report](docs/research/development-followup.md) records the current
fixes, new APIs, and validation.

For component authoring, `Motion` bundles the binding, SSR styles and native exit
transition. Each instance owns one native HTML element and works in keyed lists:

```svelte
<script lang="ts">
	import { Motion } from 'astra-motion';
	let visible = $state(true);
</script>

<button onclick={() => (visible = !visible)}>Toggle</button>
{#if visible}
	<Motion
		as="section"
		motion={{
			initial: { opacity: 0, y: 12 },
			animate: { opacity: 1, y: 0 },
			exit: { opacity: 0, y: -12 }
		}}>A native section, including its exit.</Motion
	>
{/if}
```

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

This remains experimental: `motion-dom@13.2.0` is pinned because projection uses
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
accordion, dialog and cards at `/motion-lab/components`. New labs: `/motion-lab/presence`,
`/motion-lab/scroll`, `/motion-lab/timelines`, and `/motion-lab/inheritance`.

```sh
pnpm run check
pnpm run test:motion
pnpm exec vitest run --config vitest.motion.config.ts
MOTION_LAB_URL=http://localhost:5173 pnpm run test:motion:e2e
node scripts/measure-motion-bundles.mjs
```

The separate motion e2e configuration uses an existing server and never runs a build
or starts a dev server. The bundle-size script only creates isolated feature bundles
in memory, with host Svelte/SvelteKit externalized.

Runtime entry points: `astra-motion`, `/layout`, `/presence`, `/state/lite`, `/state`, `/values`,
`/animate`, `/scroll`, `/in-view`, `/policy`, and `/routes`. The routes entry requires SvelteKit; other entries do not.
`createInView(() => element, options)` exposes reactive viewport visibility without an
animation binding. `Presence` defaults to wait sequencing and also supports `mode="sync"`
and an `onExitComplete` callback after the outgoing branches finish.
Choose `/state/lite` for state, native presence, variants and MotionValues; use
`/state` when the same binding also needs layout or interactions. Both use the same
binding implementation. The lite entry excludes the projection-node engine and
gesture module (26.1 kB gzip versus 40.1 kB, host Svelte externalized).
The project-local shadcn components accept `motion={binding}` (and independent
`overlayMotion={binding}` on dialogs). They import only the binding type, so ordinary
widgets do not import the animation engine. Use `parent.child(options)` for explicit
SSR-safe child variant inheritance. The official `motion@13.2.0` vanilla entry powers
scroll and timelines; React is neither installed nor imported by this runtime.
