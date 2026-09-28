# Phone example feedback and performance evidence

Follow-up to release `93f06a3`, 2026-09-28 UTC. The user reported these behaviors
on an **iPhone 15 Pro using Safari**; iOS and browser versions are unknown.
Drag, reorder operations and Activity retention worked in that user session.
List/grid resizing distorted contents and closing the expanding note jumped.

## Reproductions and fixes

Both defects reproduced on the actual canonical examples, with the production
stylesheet/font at 393 × 852 and 317px of example content. These are browser
engine tests at a phone viewport, not physical device tests.

| Finding                                            | Before                                                                                                                                                           | Correction                                                                                                                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2: reorder text and controls inherit item scaling | The 41px Outline label paints at 84.194px during list-to-grid and 19.966px during grid-to-list.                                                                  | A child `motion.div layout="position"` corrects inherited scale while the item retains full size animation. Numeric inline border radius enables corner correction.                        |
| P2: closing text rewraps before removal            | Card height grows from 227.563px to 283.655px before shrinking to 176px. Its document position reverses with unchanged 290px stage height and 500px page scroll. | Managed `AnimatePresence mode="popLayout"` removes the fading paragraph from flow immediately and holds its captured width. The positioned card animates once to its collapsed dimensions. |

These corrections belong to the examples' composition. No public runtime API,
type, dependency or engine implementation changes were necessary. The guide now
explains both patterns instead of demonstrating the distortion it warns against.

Independent regression commit `3a8ea1a` (integrated as `368bae4`) failed before the
fix `7671604`. The exact test blob
`fd24e33adba83e39edfd5d981b2da247fbdbbe6f` passed afterward in Chromium, Firefox and
WebKit: **6/6 executions**, with no assertion or tolerance change. Reorder checks
both directions, interruption, text/control proportions, start continuity and
intermediate card widths. The note checks closing and reversed expansion,
intermediate widths, endpoint bounds, stable scrolling, final geometry and removal.
Source: `src/lib/motion-lab/phone-layout-verification.svelte.spec.ts`.

## Shared View example

The replacement demonstrates three illustrated cards opening into a detail
article. Artwork and title have separate names and independent shared snapshot
layers across different DOM nodes; other cards exit and article copy enters.
Instance-scoped names prevent collisions. Back restores focus to the selected
card, reduced motion follows user preference, and unavailable native support
keeps the same usable content with immediate updates.

The canonical browser regression requires native API support, records actual
name leases, and checks distinct group/old/new layers for artwork and title. It
opens two different cards and checks restored focus and removed transition styles.
Production E2E retains separate native and explicitly unavailable-API cases.

Independent review of the new example reproduced two additional lifecycle cases
before release. Completion reclaimed focus after the user moved to an outside
button. Removing the entire example during gated native capture left six detached
nodes with owned names and one reset stylesheet until normal completion. This was
delayed cleanup, not a persistent leak. Fix `494db53` tracks later focus intent,
cancels pending handles on disposal, removes focus listeners and guards the pending
state update against destruction.

Regression commit `caebe22` (integrated as `fb0bd55`) failed both cases before the
fix. Its unchanged test blob `7f67b4c07c87eeec929a5828f287dbb122cf5e61` passes all
three View cases in Chromium, Firefox and WebKit: **9/9 executions**. Disposal
calls native cancellation once and clears all six names and the stylesheet before
the gated callback resumes. No late DOM/status writes occur. The private signal
inside a destroyed Svelte component is not observable; the report does not claim
to have measured writes to that signal.

## Bundle size

[Measured sizes and provenance](phone-bundle-sizes.json) come from the clean
`93f06a360f419e8ed14eba1f897f8fd50f3547b1` installed-package CI artifact. Package
SHA-256: `2d064554821e139f9c704cd0aaad5bab117ac7efef0817e41554fc559d447d47`.
The guide's older figures are replaced with these results. They include Svelte
and fixture bootstrap; they are not the marginal size of the library alone.
Each app counts shared chunks once and sums separately compressed HTTP assets.

| Production application   | Initial gzip bytes | Deferred gzip bytes |
| ------------------------ | -----------------: | ------------------: |
| Eager motion             |             68,259 |                   0 |
| Lazy domAnimation        |             26,462 |              28,926 |
| Lazy domMax              |             26,517 |              46,767 |
| Synchronous domAnimation |             51,899 |                   0 |
| Hybrid useAnimate        |             34,736 |                   0 |
| Mini useAnimate          |             16,227 |                   0 |

