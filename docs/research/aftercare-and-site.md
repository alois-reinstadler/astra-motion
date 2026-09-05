# Aftercare, smaller state entry and Fieldwork

Subsequent release evidence is in [production qualification](production-qualification.md).
The source-only checks and remaining-work statements below describe the earlier
aftercare checkpoint; the new report includes actual packed production consumers.

2026-09-05. This follows the [composition implementation](composition-scroll-timelines.md).
The recommendation remains **adopt the architecture with beta/upgrade caveats**.
Svelte owns lifecycle, Motion owns animation and projection, and native View
Transitions enhance Kit navigation. A production preprocessor is still unnecessary.

## One place to learn and try

- `/` is the marketing homepage, with an actual interruptible layout playground.
- `/docs` provides persistent topic navigation, complete copyable recipes, mobile
  contents, previous/next pages and links to the corresponding live examples.
- `/examples` is a searchable catalogue organized by interaction.
- `/showcase` is Fieldwork, a photographic workspace with four complete scenes: a
  shared-element contact sheet, a dockable editing desk, an editable publishing
  queue and a native-scroll journal with a scoped opening-title sequence. Each
  scene includes its actual source and companion files, plus the relevant guide.
- `/motion-lab` and its existing subroutes remain available for stress testing.
  Shared navigation connects them back to the main site and guides.

The examples are source-first. The site does not claim a published registry package,
complete Motion React parity or production qualification. Library package file
selection excludes `dist/site/**`, `dist/showcase/**` and `dist/motion-lab/**`.
Fieldwork uses local NASA photographs with original metadata and media-policy
provenance in `static/showcase/provenance.json`; the page links the original images
and identifies the editorial workspace as fictional.

Docs recipes use the same catalog as the compiler and isolated consumer checks.
Each complete recipe is compiled for SSR and browser output; the intended package
exports are also resolved to source in a temporary consumer and checked by
`svelte-check`. This catches signatures that a syntax-only snippet test misses.

Browser review caught and fixed lost clicks before hydration: demo buttons remain
disabled until mounted, while mobile docs contents use native `details`/`summary`
and work with JavaScript disabled. Links remain ordinary SvelteKit links.

