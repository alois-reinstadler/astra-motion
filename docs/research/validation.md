# Motion prototype validation

Research and runs: 2026-09-05. This report distinguishes actual browser evidence from
source inspection and unqualified behavior. The implementation is an experimental
adapter with automatic layout enabled by default. Ordinary Svelte assignments work;
explicit transactions remain an optional mode. Bare compiler attributes are not shipped.

## Current composition and scroll qualification

See [composition and aftercare](composition-scroll-timelines.md) for the newer validation
round and updated feature sizes. The checkpoints below preserve earlier measurements.

## Previous state-expansion qualification

The state adapter and real component integrations supersede the earlier capability
and bundle checkpoint below. See [implementation/reviews](state-implementation.md)
and [complete API examples](state-api.md).

| Check                            | Result                                      |
| -------------------------------- | ------------------------------------------- |
| Chromium browser suite           | 146/146, 28 files, 84.00 s                  |
| Firefox browser suite            | 146/146, 28 files, 83.87 s                  |
| WebKit browser suite             | 146/146, 28 files, 115.36 s                 |
| Browser total                    | **438/438** across sequential engine runs   |
| Server/compiler suite            | **41/41**                                   |
| Real SvelteKit/SSR/history suite | **27/27**, one Playwright worker            |
| Typecheck                        | **0 errors, 0 warnings**                    |
| Scoped ESLint/Prettier           | Motion runtime, labs, routes and tests pass |
| Official Svelte autofixer        | Changed components: zero issues/suggestions |

The final transition/default-resolution correction was additionally checked in a
54-case three-engine state/orchestration run. Coverage includes server markup with
JavaScript disabled followed by hydration, initial:false keyframes, asymmetric
presence reversal, inherited/custom/array variants, before/after children,
overlapping-label completion, stale native completion/transitionEnd, intro interaction
takeover, real pointer capture, cleanup, nested/live configuration, dynamic layout
ID/mode/enablement and actual Bits component focus/Escape behavior.

The parallel qualification attempt hit timing failures on this heavily loaded shared
machine. Runs were repeated sequentially without relaxing geometry assertions. Review
also found a genuine variant-array default-transition bug, fixed separately; failed
timing assertions were not all dismissed as infrastructure. These durations describe
test execution, not animation frame performance.

New performance evidence: **100 simultaneous opacity/background-color participants
performed zero participant getBoundingClientRect calls during animation** in all
three engines. Paint-only color changes no longer invalidate layout. This is a read
count, not a claim of zero style recalculation/forced layout for arbitrary targets.
Existing 1/10/100/500 traces below remain the layout performance record. No new
production/mobile trace campaign was performed.

Current feature sizes, bytes gzip, host Svelte/Kit externalized:

| Entry                                | Gzip bytes |
| ------------------------------------ | ---------: |
| Policy                               |        152 |
| Presence                             |        935 |
| Wait + presence                      |      1,218 |
| Routes                               |      1,153 |
| Layout                               |     29,560 |
| State + layout + interaction support |     38,000 |
| All exported value helpers           |      8,688 |
| Full local API                       |     39,649 |
| Full API + routes                    |     40,441 |

Importing only presence from the root still yields **935 bytes**. These are isolated
in-memory production-style bundles with feature exports retained, not a built
consumer app. [Raw sizes](bundle-sizes.json) also records minified/Brotli sizes.
At this checkpoint project-local wrappers imported state support even when disabled.
That historical cost is removed in the current binding-prop integration; compiled
wrapper import tests cover both client and server output.

Chrome agent-browser verification inspected desktop/narrow screenshots, exercised
dialog expansion/focus return and repeated card filtering/reordering, and ended a
20-reversal burst with one card, opacity 1 and zero native animations. Page errors
were checked. Runtime edits explicitly reload; full component-HMR/real-device soak
qualification remains a release gate. The following sections retain earlier research.

## Environment and reproduction

- Svelte 5.57.0; SvelteKit 2.70.3; Motion DOM 13.2.0; Motion Utils 13.0.0.
- Playwright Chromium 151.0.7922.34, Firefox 153.0, bundled WebKit identifying as
  Safari 26.5 / AppleWebKit 605.1.15, on Linux. WebKit is not a real Apple device test.
