# Independent adversarial test report

2026-09-05. Tests exercise the real browser DOM, Svelte runtime and Motion projection
through `review-stress.svelte.spec.ts`; they do not mock geometry or animation engines.
The small `SharedPresenceSpike.svelte` fixture combines native Svelte retained outros
with overlapping shared projection identities. It passes the official Svelte MCP
autofixer with no issues/suggestions and compiles for client/server without warnings.

## Findings that changed implementation

### A1 — popLayout sibling reflow snapped after the transaction (high priority)

A precise event-boundary regression falsified the original pop-layout claim. Record
a sibling's rectangle in the capture phase of the exiting node's `outrostart`, then
read it after the pop handler and Svelte tick. In Chromium the sibling moved **82.5px
instantly**, although its layout offset correctly reached the new target.

Cause: Svelte 5.57 schedules `outrostart` from a dummy WAAPI animation's `onfinish`.
The event occurs after the original `layout.update` commit. Popping to absolute
position in that event changes flow without giving Motion a corresponding snapshot
and commit. Checking only final offset, removal, or final screenshot missed this.

Reproducer: `projects sibling reflow when the browser dispatches delayed outrostart`.
The fix queues flow mutations into one Motion read phase and performs a coordinated
transaction around the batch. Presence-only consumers retain their small dependency
boundary. The test waits for the actual scheduled flow change, then verifies the
visual inverse and the new layout offset together.

### A2 — Changing a parent attachment broke surviving child ancestry

Replacing an attachment on an existing parent disposed its projection while children
still referenced that projection. A direct native-element registration test reproduced
this. The implementation was changed to reuse a surviving element's projection and
update its configuration, preserving the child tree. The expected failure is now a
normal regression assertion.

### A3 — popLayout reversal discarded CSS priority

Set `position: static !important` inline on tile 0, remove it, then restore it before
outro completion. The retained node recovered `position: static` but lost `important`.
The pop attachment saved only property values. The implementation now preserves both
value and priority; the expected failure became a normal regression test.

### A4 — Stale unmount fallback cancelled a later transaction (high priority)

After A1 was fixed, its regression passed alone but still failed consistently after
another mounted lab was destroyed. This was a real projection lifetime interaction,
not a browser resize or a reason to loosen the assertion. The sibling had no transform
or animation and retained layout measurement ID 8 while the root had advanced to 10;
its dirty state and root update state had both been cleared.

Cause: `projection.scheduleCheckAfterUnmount()` queued an upstream `frame.postRender`
fallback. For a clean old node this calls `root.checkUpdateFailed()`, which clears the
root's current update state and snapshots. A new pop transaction started in
`frame.read`; its destination measurement was queued to a microtask. The stale cleanup
fallback therefore ran first and cancelled this unrelated new transaction.

The adapter already guarantees a commit after cleanup, so that fallback was redundant.
Removing it preserved the global Motion read batching and made the complete Chromium
sequence pass, without inserting settling delays or changing geometry tolerances.
This failure mode also applies when a real component is destroyed just before a
subsequent interaction; isolated happy-path tests could not reveal it.

### A5 — Transform reset was not restored after measurement (high priority)

A later Firefox failure remained even with a demonstrably stable paused projection.
The Motion specialist reduced it to **one flex participant and a no-op layout update**:
a paused intermediate transform disappeared, moving the node **131.45px**, although
the projection target and delta remained correct. Calling the same VisualElement's `render()` restored the exact pose
without any geometry recalculation. This established a real render scheduling bug,
not merely ordinary progress between samples.

Motion resets inline transforms to measure destination layout. The adapter's timing
could then encounter VisualElement render scheduling deduplication and omit the
restoring write. The adapter now registers a projection `measure` listener that queues
`visual.render` directly through `frame.render`, using Motion's existing callback
identity deduplication and phased scheduler. It adds no geometry implementation or
new RAF loop. Projection and VisualElement cleanup remove the listener/queued render.
The standalone `paused-projection.svelte.spec.ts` preserves the minimal regression.

## Scenarios exercised

