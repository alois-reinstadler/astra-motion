# React Motion parity: architecture follow-up

2026-10-11. Three independent subagents investigated automatic capture, presence
contracts, and projection/ownership. The primary agent reviewed their source
evidence and independently exercised the automatic snapshot prototype with real
browser button interactions. This is a research/recommendation deliverable; no
library source, public API, package dependency, or production hook was changed.

## Recommendation

Keep the goal of automatic React Motion behavior with natural Svelte reactivity.
Do not require a layout transaction wrapper, staged state controller, dependency
prop, compatibility mode, or compiler transform to obtain correct ordinary behavior.
Keep Motion as the sole animation/projection engine.

**Qualify the small automatic snapshot-ordering fix first.** We found a one-line
diagnostic insertion that fixes the tested ordinary and interrupted outgoing
geometry without interception, private Svelte subscriptions, or a presence-cache
rewrite. Separately fix measurement/restoration scheduling and public presence
completion semantics. Reserve a larger commit-generation architecture for the
remaining async/phase failures; pursue a supported Svelte runtime hook only if that
architecture is falsified.

This revises the previous advice to start with a boundary `$effect.pre` adapter.
That proposed general capture boundary was falsified by actual Svelte ordering.

## Scope, provenance, and evidence limits

The thread's checkout is `e1e6455`. The October review and uncommitted ownership
implementation live in `/home/node/.t3/worktrees/astra-motion/t3code-10ab3c8f`, at
`14ae1cb` plus existing work. All implementation line numbers below refer to that
inspected worktree, not the older checkout. Its Motion source hash matches the
existing production probe bundle provenance exactly:

```text
Svelte 5.57.0; motion-dom/framer-motion 13.4.4; React 18.3.1
Astra source SHA256: 4da0eeba17c4e969185e10531f9e56e6574bf060183201a52c266487b5acde17
Probe bundle SHA256: f9bc7813264a9bb471e8c8811affb54f9c1136439b126e475958fa48d8d7f229
```

T3 preview status and open both explicitly reported no connected automation host.
The primary agent used an isolated agent-browser session and a temporary Portless
server. All browser sessions, test runners, and the temporary server were closed.
Prototypes were Vite-only diagnostic transforms or temporary fixtures under `/tmp`.
The original worktree's source hash was checked before and after the investigation.

The metrics below are computed first-pin geometry and numerical rAF trajectories,
not synchronized cross-framework curves or proof that every sampled state was
displayed. In particular, ResizeObserver can run after an rAF callback but before
paint; the await result needs presentation-level evidence before being called a
displayed flash. Firefox/WebKit, packaging, SSR/hydration and the unrestricted suite
were not freshly requalified. Passing negative-control assertions is not parity.

Evidence: [browser interactions and trajectories](2026-10-11-parity-followup-evidence/browser-measurements.json),
[Svelte ordering](2026-10-11-parity-followup-evidence/svelte-ordering.json),
[snapshot approach comparison](2026-10-11-parity-followup-evidence/snapshot-approaches.json),
[seed-only ablation](2026-10-11-parity-followup-evidence/snapshot-seed-only.json),
[projection/ownership outcomes](2026-10-11-parity-followup-evidence/projection-ownership.json).
[Diagnostic sources and traces](2026-10-11-parity-followup-evidence/diagnostics.tar.gz)
exclude generated bundles and dependencies; scripts retain original absolute paths
for provenance and are not a portable installed test suite.

## Ranked findings and corrections

### 1. Automatic presence informs Motion too late, contaminating its snapshot

**Verified defect / parity gap; high confidence for the tested fixtures.**

Evidence: `layout.ts:211-226`, especially `setPresence` calling
`projection.willUpdate()` at line 220 after parent reflow. The later automatic
`seedCachedSnapshots` skips any node already holding a snapshot (`:325`), preserving
the origin that was captured from changed DOM. Motion's snapshot method also avoids
replacing an existing snapshot.

Minimal reproduction: 30 keyed `motion.div` cells under pop-layout presence; one
ordinary `$state` publication switches grid columns 10→5, reverses membership and
removes keys 0 and 5. Repeat after an in-place reverse interrupted after 90ms.
No consumer mutation is wrapped in a layout transaction.

