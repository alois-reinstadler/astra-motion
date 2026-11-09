# Upstream DOM-commit lifecycle and deferred outro — RFC draft

**Historical research, salvaged 2026-11-10.** Neither API below exists in Svelte.
`onDOMCommit` and `DeferredTransitionConfig` are proposals, not available or planned
Astra APIs. Nothing here has been submitted upstream.

Source: retired project `bewegung`, `SPEC-012-upstream-primitives.md` at
`c5c2d442d6789f168d28e6423812949be8e9cd2d` (unchanged at its final `main`,
`cfcaaaf66c91e10691f0b6a556201c8d23748d5d`), with supporting evidence from that
commit's `FINDINGS.md` (P3) and `ARCHITECTURE.md`. Written in August 2026 against
**svelte@5.56.10** and **svelte@5.57.0**, `motion-dom@13.1.1` and Motion Vue v2.4.0.
Source citations are dated. Before using any claim about current Svelte exports or
scheduler behavior in upstream work, verify it again against the current release.

## How this relates to Astra today

Astra does not wait for this primitive. Its present implementation is:

- **Automatic layout** reconstructs the source box after Svelte's normal commit from
  Motion's cached measured box and current delta, triggered by bounded
  MutationObserver records. See [automatic-layout.md](automatic-layout.md).
- **`layout.update(() => …)`** is an explicit, synchronous precommit transaction for
  cases where a fresh before-snapshot matters. See
  [motion-system.md](../motion-system.md).
- **Presence** uses native Svelte transitions for retention and reversal.

The gap described in [svelte-platform.md](svelte-platform.md) — no coherent,
renderer-wide before-mutation snapshot — remains. Astra's cached postcommit
projection covers the implemented cases; it is not a universal precommit hook. This
document keeps the precise contract that would close the gap, so future upstream work
does not have to reconstruct it. It does not claim that automatic layout is blocked
until D1 lands, and it does not adopt bewegung's package layout, API names or
release gates.

## Evidence behind the proposal (as of August 2026)

