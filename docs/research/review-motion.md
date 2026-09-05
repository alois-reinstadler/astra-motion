# Independent Motion architecture review

Reviewed the first preferred `layout.ts`, `presence.ts`, `Presence.svelte` and architecture decision against the pinned Motion 13.2.0 source. This review intentionally looked for failures in the adapter, not reasons to approve the research. Findings below distinguish code-supported failures from browser-verified regression coverage. The orchestrator subsequently authorized this reviewer to fix `layout.ts`; presence changes remain owned by the orchestrator.

## P1 — Projection ancestry was wrong during ordinary Svelte mounting — fixed

The initial adapter constructed projection nodes immediately inside attachments. `parentProjection()` searched only already-registered elements. The installed Svelte compiler emits the child's `$.attach` before its parent's for ordinary nested native markup. Therefore a child could attach to the document projection root before its projecting DOM ancestor existed. The ancestor was never repaired afterward. This breaks nested counter-scaling and also skips `layoutScroll` ancestors; a final settled rotation assertion cannot detect it.

**Change:** attachment registration is collected and projection construction runs in DOM order. Synchronous transactions drain registrations before taking snapshots and after Svelte commits; ordinary initial registrations drain in a microtask. No projection math or replacement scheduler was added.

**Verified:** Chromium browser regression renders the actual lab and checks that the nested child's projection parent is its DOM parent, and that a tile's projection parent has `layoutScroll: true`. Both pass. This is a tree-structure assertion, not a screenshot-based guess.

## P1 — Shared identity was disposed before its replacement mounted — fixed

Svelte can destroy an old attachment before mounting its replacement. The initial cleanup unmounted the old projection immediately. Motion's shared stack needs the old member/snapshot available when the incoming member is promoted. The unpruned empty stack happened to retain a former lead, which could conceal the ordering error in simple underline demos; correct cleanup alone would then break those handoffs.

**Change:** teardown is deferred until replacement registrations have mounted. This preserves Svelte's ownership of the DOM while giving Motion a coherent identity handoff. The adapter does not reinsert Svelte-owned nodes.

**Verified:** a browser regression explicitly removes the old attachment/node first inside a transaction, mounts its shared replacement second, and asserts that the incoming projection's `resumeFrom` is the prior node.

## P1 — Shared stacks accumulated permanently — fixed

Motion's document root is a process-lifetime singleton. `registerSharedNode` adds an entry to `root.sharedNodes`; `NodeStack.remove` does not remove an empty entry, and when the final member leaves it can retain `lead`. The initial adapter never pruned its owned IDs. Repeated route/component mounts using fresh controller scopes therefore accumulated root map entries and retained projection/VisualElement objects. Deleting the local `participants` entry was insufficient.

**Change:** after unmount, remove the adapter's shared ID only when the corresponding stack has zero members. Do not reset the global projection root, delete other integrations' state, or prune a stack with a surviving lead.

**Verified:** 20 controller lifecycles with a shared ID return the global stack count to the starting value after every unmount. The document singleton and its window listener remain Motion-owned shared infrastructure; their existence alone is not a leak.

## P1 — Shared exit/presence handoff lacked Motion presence metadata — fixed; retention caveat remains

The first adapter set `projection.isPresent = true` once and never changed it. Native Svelte outro retention keeps DOM alive but does not tell Motion to relegate the outgoing lead or promote a returning node. A persistent small source plus a shared modal illustrates the failure: close the modal with a short native opacity outro while its layout spring is still running. Handoff back to the source cannot be coordinated through presence, and destruction may cut off the outgoing crossfade.

**Change:** one capture-phase document listener pair bridges native `outrostart`/`introstart` to `isPresent`, `relegate` and `promote`. Svelte's events do not bubble, so capture also handles a non-projecting transition root containing shared descendants. Per-root exit metadata keeps overlapping nested exits independent. The listeners are removed when the last participant disposes. This introduces no alternate DOM retention owner.

**Verified:** the browser regression sends the same non-bubbling CustomEvents used by Svelte, confirms that an outgoing detail hands leadership to the persistent source, and confirms that reversing a parent exit does not cancel an independently exiting child. Reversing the child's exit promotes it again.

**Remaining P2 caveat:** Svelte's native transition duration controls outgoing DOM lifetime. If that duration is shorter than the shared layout spring, the outgoing crossfade ends early while the surviving element continues. The adapter does not claim animation-completion fan-in or full shared-presence duration matching.

## P1 — Reactive reconfiguration destroyed projecting ancestors — fixed

