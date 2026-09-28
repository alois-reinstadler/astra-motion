# Independent adversarial review

Date: 2026-09-28 UTC. Initial candidate: `b08875b`. This reviewer did not implement
the candidate. Scope is the requested Motion surface and its approved Svelte
adaptations, not equivalence with React's private renderer lifecycle.

Final correction recheck: integration HEAD
`63721c14ea745934bde92136e5020f050c43bda6` plus uncommitted corrections. The inspected
`sequence-path.ts` SHA-256 is
`4822fbdb44fa3996212f7557794055f225fe923923fb2dfbd2c3ddf37cce773d`;
`animation-ownership.ts` is
`36683939865fd32fa53864458b73132fa69e34bf7f39de0298833ca365d5fcb4`.

## Method and limits

Reviewed the parity contracts/matrices, migration and installed-package/site
evidence, then the managed value/scroll/animation helpers, core Activity and
Presence lifecycle, lazy materialization, Reorder, View transaction/navigation
coordination, public exports and package metadata. Compared suspicious behavior
with installed/captured Motion 13.4.4 source. Read official Svelte effect,
lifecycle, context, attachment and packaging documentation.

Following the user's request to test less, no broad suite, production build,
consumer rebuild or browser session was started. One minimal executable
source-level reproduction was used where source ownership needed decisive
confirmation. Existing qualification records are supporting evidence, not an
independent fresh pass or a release-wide qualification claim.

## Findings

### R1 — P1: hiding a consumer pauses externally owned shared playback

Initial candidate `src/lib/motion/motion-core.svelte.ts:358` loops every
`visual.values` animation and pauses any running playback with public play/pause
methods. It does not distinguish a component's animation from a borrowed style
MotionValue's external animation. `animation-controls.svelte.ts` has a similar
loop in `updateActivity`.

Trigger: an externally animated MotionValue is used as style.x by a consumer
inside AnimateActivity and by a visible consumer outside it. Hiding the former
pauses the external animation, freezing the visible consumer too. Expected:
hidden consumer rendering stops; external playback retains its owner's lifecycle.
This differs from an animate target that explicitly starts animation on the
borrowed value and therefore claims playback ownership.

Evidence: `node docs/parity/repros/borrowed-activity.mjs` exits 0 and confirms real
engine JSAnimation state changes from running to paused. The reproduction
executes the production syncActivity body with minimal visual dependencies; it
is a source-level ownership reproduction, not a mounted Svelte/browser test.

Status: **resolved**. Rechecked final root `animation-ownership.ts`, both Activity
filters, and the animateTarget wrapper. Ownership is tracked by playback identity
and visual; only newly started playback is claimed. Reviewed the mounted
`parity-borrowed-activity.svelte.spec.ts` and `/tmp/astra-borrowed-activity.log`:
one Chromium case passed, establishing external/shared playback continues, hidden
rendering stays held, and a later explicit controls command pauses/resumes its
owned playback to x=1000. This browser run was executed by root, not duplicated
by this reviewer. The supplied source-level repro remains tied to the initial
candidate and intentionally asserts the original defect.

### R2 — P2: migration recommends assigning a readonly scope reference

Initial candidate `docs/migration.md:57` says to attach scope.attach **or bind
scope.current**. `UseAnimateScope.current` is readonly and the hybrid/mini scope
objects expose only a getter. A two-way Svelte binding fails strict checking and
attempts assignment to a getter-only property at runtime.

Expected: document `{@attach scope.attach}` and reading scope.current.
Evidence: public declaration and both implementations establish the contradiction
without requiring a build. Rechecked root's correction directly at
`/workspace/wt/astra-parity/docs/migration.md:57–58`: it now specifies the attachment
and explicitly describes current as a readonly getter. **Resolved.**

### R3 — P1: sequence arc subjects share interruption ownership

Review of the supplied in-progress `sequence-path.ts` initially found one clock
and one ownedDriver assigned to x/y MotionValues for every arc subject. Replacing
one subject's x or y calls stop on that driver and freezes all other arc subjects,
although their animation ownership has not been replaced. Ordinary sequence
properties continue independently, making the partial freeze especially confusing.

Expected: interrupting one subject releases that subject; explicit whole-group
stop still stops every subject. Evidence is the shared driver construction and
final ownMotionPathPlayback loop. This is a source finding on the supplied final
delta, not a failure attributed to the initial candidate's known unfinished adapter.

Status: **resolved in final-delta source recheck**. The adapter now creates one
clock/driver per element and keeps all drivers under the public group controls.
The author reports the decisive Chromium sequence case passed independent
subject interruption; this reviewer did not rerun that browser case.

### R4 — P2: sequence sampler permanently overrides retained earlier endpoints

The initial adapter's sampleAt applies the latest-starting sampler on each axis
forever. It also extracts ordinary x/y segments on any subject that uses an arc
elsewhere. An earlier ordinary x segment ending at t=2 and an overlapping segment
at t=1 through t=1.2 therefore leave x at the latter endpoint indefinitely.