## A smaller state entry, one implementation

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
	<div {...panel.props} transition:enterExit>Native Svelte presence</div>
{/if}
```

`state/lite` includes state, finite native presence, variants and MotionValues.
`state` supplies the same binding with layout and interactions. Each selects its
features at construction; there is no global feature-registration ordering and no
duplicated state engine. Lite `.update()` still coordinates an independently loaded
layout adapter through the existing lightweight commit bridge.

Lite rejects unsupported layout and interaction options in TypeScript and diagnoses
JavaScript callers at runtime. Bindings remain assignable to the component forwarding
contract. Independent rendered-module inspection confirms that lite omits the
projection-node engine and gesture module; `HTMLVisualElement` still brings some
geometry/scale helpers.

## Reproduced core failures fixed

1. **Fresh mounts reused obsolete initial values.** A binding created with
   `initial: false`, removed, updated and mounted on a new node could remain at its
   original destination. Its stable props now resolve current initial values when
   rendering a fresh mount. During an existing mount, props serialize the current
   owned inline styles when author attributes are recomposed, so an unrelated style
   update cannot restore an obsolete initial transform. This reads CSS declarations,
   not computed styles or geometry, and does not subscribe Svelte to animation frames.
   Server rendering also resolves changes made between construction and markup.
2. **Imperative attachment replacement could freeze an exit.** Same-node synchronous
   cleanup/reattachment now preserves the native transition timeline and direction.
   A generation-guarded final cleanup cancels it on actual disposal. Failed attachment
   setup also resets preserved state. Normal Svelte attachment invalidation pauses
   during outro; the independent test distinguishes that behavior from an imperative
   integration explicitly replacing the attachment.
3. **Raw transform targets could compete with projection/decomposed values.** The
   ownership guard now covers style, initial/update/exit, interaction variants,
   transitionEnd, imperative targets and existing Motion values. Raw `transform`
   alone is allowed. Combining it with layout or `x`/`y`/`rotate`/`scale` on the same
   binding produces an error before the competing animation starts. Undefined
   optional style values do not claim a transform.

These fixes add lifecycle/diagnostic glue, not interpolation or matrix-composition
machinery. Application transforms should use Motion's decomposed style/target values
when sharing a node with projection.

## Scroll, timelines and route lifetime

The [reliability report](reliability-soak.md) records two additional reproduced fixes:
completed timeline controls could reclaim styles after a new owner mounted, and the
pinned official scroll timeline cache retained 100 listeners after 100 target-scroller
unmounts. All mutating controls now revalidate ownership; the scroll adapter uses
Motion's reference-counted measurement path plus attachment-owned native timelines
where suitable. Target/custom-offset effects use the measured fallback.

The [route report](route-aftercare.md) covers live inherited reduced-motion policy,
superseded navigation rejection handling, document-scoped shared IDs, temporary CSS
name priority restoration and diagnostics that cannot stall navigation.

Motion's projection exports and the small `controls.attachTimeline` bridge are public
and typed but not documented stable integration contracts. The fresh review also
justified an isolated `motion-compat.ts` shim accessing two private/protected fields
to inspect already-created animations without forced measurements and suppress stale
native completion callbacks. Keep Motion 13.2.0 pinned and rerun the upgrade tests.
There are no deep imports, prototype modifications or dependency patches.

## Fresh adversarial review and decisions

The additional review requested after the site work produced concrete failures.
The decision is to keep the architecture and repair these integration boundaries:

| Finding                                                          | Classification                            | Reconciled behavior                                                                                               |
| ---------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Late native finish overwrote a replacement pose/animation handle | Motion API limitation + adapter bug       | A pinned compatibility helper disarms only the exact owned native animation before handoff.                       |
| Pending animation inspection measured unrelated intrinsic height | Performance issue                         | Inspect the existing playback without invoking Motion's resolver-flushing getter.                                 |
| Scoped stop reset JS playback and queued stale renders           | Implementation bug                        | Stop preserves the current pose; cancel remains distinct; pending renders finish before ownership releases.       |
| Native-to-presence spring discarded momentum                     | Implementation bug                        | Capture velocity after Motion samples stopped native playback; finished effects have zero residual momentum.      |
| Reduced parents left inherited children frozen                   | Svelte integration bug                    | Keep Motion variant dispatch and apply policy per visual; explicit child overrides remain effective.              |
| Optional component motion destroyed edited inputs                | Component integration bug                 | Card, Dialog and Accordion retain their native content while the optional binding changes.                        |
| Unrelated application styles reset animation transforms          | Transform ownership bug                   | Recompose current owned inline declarations, preserving unrelated application styles.                             |
| Retained route source collided with incoming shared ID           | Svelte lifecycle limitation + adapter bug | Snapshot-aware outgoing-source classification preserves native outro retention and genuine duplicate diagnostics. |

The [Motion reviewer report](adversarial-motion-aftercare.md),
[route aftercare](route-aftercare.md), and [reliability evidence](reliability-soak.md)
include reproducible failures and focused validation. No finding warrants replacing
Motion with a custom engine or adding a production compiler transform.

A final review of the composed showcase also corrected browser focus loss during
keyed queue movement, mobile heading overflow, and two policy mismatches.
The inspector now uses an inherited state binding rather than the independent
small fade helper. The Story transport explicitly updates its status when reduced
motion stops playback; canceled Motion completion promises do not resolve. Its
reading meter preserves actual progress without interpolation under reduction.
Controls that require attachments stay disabled until hydration. These are example
and integration fixes, with no additional animation engine.

The [hands-on tour](../try-it.md) gives an ordered route through the showcase and
more demanding lab cases for the next manual test pass.

## Bundle measurements

In-memory production-minified Rolldown bundles; Svelte/Kit externalized as host
dependencies. All exports of each feature retained. These are feature costs, not
additive totals or a site production build. Exact data: [bundle-sizes.json](bundle-sizes.json).

| Feature                        | Gzip bytes |
| ------------------------------ | ---------: |
| Small fade presence            |        935 |
| Wait presence                  |      1,218 |
| Routes                         |      1,701 |
| Layout                         |     29,904 |
| State/lite                     |     26,100 |
| State with layout/interactions |     40,125 |
| Scoped timelines               |     23,264 |
| Scroll                         |     25,491 |
| All features together          |     50,332 |

Lite saves about 35% against the full state entry. The small presence import has the
same cost when imported through the root barrel. None of the measured entries
contains React.

## Verification and remaining work

The reconciled core suite passes **225 tests in each of Chromium, Firefox and
WebKit** (675 browser cases, 44 files per engine). The server/compiler suite passes
81 tests across 15 files. The isolated combined site, route and showcase run passes
**105/105 end-to-end cases** (35 per engine, 10 files, 2.8 minutes). This includes
all four showcase scenes, real Kit navigation, mobile navigation/source viewing,
SSR, hydration, live policy changes and interrupted playback. Typechecking has zero
errors/warnings; scoped ESLint, Prettier, the Svelte autofixer and the isolated guide
consumer checks pass. Machine-readable evidence: [aftercare-validation.json](aftercare-validation.json).

Desktop and mobile screenshots were visually inspected, including the shared-photo
detail, queue and Story controls. Browser page/console errors and horizontal overflow
were absent. At 35% reading progress, changing policy during playback settled the
Story transport and kept the measured meter ratio at 0.34948.

The contact sheet samples 75 frames of repeated open/close/density changes; the desk
samples 80 frames of format/inspector reversals. In the final run, Chromium
text/circle scale error stayed below 0.00051%; Firefox stayed below 0.00053%.
WebKit contact text/circle error reached 0.1498%, reflecting Motion’s intentional
integer projection-box rounding. Pixel-aligned 3:2 photo frames limit the measured
WebKit image deviation to 0.916 CSS pixels and 0.185% axis-scale difference across
these workloads. Settled crops return to 3:2. These are bounded scenario measurements,
not a claim of mathematically exact geometry under every browser transform.

Run static/Kit server checks before browser qualification. An overlapping check
regenerated `.svelte-kit` client files and reloaded two pages during an earlier run;
a third case had loaded a pre-freeze assertion. Logs/traces identified the interference.
The final frozen, isolated run passed all 105 cases. This is not an application
state-loss fix or a claim of state-preserving HMR.

Focused evidence also includes the independent five-case lifecycle review in all
three engines, the 27-case scroll/timeline suite per engine, 120 timeline cycles and
100 container plus 100 document scroll cycles per engine with no remaining tracked
listeners/owners/native animations, and 12 idle frames with zero geometry reads.

This remains a development-browser qualification. It is not physical iOS/Safari
testing, a production-site build, an exhaustive heap/GC proof, or full Motion React
parity. Native route snapshots retain browser-specific clipping/aspect-ratio limits;
actual BFCache restoration and streamed late route content need a dedicated campaign.
Arbitrary async presence retention, advanced drag/reorder APIs and arbitrary 3D or
transformed ancestor composition remain outside the implemented contract.

Before release: qualify a packed consumer and production build when authorized,
exercise component HMR across the integration boundaries, and run performance/heap
traces on representative physical devices. Keep the documented projection/content
contracts: resizing parent surfaces need registered transformable text hosts; images
need intentional intrinsic dimensions and cropping. Bare `layout` attributes are
still a compiler experiment, not the public API.
