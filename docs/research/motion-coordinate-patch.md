# Motion 13.2.0: detached shared source in a scroll container

The adapter carries one narrowly scoped compatibility listener for the exact `motion-dom@13.2.0` dependency. Motion itself is unpatched. The listener ships in the library runtime, so consumers receive the correction without pnpm workspace settings, a patched dependency, or a fork. It uses existing root-exported Motion types and geometry helpers; interpolation and projection remain Motion’s responsibility.

## Reproducer

1. Register a horizontal scroll container and a shared child.
2. Move/resize the child, then pause its actual Motion animation at an intermediate pose.
3. Scroll the container by 40px.
4. Remove the source DOM node and replace it with a differently sized node using the same shared ID.

With a painted source width of 65px and destination width of 60px, the replacement jumps 3.333px. This reproduces with both reconstructed postcommit snapshots **and ordinary Motion snapshots captured before the DOM mutation**, in Chromium, Firefox, and WebKit. The error equals `scrollOffset × (scale − 1)`: `40 × (65 / 60 − 1)`.

The executable reproducer and its native precommit control live in [auto-snapshot-spike.svelte.spec.ts](../../src/lib/motion-lab/auto-snapshot-spike.svelte.spec.ts). It additionally checks subpixel 6:5 aspect preservation, authored scale, repeated replacement, and `layoutRoot`.

## Cause and correction

In Motion's `notifyLayoutUpdate`, shared animation deltas are calculated from measured boxes, which include container scrolling. The new node starts with `resumingFrom` pointing at the removed source. During `setAnimationOrigin`, `mixTargetDelta` calls `scheduleRender`; that method releases `resumingFrom` because the source's projection instance has been unmounted. `resolveTargetDelta` then uses the cached logical layout box, whose coordinate space has had container scrolling removed. Applying a scale delta calculated in the other space introduces a translation error.

For this detached-source case only, the adapter registers a `didUpdate` listener **before** calling `projection.mount(element)`. Motion installs its own animation-start listener during `mount`, so the adapter can normalize the emitted `LayoutUpdateData.delta` first. It passes **both** delta input boxes through Motion’s existing `removeElementScroll` helper before `calcBoxDelta`. Target authored transforms still use `applyTransform(..., true)`. The extra guard verifies that source and destination measurement IDs differ, matching Motion’s shared-layout condition.

The adapter intentionally keeps normal immediate teardown. Retaining a real detached VisualElement until shared completion avoided the initial scroll error, but exposed double application of authored scale (`0.8 × 0.8`) and additional bookkeeping across replacements. It was not adopted. No DOM is reinserted and no fake projection instance is retained.

## Scope and upgrade obligation

The condition includes `node.resumeFrom && !node.resumeFrom.instance`; connected/shared-presence sources follow the original upstream path. This corrects a coordinate-space mismatch in this exact version rather than extending the public API. The event type, constructors and helpers are available from the package root, but **listener order and mutable event payload semantics are undocumented integration details**. This is an explicit upgrade risk, not a stable public layout API. On a Motion upgrade, inspect listener ordering, rerun the regression, and remove or revise the compatibility listener against upstream source. The relevant pinned source is [Motion commit e871ba7, projection node](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/packages/motion-dom/src/projection/node/create-projection-node.ts).

The initial investigation patched both ESM and CommonJS engine files and passed 60 browser cases across three engines. That package patch was removed with `pnpm patch-remove`: workspace patches do not propagate to downstream library consumers. The final adapter-only correction is verified against the ordinary, unpatched package with cached projection, native precommit controls, automatic invalidation, changed scrolling, authored scale, and repeated shared replacement. These are real browser geometry checks with unchanged subpixel tolerances.
