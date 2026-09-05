# Reliability soak and scroll lifetime correction

2026-09-05. These are focused development-browser regression workloads, not a
production/mobile benchmark or a garbage-collector heap-retention proof.

## Reproduced failures and fixes

### Completed timeline controls could steal a new owner's styles

After a scoped animation completed, its ownership was correctly released. However,
`controls.time = ...` and `controls.complete()` could still write after a state or
layout binding acquired the element. Replay was guarded; other mutations were not.

Every mutating scoped playback operation now validates scope membership and
reacquires ownership before calling Motion. This includes seeking, changing speed,
pausing, completing and attaching a timeline. Stopped/canceled controls cannot revive;
start a new animation. Detached controls remain invalid. A completed playback that
is manually sought is owned again, like paused playback, until stopped or completed.
No animation engine or new animation clock was introduced.

### Official Motion's cached scroll timelines retained removed containers

The first 100 component mount/scroll/resize/unmount test left **100 scroll listeners**
on removed target scrollers, despite zero adapter owners, native animations and owned
styles. This was traced to the pinned upstream implementation:

- [`getTimeline` in Motion v13.2.0](https://github.com/motiondivision/motion/blob/v13.2.0/packages/framer-motion/src/render/dom/scroll/utils/get-timeline.ts)
  keeps a module-level strong `Map` keyed by containers and targets. Its fallback
  timeline retains a `scrollInfo` subscription and a `cancel` function.
- [`observeTimeline` in Motion v13.2.0](https://github.com/motiondivision/motion/blob/v13.2.0/packages/motion-dom/src/scroll/observe.ts)
  cancels its frame subscription, without releasing that cached fallback tracker.
- The cache also holds native timeline sources strongly. This conclusion is source
  inspection; the retained fallback event listeners were directly measured.

The adapter now avoids that cache without patching dependencies or importing internals:

1. Progress uses Motion's documented two-argument `scroll((progress, info) => ...)`
   callback. The second argument is used so minification cannot drop it and silently
   select the cached one-argument path. Motion measures offsets and shares its event
   tracker and scheduler across subscribers.
2. Fallback animated properties subscribe to their existing controller MotionValue.
   They seek Motion's own animation controls. There is no per-element RAF or duplicate
   layout measurement loop.
3. Simple container/document animations receive an attachment-owned browser
   `ScrollTimeline`. Motion's animation controls attach it to native animations where
   supported. Custom offsets and target tracking use the Motion-measured fallback.

The browser's `ScrollTimeline` is a standard platform API. **Motion's
`controls.attachTimeline` is exported and typed but not a documented stable vanilla
integration contract**, so this small bridge shares the exact-version/upgrade-test
requirement of our projection integration. Its timeline type cast bridges the DOM
library's broad `CSSNumberish` to Motion's narrower percentage `currentTime` type;
a scroll timeline supplies percentage time. Target `ViewTimeline` acceleration is
intentionally not claimed by this adapter while the cache lifetime issue remains.
All interpolation, finite trajectories, native animation playback and measurement
remain Motion-owned. The new code only owns subscription/timeline lifetime.

## Actual workloads and results

The final focused command runs `soak.svelte.spec.ts`, `scroll.svelte.spec.ts` and
`scoped-animate.svelte.spec.ts`, sequentially by engine:

| Engine   | Cases | Total command duration |
| -------- | ----: | ---------------------: |
| Chromium |    27 |                15.89 s |
| Firefox  |    27 |                16.60 s |
| WebKit   |    27 |                41.05 s |

The soak cases exercise, per engine:

- **120** timeline mount/animate/retarget/detach cycles, including resizing a target
  and removing it while playback is active: zero owners or native animations after
  each cleanup and after settling.
- **100** scroll component mount/scroll/resize/reverse/unmount cycles: zero remaining
  scroll/resize listeners, adapter owners, native animations or owned inline styles.
  These components include native-compatible container effects, custom target offsets
  and horizontal scrolling.
- **100** document-scroll mount/scroll/unmount cycles: zero remaining document/window
  scroll/resize listeners, owners or native animations. A follow-up strengthens the
  same test with exact expected progress and actual native timeline assertions.
- **12 idle frames** after scroll initialization: zero `getBoundingClientRect()` calls.
  This is an idle geometry-read assertion, not a claim that all browser/Motion work is zero.

Existing focused cases additionally check resize/rapid direction changes, reduced
motion during a retained native outro, scoped selectors, stale-sequence prevention,
finished replay, transform ownership and cleanup. The document-scroll assertions
were rerun separately in all three engines after strengthening them.

Raw logs: `/tmp/astra-soak-final-{chromium,firefox,webkit}.log`, plus
`/tmp/astra-soak-window-{chromium,firefox,webkit}.log`. Failed initial reproduction:
`/tmp/astra-soak-listeners.log`. The Svelte fixture passed the official autofixer with
zero issues/suggestions. Scoped lint passes. Chrome's timeline lab was visually
inspected at `/tmp/astra-soak-timelines.png` with no page/console errors; an earlier
long browser evaluation timed out and is not counted as manual soak evidence.

The tests deliberately retain removed nodes to inspect their listeners and styles.
They prove cleanup of these resources, not the absence of every possible heap reference.
A release-device performance/heap campaign remains separate work.

## Independent shared-core/lite lifecycle review

The optional lite entry was checked through Rolldown's actual rendered module graph.
It excludes `HTMLProjectionNode`, `createProjectionNode`, the adapter gesture module
and React. Motion's `HTMLVisualElement` still retains some geometry/measurement and
scale-correction helpers. The precise claim is **no projection-node engine or gesture
backend**, not zero files under Motion's projection directory. The review snapshot
measured 25,336 gzip bytes; later bundle measurements supersede that snapshot.

The review also reproduced an imperative attachment edge case: manually cleaning up
and synchronously reattaching the same binding to the same node during an outro froze
its trajectory at x=-13.328 while Svelte continued retaining the DOM. Ordinary Svelte
attachment invalidation does not hit this path because attachment effects pause
through the outro; that distinction is asserted in the test fixture.

The shared core now preserves the existing timeline/direction for synchronous
same-node reattachment. Generation-guarded final cleanup cancels a timeline only when
no replacement attachment claimed it. New-node mounts initialize a fresh clock. The
regression confirms the preserved exit reaches x=-80 before its final removal; it
reads the captured Motion trajectory after cleanup, because the removed node's inline
styles are correctly restored. This avoids assuming a fixed number of animation
frames fits within a particular duration on loaded test machines.

Five independent lifecycle cases pass in each of Chromium, Firefox and WebKit:
state rebind continuity, native intro rebind, paused ordinary outro invalidation,
current-target new-node remount, and imperative same-node outro reattachment. One
server case proves initial:false resolves a target changed after binding construction
but before markup renders. Logs: `/tmp/astra-rebind-final-{chromium,firefox,webkit}.log`
and `/tmp/astra-rebind-server.log`. The initial real failure is preserved in
`/tmp/astra-rebind-force-progress.log`. Fixture autofixer and scoped lint pass.

## Finished WAAPI animation to native Svelte exit handoff

A later full WebKit run exposed a second presence lifetime boundary. The parent had
visually finished animating opacity 1 → 0.8, but its native `finish` event had not yet
updated Motion's value. Motion 13.2's `NativeAnimation.stop()` returns early for a
finished animation, so the outgoing Svelte trajectory captured the stale value 1.
During an `afterChildren` exit this produced a visible jump back to 1.

A focused natural run reproduced **10 failures in 25 exits**. Captures showed native
`playState: finished`, computed opacity approximately 0.8 and MotionValue/latestValues
still 1. Calling the real browser animation's `finish()` immediately before the Svelte
state change made this boundary deterministic. Raw evidence is preserved in
[waapi-presence-boundary.json](waapi-presence-boundary.json).

Synchronizing the final value was necessary but insufficient: WebKit also delivered
an already queued old `onfinish` callback after cancellation. Three focused probes
showed the new exit midpoint overwritten one frame later: 0.4 → 0.8 for forward
playback, and 0.15 → 0.3 for backward/odd reverse-repeat playback.

The adapter now identifies a finished `NativeAnimationExtended` behind Motion's
`AsyncMotionValueAnimation`, resolves the endpoint through Motion's own
`getFinalKeyframe` and updates through its `updateMotionValue`. Before canceling the
old animation, it clears that animation's old finish callback. No custom spring,
interpolation, endpoint/repeat math, browser-wide handler interception or dependency
patch was introduced.

**Explicit compatibility exception:** clearing the callback accesses the exact
Motion-created WAAPI animation through `NativeAnimationExtended`'s protected
`animation` handle, using one narrow type assertion. This is a private-property
contract pinned to Motion 13.2.0, beyond our existing undocumented root exports. The
public `cancel()` operation alone demonstrably leaves this callback race. Looking up
arbitrary DOM animations by property could instead affect application-owned handlers.
The subsequent [independent Motion review](adversarial-motion-aftercare.md) assessed
and retained this exception; remove the workaround when an upstream public operation
safely covers the boundary.

The independent review also reproduced the measurement risk of accessing
`AsyncMotionValueAnimation.animation`: its public getter synchronously resolves
unrelated pending keyframes. The final centralized `motion-compat.ts` helper instead
inspects the existing private `_animation` field. This is a second explicit pinned
exception. A regression proves that handing off opacity no longer forces an unrelated
intrinsic-height measurement. The original focused results below predate that
refinement; the current combined suite covers both corrections.

The permanent regression keeps five natural exits, the deterministic native-finish
handoff, and forward/backward/reverse-repeat endpoint cases. The latter confirm the
new exit midpoint survives the old event-delivery window with zero old finish
callbacks. They use real browser event delivery, not synthetic finish events.

The final focused race/lite-state/presence-state run passes **14 cases per engine**
(42 total): WebKit 12.73 s, Chromium 7.49 s, Firefox 8.36 s command duration.
Logs: `/tmp/astra-waapi-qualified-{webkit,chromium,firefox}.log`. Scoped lint passes.