| Fresh browser case           | Ordinary maximum first-pin error | Interrupted maximum first-pin error |
| ---------------------------- | -------------------------------: | ----------------------------------: |
| Unchanged Astra              |                      60.390625px |                        422.796875px |
| Pinned React, clean document |                       0.015625px |                           0.40625px |
| Astra seed-only diagnostic   |                       0.015625px |                          0.015625px |

Primary-agent button interactions independently reproduced all three rows. Both
prototype cases had numeric intermediate survivor motion, correct final ordering,
completed exit removal, and zero retained cells after explicit disposal. React's
interrupted sample has advancing real-time frames, so these numbers do not establish
that Astra's curve is closer to an ideal reference.

Diagnostic change, entirely internal:

```ts
seedCachedSnapshots([participant]);
projection.willUpdate();
projection.isPresent = isPresent;
```

The independent comparison isolates causality: postponing presence-cache promotion
alone retained both errors; postponing it plus seeding passed; **seeding alone with
the unchanged presence cache passed identically**. Do not undertake a cache rewrite
to fix these particular cases.

User impact: outgoing pop-layout elements can jump while survivors continue to
animate correctly. A passing final rectangle/order assertion conceals this defect.

Fix candidate: seed the cached projected origin before this late presence snapshot.
Do not unconditionally overwrite a valid explicit-transaction snapshot. Regression
must fail on the unchanged runtime, assert ≤0.75px first-pin error, numeric survivor
movement, exit cleanup and final order, and cover interruption, reversal, scroll,
plain/transformed ancestors, shared IDs, and roots without their own projection.

### 2. Transform-restoration lifetime ends before deferred measurement

**Verified lifecycle defect; high confidence in scheduling causality.**

The percentage test alone passes. Running numeric translation immediately before
percentage translation reproduces 75px at `upstream-shared-layout-expanded.svelte.spec.ts:125`,
**before any shared handoff occurs**. Parent left is 150px; the newly mounted source
is incorrectly animated to left 75px at the fixture's half-progress easing.

Trace: queued layout mutation → `updateLayout` capture → boundary normalization and
`frame.render` restoration (`projection-boundaries.ts:181`) → deferred `root.didUpdate`
(`layout.ts:479,515`) → render restoration precedes root measurement →
`resetTransform` skips because saved declarations are gone (`projection-boundaries.ts:267-270`).
The next logical box is `[150,250]` instead of `[0,100]`, inventing a −150px delta.

The previous report's skipped-percentage/shared-handoff explanation is incorrect.
Pinned `delta-remove.mjs:20-24` resolves valid percentages, and this fixture already
has numeric boundary `latestValues.x = 150`.

An isolated `commit()`→`commit(true)` change in transaction finalization makes the
two-case reproduction pass and changes shared-layout-plus-ownership verification
from 40 pass/1 fail to 41/41. The source starts at 150px with no unintended animation.

Fix: preserve normalized transforms until the root has consumed the measurement,
then restore before presentation/disposal. Immediate commit establishes causality;
a blanket synchronous switch is not qualified for reentry or frame scheduling.
Regression: mount → dispose → transformed mount in one runtime, per-frame startup
error ≤0.75px, no invented startup animation, authored transform restored, and later
shared handoff still animated. Do not increase timeouts or relabel this as load flake.

### 3. Public presence callback capture and reactive selector granularity

**Verified API defects; the previous React comparison overstated the contract.**

`presence-context.svelte.ts:169-174` captures a generation when the callback getter
is read; `:86-88` rejects it when invoked during a later generation. Capturing only
the callback at initialization, while keeping `presence.isPresent` reactive, wedges
an exit. It does not require destructuring the reactive boolean. The isolated stable
callback patch changes retained=true/completions=0 to retained=false/completions=1.

Pinned React `use-presence.mjs:41-42` uses `useCallback` with `onExitComplete` as a
dependency and returns `[true]` while present; there is no always-present callback
and no lifetime-wide stable identity. A real React exit→reenter→exit probe shows
that invoking the saved first-exit callback removes the second exit. Therefore
automatic rejection of historical _manual_ callbacks is an Astra-specific stronger
contract, not React parity.