Lazy loading defers downloads and parsing; it does not remove the later cost or
make active layout work cheaper. The eager entry is substantial. Mini is useful
for native CSS-style imperative animation, but does not provide hybrid sequences,
MotionValue/object animation or decomposed transform animation. Basic lazy
features exclude drag/pan/layout projection; domMax adds them. These graphs were
verified against installed archives, rather than inferred from export names.

## Performance boundaries

The [current installed-package run](../research/phone-feedback-performance.json)
uses the exact archive hash above on an Intel Xeon E3-1275 v5, Linux Chromium
151.0.7922.34, SwiftShader software rendering, 1280 × 1040 viewport and normal CPU
speed. It ran the existing production harness once: 100/500 cells ×
automatic/explicit/instant × three repeats, with standard warmups, 18 changes per
trial, 80ms requested spacing and a 1400ms settlement window. It is deliberately
a desktop baseline; the throttled matrix and device tests were not rerun.

| Cells | Mode      | Median trial p95 RAF interval | Worst RAF interval |
| ----: | --------- | ----------------------------: | -----------------: |
|   100 | automatic |                        16.7ms |             50.0ms |
|   100 | explicit  |                        16.8ms |             33.4ms |
|   100 | instant   |                        16.7ms |             16.8ms |
|   500 | automatic |                       100.0ms |            133.3ms |
|   500 | explicit  |                        49.9ms |             83.3ms |
|   500 | instant   |                        16.8ms |             50.0ms |

**18/18 trials** retained correct DOM order, visibility, count, final transforms
and cleanup, with zero active/native animations at settlement and no browser
errors. Every measured mounted idle window had zero geometry/style reads and
zero active/native animations. Each mode also completed 30 mount/destroy cycles
at 500 cells: zero final participants, active/native animations, detached roots
and retained node IDs, and zero reads after disposal. These observations qualify
the recorded windows; they do not prove the absence of every possible leak.
The five current Chromium observer/read-cost regressions also pass.

The 500-cell results are a substantial animation performance limit. Even explicit
updates exceed a 60Hz frame budget here. The machine and runtime differ from the
historical benchmark, so the two runs do not establish a before/after regression.

The [production benchmark](../research/production-performance.md) is historical:
its package SHA-256 starts `10db8579`, not the current archive. It used Linux
Chromium on an AMD 7800X3D with SwiftShader software rendering. Its 54 trials
demonstrated correct settlement/cleanup and zero geometry/style reads during
the measured 700ms idle windows. They also exposed a real large-grid limit:
automatic layout at 500 cells had median trial p95 RAF intervals of 33.2ms at
normal CPU speed, 183.3ms at 4× slowdown and 300ms at 6×. These are RAF intervals,
not direct compositor drop counts or calibrated phone speeds.

The current source has focused observer batching and animation read-cost
regressions. These protect work bounds, not a universal frame-rate promise.
Physical iPhone/Safari timing, high refresh rates, thermal behavior, native touch
interruption and browser toolbar interactions remain unqualified. The user's
successful interactions provide useful device feedback but do not replace that
performance coverage. Large animated grids remain a profiling and optimization
area; window visible items and limit simultaneous layout changes.

## Release gates

Source checking and complete canonical documentation compilation report zero
errors/warnings. Whole-tree formatting/lint, 203 server tests in 44 files, four
qualification-tooling tests, generated elements, pinned engine checks, production
build, strict publint, source bundle measurement and both installed Svelte/Kit
consumers pass. After the additional View lifecycle correction, the affected
source/guide checks, lint and production build were refreshed; unrelated broad
local suites were not repeated. Svelte autofixer reports no issues/suggestions.

The locally rebuilt package is byte-identical to clean release `93f06a3`. Its
pack manifest correctly records a dirty source tree while the unpublished demo
lifecycle correction was being edited; archive identity, not that working-tree
label, establishes the runtime used by the performance run. The remote gates
qualify the final clean revision; existing matrices remain unchanged.

Three focused production Chromium E2E cases pass: native View round trip,
explicit unavailable-API fallback round trip, and example discovery. Manual
shared Chrome at 393 × 852 also exercised the built dedicated pages. Reorder
text measured 41.296867–41.296883px while its item traversed 148.5–305px, including
a reversal. The closing note moved from 227.5625px to 176px high without the old
intermediate growth (minimum 175.5922px from its existing spring overshoot),
with unchanged page scroll. The third View card opened and returned with correct
focus, removed reset styles and no horizontal overflow. All three documents
returned 200 and produced no console warnings/errors; screenshots were inspected.
The delivery report records the exact merged commit, complete remote CI/Pages
results, deployed verification and cleanup once those operations finish.
