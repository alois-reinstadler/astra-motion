# Independent Motion integration review — September 5, 2026

This review tried to invalidate the completed aftercare implementation. It inspected the pinned Motion 13.2.0 source, state/lite feature boundary, scroll lifetime bridge, scoped controls, and native presence handoff. The reviewer initially changed only an isolated regression file. After reproducing failures, the orchestrator implemented the shared compatibility fix and assigned the reviewer the scoped-control corrections.

## Reproduced findings

| Priority | Finding                                                                                                    | Evidence before correction                                                                                                                                                                                                                                                                             | Correction                                                                                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | A finished native animation's delayed completion could clear the replacement MotionValue animation handle. | Finish a native opacity effect, immediately request another target, wait two frames: the node has a running native animation but `MotionValue.animation` is undefined. Reproduced directly against official `animateTarget`, then retained as an adapter regression through `animateMotionDefinition`. | Settle/disarm already-finished native playback before adapter target replacement. Running targets remain under Motion's existing interruption and priority logic.                                                   |
| P1       | A stopped scoped timeline could write after ownership transferred.                                         | Finish an opacity animation targeting `0.25`, stop it, transfer ownership and write `0.75`: after two frames opacity becomes `0.25`.                                                                                                                                                                   | Disarm the old native completion handler; commit and cancel queued VisualElement renders before releasing ownership. Merely muting `onfinish` did **not** fix the queued-render half of this failure.               |
| P1       | Scoped `stop()` reset JavaScript-backed playback to its starting pose.                                     | Force Motion's JavaScript path with `repeatDelay: 0.1`, animate opacity from 1 toward 0, stop below 0.85: opacity returned to 1.                                                                                                                                                                       | Remove the unconditional `cancel()` after `stop()`. Motion's JS cancellation deliberately samples time zero. Explicit cancellation remains a separate operation with its original reset semantics.                  |
| P2       | Presence replacement dropped active WAAPI velocity.                                                        | Interrupt a native opacity animation moving upward with a spring targeting zero. Its first spring sample moved downward immediately despite the existing positive velocity.                                                                                                                            | Read velocity after `MotionValue.stop()`, because native stop is what samples current position and velocity. Already-finished playback receives zero residual velocity.                                             |
| P2       | Inspecting pending playback forced unrelated synchronous geometry measurement.                             | Queue an unrelated `height: auto` animation, then create an opacity presence trajectory: two bounding-box reads occur synchronously on the unrelated node.                                                                                                                                             | Inspect only an already-materialized native animation. The public `AsyncMotionValueAnimation.animation` getter flushes the global keyframe-resolution queue and must not be used as a passive inspection operation. |

Regression source: `src/lib/motion-lab/aftercare-motion-review.svelte.spec.ts`. The file also verifies native/JS cancellation behavior and ownership transfer after ordinary completion.

## Architectural judgment

These failures justify a small cancellation/handoff compatibility boundary, not a replacement engine. The public root exports do not provide a non-forcing current-animation inspection API, and the pinned native cancellation path leaves a queued completion callback alive. `motion-compat.ts` isolates accesses to `AsyncMotionValueAnimation._animation` and `NativeAnimation.animation`; these are private/protected fields and remain explicit upgrade risks. Group traversal uses the typed, root-exported `GroupAnimation.animations` field.

An alternative was calling `NativeAnimation.attachTimeline()` with a no-op observer solely because it clears `onfinish`. That avoids the protected native handle but repurposes a timeline API as cancellation machinery, and it still does not solve non-forcing asynchronous-animation inspection. The isolated version-specific helper is more direct. It changes no dependency files or prototypes and introduces no animation clock.

The state/lite selection and scroll lifetime bridge did not produce an additional concrete failure in this focused review. That statement is narrower than proving those systems complete. The scroll bridge's `attachTimeline` use and root-exported projection infrastructure still require version pinning and regression gates.

## Verification after reconciliation

Sequential browser runs covered the eight new adversarial cases plus all fourteen existing scoped-animation cases:

| Engine   | Result       | Total runner duration |
| -------- | ------------ | --------------------- |
| Chromium | 22/22 passed | 4.62 s                |
| Firefox  | 22/22 passed | 5.32 s                |
| WebKit   | 22/22 passed | 9.02 s                |

Logs: `/tmp/astra-aftercare-scopes-{chromium,firefox,webkit}.log`. Before-fix evidence: `/tmp/astra-aftercare-motion-review-expanded.log` and `/tmp/astra-aftercare-motion-review-fifth.log`.

These are deterministic functional regressions, not a frame-rate benchmark or a claim of complete browser parity. The orchestrator owns broader qualification and the remaining review reconciliation.
