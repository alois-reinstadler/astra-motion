# API release candidate implementation

This implementation builds on preserved snapshot `c2f1795` of the shared checkout.
The snapshot includes earlier coverage, runtime repairs, editorial work and snippet
previews. The original checkout was not used as a concurrent editing workspace.
See [baseline findings](2026-09-29-api-baseline.md) for inspected evidence and historical
verification; historical green checks do not qualify this candidate.

## Public contracts

- `Reorder.Group bind:values` writes proposals to application state when no callback
  exists. An `onReorder` callback remains the sole acceptance authority, including
  when binding is also supplied. Application updates do not notify that callback.
- Primary `AnimatePresence value` retains outgoing data. Optional `key` selects
  identity; absent key uses the value itself. Null/undefined mean absence; false,
  zero and empty strings are values. Present/items/value forms are exclusive.
- `motion.bind` uses the same runtime contract as `motion.*`, including state/default
  resolution and transform ownership. Native `.props` supplies SSR style and attachment;
  native outro retention still requires the transition directive. `.child` declares
  native SSR ancestry. Svelte setup context and native markup cannot be inferred from
  an attachment. Existing `createMotion` semantics remain the compatibility path.
- Helper inputs use static values or getters where identity/options can change.
  Initial values are snapshots; callbacks remain callbacks. `.current` state readers,
  MotionValue methods/direct styles and `motionStore` markup subscriptions are distinct.
- Scoped `useAnimate` controls expose additive `settled` results using existing reason
  vocabulary. Upstream `finished` remains completion-only. Pending pause/resume preserves
  one promise; completed inert operations preserve the result; replay creates a new
  result. Replacement/detachment releases owned work without cancelling its external
  replacement. Stopped controls cannot restart.
- Development diagnostics check demonstrable option/transform/local-variant/infinite-exit
  mistakes, deduplicate per owner, and avoid inherited/lazy-root heuristics. The static
  forwarding checker finds obvious custom components lacking forwarding; it is not a
  general dataflow proof.
- `useFollowValue` supports static/getter sources and transition options with spring as
  the default, plus tween/inertia. It retains output identity and borrowed input ownership.
  `useWillChange` is an explicit, persistent engine hint, not an acceleration promise.
- `animateView` exposes fluent selection, pairing, crop/group/class, layout and snapshot
  methods through one document coordinator. Native CSS snapshot properties are supported;
  element aliases such as x require CSS translate/transform instead. Queued cancellation
  applies its update immediately without capturing or cancelling the active owner.
  Immediate requests take capture priority over older queued requests. These scheduling
  choices are explicit Astra contracts, not claims of identical upstream batch ordering.
- `MotionConfig.isStatic` remains excluded: pinned upstream marks it an internal canvas
  implementation detail. Initial false/duration zero, ordinary static markup and Activity
  address different intents; none is advertised as an equivalent public canvas flag.

## Independent review and repairs

Separate reviewers inspected core lifecycle/ownership, fluent View behavior, package
boundaries/qualification, and final documentation/marketing. Concrete repairs include
terminal timeline settlement, completed-control observation, effective per-property exit
repeat checks, cycle-safe diagnostics, queued cancellation and immediate priority,
enter/exit precedence (including null), root capture ownership, visual-duration crossfades,
explicit CSS snapshot validation, archive installation copy, API-name search and accurate
reduced-motion advice for independently owned followers.

Installed-consumer assertions cover bound pointer reordering, actual will-change styles,
retained presence, modern native targets, following values, cancellation settlement, and
native/fallback View outcomes. Generated independent dependency locks are fingerprinted
and retained with the archive's qualification metadata.

## Coverage and experiment boundaries

The upstream inventory preserves all 1,990 declarations and historical verification.
New exact assertions are mapped narrowly. Forty-six previously excluded cases are now
explicit coverage gaps in fluent snapshot internals, following edge cases and rendering
hint wiring. Public API support does not mean every upstream test was ported.

The [vgpu/Threlte experiment](../research/vgpu-threlte.md) has its own dependency graph.
It demonstrates setter batching and compares existing ecosystem capabilities. The shared
browser did not provide WebGPU or WebGL2 contexts: GPU renderer paths and speedup claims
are unverified. Experimental dependencies are not shipped in the core package.

Final qualification uses one committed candidate and frozen sources. The release handoff
records its exact commit, archive digests, dependency locks, complete suites, production
consumers, browser evidence and physical-device checks not performed. This document
records implementation/review scope; it does not claim tests that have not run.