- Popped grid exit reversal reuses the native node and restores sibling geometry.
- Removal from a paused intermediate projection preserves the visual box; separate
  live reorder/removal cases exercise stress and final geometry.
- Delayed outrostart initiates projected sibling reflow, not just final DOM reflow.
- A 100-node grid reorders inside an overflow container, scrolls during animation,
  changes columns and removes a moving node; final survivor coordinates stay unique.
- Window scroll displacement remains distinct from nested projection movement.
- Destroying a parent during 100-child projection unmounts the old projection instances;
  remounting yields the expected node count.
- Child width remains stable throughout a resizing projected parent's animation,
  checking actual compensation rather than only its final authored rotation.
- A background, artwork and title hand off together, then reverse in flight.
- Shared source and destination coexist while Svelte retains the outgoing node,
  then reverse and finish with one visible correctly placed node.
- Simultaneous equal IDs share a stack within one scope, stay separate across scopes,
  and leave no empty stack after disposal; reduced-motion policy produces no active
  projection animation.
- Attachment reconfiguration and authored inline CSS priority survive lifecycle changes.

## Browser timing lessons

Early stress assertions read geometry after a later RAF and could count ordinary
animation progress as a snap. Microtask-only sampling still occasionally differed by
57.7px under broad concurrent browser load. That evidence was initially ambiguous:
microtasks do not freeze an old running spring. Pausing and verifying a stable pose
then reproduced a 69.4px change, which led to the actual A5 render-restoration defect.
The final diagnosis supersedes the initial timing-only hypothesis.

The geometric removal regression now pauses and seeks the actual Motion animation to
75ms, waits for rendering, verifies a nonidentity translation greater than 5px, and
proves the pose stays stable across another RAF within 0.1px. It then removes the node
and compares both that pre-removal pose and the immediate transaction snapshot against
the committed result, retaining the 3px tolerance. This provides a deterministic test
of preserving an intermediate projection rather than loosening a wall-clock assertion.
The separate 100-node live stress cases continue to reorder, remove, scroll, resize
columns and destroy parents without pausing their animations.

WebKit also reported computed opacity 0 at a fixed 90ms after commit while Motion's
inline opacity had reached 0.851641. Inspection showed correct native keyframes from
0 to 1 but a WAAPI `currentTime` of 0: native startup had been deferred. The assertion
now waits up to 250ms for positive opacity and still checks successful interrupted
completion at opacity 1. This does not treat every frame clock as identical or confuse
native animation startup with an opacity-target bug.

## Actual engines

Observed user agents:

- Chromium: HeadlessChrome **151.0.7922.34**, Linux.
- Firefox: **153.0**, Linux.
- Playwright WebKit: identifies as **Safari 26.5 / AppleWebKit 605.1.15**.

The WebKit run is Playwright's bundled engine, not a claim of testing shipping Safari
on Apple hardware. Tests run through Vitest's existing browser infrastructure; no
application dev server or build was started by this review.

## Remaining untested surfaces

This suite does not exercise real SvelteKit navigation. Browser back/forward, redirects,
aborted/delayed route loading, scroll/focus restoration, BFCache and actual native
route snapshots still require the running route lab. It also does not quantify forced
layout durations, dropped frames or memory: the separate performance fixture owns those
measurements. Tests do not establish arbitrary transformed ancestors, sticky geometry,
RTL margins or continuous responsive resizing as supported.

An earlier three-engine run recorded **36/36 passing cases**, but the later A5
regression showed why one passing run was insufficient. Final reconciliation includes both the 12-case stress suite and the independent
one-node regression: **39/39 cases passed across three engines**, six browser files,
13.07 seconds wall time. No clock mocks, relaxed thresholds, skips or expected
failures were needed.

Reproduce all engines with:

```sh
pnpm exec vitest run --config vitest.motion.config.ts src/lib/motion-lab/review-stress.svelte.spec.ts
```

The evidence establishes fixed-state geometric continuity and successful live stress
completion. It is not a mathematical proof of velocity continuity during every
unpaused retargeting. The earlier elapsed-time displacement assertions were not valid
for making that stronger claim; no pixel threshold was increased to hide a failure.