Initial parent-first mounting is now correct. A different lifecycle remains: `<div {@attach layout({ style: { rotate: angle } })}>` creates a new attachment function when `angle` changes. Svelte destroys/recreates that parent's attachment, but stable child attachments may survive. Their Motion `parent`/`path` then still reference the old projection object. The same issue can occur when conditionally adding a projecting attachment around already-mounted descendants.

**Change:** same-DOM attachment replacement reuses the existing VisualElement and projection node. Options and Motion-owned styles update through the VisualElement; changing an ID moves the same projection between shared stacks; changing controller transfers participant accounting. Removed authored transform/scale-correction values are cleared and original CSS restored. Child parent/path references remain valid without mutating Motion's tree structure. Cleanup callbacks are idempotent.

**Verified:** the previously expected-failure adversarial parent replacement now passes. The dedicated regression asserts projection object identity, surviving child ancestry, scoped-ID migration, controller counts, changed authored rotation, and removal/restoration of authored rotation and radius.

Adding an entirely new projecting ancestor around already-mounted descendants or physically moving a retained node between unrelated projecting DOM parents remains a separate unqualified operation; same-element option updates do not claim general DOM reparenting.

## P2 — Reduced-motion override bypassed the adapter — fixed

`HTMLVisualElement` independently samples the OS reduced-motion preference, and the projection engine reads `visualElement.shouldReduceMotion` when choosing its animation type. The initial adapter only replaced the projection transition. Consequently `createLayout({ reducedMotion: 'never' })` could still be forced instant by Motion's separate default policy.

**Change:** forward `reducedMotionConfig` into the VisualElement and refresh its effective policy when taking a transaction snapshot. The application policy now reaches both branches of Motion's decision. Existing animations are not retargeted immediately on a media-query change; the next transaction observes the current setting. A live media-query override browser assertion is still needed.

## P2 — The supposedly synchronous transaction silently accepted async callbacks — fixed

TypeScript permits an async function where a `() => void` callback is expected. The original signature and implementation therefore allowed a promise-returning callback: writes after its first `await` happened outside the captured transaction, despite the architecture document promising otherwise.

**Change:** the generic public signature excludes promise-returning callbacks. Native async callbacks are rejected before invocation, and unexpected thenables returned by other callbacks are diagnosed. A thenable already returned by user code cannot be cancelled; callers must still load data before entering the transaction.

**Verified:** the browser regression includes a compile-time rejection assertion and confirms a rejected native async callback never executes its first statement.

## P2 — Transform ownership covers initial state, not arbitrary future CSS

The static computed-style check correctly rejects pre-existing CSS transforms without replacing them. Supplying numeric transforms through Motion's `latestValues` correctly reuses its transform pipeline. But a class, inline style or independent transform applied later can conflict with Motion's subsequent writes. The adapter also does not qualify transformed unregistered ancestors, perspective or arbitrary 3D matrices. These are broader geometry limitations, not evidence that adding a second FLIP transform would help.

**Recommendation:** explicitly reserve the participating node's transform for Motion for the attachment lifetime; route supported values through the typed options. Do not advertise arbitrary authored CSS transforms as supported. A reliable diagnostic for future stylesheet transforms cannot be implemented by comparing the node's inline transform once, because Motion itself changes that value every frame. The runtime comment now records this restriction. Original inline priorities are preserved on cleanup after review.

## P2 — Every transaction still measures the whole registered application

`updateLayout` snapshots every registered participant and every pop-layout capture, even for a transaction scoped to one controller. This is deliberate cross-component coordination, but `layout.stats()` is group-local while actual measurement work is global. A tiny tab change can incur the cost of an unrelated 500-item grid. `shouldReduceMotion` is also evaluated per participant.

**Recommendation:** report total registered work and measure before adding invalidation machinery. If a performance cliff is confirmed, allow explicit coordination boundaries or cache the policy per shared policy object for a transaction. Reuse Motion's scheduler and groups; do not introduce per-element RAFs or document scans. This is a performance tradeoff, not a demonstrated frame-time regression from this review.

## P1 — Redundant upstream unmount fallback cancelled a newer transaction — fixed

The browser reviewer isolated an interaction that the original architecture review missed: `scheduleCheckAfterUnmount()` is a fallback for integrations which might omit a commit after removing a node. It schedules a `frame.postRender` check which may call `root.checkUpdateFailed()`. In this adapter, a subsequent pop-layout transaction can begin in `frame.read` while its destination commit is queued to a microtask. The stale post-render fallback then clears that newer transaction's snapshots and dirty state before its commit executes.

