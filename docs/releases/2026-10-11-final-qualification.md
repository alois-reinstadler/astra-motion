# Consolidated main qualification — 11 October 2026

Qualified source commit: `63281005d2aa855ef4a22073f3f379b8e10d018d`. All three complete source runs started from
this clean committed tree. Independent final review is pending; this record does
not authorize publication or release.

## Concrete package

Archive: `/workspace/releases/astra-motion/main-2026-10-11/qualified/astra-motion-0.1.0-rc.3.tgz`

SHA-256: `a24a314c3ad5e27ad8207c53ef5fb66e642bd274177eddedbfdf5b436088259f`

This archive supersedes the earlier RC3 archive with SHA-256
`7514976ccaebe59547edce057d404d3771737e5d8a9fd4898103e496b061eaeb`.
Earlier artifacts remain unchanged. The new archive is byte-for-byte identical
to the consolidated archive installed into the isolated plain-Svelte and
SvelteKit consumers. `qualified-package-equivalence.json` records both paths
and hashes; the consumer lockfiles and package payload hashes are retained.

## Results

| Gate                                         | Result                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| Complete source Chromium                     | 141 files, 1,193 passed, no failures or skips                            |
| Complete source Firefox                      | 141 files, 1,193 passed, no failures or skips                            |
| Complete source WebKit                       | 141 files, 1,193 passed, no failures or skips                            |
| Complete server                              | 61 files, 283 passed                                                     |
| Complete production E2E, three engines       | 253 passed, two existing touch-emulation skips                           |
| Actual packed plain-Svelte consumers         | Nine cases per engine, 27 passed                                         |
| Actual packed SvelteKit consumers            | 15 cases per engine, 45 passed                                           |
| Pinned upstream Motion 13.4.4                | 12 passed across three engines                                           |
| Svelte check                                 | Zero errors and warnings                                                 |
| Prettier, ESLint, guide/snippet checks       | Passed                                                                   |
| Site build, prepack, strict publint          | Passed, including fresh final pack                                       |
| Tooling tests, forwarding and upgrade checks | Passed                                                                   |
| Site bundle budgets                          | Home 331,575 bytes; quick start 206,967; catalog 128,442; within budgets |

The [machine record](2026-10-11-final-qualification.json) contains exact commands,
commits, timestamps and logs. Evidence is outside removable worktrees at
`/workspace/releases/astra-motion/main-2026-10-11/`. Full source logs are named
`source-<engine>-cleanup-corrected`; source performance output is preserved per
engine rather than replacing historical research.

Production, server, build and upstream checks finished before the final
browser-test-only corrections. Their actual inputs are unchanged;
`qualification-input-applicability.json` lists every intervening changed path.
They are not inherited RC3 results. The final source matrix, Svelte check,
formatting, ESLint and package rebuild ran on the qualified source commit above.
Packed checks verify declarations, SSR/hydration, runtime identity, navigation,
retained-node behavior, cancellation, unmount cleanup and bundle isolation.

## Investigated failures and retained evidence

Earlier failed and interrupted attempts are retained and are not counted as
qualification. No blanket retries, relaxed geometry tolerances or new source
skips were introduced.

- The delayed-native-outro continuity test originally sampled after natural
  playback had already moved. It now samples the actual flow transaction and
  separately retains natural settlement and node-removal checks. Suppressing
  projection fails the unchanged 20px continuity requirement.
- A subsequent full-suite timeout exposed an independent assertion defect:
  Vitest awaits values returned by `expect.poll`, while Motion playback controls
  are thenable. Returning `currentAnimation` could hang after the pointer cleared,
  or falsely pass while a completed playback remained retained. The corrected
  boolean predicate checks the property with the same two-second deadline.
  Deterministic stop comparison: old poll still pending at 2,204ms after cleanup
  at 8ms; corrected poll resolves at 52ms. Deliberately retained real playback
  fails in all three engines with the corrected predicate, whereas the old
  predicate falsely passed. Full source acceptance then passed in every engine.
  `delayed-outro-followup/investigation.md` explicitly retracts the earlier,
  unsupported inference that the sample promise itself had stalled.
- WebKit CSS zoom computed authored -160px as -160.000006px even on an unanimated
  sibling. The test now requires exact equality with that rendered reference,
  exact final MotionValue -160 and retained node identity. Intermediate bounds
  are unchanged; no tolerance was widened.
- Native intro sampling waits for the actual intro and browser animation-ready
  boundary before the original 250ms opacity measurement. Natural playback is
  retained. Cold Shiki compilation has a documented 15-second budget for that
  single CPU integration test; its assertions are unchanged.
- Early overloaded or stale-preview attempts remain recorded separately. The
  successful complete production run used a restarted preview of the current
  production build. The final source engines ran sequentially.

## Limits requiring owner attention

The shared-layout dependency fixture emits two nonfatal `derived_inert` warnings
per engine. Their lifecycle implications remain assigned to independent review;
this qualification does not claim universally warning-free browser consoles.
Arbitrary unstaged parity remains unproven. Firefox and WebKit each skip the
existing case that requires Chromium CDP touch emulation; no real-device touch
coverage is claimed. The native-button glyph oracle retains its 0.5px tolerance
and 150 frames. Deliberate `scaleX(1.15)` distortion fails in both tested WebKit
viewports.

The [consolidation ledger](2026-10-11-consolidation.md) records source dispositions
and restoration. Historical experiments remain historical. Motion 13.4.4 stays
the engine, Svelte owns lifecycle, `updateLayout` remains optional and the
withdrawn `createLayoutState` prototype is not restored.