- Existing Vite/Vitest browser infrastructure; new three-engine Vitest configuration.
- The user subsequently authorized an application dev server. The real route tests
  use `http://127.0.0.1:5187`; the Playwright configuration does not start servers.
- No application production build, package publication or deployment was run.

```sh
pnpm run check
pnpm exec vitest run --project server src/lib/motion-lab src/lib/motion/routes.spec.ts
pnpm exec vitest run --config vitest.motion.config.ts
pnpm exec vitest run --project client src/lib/motion-lab/performance.svelte.spec.ts
MOTION_LAB_URL=http://127.0.0.1:5187 pnpm run test:motion:e2e
node scripts/measure-motion-bundles.mjs
```

For a single browser, prefix the Vitest command with `MOTION_BROWSER=firefox` (or
`chromium`/`webkit`). Test files under `src/lib/motion-lab` are excluded from packaged
files. Remote Svelte autofixer checks are reproducible with
`node scripts/svelte-autofix.mjs path/to/Component.svelte`.

Previous layout checkpoint: **237/237 browser cases** across three engines (48 browser
files), in 71.59 seconds, plus **39/39 server/compiler tests**. The browser total includes
strict text/image geometry, cached-source interruption, automatic assignments, intrinsic
sizing, unregistered sibling reflow, shared scrolling, and paused popLayout flow removal.
The final dependency is ordinary, unpatched Motion DOM; its scoped compatibility listener
ships with the adapter. The original package patch was removed.

Previous SvelteKit checkpoint: **21/21 cases** across three engines (10.4 seconds),
including native shared snapshot support, delayed navigation and history supersession.
`pnpm check` reports **0 errors and 0 warnings**; targeted ESLint/Prettier pass. The
new/changed Svelte components return zero issues/suggestions from the official Svelte
autofixer. Repository-wide `pnpm run lint` stops at pre-existing Prettier failures in
untouched components; added motion files pass their scoped lint/format checks. Chrome was also exercised through agent-browser: repeated accordion,
alignment, reorder, column and shared-detail changes settled with image aspect 1.20002,
10 remaining tiles, zero native animations and no page errors. A screenshot confirmed
the expanded detail image and final layout. This is in addition to the strict
intermediate geometry assertions in the browser tests.

The paused popLayout test now samples the actual flow-removal commit: automatic presence
metadata can commit earlier. All original geometry tolerances, absolute-position checks
and destruction checks remain. This distinguishes a changed test timing assumption from
a visually continuous exit.

## Extended authoring experiments

The follow-up adds 30 browser cases: nine for isolated automatic versus explicit updates,
and 21 for the extended composition laboratory. `/motion-lab/updates` mounts only one
observation mode, proving that ordinary assignments animate automatically by default,
while an explicit-only scene requires `layout.update`. `/motion-lab/extended` exercises
cross-component auto-fit reflow, editable/delayed intrinsic content, different-width
shared markers during scroll, intentional raw-text distortion versus corrected glyphs,
nested long-child exits and owner destruction, reduced policies, and 20 rapid changes.

The glyph comparison pauses actual Motion controls and checks corrected width/height
within 0.5px while requiring visible distortion in the raw control. Auto-fit can remove
a grid column and make individual cards grow when a sidebar opens; the intermediate
geometry test checks progress between both endpoints without assuming shrink direction.
The combined 237-case run includes this responsive version. Desktop and 390px-wide
Chrome screenshots were inspected; the latter has no document horizontal overflow.
Manual stress settled at chapter 21 with one branch, one shared marker, and no native
animations or page errors. New Svelte sources pass the official autofixer and scoped
format/lint checks; final typecheck reports zero errors or warnings.

## Coverage of the requested laboratory

