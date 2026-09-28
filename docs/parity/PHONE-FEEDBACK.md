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

Final source, production, package and delivery gate evidence is added after the
candidate finishes qualification. Existing remote browser/package matrices and
device coverage limitations remain unchanged.
