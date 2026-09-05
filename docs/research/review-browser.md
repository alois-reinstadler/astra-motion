# Independent browser animation and performance review

Reviewed 2026-09-05. Scope: `layout.ts`, `presence.ts`, `routes.ts`, Motion DOM
13.2.0 projection implementation, lab markup and browser assertions. This review
inspected the actual adapter rather than assuming Motion automatically supplies
correct framework lifecycle integration.

## High-priority findings

### B1 — Broken projected ancestry (implementation bug, fixed)

Initially a child Svelte attachment mounted before its parent. Looking up the
nearest registered ancestor at attachment time gave the child the document root,
not its actual projected parent. The original final-transform test passed despite
this: retaining a child's final rotation does not prove ancestor scale compensation.
Scroll participants had the same registration-order exposure.

Reproducer: render the existing nested lab, retrieve both projections using the
root-exported `visualElementStore`, compare the child's `parent` with the `.nest`
projection. Chromium returned false (document node ID 0 versus parent ID 7).
`review-browser.svelte.spec.ts` preserves this regression assertion.

The adapter now collects registrations and mounts them in DOM order. The same test
passes. Shared replacement mounting before removal also preserves the source stack.
After these fixes, the earlier flex and shared-underline intermediate-position
failures both pass without weakening tolerances or inserting settling delays.
A suspected Vitest resize timing issue was not established as the cause.

### B2 — Reduced-motion override split between two owners (implementation bug, fixed)

Initially `reducedMotion: 'never'` changed the adapter's transition but was not
forwarded into the VisualElement. Motion could therefore still suppress animation
using its OS preference. The corrected adapter sets the VisualElement policy and
refreshes its effective preference at transaction time. A browser regression test
sets Motion's exported preference state to true and verifies that an explicit
`never` still produces `shouldReduceMotion === false`.

This does not promise mid-flight cancellation the instant the OS preference changes:
the local adapter reevaluates when a transaction starts. Route policy is evaluated
when navigation starts; Svelte presence evaluates when a transition is created.

## Remaining caveats

### B3 — Every update has application-wide measurement cost (performance issue)

`layout.update` snapshots every registered participant in every controller.
`beforeCommit` also reads every popLayout participant, even for an unrelated tab.
The independent browser test wraps each tile's `getBoundingClientRect`, performs
an empty transaction on another controller, and verifies at least one read per tile.
Thus group IDs scope shared identities, **not measurement work**.

This is a deliberate safe first boundary for cross-component reflow, but it is an
O(total mounted participants) cost for every synchronous update. Multiple separate
updates in one task each perform the snapshot pass; nested updates alone coalesce.
Dirty-group invalidation needs an explicit contract because CSS siblings can affect
one another. Do not promise 500-node responsiveness from the small demo alone.

Motion correctly owns a global phased scheduler: projection updates batch transform
reset, destination reads, calculation and render, and use Motion's shared RAF.
The adapter adds no per-element RAF. Live projection is driven through Motion's JS
projection spring/render pipeline; it should not be described as entirely compositor
or WAAPI work. DOM read counts do not equal forced-layout counts. Actual style/layout
durations require browser tracing, separate from these correctness assertions.

### B4 — Transform support is intentionally restricted (acceptable prototype limitation)

Initial CSS transform/translate/rotate/scale on a participant is rejected with a clear
message. Numeric values through `layout({ style })` use Motion's transform pipeline.
The adapter does not monitor subsequent CSS class changes for newly authored
transforms; those can conflict with Motion's inline transform. Unregistered transformed
ancestors, perspective, skew, arbitrary matrices and 3D are unqualified. The API must
continue to state lifetime transform ownership and must not claim arbitrary CSS
transform preservation. Scale correction only knows values registered with Motion;
a stylesheet radius or shadow is not automatically converted into a tracked value.

### B5 — popLayout is a direct-child positioning contract (acceptable limitation)

The existing offset-based capture handles a positioned immediate parent; it is not
an arbitrary overlay engine. The check runs at outrostart and rejects other offset
parents. The cached read pass precedes positioning writes within `layout.update`.
Margin/border/RTL/fractional geometry and scrolled interruption deserve dedicated
intermediate-position assertions, not just checking `position:absolute` and final
item count. Parent and child geometry can only be trusted after B1's ancestry fix.

### B6 — Browser resize is intentionally not animated (Motion behavior)

Upstream's document projection resize handler blocks updates for 250 ms after a
width change and finishes active layout animations. Responsive CSS still reaches its
correct result, but smooth interruptible responsive resizing is not provided by this
adapter. Do not interpret this as continuously animated responsive reflow.

### B7 — Route cleanup is thoughtfully bounded, but real navigation coverage matters

The coordinator handles a throwing browser start, rejected transition promises,
supersession, explicit disposal and pagehide. It restores prior inline names including
priority, and avoids letting a stale session clear the next session's registry.
Duplicate registered names skip their pair. No document scanning is needed.

The mocked route tests verify bookkeeping; they cannot prove browser snapshot order,
Kit scroll/focus restoration, redirects, BFCache, aborted loading or browser history.
Those remain browser integration scenarios until exercised against the route lab.
A pre-existing stylesheet `view-transition-name: ... !important` can defeat temporary
normal-priority inline naming; browser rejection must remain an animation-only fallback.

## Verification and support

Command: `pnpm exec vitest run src/lib/motion-lab/layout.svelte.spec.ts src/lib/motion-lab/review-browser.svelte.spec.ts`.
After reconciliation: **10 tests passed, 2 files, 8.09 seconds wall time** on the
available Chromium runner. Before reconciliation the independent nesting test failed.
This is correctness evidence, not a performance benchmark. No build or application
dev-server command was run by this review. Firefox and WebKit were not run by this
review; other project reports must distinguish their own actual runs.

Document same-document View Transitions are Baseline 2025 according to current
[MDN startViewTransition documentation](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition).
That supports feature-detected enhancement in current major engines, not a promise
for every deployed version. Element-scoped transitions remain non-Baseline in
[MDN's element API](https://developer.mozilla.org/en-US/docs/Web/API/Element/startViewTransition).
Document transitions make the document non-interactive during the transition; their
snapshot behavior is a reason to keep continuous local interactions on live projection.
The adapter correctly avoids depending on element-scoped APIs or view-transition-scope.

Recommendation: retain the hybrid architecture with an explicit transaction and
restricted transform contract. Require real route/history tests and traced participant
benchmarks before promoting it beyond a technical prototype.

The subsequent [adversarial review](review-adversarial.md) found additional
lifecycle defects that these initial tests did not catch: delayed popLayout flow
changes outside a projection transaction, and stale upstream unmount callbacks
cancelling a later transaction, followed by a missing transform-restoration render.
These required adapter changes and stronger browser regressions; passing the initial ten tests was not proof of full presence/layout
coordination.