Recommendation: safely capturable Svelte public callback that resolves the current
generation when called; strict explicit generations remain internal. Manual exit
work must cancel on effect teardown/reentry, as it must upstream. No public epoch,
token or compatibility hook. Revise the public stale-callback assertion at
`parity-presence.svelte.spec.ts:191-207`; retain internal stale-animation checks at
`motion-core.svelte.ts:347-356`.

Separately, custom-only updates replace the aggregate raw snapshot (`presence-context.svelte.ts:124-134`).
An effect reading only `presence.isPresent` reruns 1→2 despite unchanged presence.
A hook-local field `$derived` preserves 1→1. `ManualExit.svelte:8-15` starts manual
WAAPI work and cancels it on effect teardown, making unwanted invalidation relevant.
The invalidation is measured; actual WAAPI restart impact was not separately measured.
Use field-level selectors internally, including `useIsPresent`.

Regression: initialization-captured callback unblocks wait-mode presence; cancelled
manual work cannot finish a later exit; internal stale work remains rejected;
custom-only updates do not restart presence-only effects; multiple registrations,
propagation and duplicate native/managed completion remain correct. Focused existing
presence suites pass 9/9; all isolated presence probes were console-clean.

### 4. Public pre-effects cannot supply the promised general capture boundary

**Falsified architectural proposal; high confidence.**

Normal-mode sibling insertion plus list publication moved the sampled target from
top 38px to 108px before all three child pre-effects ran. Array identity/length
pre-effects missed in-place reverse; an index-reading effect ran. Sibling insertion
and promise resolution each moved the target 70px without any child pre-effect.
Async keyed reorder had already happened before capture; splice removed the target
before a logged capture. See the preserved ordering fixture and measurements.

