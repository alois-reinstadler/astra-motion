# Independent final runtime review — 11 October 2026

**No confirmed release blocker in the reviewed runtime.** The known
`derived_inert` diagnostic remains an advisory with reproduced, bounded cleanup
evidence below. This review neither proves arbitrary unstaged parity nor claims
a universally clean browser console.

## Candidate and independence

I did not implement the consolidation. I reviewed detached candidate
`e44ccee86e7bd6bee4daa3833ffae9a3145d3be0`, including the final diff from
`90a3f1bd74432f761f788ad7ad06ec2d601da65b`. Its implementation is identical to
qualified commit `63281005d2aa855ef4a22073f3f379b8e10d018d`; the intervening four
files are qualification/status records. I read the operating contract, parity
contracts/matrix, integration/consolidation records, original architecture
follow-up and fresh qualification record. Earlier reports were treated as claims.

I independently hashed the actual archive at
`/workspace/releases/astra-motion/main-2026-10-11/qualified/astra-motion-0.1.0-rc.3.tgz`:
`a24a314c3ad5e27ad8207c53ef5fb66e642bd274177eddedbfdf5b436088259f`.
My runtime execution below uses this candidate's source. The separate independent
package review owns fresh installed-package execution; this report does not
relabel source tests as packed-consumer tests.

## Runtime assessment

The five changed runtime files make bounded changes: prepared sibling pop reads
precede writes, mutation functions remain ordering barriers, sibling failures roll
back and later batches still run, native event tasks share their flow transaction
while shared-stack promotion remains immediate, sticky boundary correction follows
Motion's measurement cache, and word punctuation shares its word's animation slot.
No engine replacement, new state API, eager subscription scheme or withdrawn
`createLayoutState` export appeared.

I traced the preserved RC3 contracts into the final source:

| Contract                                             | Evidence examined                                                                                                                                                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed cached origins before late presence publication | `layout.ts` calls `seedCachedSnapshots` before `willUpdate` and presence publication. Direct-state/promise interruption browser cases passed.                                                                                 |
| First-owned boxes and nested transactions            | `presence-measure.ts` associates the first box with the snapshot owner; `beginPresenceSnapshot` rejects stale closers. Five snapshot cases passed, including throwing capture and sibling roots.                              |
| Mutation drain/error ownership                       | `commit.ts` preserves managed before-paint promotion and version guards; failures aggregate after later work; `updateLayout` releases ownership in nested `finally` blocks. Focused server and rollback browser tests passed. |
| Deferred ancestor normalization                      | `ProjectionBoundary.renderBoundary` waits for `root.updateScheduled`; unmount cancels its frame and restores styles. Transformed shared-layout/scroll tests and adversarial intermediate-pose cases passed.                   |
| Stable `safeToRemove` and independent selectors      | The captured method reads the current generation at invocation; separate field-derived selectors avoid custom-only presence invalidations. No consolidation changes replace these implementations.                            |
| Batched completion, revival/destruction rejection    | `createPresenceScope.check` queues once per generation and rechecks alive/present/pending/generation before completion. Core asynchronous acknowledgements retain disposal/version checks.                                    |
| Skip reconciled-away participants                    | `snapshot` checks participant identity after reconciliation before measurement.                                                                                                                                               |
| Always-throwing synchronous callback types           | The `[Result] extends [never]` branch remains; async callbacks and returned thenables remain rejected.                                                                                                                        |

Natural native-pop reversal, zero-duration disposal, shared handoff, transformed
ancestors, direct reactive state, in-place keyed changes, promise-driven
interruption and unmount cleanup were exercised. Existing stress cases retain
intermediate geometry assertions, including controlled-phase cases alongside
natural settlement/removal. No geometry tolerance, retry, skip or implementation
change was introduced by this review.

The corrected cleanup oracle checks the boolean property
`projection.currentAnimation === undefined`. Installed Vitest awaits the polling
callback result; returning Motion's thenable playback object instead would test
its completion value. I inspected that correction and its retained negative
controls. The final WebKit stress suite passed with the corrected predicate.

## Advisory R1: retained native transition reads an inert derived style

**Reproduction:** the existing `layout-dependency-exits` case in
`upstream-shared-layout-expanded.svelte.spec.ts` replaces a keyed `motion.div`,
then invalidates `layoutDependency`. The original focused suite emitted the two
known warnings. My independent probe repeats four keyed replacements with
dependency invalidation in each of twelve mount/unmount cycles, using the same
fixture and real browser frame scheduling.

**Expected / observed:** native retention may read the outgoing node's last
evaluated style, but teardown must release its owned work. Firefox recorded
48 `derived_inert` warnings for 48 replacements. All three engines passed the
probe's assertions after every unmount: Astra's strong visual registry no longer
owns the captured nodes; engine visuals have `current === null` and zero value
subscriptions; the projection tree contains only Motion's global window root;
shared stacks are empty; document intro/outro listeners are removed in balanced
pairs; and no completion report arrives during the subsequent 200ms observation.
The probe uses a 60ms transition and naturally running frames, so the final
observation exceeds that transition rather than seeking its clock.

