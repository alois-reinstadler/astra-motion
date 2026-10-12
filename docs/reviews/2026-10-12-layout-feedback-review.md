# Independent review of owner layout feedback

Reviewed implementation: `0b2355a..24e534e`. This supplements the completed
11 October consolidation review. Reviewers did not implement the changes they
reviewed. Complete source and production qualification is recorded separately;
this report does not substitute focused probes for those gates.

## Runtime review

One confirmed blocker in the first draft was resolved: when an ancestor committed
projection during Motion postRender, an outgoing child without its own projection
could jump 22px horizontally and 52px vertically before the next frame. The bridge
now coalesces a refresh of all active retained roots after the synchronous commit.
The independent reproduction passes with zero vertical/width error and negligible
horizontal floating-point error. Removing that correction makes the regression
fail by 22px; natural-playback tests separately cover ordinary exits.

Independent probes also verified eight anchor/direction combinations with borders
and scrolling, both stacked-owner cleanup orders, authored-attribute restoration,
cancellation before flush, empty registries/styles after disposal, and no late
CSSOM writes. Presence-only bundles do not render projection or React modules.

The reviewer inspected the WebKit RTL follow-up: capturing border-edge positions
and subtracting current absolute margins correctly handles the used-margin change
from 115px in normal flow to 9px when absolute. All four coordinate formulas retain
the captured dimensions. Root's focused WebKit runtime run passes all 22 checks.

The packed SvelteKit geometry oracle was independently reassessed after a failure:
`564.875 + 428 = 992.875` before collapse and `616.875 + 376 = 992.875` on every
sample. The apparent 52px viewport movement was page-scroll clamping. Comparing
document coordinates is appropriate for this ordinary document-flow fixture;
the 2px tolerance, width, intermediate/late samples, containing-block transition
and cleanup assertions remain unchanged.

## Public API and documentation review

No confirmed blockers. The Notes example and canonical excerpt carry the same
isolated stacking, label/highlight ordering, pointer behavior and ARIA correction.
The accordion complete-source loader includes the corrected preview alignment.
Both public snippets independently compile for client and server without warnings.
Public entries and presence contracts remain unchanged; no withdrawn staged-state
API was restored. Natural-frame, reversal, focus, identity and cleanup assertions
were inspected along with all six example engine logs and original-CSS negative
controls. Historical qualification claims remain tied to their original inputs.

## Actual package review

The reviewer independently verified archive SHA-256
`eb65795058f3d92c51c6ece44fdd100b6aa5bf965a3053c3893db5d5d87ea571`
(417,399 bytes), final-tree repack identity, and all 1,223 installed files in each
isolated consumer. Exactly nine members differ from the previous reviewed archive:
six runtime JavaScript files and three internal declarations. The other 1,214
members, including public exports, README, manifest and vendored engine, match.

Runtime identity checks pass with Motion 13.4.4 and shared frame, store and
MotionValue identities. Bundle isolation passes for all eight measured entry
variants. The fresh final consumer record contains 27 plain-Svelte and 45 Kit
passes, including retained-exit geometry; declarations and strict publint pass.
Existing packaging advisories concern unpublished laboratory declarations and
Vite-specific code outside the published file set.

No confirmed blockers remain in these bounded independent reviews. Owner review
should inspect protected SessionCards exits during collapse, rapid Notes selection,
and narrow accordion reversal. The fresh qualification record and artifact replace
the earlier runtime-unchanged feedback claim; no publication is authorized here.

## Final source-test sampling review

The complete Firefox run exposed a sampling defect in one new regression: only two
frames fell in its 230–340ms late window. All sampled geometry passed. The
reviewer verified the test-only correction in `24e534e`: retain this fixture for
1.5 seconds, sample natural playback until six late frames show the parent at its
settled width (with a one-second deadline), and check connection and the unchanged
2px geometry bound on every frame. The first frame always contributes to the
early oracle. Cleanup now has a two-second deadline appropriate to the chosen
1.5-second exit. The default 0.4-second fixture, actual examples and packed checks
are unchanged. An interim run failed only because its old cleanup timeout was
shorter than the new exit; that log is preserved. Focused Firefox passes 9/9.
The final complete matrix separately verifies the tightened six-frame assertion.
No confirmed blocker remains in this review.

## Native handoff phase oracle

The first complete WebKit run after the retained-exit sampling correction reported
a failure in an existing WAAPI handoff check. Its `child opacity < 0.8` predicate
remained true after the child finished, when `afterChildren` correctly lets the
parent fade. An independent reviewer recorded natural playback in Chromium and
WebKit, twelve ordinary WebKit repetitions, and a deliberately delayed old poll.
At 301ms that poll passed with child opacity 0 and parent opacity 0.402637; this
reproduces a false failure without changing the runtime. The original failed run
recorded source 0.8 but omitted its held opacity and phase, so its precise cause
is not retrospectively established. It is consistent with the demonstrated
oracle defect.

