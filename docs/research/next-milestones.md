# What remains after automatic layout

> Historical planning checkpoint. The subsequent state implementation completed much
> of the authoring milestone, plus variants, values and bounded gestures. Use the
> [current implementation report](state-implementation.md) for present capability and
> next steps; the earlier estimates and missing-API statements below are historical.

Assessment: 2026-09-05. This is a scope and acceptance plan, not a release promise.
Runtime evidence comes from `src/lib/motion/layout.ts`, `observe.ts`, and the
[validation report](validation.md). Browser tests establish the cases they exercise;
they do not establish Motion React parity.

## What `layout.update` changes

With default `createLayout()`, ordinary state assignments commit through Svelte.
Mutation records and observed size changes invalidate the shared projection tree. The
adapter uses cached Motion geometry/current projection as the source, measures the
committed destination, and lets Motion animate the difference. This includes async
data assignments after they arrive; application code need not mark each write.

`layout.update(change)` captures a source snapshot **before** the callback, runs the
callback inside Svelte's `flushSync`, reconciles registrations, and commits projection.
It also consumes observer records covered by that transaction. Its benefit is a known,
synchronous mutation boundary for application-controlled changes. It is not a different
animation engine, a higher-quality animation mode, or a switch that disables observers.
Its callback must be synchronous. [Svelte `flushSync`](https://svelte.dev/docs/svelte/svelte#flushSync)

Both paths coordinate **all registered participants**, including other controllers.
`automatic: false` currently means that a controller does not request the shared
observer; it does not exclude its nodes from observation when another automatic
controller is mounted. Observer overhead disappears only when no automatic participant
remains. This mixed-mode behavior deserves an explicit API contract before stabilization.
In an entirely manual scene, ordinary writes have no automatic layout invalidation;
call `layout.update` around the changes intended to animate.

Neither mode promises to observe every browser layout cause. For example, a CSS
pseudo-class that changes alignment without a DOM mutation or an observed box-size
change supplies no invalidation signal. That is a coverage boundary to test and
document, not a reason to poll geometry every frame.

## Which limitations come from where

| Limitation                                                               | Cause and next action                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text/images stretch under a resizing surface unless children participate | Transform projection scales the surface. Motion React documents the same constraint. Use transformable, position-projected text hosts and explicit image aspect/crop behavior; improve diagnostics and authoring examples.                                              |
| Horizontal window resize settles instead of continuously animating       | Motion deliberately suppresses projection during resize. Correct responsive layout is different from continuous resize animation; retain the default until a separate policy has convincing performance evidence.                                                       |
| Existing CSS transforms cannot freely coexist on a projection node       | The adapter gives Motion ownership of the transform pipeline. Typed transform values are supported; arbitrary matrix composition, changing stylesheet transforms and unregistered transformed ancestors need further work. This is not a fundamental Svelte limitation. |
| Transform options are applied only on attachment mount                   | Attachments run in the browser. SSR needs a matching declarative style contract to avoid an initial visual flash. This is an adapter/authoring gap.                                                                                                                     |
| Every invalidation visits all participants                               | Current conservative scheduling guarantees cross-component reflow but costs O(N). Identity scopes currently do not isolate measurement work. A safe containment/dirty-region contract is needed before narrowing it.                                                    |
| Pinned Motion internals                                                  | Root exports permit reuse but do not promise stability. Encapsulate the compatibility listener, retain upgrade regressions, and pursue an upstream supported integration boundary.                                                                                      |
| Route snapshots do not retarget like local springs                       | Native transitions capture old visual state. Keep cancellation/fallback semantics explicit and test redirect, streamed-data, aborted-load and real-device history cases.                                                                                                |

The first two constraints also exist in the target reference implementation. Our own
adapter gaps must not be presented as inevitable tradeoffs of Svelte.
[Motion layout guidance](https://motion.dev/docs/react-layout-animations),
[Motion compatibility policy](https://github.com/motiondivision/motion/blob/e871ba7f175d0609cef84f416f984e8e84be8333/CHANGELOG.md)

## Ranked milestones for the original scope

1. **Reliable local composition.** Expand adversarial examples for nested accordions,
   reordered variable-height content, content loading, simultaneous shared sources,
   parent destruction and scroll during handoff. Acceptance: intermediate geometry
   assertions as well as final positions; no new page errors, stale nodes, competing
   transforms or accumulated registrations across repeated mount/destruction cycles.
2. **Finish the authoring contract.** Define initial/enter/exit transform composition
   with projection, SSR-equivalent initial styles, a central policy installation,
   actionable diagnostics and mixed manual/automatic semantics. Acceptance: native
   element and forwarded-component examples work without exposing projection internals;
   no hydration warnings or first-render transform flash; mid-flight reduced-motion
   changes have an explicit tested policy. Presence currently supplies opacity fades,
   not the original target's general `initial`/`animate`/`exit` value model.
3. **Qualify cross-route composition.** Add redirects, aborted loads, streamed content,
   real BFCache and nested route-layout teardown. Acceptance: every navigation releases
   its handshake and temporary names, restores intended focus/scroll, and cannot leave
   an obsolete snapshot overlay after supersession. Keep ordinary-navigation fallback.
4. **Establish release performance and maintenance gates.** Measure packaged production
   consumer apps and real mobile devices, repeat cold 1/10/100/500-node traces, assess
   independent-region invalidation, and run live HMR/upgrade/long-session cleanup tests.
   Acceptance: agreed device-specific frame and memory budgets, documented package
   compatibility, and no reliance on workspace-only patches.

The extended lab now exercises part of milestone 1: cross-component responsive reflow,
delayed/cancelled content, different-width shared scrolling, actual glyph correction,
nested wait/destruction and a 20-change burst. Its 21 new cases plus nine update-mode
cases pass inside the full 237-case browser suite. These expand evidence without
completing the broader composition and release gates above.

The main engine integration is already demonstrated: presence/wait/popLayout, automatic
and shared projection, scopes, routes and interruption. The remaining work is substantial
composition and release engineering, not inventing another spring or FLIP engine.

A reasonable **planning allowance**, assuming dedicated work and no new upstream engine
blocker, is **2–4 focused engineering weeks for a beta covering the original scope**.
That is a low-confidence estimate rather than a deadline; the first two milestones
should be used to recalibrate it. Real-device soak testing and upstream support can
extend stabilization beyond that. Full `motion/react` parity includes gestures, drag,
scroll-linked values, variants and timelines that the original request explicitly
excluded, so it is a different, much larger project and has no credible estimate here.
[Motion React's broader API](https://motion.dev/docs/react)

## The preprocessor is deferred, not disproven

Now that automatic invalidation works, a preprocessor can genuinely reduce
`{@attach layout()}` to a `layout` attribute without wrapping state writes. It can also
generate imports, diagnostics and explicit group bindings. Those are authoring benefits;
the compiler cannot know final font/image/CSS geometry or replace projection at runtime.

The structured transform spike already demonstrates feasibility. Shipping it still
requires source-authoring types, editor diagnostics, Prettier behavior, sourcemaps,
custom-component forwarding and live HMR tests. Native attachments already work with
Svelte's tooling, so compiler syntax should be optional and map to exactly the same
runtime. Stabilize the runtime and grouping contract first; then judge the sugar by
whether it materially improves everyday component code. It is not needed to unlock
layout capability, but it can still help meet the original bare-attribute UX target.
[Svelte attachments](https://svelte.dev/docs/svelte/@attach),
[structured compiler APIs](https://svelte.dev/docs/svelte/svelte-compiler)