**Root cause and correction of an earlier inference:** captured Firefox stacks
lead through Svelte's deferred native transition callback to
`createBinding.transition`, its `options()` read (`motion-core.svelte.ts:913`),
and the compiled fixture's derived `style` getter. Svelte 5.57's
`execute_derived` warns when a previously evaluated derived has an INERT or
DESTROYED parent and returns its cached value. Native outro retention makes the
parent inert before final attachment teardown. These captured stacks establish
the deferred transition path; they do **not** establish the queued initial
`refresh(options())` as the source, as the earlier integration report inferred.
The independent review supersedes that causal attribution without changing the
historical record.

**Classification:** advisory developer diagnostic, not a confirmed release
blocker. No stale live subscription, retained projection participant, post-unmount
completion or geometry failure was reproduced. Cached outgoing style is
consistent with retaining the outgoing instance. This bounded evidence is not a
heap-profiler proof that every possible callback or consumer getter is harmless.
The owner should inspect keyed native exits with derived props during human
review. A future warning correction should retain reactive policy/reversal
coverage and the cleanup probe; suppressing the warning alone would not prove it.

**Regression evidence:** `warning-stack-summary.json` contains the exact stack
samples/counts; `review-probe.svelte.spec.ts` contains the independent assertions.
Both are retained in the external evidence directory below.

## Checks actually run

| Check                                                                                           | Result    |
| ----------------------------------------------------------------------------------------------- | --------- |
| Chromium shared-layout, native-pop batch, ordinary release layout and upstream scroll suites    | 55 passed |
| Chromium presence-snapshot suite                                                                | 5 passed  |
| Independent 12-cycle cleanup probe, Chromium                                                    | 1 passed  |
| WebKit native-pop batch, adversarial stress and independent cleanup probe                       | 21 passed |
| Independent 12-cycle cleanup probe and warning stacks, Firefox                                  | 1 passed  |
| Server commit, native presence, projection boundaries, text segmentation and presence lifecycle | 36 passed |

Commands, configs, probes and logs are under
`/workspace/releases/astra-motion/main-2026-10-11/reviews/runtime/`.
`runs.json` records invocation details; `SHA256SUMS.json` records evidence hashes.
The source-browser commands use `review.config.mts`, `MOTION_BROWSER`, the
existing browser library environment and pnpm. The isolated checkout links the
existing dependencies, so `--config.verify-deps-before-run=false` avoids pnpm
rewriting that shared dependency tree. No dependencies were added.

The initial external-config attempts failed before tests because an absolute
package subpath did not resolve and the external `.ts` config was treated as
CommonJS. The final `.mts` config resolves the existing repository configuration.
Those failures remain archived. Two preliminary probe assertions also failed:
I initially expected upstream's weak visual map entry to disappear and its
projection tree to be literally empty. Motion 13.4.4 intentionally leaves the
WeakMap entry after nulling `current`, and retains its global window root. I
corrected those assumptions against its installed source, then checked Astra's
strong ownership, subscriptions, exact root-only membership and listener cleanup.
The original failed probes/logs remain; they are not candidate passes.

## Practical limits

The full three-engine 1,193-case source matrix is fresh coordinator evidence,
not a suite independently repeated by this reviewer. I did not repeat the entire
production E2E/packed matrix, physical-device touch, heap allocation profiling,
all gesture/focus paths or every possible state/effect/await topology. The
existing Firefox/WebKit touch-emulation skips and the native-button glyph oracle
remain disclosed by qualification. Arbitrary unstaged trajectory equivalence is
still unproven. No confirmed blocker requires a runtime fix from this review.

## Documentary follow-up verification

I independently reviewed `251bca404f50791b591627673c40985d7d8ba286`. Its changes
to STATUS, runtime integration and the human/machine qualification records
accurately identify the captured deferred-transition path, explicitly supersede
the initial queued-refresh hypothesis, and retain the advisory's bounded cleanup
and console limitations. No runtime change is implied or required by that
correction.

The separate public-documentation blocker produced a new actual archive:
`/workspace/releases/astra-motion/main-2026-10-11/reviewed/astra-motion-0.1.0-rc.3.tgz`,
SHA-256 `719b4424df6d4c047d20b76a9429636378f600f9e9abec665ae96e364992542e`.
I independently hashed both archives and compared every regular member. Of 1,223
files, only `package/README.md` changed; the remaining 1,222 are byte-identical.
This review's runtime conclusion therefore applies to the unchanged runtime and
declarations in the new archive. Fresh installation/browser qualification of
that archive remains separately recorded by the coordinator. The original
reviewed archive and evidence remain preserved.

Comparison evidence: `reviews/runtime/documentary-followup-verification.json`
under the external release evidence directory. This follow-up required no new
runtime probe or implementation change.
