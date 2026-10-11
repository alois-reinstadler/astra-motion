# Consolidated main qualification — 11 October 2026

Qualified source commit: `63281005d2aa855ef4a22073f3f379b8e10d018d`. All three complete source runs started from
this clean committed tree. One independent final review cycle by three
nonimplementing reviewers is complete: one documentation blocker was corrected
and verified, with no confirmed blockers remaining. Owner human review is next;
this record does not authorize publication or release.

## Concrete package

Archive: `/workspace/releases/astra-motion/main-2026-10-11/reviewed/astra-motion-0.1.0-rc.3.tgz`

SHA-256: `719b4424df6d4c047d20b76a9429636378f600f9e9abec665ae96e364992542e`

Packed from clean commit `d7d366e1aaf06c22d81a1754d23a4aa35a6017c6` after
correcting stale RC2 installation instructions. This supersedes the pre-review
`a24a314c3ad5e27ad8207c53ef5fb66e642bd274177eddedbfdf5b436088259f` archive
and the earlier RC3 `7514976ccaebe59547edce057d404d3771737e5d8a9fd4898103e496b061eaeb`
archive. Earlier artifacts remain unchanged.

All three reviewers independently verified the replacement: only packaged README
changed, with all 1,222 other members byte-identical. The actual replacement was
installed into fresh isolated plain-Svelte and SvelteKit consumers; declarations,
builds, all 72 browser scenarios and strict installed-package publint passed.
`consumer-reviewed.json`, `reviewed-package-diff.json` and `packed-reviewed/`
record archive identity and fresh results. A final committed-tree repack and
`handoff-package-equivalence.json` provide the handoff byte-identity check.

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
Subsequent changes are README and documentation/review records only; runtime,
site, tests and configuration remain unchanged. README was repacked and all
consumer checks repeated on the replacement archive. Packed checks verify
declarations, SSR/hydration, runtime identity, navigation,
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

## Independent final review

The [final review overview](../reviews/2026-10-11-final-review.md) links the three
independent reports and verified resolution. The public reviewer reproduced stale
RC2 installation instructions in source and actual packaged README. The correction
is verified by a regression that detects four original mismatches and none after
the fix, by independent archive comparison, and by fresh consumer qualification.
No confirmed release blocker remains. Runtime and package reviewers additionally
probed repeated replacement/unmount and independent-root teardown in all engines.
Their bounded evidence does not establish universal lifecycle or unstaged parity.

## Limits requiring owner attention

The shared-layout dependency fixture emits two nonfatal `derived_inert` warnings
per engine. Independent review traced the reproduced warning through Svelte's
deferred native transition to the outgoing derived style getter. Repeated
replacement/unmount probes in all three engines released Astra registrations,
subscriptions, projection participants/shared stacks and transition listeners,
with no late completions in the observation window. This remains an advisory,
not a warning-free-console or universal leak-freedom claim.
Arbitrary unstaged parity remains unproven. Firefox and WebKit each skip the
existing case that requires Chromium CDP touch emulation; no real-device touch
coverage is claimed. The native-button glyph oracle retains its 0.5px tolerance
and 150 frames. Deliberate `scaleX(1.15)` distortion fails in both tested WebKit
viewports.

The historical layout-timing paragraph lacks an adjacent date/commit/evidence
link; the public reviewer records this as an editorial owner follow-up. It is
not fresh final-runtime performance qualification. Prepack also retains existing
unpublished laboratory declaration warnings; public package declarations and
strict publint pass.

The [consolidation ledger](2026-10-11-consolidation.md) records source dispositions
and restoration. Historical experiments remain historical. Motion 13.4.4 stays
the engine, Svelte owns lifecycle, `updateLayout` remains optional and the
withdrawn `createLayoutState` prototype is not restored.
