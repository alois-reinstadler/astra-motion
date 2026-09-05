# Motion architecture decision — 2026-09-05

> Historical initial decision. The implemented default now uses automatic observation
> and cached Motion snapshots. See [the follow-up decision](automatic-layout.md) and
> [current API and recommendation](../motion-system.md). Explicit transactions remain optional.

Status: technical prototype, not a claim of complete Framer Motion parity.

## Repository baseline

Installed Svelte 5.57.0 / SvelteKit 2.70.3 (package ranges differ), pnpm 11.24.0,
TypeScript 6, Vite 8. Static adapter; normal SSR and hydration. Empty library barrel.
No existing Presence, LayoutGroup, Swap, AutoSize or motion engine. Existing shadcn
components use tw-animate-css and 100/200/300ms CSS classes; preserve those.
No shared spring token system. Vitest browser + node and Playwright are available.
The existing e2e configuration starts a build/preview, so the motion lab uses a
separate configuration against the already-running server.

## Answers and ranking

1. **Hybrid Svelte lifecycle + Motion DOM projection + native route transitions.**
   Best reuse and platform fit. Svelte transition directives retain outgoing DOM and
   reverse; a small wait controller gates replacement. Motion owns projection,
   shared stacks, interruption, scale correction and scheduling. Kit owns navigation.
2. **Registered Motion DOM adapter with explicit layout transactions only.**
   The most reliable initial runtime boundary. Can be used within the hybrid;
   requires wrapping layout-changing state writes, but no geometry math in app code.
3. **Svelte plus custom cached FLIP/projection.** Reject as a production foundation.
   Simple cached rects lose current projected visual position during interruption,
   ancestor/scroll transforms and shared-stack state. Rebuilding those is unjustified.

Svelte already solves local bidirectional presence, destruction delay, nested outro
ownership, and compiler-owned native nodes. It lacks general cross-component layout
projection and shared projection identities. `animate:flip` is tied to keyed each
children and does not supply a persistent general projection tree. Crossfade pairs
transitions, not a continuously retargetable layout tree.

Motion DOM now owns HTMLVisualElement, HTMLProjectionNode, nodeGroup, NodeStack,
MotionValues, springs, WAAPI, scale correction and a shared phased scheduler. React
is not needed to execute these. Svelte-specific work is registration, reliable commit
boundaries, cleanup, ID scoping, transition coordination and SSR policy. Do not build
our own springs, interpolation, matrices, nested projection, or animation scheduler.

## Dependency decision

Use exact `motion-dom@13.2.0`; `motion-utils@13.0.0` is transitive. No motion/react,
React, framer-motion, Svelte clone, Vue runtime or paid dependency. Root exports only.
**Root-exported does not mean stable:** upstream explicitly excludes undocumented
APIs from compatibility guarantees. Projection is a framework-independent internal
integration contract. Pin it and isolate it behind one adapter; upgrades require the
browser suite. This is an adoption caveat, not something a preprocessor can fix.

Motion's LayoutAnimationBuilder is useful prior art, but it scans marked descendants,
clears untracked transforms and can reinsert removed DOM. Let Svelte retain ownership
and register elements directly instead. `unstable_animateLayout` is Motion+ alpha.

## Measurement and authoring decision

Do not assume attachment `$effect.pre` observes old DOM. Current Svelte docs explicitly
say parent DOM and some async block DOM can already be updated. A runtime attachment
also cannot discover arbitrary reactive causes of CSS position changes. A compiler
that just converts `layout` to an attachment does not solve this boundary.

Start with `const layout = createLayout()` and `layout.update(() => state = next)`.
It snapshots all registered participants, executes a synchronous Svelte flush, and
commits the root projection tree. It batches all reads before the state write; Motion
then batches transform reset, destination measurement and projection. Nested calls
coalesce. This is an honest, reliable API; optional automatic authoring must earn its
place through timing tests. Async data should be loaded first, then committed in one
synchronous update. Do not expose a callback that silently accepts asynchronous writes.

Native attachments preserve tags and forward through component prop spreads.
Compiler attributes are a separate spike, not a default compiler dependency. Normal
attachments have typing, formatting, editor support, deterministic SSR and no transform.
The prototype deliberately does not advertise bare `layout` as automatic behavior.

## Transform ownership

Projection must never discard app CSS transforms. The adapter detects existing
transforms and fails diagnostically when it cannot represent them safely; provide
explicit numeric rotate/scale through Motion's transform pipeline. Arbitrary animated
CSS matrices/3D/perspective and transformed unregistered ancestors require separate
qualification. Do not silently append a transform and claim correct nested geometry.

## Routes

`onNavigate` coordinates old snapshot → release navigation → navigation.complete →
new snapshot. Registry-based scoped shared IDs become temporary view-transition names;
never scan the document. Duplicate names disable that identity rather than rejecting
the whole transition. Navigation supersedes prior effects. Reduced motion and missing
API go directly through Kit. Native snapshots suit unrelated route trees; local Motion
projection keeps interactive UI alive. No reliance on experimental element scopes.

See [Motion architecture](motion-architecture.md) and [Svelte platform](svelte-platform.md)
for dated primary-source evidence. Spike outcomes, limitations and measurements are
recorded separately as implementation proceeds.
