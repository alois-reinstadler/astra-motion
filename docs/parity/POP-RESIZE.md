# popLayout capture during ancestor resizing

Runtime follow-up to [phone containment](PHONE-CONTAINMENT.md), 2026-09-29.

## Correction

`AnimatePresence mode="popLayout"` and `AnimateActivity layoutMode="pop"` now
retain measured boxes while their registered HTML roots are present. A shared
layout observer refreshes affected boxes after layout mutations and resizes;
explicit `updateLayout` transactions capture immediately before the mutation.
Exit processing consumes that snapshot instead of replacing it with a box already
reflowed by an ancestor's Svelte update. Exiting and disposed roots stop observing.
There is one snapshot observer per document, no continuous frame measurement, and
paint-only style writes do not refresh the snapshots.

The temporary pop stylesheet preserves the measured sizing model and removes
min/max constraints that could shrink the frozen width again. Left/right and
top/bottom anchors retain their existing meaning, including direction-aware
horizontal anchoring. Styles and snapshot subscriptions are released on reversal
and destruction. No public API or dependency changes are required.

Managed flow removal now runs in a microtask after Svelte's flush. It can advance
an already scheduled native flow-mutation batch without replaying that batch later.
This preserves the intrinsic exit box before the next animation frame, while
retaining the existing coordinated projection transaction. That transaction seeds
the previous projection measurements before reading the changed DOM, so preserving
the exiting child does not sacrifice the ancestor's own size animation.

## Boundaries

- The containing block must remain the same. Changing it invalidates saved offsets;
  the runtime falls back to live measurement rather than applying stale coordinates.
- Automatic capture uses the last observed present box. If multiple synchronous
  updates produce an intermediate layout before observers can run, wrap the exit
  update in `updateLayout` to capture that intermediate box explicitly.
- Newly mounted or otherwise unmeasured roots use live measurement. This does not
  promise a historical box for content never observed while present.
- Observation follows the existing inferred parent/subtree and ancestor resize
  contract. Unobserved external position-only changes, stylesheet replacement,
  changing containing blocks and arbitrary ongoing CSS animations are not newly
  qualified by this follow-up.
- Projected text still needs a `layout="position"` boundary to correct inherited
  scale. Freezing a wide paragraph does not contain it inside a narrower clipped
  ancestor. The canonical note retains its fade-then-collapse sequence for that
  separate visual requirement.
- The native `popLayout()` attachment remains on its existing explicit-transaction
  and positioned-direct-parent contract; this change qualifies the managed
  AnimatePresence/AnimateActivity paths.

## Regression evidence

`pop-resize.svelte.spec.ts` includes thirteen cases covering automatic and explicit
capture, wrapping and sibling reflow, reversal/removal, refreshed baselines,
consecutive synchronous transactions, scrolling, RTL/right/bottom anchors,
projected parent shrinking and interrupted expansion (including parent start and
intermediate sizes in both capture modes), retained Activity roots,
and no snapshot reads for paint-only frames. Before the change, both initial
capture regressions failed: a 320px paragraph was captured at 180px.

`commit.spec.ts` checks that an advanced flow-mutation batch runs once and cannot
consume a later batch when its stale frame callback executes.

The final selected matrix passed **56 tests per engine** in Chromium, Firefox and
desktop WebKit (168 executions). It includes the new capture cases, presence and
Activity behavior, enforced CSP, the canonical examples, phone-containment tests,
coordinated exits and adversarial layout tests. No assertions were relaxed.
WebKit used the installed Playwright browser with missing Debian libraries and a
software EGL driver extracted under `/tmp`; system packages and the browser cache
were not modified. A temporary launch wrapper supplied those library paths.

Shared Chrome verification exercised a trusted close/reopen on the projected
fixture. The first five frame samples retained 320px paragraph width and 120px
height (maximum error below 0.001px) as parent width decreased from 356px through
354.075px to 348.125px. Reopening retained the same paragraph, restored static
positioning, removed pop ownership and preserved button focus. Screenshots were
inspected and the console contained no warnings or errors. The temporary harness
and all owned browser tabs were removed afterward.

All 204 server tests in 45 files passed. Type checking, targeted ESLint/Prettier, guide checks, engine/export checks,
generated-element checks, the production build and strict publint passed. The
installed plain-Svelte and SvelteKit consumers passed their checks, strict
declaration checks and builds for archive SHA-256
`e8228998d96d9b23cd8be478ac574d58f9483d2b3af570a6390e57f1b323ff09`.
The working tree included unrelated ongoing test work; these results are local
qualification, not a clean release or a published artifact.

In-memory feature measurements against the unchanged HEAD sources, using the same
installed dependencies, found these gzip changes (Svelte remains external):

| Feature                                |   Before |    After | Increase |
| -------------------------------------- | -------: | -------: | -------: |
| Native presence helpers                |    935 B |    991 B |     56 B |
| Presence entry with managed boundaries |  4,809 B |  6,137 B |  1,328 B |
| Full local runtime                     | 95,921 B | 96,426 B |    505 B |

The managed presence entry now includes observation even without the projection
engine. The full runtime already used that observer. Physical phone Safari and
arbitrary CSS/3D transform compositions are not claimed here.