This matches [Svelte's effect documentation](https://svelte.dev/docs/svelte/$effect):
dependencies and publication order matter. A consumer dependency prop or state
wrapper would move lifecycle work to users and violate the requested contract.

### 5. Cross-root ownership is not fixed by replacing a symbol with an object

**Unproven architectural concern, not a demonstrated geometry defect.**

The runtime deliberately has global transaction depth, participant capture,
`beforeCommit` callbacks and root commit scheduling. Motion itself shares a default
document projection root. An object token alone changes none of these facts.

Four existing ownership checks pass. An additional two-mounted-root diagnostic on
the original runtime resizes A and exits B inside a nested transaction: B retains
its original width, A is not popped, and the owner releases correctly (five checks
including the existing four). This does not qualify arbitrary async interleaving.

Keep first-capture-wins origins, observed/captured separation, nesting, identity-
guarded closers and exception release. Define isolation through affected geometry
and intended shared-stack membership; do not force per-component-root transactions
that fail to capture sibling reflow. No public root-owner controls are needed.

## Attempted approaches ledger, updated before choosing fixes

| Approach                                               | Evidence and decision                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Explicit/staged state publication                      | Existing bounded success; unsuitable as required consumer contract       |
| Postcommit observation and cached origins              | Keep; useful foundation with phase/consumption gaps                      |
| Private Batch flush hook                               | Previously incomplete; await branch publication can occur before flush   |
| Compiler callback instrumentation                      | Previously breaks ordinary reordering; reject production path            |
| DOM prototype interception                             | Coverage, reentry and unrelated-mutation costs remain; reject foundation |
| Private eager subscriptions                            | Dependency cost/identity/async limitations; reject foundation            |
| Explicit transaction snapshot ownership                | Existing narrow win independently reproduced: 302→0.015625px; keep       |
| Existing-prop `$effect.pre` capture                    | New ordering probes falsify general boundary                             |
| PostRender promotion of immutable presence cache alone | New probe retains 60.391/422.797px; insufficient                         |
| Seed cached projection before presence willUpdate      | New successful ablation; qualify first                                   |
| Same-turn measurement instead of deferred commit       | New successful causality probe: 40/41→41/41; qualify phase lease         |
| Symbol→object ownership token                          | Not an isolation solution; no demonstrated defect it repairs             |
| Coherent commit generation + last rendered pose        | Still untried as full architecture; next async/phase experiment          |
| Supported semantic Svelte publication hook             | Still untried; fallback if coherent snapshots are insufficient           |

## Capability/parity matrix for this follow-up

| Capability                                                     | Fresh evidence                                                            | Remaining limitation                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Ordinary automatic combined pop exit                           | Baseline fails; seed-only prototype ≤0.016px                              | Broader coordinate, shared-stack and package qualification     |
| Interrupted automatic pop exit                                 | Baseline 422.797px; seed-only ≤0.016px                                    | Curves/velocity and same-phase presentation comparison         |
| Open-transaction ownership                                     | 302→0.016px; nested cross-root check passes                               | Arbitrary async interleaving unproven                          |
| Transformed startup                                            | History-dependent 75px; scheduling prototype passes                       | Lease/reentry safety not yet production-qualified              |
| Manual presence completion                                     | Initialization wedge fixed in isolated prototype                          | Public contract regression intentionally needs revision        |
| Presence-only reactivity                                       | Custom-only invalidation removed by selector prototype                    | Actual manual animation restart impact not separately measured |
| Promise sibling reflow                                         | 70px first rAF sample in every cache variant                              | Displayed-paint behavior and removal during reflow unresolved  |
| Survivor animation and cleanup                                 | Numeric intermediates, correct order, exits removed, final disposal empty | No claim of universal trajectory equivalence                   |
| SSR/hydration, reduced motion, drag, packaging, other browsers | Existing evidence was read                                                | Not freshly qualified by this focused investigation            |

## Three highest-value next experiments

1. **Qualify automatic snapshot seeding with coherent source generations.** Start
   with the seed-only insertion, preserving explicit origins. Add promises/await,
   deep list mutation, mixed parent changes, interruption within Motion's update
   phase, scroll, containing-block changes, shared IDs and immediate unmount.
   Require ≤0.75px first-pin error, actual intermediate movement, correct cleanup,
   stale-work rejection and bounded measurement/dependency work. Record the last
   _rendered_ pose separately from a target that has advanced but not reached DOM.
   Falsify with a subframe publication that makes the cached pose stale or a missing
   containing-block origin. The current awaited-reflow removal exceeds this gate.

2. **Give measurement normalization an explicit lifetime.** Test a lease held through
   Motion's root read and released before render/disposal, against the immediate-
   commit control. Require the history-dependent parent cases and focused 41 checks
   to pass, no startup animation, no changed authored styles after cleanup, no nested
   read/reentry corruption and no new forced-read growth. Falsify with a render
   restoring transforms before any queued measurement consumes them.

3. **Qualify one native presence completion contract.** Stable public completion,
   field-level reactivity, cancellation-aware manual work, strict internal exit
   generations. Require captured callback correctness, wait-mode progress, exit→
   reentry→exit cancellation, multiple registrants, propagation and exact-once
   managed/native completion, then packed-consumer and SSR/hydration checks. Falsify
   if library-owned stale work can finish the next exit or custom-only data restarts
   a presence-only effect.

The async capture fallback must be a supported before/after **visible DOM
publication** hook, encompassing normal effect traversal, async branch commit,
await resolution and deferred outro destruction. `await.js:93-110` calls
`BranchManager.ensure` before `flushSync`; `branches.js:201-205,235` can append and
remove DOM directly. Another generic Batch wrapper cannot cover those paths.

## Architectural commitments

**Keep:** Motion projection/animation as the sole engine; Svelte's native retention
backend under flagship components; managed retained records; snapshot ownership;
targeted observation; negative controls and pinned upstream traces.

**Revise:** snapshot consumption order, transform-normalization lifetime, public
completion semantics, field-level presence reactivity, and qualification based on
actual intermediate behavior. Declarative presence identity inputs (`items`,
`value`, `present`) are a Svelte structural adaptation, not a mutation lifecycle
wrapper; a snippet does not publicly enumerate keyed child instances like React.

**Abandon:** mandatory staged state as parity, universal interception as strategy,
public pre-effects as a global boundary, token-shape changes as root isolation,
and the earlier incorrect React-stability/percentage-resolution explanations.
Do not abandon the automatic parity goal. Do not begin a broad rewrite before
qualifying the concrete small fixes and falsifying the remaining cache strategy.
