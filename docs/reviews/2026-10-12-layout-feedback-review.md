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
