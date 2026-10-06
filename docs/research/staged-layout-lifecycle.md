# Staged layout lifecycle — 2026-10-06

Astra now provides `createLayoutState` from the root and `/layout` entries. It
publishes immutable render state through the existing layout transaction. This is
an explicit snapshot boundary using public Svelte APIs, with no compiler plugin,
source patch, private scheduler interception, or new dependency.

## Why the change is needed

Svelte pre-effects do not supply a global React-style before-mutation phase. An
ancestor can already have changed layout when a descendant sees its exit intent.
[Svelte issue 16648](https://github.com/sveltejs/svelte/issues/16648) describes this
Motion integration problem. The earlier prototype demonstrated both a working
owned scope and a 302px jump when one parent expression bypassed that scope.

## Implementation

- `layout-state.svelte.ts`: component-owned `current`, `set`, and functional
  `update`; one shared microtask publishes pending values through `updateLayout`.
  Initialization publishes synchronously for SSR/hydration. Destruction cancels
  queued and future publication. All relevant geometry must read `current`.
- `layout.ts` / `commit.ts`: pending managed pop writes drain inside the existing
  snapshot → Svelte publication → projection commit transaction. Previously the
  second transaction could jump during interrupted motion. A regression detects
  57.87px error when this drain is removed; the fixed result stays below 0.75px.
- `AnimatePresence.svelte`: completed records are removed in frame batches.
  Entry identity prevents a prior exit removing a revived/re-exiting key. The
  latest requested input is reconciled even without a loaded layout engine.
- Presence lookup walks the requested DOM subtree rather than scanning all
  registered siblings for each root. Keyed reconciliation uses a key/index map.
- A throwing completion callback still surfaces its error while allowing other
  queued boundaries to finish.

Automatic geometry caches remain: removing them would break immediate resize/exit
behavior. The production implementation does **not** claim the prototype's O(k)
outgoing-only measurement cost; projection and default cache work still scale with
registered participants.

See [authoring example](../authoring.md#snapshot-before-publishing-related-state).

## Evidence

The production harness includes `astra-managed-staged`, using actual
`AnimatePresence` and `motion.div` components. `astra-staged` remains the historical
hand-built prototype. React 18.3.1 and Motion 13.4.4 are pinned; every result records
source hashes and exact installed versions. Diagnostic instrumentation is excluded
from timing runs.

On the matched 500-cell grid, the pre-fix managed implementation needed median
10.7–11.6 seconds to remove 100 distributed cells. After batching, the ordinary
managed path's repeated median was 626ms; the staged path was 471ms; React was 382ms.
Remove 500 medians were 649ms, 567ms, 526ms respectively. These are shared-host samples,
not a claim that Astra always matches React's performance. Raw repeat timing:
`experiments/staged-rendering/results/production-repeat.json` (one warmup, three
measured trials per case, both removal workloads). These samples precede the
initialization-only hydration hardening. The final build's remove 100 medians were
531ms staged, 499ms ordinary managed and 332ms React; see `production-final.json`.
The reversed ordering and shared-host noise preclude ranking the two Astra modes.

The first-pop/final-state matrix retains failures rather than hiding them:

- Combined parent resize/reorder/removal, interruption, coalescing, cancellation,
  reentry, disposal and fixed-origin transformed ancestors pass for both frameworks.
- A parent expression bypassing staged state still jumps 302px in Astra. It is
  deliberately outside the guarantee; React's corresponding commit passes.
- A centered scaled external ancestor changing its height and an external width
  mutation fail these geometry probes in both frameworks (10.5px and 90px).

This checks first-pop geometry and final state, not identical per-frame curves.
Arbitrary independent `$state`, mutable aliases, async template commits and
external DOM writes remain outside the snapshot boundary. No universal 1:1 claim.

## Verification

- Existing server suite: 250 tests pass; subsequent focused checks cover the added
  error-isolation and SSR cases.
- Broader Chromium presence/layout/activity/composition checks: 207 pass.
- Staged-state component checks: 9 pass, including hydration of 28 retained server
  nodes without replacement or hydration warnings; both SSR checks pass.
- Regression mutation checks prove the old removal behavior and interrupted-pop
  ordering fail the new tests.
- Svelte check: 0 errors, 0 warnings. Focused lint, formatting and autofixer pass.
- Library packaging/publint passes. Packaging reports declaration warnings
  in lab/site-only exports and an import.meta.env advisory; the new public
  LayoutState declarations are generated correctly.

Browser timing is Chromium-only. Firefox/WebKit and asynchronous Svelte rendering
are not qualified by these results. No changes were published or pushed.

Five final-build instrumented 500-cell workloads pass: reverse, resize, single exit,
remove 100 and remove 500. Every outgoing node was sampled on exit; largest first-pop
error was 0.40625px. `production-diagnostics.json` contains reads and call sites.
Browser console had no warnings/errors; all 12 network requests returned 200; cleanup
left zero cells and zero animations. Measurements are Chromium-only.