| Scenario                     | Actual evidence and boundary                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Basic presence            | Native opacity intro/outro; retained node and eventual removal asserted.                                                                                  |
| 2. Rapid presence reversal   | Same node resumes; repeated changes settle without retained stale branches.                                                                               |
| 3. Wait                      | Nested longer outro, latest value, reversal, empty snippet, parent destruction.                                                                           |
| 4. popLayout                 | Grid removal, immediate target flow, intermediate visual inverse, reversal and CSS priorities.                                                            |
| 5. Basic CSS layout          | Flex movement, intermediate projection and retargeting through ordinary assignments and explicit transactions.                                            |
| 6. Auto size                 | Intrinsic accordion height with CSS target and intermediate visual height.                                                                                |
| 7. Flex                      | Alignment changes outside keyed each blocks.                                                                                                              |
| 8. Grid                      | Column changes and reorder through ordinary assignments; continuous responsive resize is not supported.                                                   |
| 9. List reorder              | Large grid/list reorder and repeated reorder during animation.                                                                                            |
| 10. Nested layout            | Actual parent projection identity and child scale compensation during parent resize.                                                                      |
| 11. User transforms          | Numeric rotate/scale through Motion; arbitrary CSS transforms are rejected/unqualified.                                                                   |
| 12. Shared underline         | Old/new DOM nodes share projection; two independent scopes do not collide.                                                                                |
| 13. Card to detail           | Shared replacement morph, including aspect change; lab is not an accessible modal implementation.                                                         |
| 14. Multiple shared elements | Background, artwork, title transition together and reverse; retained old/new branches tested.                                                             |
| 15. Route shared element     | Real Kit list/detail, image/title/background identities; native capture readiness checked separately.                                                     |
| 16. Back navigation          | Real back/forward, restored mobile collection scroll, forward scroll reset and body focus; pending load superseded by back without a stale history entry. |
| 17. Scroll container         | 100-node grid scroll/reorder/remove stress; projection scroll ancestry asserted.                                                                          |
| 18. Window scroll            | Document scroll displacement separated from active local projection.                                                                                      |
| 19. Rapid stress             | Reorder/remove/columns/reversal/destroy during motion; paused geometry tests distinguish snaps from elapsed motion.                                       |
| 20. Large list               | 100-node browser stress and 1/10/100/500-participant instrumented Chromium run.                                                                           |
| 21. Reduced motion           | Layout policy override, instant presence, real reduced-motion route navigation. No universal mid-flight OS-change cancellation claim.                     |
| 22. SSR/hydration            | Actual server rendering of Presence and full lab, real Kit SSR/hydration console assertions; transformed initial-state flash remains unqualified.         |

Real route tests also cover programmatic navigation with a 400ms universal load and
a later link superseding that pending load. They do not cover actual BFCache, redirects,
streamed server data or aborting a network response. Promise failure/pagehide cleanup
have separate bookkeeping tests.

This matrix is coverage, not a claim of exhaustive qualification. Unregistered
transformed ancestors, sticky/fixed edge cases, clipping, RTL/writing modes, table
flow, arbitrary dynamic CSS transforms, responsive retargeting and all nested
crossfade/projection combinations remain unsupported or unqualified. Automatic observation covers delivered DOM mutations and registered ancestor/participant
size changes, including final retained-node removal. It is deliberately conservative
and may invalidate every registered group for an unrelated mutation in their shared
layout ancestry. Continuous browser resize remains limited by Motion's suppression.

## Lifecycle and compiler experiments

The attachment-created pre-effect sees old width **100** but new keyed order **ba**;
the component pre-effect sees old width/order and the post-effect sees width **200**.
This falsifies a universal attachment `$effect.pre` snapshot barrier on Svelte 5.57.

The initial settled-width experiment has been superseded by cached Motion geometry
checks covering paused retargeting, nested projections, authored scale, scroll changes,
fractional image dimensions and repeated shared replacement. See
[automatic layout](automatic-layout.md) and the
[shared-scroll compatibility correction](motion-coordinate-patch.md). The runtime uses
Motion's own cached pose and projection pipeline rather than a separate FLIP engine.

The optional modern-AST transform has **26 passing cases**: scripts/TS/modules/no
script, imports and collision avoidance, attachments, snippets/render tags, native
versus component rejection, transition conflicts, deterministic/idempotent output,
source maps and client/server/HMR compilation. It is disabled and not exported.
HMR compilation and source-map presence do not prove live HMR cleanup or exact
original error locations. Bare-attribute language-server integration is unbuilt.

Native Svelte crossfade has four browser tests per engine. Two simultaneous identities
with differing sizes pair correctly; repeated/reversed switching cleans up; persistent
CSS reflow moves **120px immediately** without starting a crossfade. This supports
crossfade as a useful replacement helper, not a general projection/group system.
The interruption tests seek actual native animations after startup rather than assume
that a timer implies a rendered intermediate frame. This is not exhaustive scroll,
nested or simultaneous-projection qualification.

## Original performance baseline

