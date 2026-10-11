# RC3 stabilization and qualification

This is the single release path: stabilize the existing Motion/Svelte integration,
keep the public surface unchanged, and qualify the actual packed artifact. No
staged-state API, compatibility adapter, compiler instrumentation, eager reactive
subscription layer, or DOM interception is added. Existing `updateLayout` remains
optional; the new ordinary-state fixtures do not call it.

Candidate: `t3code/svelte-motion-parity-review`, based on
`e1e645563e0403621d37ab603492d9e0958ce861`. Version: `0.1.0-rc.3`.
Publication and remote CI have not occurred.

## Why this path

The [attempted-approaches ledger](../reviews/2026-10-11-parity-architecture-followup.md#attempted-approaches-ledger-updated-before-choosing-fixes)
was checked before choosing fixes. The recommendation to preserve Motion as the
engine and Svelte as lifecycle owner holds. The evidence changes two details of
the earlier recommendation:

- An optional explicit transaction cannot be the prerequisite for normal Svelte
  state changes. Seeding the cached projected origin before late presence
  publication fixes the measured direct-state failures without a new public API.
- Replacing a symbol with an object does not change transaction scope. Existing
  first-owner, nested-call and stale-closer rules pass the cross-root fixture.
  Keep that protocol; do not rewrite ownership without a demonstrated failure.

Public `$effect.pre` boundary capture was already tested and failed relevant
parent/sibling/deep-mutation ordering assumptions. It is not a release dependency.
The percentage-ancestor investigation located an asynchronous measurement-lifetime
bug; the chosen correction keeps normalization alive until Motion consumes that
measurement, rather than forcing synchronous commits or changing percent math.

## Consolidation

The [inventory](2026-10-11-worktree-inventory.json) records 45 local branch refs
before this pass. Their committed changes were already in `main` or patch
equivalent to changes in `main`. Distinct remaining work lives in dirty worktrees.
Those worktrees and their attached branch refs are preserved. Verified internal
snapshot ownership and exit-batching fixes were incorporated selectively. The accompanying
staged public API was excluded. The three disposable worktrees created for this
pass were removed after retaining their patches, diagnostic files and selected
changes. No preexisting worktree was removed. Separately, 29 unattached local
branches were retired only after verifying each tip is an ancestor of current
`main`. Sixteen local refs remain: fourteen attached branches and two branches
with distinct commit history. [Saved branch names and tips](2026-10-11-retired-local-branches.json)
allow exact restoration; no remote ref changed.

## Confirmed fixes and negative controls

| Boundary                               | Before                                                         | Candidate check                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Ordinary combined keyed update         | Exit origin error 60.391px; interrupted case 422.797px         | Six direct-state cases, including in-place mutations, promise resize, interruption and cleanup; origin tolerance 0.75px |
| Initialization-captured manual removal | Four of five new cases fail                                    | Stable callback, current exit, cancellation on revival/destruction, custom-only publication and SSR                     |
| Presence snapshots                     | Late observation overwrites owned origin                       | First capture per synchronous owner; nested/cross-root updates; release after errors                                    |
| Deferred ancestor measurement          | Exact baseline restores authored transform before Motion reads | Six lifetime checks, including cancellation, unmount and newer authored styles                                          |
| Independently completed exits          | Four batching regressions fail against the old runtime         | One queued removal batch, latest-input reconciliation, record-identity guard and destroyed-boundary cleanup             |
| Disposed shared participants           | 12 destroyed-policy warnings                                   | Zero warnings in the stale affected-set regression; three alternating handoffs and unmount                              |

## Packed artifact

Archive: `artifacts/releases/rc3/astra-motion-0.1.0-rc.3.tgz`.

Archive SHA-256:
`7514976ccaebe59547edce057d404d3771737e5d8a9fd4898103e496b061eaeb`.

The exact RC3 archive passes nine plain-Svelte SSR/hydration/runtime fixtures and
15 SvelteKit qualification cases in each of Chromium, Firefox and WebKit. These
consumers use the installed archive rather than source aliases. They check
published declarations, engine/bundle isolation, native identity, cleanup,
navigation and representative animation behavior. The archive and raw results
are retained locally under `artifacts/releases/rc3/` (build output, excluded from Git).
A final archive/source comparison confirms all 1,222 non-manifest archive
files are byte-identical to current source/build output; only pnpm's packed `package.json`
normalization differs. Later qualification edits change tests and release records.

## Source and production-page qualification

Completed: server 251/251; Svelte diagnostics zero errors/warnings; whole-repository
lint; documentation-source compilation; script tests 4/4; upgrade audit; preliminary
complete Chromium 136 files / 1,173 tests; final affected Chromium 105/105;
focused Firefox and WebKit 22/22 each; pinned upstream contracts 12/12 across
three engines. The full Firefox run reports 1,174/1,178 and WebKit 1,171/1,178
before the test corrections below. All eight affected test files subsequently
pass all their cases across all three engines (66 distinct cases per engine).
The entire 1,178-test suite was not rerun after those test-only corrections.
The full production-site gate reports 248 passes, two existing Chromium-only
touch-input skips (Firefox and WebKit), and two WebKit glyph-reference failures.
The complete corrected glyph file passes 42/42 across the three engines; an
independent root recheck of the six reorder cases also passes. The full 252-case
production suite was not rerun after that test-only correction. Passing totals do not establish
universal parity.

Two nonfatal development warnings remain in the shared-layout dependency fixture:
queued attachment initialization reads component-derived options after their
reactive owner has ended while DOM is retained. This is a different path from the
fixed disposed affected-set bug. No exception or packed-consumer failure has been
attributed to it. Browser consoles are not universally warning-free.

T3's collaborative session stalled with zero recorded RAF callbacks for over a
minute and a `visible: false` preview status. Fresh production Chromium checks of
natural, immediate and same-task wait-mode handoffs all finish within one second,
retain exactly one card, and show intermediate exit/entry frames at approximately
60fps with no errors. The stalled session is unqualified evidence of a runtime
defect; its traces are retained rather than reported as a passing interaction.

## Qualification failures and corrections

Full-suite failure logs are preserved. The runtime remained frozen throughout
these corrections. No animation system was substituted and no geometry, glyph,
fade, progress, identity or cleanup assertion was removed.

| Failure                                                                   | Evidence and correction                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Partial native entry sampled at opacity 1                                 | Baseline reproduces it before close. Await readiness while paused, then sample and interrupt a running 90ms native pose on the same Motion clock.                                                                                                                                           |
| Spring already at endpoint after three RAFs                               | Trace: real intermediate at 186ms, completion at 409ms, assertion at 627ms for a 300ms spring. Check explicit 50/299/300ms phases; missing seconds conversion fails the revised test.                                                                                                       |
| One callback sample                                                       | Baseline Firefox's first frame follows the entire 150ms sequence. Check quarter/half progress with public controls and retain bounded output plus final endpoint.                                                                                                                           |
| Changed SVG viewBox during alleged delay                                  | Full stack receives an interpolated value. Baseline load probe reproduces two RAFs exceeding 250ms. Check authored value at 249ms, interpolation at 325ms, endpoint at 400ms.                                                                                                               |
| Shared-marker animation already completed                                 | Baseline reproduces it; candidate trace spends 1,468ms awaiting two RAFs. Capture the handoff before that delay, retain scroll/reversal and final 12px/width assertions.                                                                                                                    |
| Request timer fires before absent-content assertion; stress reaches 19/20 | Control only application timeout deadlines. Keep actual 650ms cancellation/replacement and twenty 80ms requests, real animation frames, latest wait child and final layout assertions.                                                                                                      |
| Native exit ends before the test requests reversal                        | Baseline and candidate focused cases pass. Hold the real native clock while sampling a partial exit and requesting reversal; then release it for natural completion. Keep running Motion handoff and original continuity tolerance.                                                         |
| Opacity settles before positional tracks                                  | Await native `introend` before exact transform assertions; keep all five reversals and natural dismissal. This is a stronger lifecycle condition than a one-second transform poll.                                                                                                          |
| 120-cycle cleanup exceeds 15 seconds                                      | Timeout stack contains no leak assertion failure. Use the existing 60-second lifecycle-soak budget consistently for all three 100–120-cycle cases. All cycles and per-cycle ownership/native-playback checks remain. This is an explicit test-budget change, not a runtime performance fix. |

The production WebKit glyph failures also reproduce before animation, with all
ancestor transforms set to `none`: native `Later` buttons measure 7×13px while
the hidden span reference measures 6×13px. This is WebKit rounding in native
button layout, rather than a 1px projection error. The corrected reference uses
an inert, hidden native button at matching viewport geometry, with transforms
removed. The ordinary span reference remains for other content. The 0.5px
tolerance, all 150 sampled frames, projection evidence, reversals and cleanup
assertions remain. Static list/grid evidence, deliberate text-distortion controls
and the corrected browser gate are retained with the original failure traces.
Injecting `scaleX(1.15)` into the actual buttons makes both WebKit controls fail:
8.05px measured against a 7px reference, exceeding the unchanged 0.5px tolerance.

WebKit was run using signed Debian libraries extracted locally and software EGL.
Only Playwright's static host-library preflight was skipped; the actual WebKit
browser executed the tests. No package dependencies or system packages changed.

Motion's manual clock and real native playback controls are used to test explicit
intermediate phases. Natural playback, interruption, focus, gestures, navigation,
SSR/hydration and cleanup are separately exercised by production E2E and packed
consumers. Controlled-phase checks do not prove continuity under arbitrary CPU
load or arbitrary unstaged update ordering.
