# Automatic layout: follow-up architecture

The initial research prototype required `layout.update`. That restriction was a
correctly identified gap, not the final architecture. Follow-up experiments proved
that Motion's existing geometry can supply a postcommit source snapshot, including
an interrupted visual pose. The runtime now includes automatic observation, enabled by default; `automatic: false` opts into explicit
transactions. This report supersedes the initial document's claim that a general precommit hook is
required for the implemented cases.

## Source geometry without precommit DOM access

The adapter uses Motion's cached `layout` measurement and resolved current `target`.
It copies all source boxes before touching the projection tree, supplies `snapshot`,
and then uses Motion's regular update pipeline. Existing `updateSnapshot()` preserves
a supplied snapshot, so Motion still handles destination measurement, projection
math, shared stacks, springs and rendering.

This is not a second FLIP engine. The adapter uses root-exported `createBox`,
`copyBoxInto`, `createDelta`, `calcBoxDelta` and `applyBoxDelta`. All remain covered by
the existing exact-version integration contract rather than a new compatibility
promise from upstream.

Two details were essential:

- Motion rounds logical boxes on WebKit. Reconstructing the shared visual snapshot
  only from those rounded extents introduced image aspect error. The adapter maps
  the unrounded cached measured box through Motion's current delta instead.
- Shared measured snapshots live in scroll-adjusted coordinates. The adapter first
  removes the old cached scroll, refreshes the relevant scroll nodes, then applies
  current scroll and authored transforms. A stale scroll offset produced an exact
  40px handoff error in an adversarial test.

Removed source nodes need not be read or reinserted. Their cached snapshots are
supplied before replacement registrations mount and before old projections dispose.
Parents still materialize before children, and replacements precede old shared-stack
removal. The adapter flushes Motion's update/read/calculation/render pipeline within
the postcommit microtask, before paint.

## Detecting changes

One MutationObserver processes delivered records; it does not query or scan the
whole document. Each participant observes its parent's subtree by default. Structural,
text, class and relevant inline-style changes in that subtree request a batched commit.
Direct mutations on the participant's ancestors also invalidate it, including inherited
class or style changes on `body` and `html`. An unrelated subtree's text updates no
longer become relevant merely because the paths meet at `body`.

Use an explicit observation root when a participant can move because of changes
outside its parent's subtree:

```ts
const layout = createLayout({ observationRoot: () => container });
```

The getter can read an element assigned by `bind:this`. An undefined or null value
uses the participant's parent. A supplied root must contain the controller's participants;
choose the common container that includes their reflow sources. Roots and ancestor
subscriptions refresh after reparenting. The root controls observation, while the
controller's `id` still only controls shared identity.

A nonparticipant flex sibling inside the observed root can move a participant while
both participant and parent sizes stay unchanged; this remains covered. An ancestor's
sibling outside that root can do the same. If that change does not resize any observed
ancestor, widen `observationRoot` or use `updateLayout`. This is the explicit boundary
that replaces document-wide conservative invalidation.

Motion-owned transforms, opacity, radii and other paint-only owned properties are
filtered out, so each rendered animation frame does not start a measurement loop.
One ResizeObserver watches participants and their ancestor boxes to catch intrinsic
sizing and ancestor-driven reflow without a DOM mutation. Initial notifications establish
the size baseline. Direct ancestor changes and resizes can affect several roots.
Observer cleanup follows the last automatic participant; node/path records are removed
as participants dispose.

Automatic commits snapshot and measure affected participants together with connected
projection ancestors, descendants and shared-ID partners. Independent projection trees
remain unmeasured. Registrations, explicit transactions and native presence coordination
still commit globally so replacements and exits stay synchronized. `automatic: false`
retains its existing meaning: it does not request an observer, but is not an isolation
boundary while another controller requests automatic observation.

There is no document polling, per-element RAF, arbitrary state-write rewrite, Svelte
internal effect patch, or compiler dependency. The explicit transaction remains a
useful escape hatch and a lower-observation-cost mode for controlled workloads.

## Evidence

The isolated cached-source spike passes across Chromium, Firefox and WebKit for
ordinary nodes, nested projections, scroll containers, authored scales, ancestor
scales and repeated shared-node replacement during animation. Tests preserve source
position and size within 1px and include fractional image dimensions.

An independent real Svelte fixture uses only ordinary assignments. It covers flex
alignment, text-driven height plus sibling movement, keyed reorder, popLayout exit
and reversal, completed removal, shared replacement, asynchronous assignments and
parent disposal. Separate tests verify that Motion's own render writes do not advance
the projection transaction counter or cause per-frame bounds reads.

The real lab also runs ordinary assignments, retaining text counter-projection and
independent intrinsic image projection. The user-reported content failures remain
regressions; automatic layout must not reintroduce them.

## Remaining boundaries

Mutation processing uses registration indexes, with no geometry reads for irrelevant
records. A relevant batch still visits registration metadata to resolve projection and
shared-stack dependencies, while geometry work is limited to affected connected trees.
Structural mutations also refresh registration paths. This is not a guarantee of isolated
controller cost when controllers share a projection tree or ancestor reflow. Motion's native
window-resize suppression remains an upstream behavior; continuous responsive
retargeting during a browser resize is not claimed. Arbitrary transformed ancestors,
3D, CSS transform conflicts and animation of changing line breaks retain their
previous limits. The compiler has not become necessary: native attachments already
provide typed native-element registration with ordinary Svelte state updates.