Historical raw data: [performance-chromium.json](performance-chromium.json).
This baseline predates the 2D transform optimization; current investigation follows below.
One reverse of a 600px, ten-column grid; one sample per size; development-mode Vitest
on a shared host. Post-mount instrumentation covers the transaction and 950ms settling
window. These are diagnostic samples, not production percentiles or mobile targets.

| Participants/backend   | Transaction ms | Bounds reads | Maximum frame ms | Estimated missed 60Hz frames | Peak / settled animations |
| ---------------------- | -------------: | -----------: | ---------------: | ---------------------------: | ------------------------: |
| 1 Motion               |            1.7 |            2 |             16.7 |                            0 |                     0 / 0 |
| 10 Motion              |            0.7 |           20 |             16.8 |                            0 |                    10 / 0 |
| 100 Motion             |            1.6 |          200 |             33.4 |                            1 |                   100 / 0 |
| 500 Motion             |           11.6 |         1000 |            216.6 |                           17 |                   500 / 0 |
| 500 immediate baseline |            7.1 |            0 |             16.8 |                            0 |                     0 / 0 |

The one-element reverse does not change its position, hence zero active animations.
All rows recorded zero instrumented `getComputedStyle` calls **after initial mounting**;
registration does read computed styles for transform ownership. Bounds reads are not
a count of forced layouts. The transaction snapshots every registered group, so a
no-op on an unrelated controller still reads all participants: O(total mounted N).

Chromium engine counters for the 500-node Motion sample versus immediate baseline:

| Metric over measured window  |   Motion | Immediate |
| ---------------------------- | -------: | --------: |
| Layout count                 |    11.00 |     11.00 |
| Layout duration              |   5.55ms |    3.99ms |
| Style recalculations         |    52.00 |     58.00 |
| Style recalculation duration |  12.96ms |    5.71ms |
| Scripting duration           |  35.09ms |    2.27ms |
| Task duration                | 357.82ms |   48.24ms |
| Ending JS heap               |  22.84MB |   29.20MB |

These process/frame counters include harness activity. Ending heap values are not
retained-heap or leak measurements. Explicit lifecycle tests do verify shared-stack
counts return to baseline and old projections unmount after parent destruction.
Long Animation Frame instrumentation reported no entries from the fixture iframe;
its zero forced-style attribution **does not establish zero forced layouts**. A subsequent compositor trace explains the frame stall (below); a repeated retained-heap
campaign remains necessary.

Motion already batches reset/read/calculate/render and owns one global frame scheduler.
The adapter does not create per-element RAFs. Nevertheless the **500-node sample has a
clear performance cliff** against immediate updates; do not market it as 500-node
60fps. These benchmark participants are simple fixed-size surfaces; the corrected
interactive lab registers additional content participants and is more expensive per item. An isolated dirty-group API needs a defined cross-component reflow contract
before narrowing measurements safely.

## Rendering and automatic-observation follow-up

A controlled fresh-browser intervention reduced the 500-cell cold maximum frame interval
from **216.7 ms to 33.4 ms**, and warm maxima from **33.3 ms to 16.8 ms**. A compositor
trace attributed 205.578 ms to `LayerTreeHost::WaitForCommitCompletion`. Motion's generated
zero-depth 3D translation created 510 drawn layers; equivalent 2D translation reduced
that to 207 cold and 109 warm. The adapter now makes that narrow transform substitution,
leaving Motion's scale, rotation, projection and scheduling intact. The full three-engine
regression suite above validates the integrated transform behavior.

Automatic and explicit 500-node reversals both record **1,000 bounds reads per reversal**,
including the entire settling window: automatic observation does not read geometry on
every animation frame. Observer filtering costs around **0.5 ms per delivered callback**
in the instrumented 500-node sample. This remains O(total participants); isolated dirty
groups and production/mobile performance are not established. Later shared-host timing
runs vary, so the controlled intervention is evidence of the specific compositing cause,
not a universal 60fps guarantee.

The integrated final runtime was also measured at 1, 10, 100 and 500 participants:

| Participants | Explicit transaction ms | Bounds reads | Maximum observed frame ms |
| ------------ | ----------------------: | -----------: | ------------------------: |
| 1            |                     1.1 |            2 |                      16.8 |
| 10           |                     0.6 |           20 |                      16.7 |
| 100          |                     2.3 |          200 |                      16.8 |
| 500          |                    13.8 |         1000 |                      16.8 |

