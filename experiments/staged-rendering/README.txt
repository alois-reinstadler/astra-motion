Staged rendering lifecycle experiment

This contains the original research prototype plus a production integration.
Mode astra-managed-staged uses the real AnimatePresence/motion components with
createLayoutState. astra-staged remains the manually controlled prototype.
See docs/research/staged-layout-lifecycle.md for the production change and results.
No compiler plugin or Svelte source patch is required for the explicit state API.

Staged.svelte implements the output we would want an opted-in compiler scope to
produce: immutable requested state, separately published committed state, a pure
keyed presence diff, pre-write outgoing-box capture, one layout.update transaction,
and retained exits removed in frame batches. Application mutations assign requested
state normally. Parent grid styles and retained entries consume committed state.
No Svelte source, scheduler, or DOM API is patched.

It uses Astra createLayout and its presence diff/box helper, with Motion's DOM animate
for opacity. It does not implement all the behaviors of the managed motion component:
variants, custom presence data, wait mode, nested propagation, layoutId promotion,
SVG, portals, changing containing blocks, async boundaries, and arbitrary component
local state remain outside this proof. Reentry restores opacity immediately rather
than implementing a configurable enter animation. This is a matched workload
comparison, not a feature-complete faster implementation of AnimatePresence.

The experiment copied the existing React/Astra harness from the main worktree,
then added astra-staged and correctness probes. The baseline is THIS worktree's
src/lib/motion, whose source hash differs from the October 5 report. Compare fresh
React/current-managed controls here, not absolute timings from the earlier report.

Mechanism and checks

- Pure keyed diff identifies future exits while committed DOM remains unchanged.
- All outgoing boxes are read before pop writes or parent grid updates.
- createLayout.update snapshots projection and flushes publication of committed state.
- Request scheduling uses one microtask outside Svelte's effect flush.
- Same-turn requests coalesce; generation checks reject stale exit completions.
- Completion callbacks queue one removal per animation frame, not one per child.
- Experimental counters expose exit captures, commits, completion batches, reversals.
- Only styles owned by this fixture are restored on reentry; Motion retains transforms.

The unstaged prop is an intentional negative control: it lets the grid's columns
read requested state directly, while children remain staged. The unowned-parent
probe demonstrates exactly why wrapping arbitrary snippets is insufficient.
The React control commits its parent and children together in this case.

Reproduction

Install root dependencies using pnpm, then from the repository root:
  pnpm --config.verify-deps-before-run=false exec svelte-kit sync
  pnpm --dir experiments/staged-rendering install --frozen-lockfile --ignore-workspace
  node experiments/staged-rendering/build.mjs
  node --test experiments/staged-rendering/harness.test.mjs experiments/staged-rendering/scheduler.test.mjs

verify-deps-before-run=false avoids pnpm's automatic install during the command;
frozen-lockfile preserves dependency resolution; ignore-workspace isolates the
experiment's React dependencies. The experiment reuses root Motion/Svelte/Vite.
During this investigation existing dependency directories were symlinked, with
no dependency installation or change to the root lockfile.

Start from experiments/staged-rendering:
  portless astra-staged-test node serve.mjs
Portless assigns PORT; the server uses strictPort to reject an occupied port.
Use the production preview, not a Vite development build, for timing.

Browser API:
  await window.__bench.runCase({mode:'astra-managed-staged',workload:'remove100',count:500,
    warmups:1,trials:3,observationMs:3000,diagnostic:false})
  await window.__probe('combined', 'astra-managed-staged')
  await window.__probe('unowned-parent', 'astra-staged')
  await window.__probe('unowned-parent', 'react')
  await window.__bench.clear()

Modes and workload controls come from the copied baseline harness. Diagnostic
runs patch measurement functions only to count reads, and are NEVER timing evidence.
First-pop geometry tolerance remains 0.75 px. Timing includes scheduled work through
removal, not merely the very short requested-state assignment. Every timing case
has one warmup and three measured trials; a second reversed-order run checks noise.

Probes: combined parent resize/reorder/removal, interrupted projection, scaled
ancestor with centered/fixed origin, coalesced requests, cancellation before the
staged commit, reentry, disposal, direct external DOM write, and an unowned reactive
parent. React uses synchronous mutations, so its cancellation/disposal probes are
controls for final outcome, not identical scheduling phases. Probes compare first
pop and final state, not complete frame-by-frame motion curves.

Evidence is in results/. Failures and negative controls are retained. Results do
not establish universal 1:1 parity, cross-browser behavior, or compiler coverage.