Upstream `animation/sequence/utils/edit.mjs` only erases earlier keyframes strictly
inside the new segment. The earlier endpoint at t=2 survives; the compiled
timeline interpolates back to that endpoint after t=1.2. Thus adding an arc
elsewhere changes ordinary overlapping-segment semantics for that same subject.

Status: **resolved in final-delta source recheck**. The adapter now compiles the
position baseline through upstream createScopedAnimate, retaining upstream
overlap/endpoints. The author reports its decisive Chromium case now observes
x=75 at t=1.6 and x=100 at t=2 in the overlap fixture.

### R5 — P2: overlapping arc handoff uses the straight baseline origin

Final-delta recheck found createSampler now receives baseline(placement.start).
For an implicit-start arc overlapping a currently curved arc, that baseline does
not include the preceding arc's displacement. Example: a strength=1 linear arc
from (0,0) to (100,0) over two seconds has midpoint (50,50). Starting another arc
at t=1 using the straight baseline starts from (50,0), visibly jumping y by 50.

Expected: an implicit starting pose carries the preceding active arc's sampled
position. Explicit starting keyframes can intentionally override it. The baseline
must still retain the corrected ordinary overlap/endpoints from R4.

Status: **resolved in final source recheck** at integration root. Sampler creation
now samples the preceding active arc inclusively at its handoff endpoint before
constructing the next sampler; absent a preceding active arc it uses the compiled
baseline. Inspected the decisive composition assertion for exactly (50,50) at
t=1. The sequence author reports that same focused Chromium case passes R3–R5
together, including teardown. This reviewer did not duplicate that browser run.

## Findings not claimed

- Automatic one-dimensional RTL ordering is an explicitly documented upstream
  limitation; the supported workaround is axis="xy".
- Native scroll range mapping inspected here matches upstream source. Suspicion
  alone is not a new verified incompatibility.
- Approved retained Activity and explicit Presence/View authoring differences are
  not reopened as defects.
- Package and documentation reports explicitly retain unexecuted release gates;
  their pending status is not represented as successful delivery.

## Opinion

**Qualified to proceed to final integrated verification.** All five findings are
resolved in the inspected integration source at `/workspace/wt/astra-parity`.
The final sequence delta was rechecked after its overlapping-arc correction,
including ordinary endpoint preservation and per-element interruption ownership.
No substantiated open defect remains from this bounded review.

**Not yet a release sign-off.** The root-owned final browser matrix, installed
consumer/package qualification, production documentation checks, CI and deployed
verification remain delivery gates. This review does not claim complete testing
of every possible option combination, nor turn those pending gates into passes.

## Reviewer deliverables

### Final Activity pause correction recheck

After the first review, root's combined source matrix reported 1562 passing cases
and one WebKit failure: a paused direct arc committed another held pose after its
Activity became hidden. Root supplied a bounded correction on integration HEAD
`a349d503133de7078452fcfb5ed91138d96557e6` plus uncommitted changes.

Rechecked `pauseMotionPlayback` in motion-compat.ts against the installed Motion
DOM 13.4.4 JSAnimation source. Public pause retains holdTime while leaving its
keep-alive driver running. Public sample synchronously commits that held pose;
private stopDriver removes frame work without setting the irreversible isStopped
flag. Public play then recreates the driver from holdTime. Group/async traversal
and the three owned Activity call sites preserve ownership filtering; borrowed
external playback and native mini playback are not newly claimed.

Reviewed the strengthened exact-position/no-hidden-onUpdate/resume-once assertion
and `/tmp/astra-final-activity-pause.log`: **18 passed**, six files across Chromium,
Firefox and WebKit, with 45 unrelated cases skipped. Root executed this focused
run; this reviewer did not start another test or reproduce it independently.

**Accepted.** No new substantiated runtime defect remains in this delta. Also
rechecked `tests/upstream-motion/reviewed-exports.json` privateActivityContract:
it names `JSAnimation.stopDriver()`, pins motion-dom 13.4.4, records the reason and
behavioral evidence, and requires requalification on every engine upgrade. The
compatibility source comment now distinguishes the existing cancellation fields
from this additional private method. The qualified-to-proceed opinion remains;
this targeted correction does not itself close unrelated delivery gates.

The same bounded follow-up also removes an unused type import and replaces the
nonreactive presence node reference-count Map with a WeakMap reset on destroy.
Source recheck confirms only get/set/delete are used and enumerable nodes remain
in the existing SvelteSet; this preserves registration and cleanup semantics.

### File manifest

- `docs/parity/ADVERSARIAL-REVIEW.md` — this report.
- `docs/parity/repros/borrowed-activity.mjs` — original-candidate source-level repro.

No runtime source was edited, no dependencies were installed, no browser pages
were opened and no subagents were launched by this reviewer. A pnpm exec format
attempt refused the linked modules directory before changing dependencies; local
Prettier was then invoked directly. The reviewer reproduced R1 once and did not
run broad tests or repeat the integration owner's focused correction checks.

The archived R1 reproduction reads its original candidate via `git show b08875b`
so it remains reproducible after the correction. The integration owner verified
that pinned reproduction; it is not a claim of failure on the corrected runtime.