The corrected check reads both opacities in the same natural frame, requires
observed intermediate child and subsequent parent-exit phases, and verifies
removal. The 0.01 parent-opacity tolerance and five repetitions remain. Two
adjacent checks now also require an intermediate child phase before inspecting
the held parent. Corrected focused checks pass 7/7 in each engine. The final full matrix remains
pending and will be recorded in the fresh qualification report. Disabling `prepareMotionHandoff` makes all
five WAAPI checks fail, including the natural case with held opacity 1 during
intermediate child opacity. The independent reviewer verified this evidence and
found no weakened oracle or confirmed runtime blocker. Probe sources, hashes,
recordings and original failures remain in the external evidence directory.

## Accordion sampling review

The complete WebKit run also exposed two insufficient intermediate-frame counts
in the 200ms accordion tests; their geometry checks passed. The corrected tests
measure five explicit phases of actual Motion/native clocks, preserve the
original intermediate counts and 0.5px bounds, and add a separate unchanged-clock
natural opening/reversal/reentry/removal case. Four focused cases pass in every
engine. Restoring the original grid alignment makes all four fail in every engine.
See [sampling investigation](2026-10-12-accordion-sampling.md).

The independent reviewer found a coverage omission in the first correction:
geometry needed checking again at settled and removed endpoints. Commit `e5f4827`
restores those assertions. The reviewer verified the fix, scoped clock ownership,
restoration/cancellation, retained-node checks and natural-playback coverage; no
further confirmed assertion loss or test contamination remains. Focused WebKit
passes 4/4 after that correction. Newly started full runs were stopped when the
review finding arrived; their logs remain explicitly interrupted evidence. The
final full runs use the corrected committed test tree. No runtime or example code
changed during these qualification-oracle corrections.

## Final natural-phase and Notes oracle follow-up

A subsequent complete WebKit run recorded no held-child-phase sample in the
repeated handoff case. Twelve independently instrumented default-duration runs
observed both phases and no parent-opacity errors; render-triggered sampling
captured one additional intermediate tick in one run. The exact reason for the
original missed phase remains unproven. The repeated test now explicitly gives
both exits one second, while preserving 0.2-second initial/shifted WAAPI setup
and the separate default-duration cases. Five repetitions, both required phase
samples, 0.01 parent bound and removal remain. Focused checks pass 7/7 in each
engine; disabling handoff ownership still fails all five WAAPI checks. The reviewer
verified the final fixture, tests and negative control (`fd40386`). This changes
only a laboratory fixture and its tests, not published runtime or example timing.

The same full runs exposed a Notes origin oracle that sampled after natural spring
progress. Independent timing captured 45ms elapsed and a 40ms projection clock,
with legitimate movement of 3.503px. Commit `86e405c` retains the 3px origin bound
at explicit time zero, preserves the original natural forward/reverse case and
adds natural rapid-interruption coverage with measured intermediate positions,
paint order, focus, pointer targets, identity, cross-instance isolation and final
cleanup. The independent reviewer found no lost assertion or test contamination.
All three cases pass in each engine; the original stacking fails all three in each
engine. See [Notes sampling investigation](2026-10-12-notes-sampling.md).

## Resource-isolated qualification and natural reversal interval

The concurrent full run at `d7b445b` passed all 1,211 Chromium cases but failed
one Firefox and three WebKit cases. Firefox recorded identical completion times
for three staggered exits. WebKit recorded one grouped-disclosure intermediate
frame, a tilt cleanup deadline with 0.000792-degree residual rotation, and no
accordion reentry sample. CPU pressure was high, but that observation alone does
not establish any failure's cause. All logs and pressure readings are retained.

The independent reviewer identified a concrete mathematical defect in the new
natural accordion oracle: it allowed reversal just over 1px below full height H,
then required a sample strictly between R+1 and H-1. That interval is empty when
H-R is at most 2px. The failed run did not save H/R, so this is a confirmed test
design flaw, not a proven retrospective explanation of that run. The correction
reverses at the first naturally rendered sample below half height and asserts
H>4. This guarantees a nonempty interval while preserving every intermediate,
geometry, focus, identity, settlement and removal assertion. Failure output now
includes H, R and sampled reentry heights. No runtime, example, clock, duration,
easing, tolerance or skip changes. Complete final source qualification is pending.