- `$effect.pre` is a dependency-tracked render effect (`effects.js:243-251`,
  `runtime.js:226-290` in 5.56.10). A layout node cannot subscribe to "some state
  anywhere will reflow me". Astra's own Chromium spike shows an attachment pre-effect
  observing a mixed old/new DOM ([svelte-platform.md](svelte-platform.md#executed-lifecycle-experiment)).
- Keyed `animate:` measures before moves (`each.js:466-479`), but only inside keyed
  each reconciliation. It is not a general lifecycle.
- The private `Batch.oncommit` (`batch.js:845-848`) is **not** the missing hook. In
  default/non-async mode, dirty render effects can run during traversal
  (`batch.js:450-457`) before commit callbacks (`:383-390`); async mode collects them
  and runs them after. Exporting it would give mode-dependent measurement timing.
- `Batch`, `current_batch`, pause/resume/destroy and DOM ranges were not exported.
  5.57.0 (`7bc0a70f`) still exported only `eager` and `flushSync as flush` from the
  batch module (`internal/client/index.js:115`), omitted pause/resume/destroy
  (`:121-133`), and exposed only the aggregate `./internal/client` entry
  (`package.json:53-64`).
- Motion needs a renderer to call `projection.willUpdate()` before mutation
  (`create-projection-node.mjs:396-447` in `motion-dom@13.1.1`; `:1608-1618` notes
  no snapshot exists otherwise). Motion Vue wires exactly this through Vue
  `onBeforeUpdate`/`onUpdated` (`use-motion-state.ts:132-157`, `layout.ts:83-110`).

## Goals and non-goals

Primary goal (**D1**): a renderer-neutral, root-scoped, paired pre/post DOM-commit
lifecycle sufficient for measurement, selection/focus preservation and editors.
Secondary, separable goal (**D2**): promise/controller-backed outro completion.
D2 must never delay D1.

Non-goals: exposing effects, batches, DOM ranges or child enumeration; arbitrary
scheduler control; React lifecycle emulation; granting callbacks mutation privileges.

## D1 — proposed public surface

Naming is open to upstream review; the semantics are the proposal.

```ts
export type DOMCommitKind = 'sync' | 'flush-sync' | 'async';

export interface DOMCommitInfo {
	readonly id: number;
	readonly kind: DOMCommitKind;
	readonly root: object; // opaque, equality only
	readonly nesting: number;
}

export interface DOMCommitLifecycle {
	before(info: DOMCommitInfo): void;
	after(info: DOMCommitInfo): void;
}

export function onDOMCommit(lifecycle: DOMCommitLifecycle): () => void;
```

`root` is not a component, effect, batch or DOM range. Registration is scoped to the
current component like other lifecycle APIs and returns an idempotent disposer.
Callbacks are synchronous; returning a promise produces a development diagnostic.

**Ownership.** Svelte owns commit ids, affected-scope discovery, ordering, error
isolation and teardown pairing. A registration owns only its two callbacks and
disposer. Consumers may read DOM state but cannot delay, cancel or mutate the commit.

### Registration state

```text
REGISTERED -> CAPTURED_FOR_COMMIT -> BEFORE_RAN -> AFTER_RAN -> REGISTERED
REGISTERED/CAPTURED_FOR_COMMIT -> DISPOSE_PENDING -> DISPOSED
BEFORE_RAN -- scope removed/disposed --> AFTER_RAN -> DISPOSED
```

### Semantics

- **Exactly-once pairing.** A registration is affected when committed work can mutate
  DOM in its subtree or move one of its nodes. For each affected batch, `before` runs
  once before the first mutation-producing traversal; `after` runs once after all DOM
  mutations and before the next paint opportunity. Batches without in-scope DOM
  mutation produce no callbacks. Coalesced invalidations produce one pair. A
  registration created during a commit is eligible from the next batch.
- **Ordering.** Per root: `before` outer-to-inner, `after` inner-to-outer (a stack).
  All `before` callbacks finish before any mutation; all mutations finish before any
  `after`. Normal user effects run after `after`. Across roots: stable root creation
  order; the same `id` may be shared, `root` distinguishes scopes. `nesting` is zero
  for the scheduled batch and increments only for a batch drained by an allowed
  outer `flushSync`, never for callback re-entry.
- **`flushSync`.** The whole pair completes before `flushSync` returns. Calling
  `flushSync` from a callback is a development error and cannot interleave a nested
  mutation inside a pair.
- **Async batches and forks.** No `before` until Svelte has chosen a concrete visible
  commit with all inputs ready. Discarded or superseded forks produce no callbacks and
  no visible id. A committed fork produces one pair with `kind: 'async'`. Offscreen
  provisional DOM is outside the lifecycle; moving it into the visible root is a
  mutation and participates.
- **Re-entrancy.** State invalidated inside a callback is queued for a later batch with
  its own id and pair. Direct DOM writes from callbacks are unsupported.
- **Errors.** A throwing callback does not strand the pair: remaining callbacks and the
  DOM commit complete, then Svelte reports the error through normal boundary handling.
  The RFC must document this isolation cost.
- **Teardown.** Disposing before `before` removes the registration. If teardown is
  caused by the commit whose `before` already ran (or disposal happens inside
  `before`), the matching `after` still runs once. Disposing inside `after` prevents
  future pairs. Root destruction triggers the normal pair; nothing runs afterwards.
  HMR uses ordinary disposal.
- **SSR and hydration.** Client-only; SSR registration is a no-op. Hydration is not a
  commit unless it repairs DOM.

If affected scopes cannot be identified before traversal, an acceptable broader
contract is one pair per root with pending DOM-capable render work. **An after-only
hook is not acceptable.**

### How a Motion adapter would use D1

In `before`, reset supported projection transforms and call `willUpdate()` / capture
scroll for possibly affected nodes (READ). Svelte mutates. In `after`, schedule Motion
READ, COMPUTE and WRITE on Motion's existing frame loop. The hook creates no rAF and
provides no animation API. Bounded observers remain for external DOM, CSS and font
changes not caused by a Svelte commit. For Astra this would replace cached-source
reconstruction for Svelte-caused commits only; the observer path stays.

## D2 — optional deferred outro completion

```ts
import type { TransitionConfig } from 'svelte/transition';

export interface DeferredTransitionConfig extends Omit<TransitionConfig, 'duration'> {
	duration?: number;
	finished?: (signal: AbortSignal) => PromiseLike<void>;
}
```

- `finished` and `duration` are mutually exclusive: development error; production
  prefers the finite duration.
- On outro, Svelte calls `finished(signal)` once and retains the same effect and DOM
  until it settles. Rejection completes removal after reporting.
- Same-key reversal aborts the signal before intro, keeps the same retained branch and
  ignores later settlement. A second outro gets a new signal (generation).
- Nested, local and global aggregation waits for all finite timelines and deferred
  promises; parent removal waits recursively. Destroy and HMR abort without waiting.
- Not run on SSR; hydration never synthesizes an outro. Reduced-motion bindings may
  resolve immediately but still participate in retention and ordering.
- Infinite visual repeats remain a binding error. D2 is not needed for finite exits.

## Required diagnostics

| Condition                          | Required behavior                             |
| ---------------------------------- | --------------------------------------------- |
| async lifecycle callback return    | ignore return; development warning            |
| `flushSync` inside callback        | development throw; no nested commit           |
| state invalidation inside callback | queue subsequent batch                        |
| callback throws                    | finish pair, then normal error handling       |
| discarded fork                     | no callbacks                                  |
| disposer after `before`            | matching `after` still runs once              |
| D2 both `duration` and `finished`  | development error; production finite duration |
| D2 rejection                       | report and complete removal                   |
| D2 reversal/destroy/HMR            | abort signal, ignore stale settlement         |

## Deterministic acceptance cases

Use renderer-controlled event logs, no sleeps; D2 promises are resolved manually.

D1:

- one pair for coalesced sync mutations, with exact outer/inner ordering;
- `flushSync` pair completes before return;
- two independent roots with stable ids and order;
- a state update inside a callback creates a second, non-reentrant pair;
- disposal inside callbacks and root destruction pairing;
- async batch waits; a committed fork gets one pair; discarded/superseded forks none;
- offscreen-to-visible commit;
- callback errors do not strand the pair;
- HMR teardown leaves no registration;
- a Motion integration proves the before snapshot precedes keyed `{#each}`, `{#if}`,
  dynamic component and boundary mutations.

D2: finite and manual fulfillment, rejection, nested aggregation, local and global
transitions, same-key reversal with identical node and component instance, a second
outro generation, destroy/HMR abort and stale settlement.

## Acceptance bar

D1 is acceptable only with true before-mutation and after-mutation ordering in both
sync and async modes. Exporting today's private `Batch.oncommit`, an after-only
callback, dependency-tracked `$effect.pre` or an observer wrapper does not satisfy
it. D1 belongs in public `svelte`, is tree-shakeable, and adds no per-component cost
without registration. A consumer would feature-detect the public export and keep its
bounded/explicit paths for older Svelte versions, never probing private paths.