All settled with zero active animations; post-mount computed-style read count was zero.
This run tests sizes in sequence and is therefore warmed; use the separate cold
intervention above for cold-start conclusions. At 500 nodes, Chromium recorded 15
layouts / 7.81 ms layout duration, 86 style recalculations / 45.06 ms, and 55.96 ms
scripting over the complete 950 ms observation window. See
[final raw measurement](performance-chromium-final.json).

A fresh final **automatic** 500-node run measured maximum frame intervals of
**50.0 / 33.4 / 33.3 ms** across three reversals, with exactly 1,000 bounds reads each.
Observer callbacks totalled **10.8 / 11.5 / 11.1 ms** per 950 ms window (24 / 25 / 26
callbacks), and all animations settled. Automatic convenience has observable overhead;
the explicit warmed table must not be presented as automatic-mode performance. See
[automatic raw results](performance-profile-500-automatic-observer-final.json).

See [performance investigation](performance-investigation.md) for controls, trace event
names, rejected will-change/containment approaches and raw artifacts.

## Tree shaking and dependencies

Raw data: [bundle-sizes.json](bundle-sizes.json). In-memory Rolldown ESM minification,
all exports of each measured entry retained, Svelte/Kit externalized as host runtime.
This is incremental library cost, not an application chunk size. No production app
build was performed. The script tests root-import dead-code elimination too.

| Entry                             | Gzip bytes (final runtime) |
| --------------------------------- | -------------------------: |
| Policy/base                       |                        152 |
| Presence + popLayout              |                        935 |
| Presence including wait component |                       1218 |
| Routes                            |                       1153 |
| Layout                            |                      28821 |
| Local full                        |                      29710 |
| Presence imported from root       |                        935 |
| Full including routes             |                      30526 |

Presence imported from the root has the same measured cost as its isolated entry;
projection is eliminated. Layout imports the substantial projection engine. There is
no React runtime in any measured entry. Only `motion-dom@13.2.0` is a direct runtime
dependency; root-exported projection classes remain undocumented integration APIs.

## Independent review reconciliation

| Role                      | Findings that changed the implementation                                                                                                                                                             | Remaining limit                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Motion architecture       | Parent-first registration, add-before-remove shared handoff, empty-stack pruning, same-node reconfiguration, presence metadata, reduced-motion forwarding, async callback rejection.                 | Pinned undocumented exports; general reparenting and shared-exit duration fan-in unqualified.               |
| Svelte compiler/lifecycle | Wait completion moved from consumer callback/attachment to wrapperless branch destruction; empty snippets work. Priorities and delayed outro timing received regressions.                            | No automatic pre-effect barrier; compiler/editor/live-HMR assumptions remain unproven.                      |
| Browser/performance       | Verified real projected ancestry and override policy; established global O(N) measurement and restricted transform ownership.                                                                        | Compositing cliff diagnosed and reduced; mobile performance and broader transform qualification remain.     |
| API/design system         | Removed public completion plumbing and sync wrapper; exposed separate route/feature entries; explicit transaction and duration-unit contracts.                                                       | Automatic authoring now works; one application policy installation remains future design work.              |
| Adversarial tester        | Found 82.5px delayed-outro snap, stale unmount fallback cancelling new snapshots, parent reattachment and CSS-priority defects; reduced same-frame transform reset to an isolated no-op transaction. | Tests establish observed continuity and stress completion, not a mathematical guarantee for every retarget. |

Full independent reports: [Motion](review-motion.md), [Svelte](review-svelte.md),
[browser/performance](review-browser.md), [API](review-api.md),
[adversarial testing](review-adversarial.md), and the subsequent user-triggered
[content distortion review](review-content.md). These preserve initial findings; later
reconciliation supersedes their historical statements that route testing had not run.

## Adoption decision

**Adopt the hybrid with specified caveats, without compiler integration.** Svelte owns
lifecycle and authoring; Motion owns local projection; native View Transitions enhance
routes. Automatic layout is implemented using Motion's cached geometry and observer
invalidation. Do not rebuild springs, projection trees or the scheduler.

Before stabilization: establish an upstream projection compatibility contract, expand
transform/SSR and route edge qualification, and measure production/mobile workloads.
Undocumented event ordering in the shared-scroll correction requires the exact pin
and upgrade tests. See [the complete API and limitations](../motion-system.md).