The orchestrator removed this unnecessary fallback. Disposal roots are explicitly included in the adapter's guaranteed commit, including the last participant's root, so relying on the upstream fallback was both redundant and harmful. This is an example of why copying lifecycle calls from another framework adapter is insufficient even when the underlying Motion primitives are the right dependency. See the event-boundary reproduction in [the adversarial review](review-adversarial.md).

## P1 — A forced measurement commit could leave Motion's reset transform on the DOM — fixed

After the pop-layout timing fixes, an intermittent Firefox continuity failure remained. This reviewer reduced it to one participant, without presence, scroll or flow changes: start a flex projection, pause and seek its spring to 75ms, verify a stable intermediate pose, then call `layout.update(() => {})`. Firefox changed `translate3d(-131.443px, 0px, 0px)` to `none`, producing a **131.45px** jump despite the correct nonzero projection delta, correct target box, and still-paused animation. Calling the same VisualElement's `render()` immediately restored the exact prior transform, without recomputing projection.

This isolates a missed restorative render after measurement resets the DOM transform; it is not evidence of incorrect pop geometry or ordinary elapsed animation progress. Motion's VisualElement scheduler deduplicates using a timestamp, whereas the adapter can force another measurement/commit within a frame. The adapter now enqueues `visual.render` directly into Motion's render phase on the projection's `measure` event. Motion still deduplicates callbacks by identity, performs the projection math, and owns the frame loop. There are no new DOM reads, custom transforms, clock overrides or per-element loops.

The deterministic regression is retained as `paused-projection.svelte.spec.ts`. With the fix, that regression and all 12 stress tests pass across Chromium, Firefox and WebKit: **39/39 cases**, 6 files, **13.07 seconds** wall time. Pixel tolerances were unchanged. Because measured participants can now receive a restorative render that was previously omitted, performance numbers must be collected on the final runtime.

## Lower-priority contract issues

- `Presence` wait mode requires one native transition root reporting `onoutroend`. Missing that callback or using several independently exiting snippet roots cannot be inferred by the controller and may stall or replace early. The small API is viable if the contract is explicit and examples are complete.
- The reviewed pop-layout implementation captures offset geometry and requires a positioned direct parent. Multi-node exit, scrolling, margins, active parent projection and reversal require dedicated browser tests; ordinary fade success does not establish those combinations.
- Motion may schedule an animation start before `currentAnimation` exists. Cleanup should be verified for same-microtask teardown and ensure no late projection work survives after disposal. Calling a global root reset would be an unsafe workaround.
- Normal non-pop outros retain flow until final destruction, which occurs after the original state transaction. Reproducer to qualify: place two layout participants in a vertical stack, remove the first with ordinary `transition:presence`, and inspect the second when the first's outro finishes. No general automatic pre-destruction snapshot boundary is implemented for every retained subtree; do not claim full automatic commit coverage. The dedicated pop-layout mutation bridge addresses flow removal for its explicit attachment, not every possible Svelte lifecycle update.
- Root exports are the correct package boundary, but they remain undocumented internals. Exact pinning and compatibility tests are essential. No React runtime, deep imports, copied state manager or replacement physics engine was found.

## Verdict and validation

The choice of Motion DOM is sound; the initial integration lifecycle was not yet sound enough. The corrected registration/disposal/reconfiguration boundary is substantially stronger and remains small. Adopt the architecture as a prototype with explicit restrictions. Same-node reactive parent configuration and native shared-presence metadata are now covered; general automatic commit coverage and shared-exit duration matching remain outside the guarantee.

Six dedicated Chromium adversarial regressions pass in `src/lib/motion-lab/layout-review.svelte.spec.ts`. The updated runtime passes project `svelte-check` (zero errors/warnings) and targeted ESLint. The runtime also installs the orchestrator's optional layout-mutation bridge using Motion's `frame.read`; presence-only imports remain independent of projection. Existing route/browser suites, performance tracing and the separate pop-layout bridge's visual validation are outside this review's validation claim. No build or development server was started.

Source audit references: [Motion projection engine](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/projection/node/create-projection-node.ts), [shared stack](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/projection/shared/stack.ts), [VisualElement lifecycle](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/render/VisualElement.ts), [Vue exit coordination](https://github.com/motiondivision/motion-vue/blob/67f1770e4e7a7d2c4c93ab060965c257ddd18903/packages/motion/src/features/exit/exit.ts).
