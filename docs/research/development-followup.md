# Development follow-up

Implemented on 2026-09-05, following the [adversarial fixes](adversarial-fixes.md).
This checkpoint includes the existing Motion runtime, documentation, examples, CI,
and the previously uncommitted review fixes.

## Changes

- `Presence` adds `mode="sync"` and `onExitComplete`. Wait remains the default.
  Completion follows destruction of all outgoing native transition branches, uses
  the latest callback, and excludes cancelled exits and parent disposal. Wait
  callbacks can choose the next destination. Changing mode resets sequencing and
  suppresses callbacks from abandoned branches. Keyed reversal preserves real nodes.
- `createInView(() => element, options)` is available from the root and `/in-view`.
  Its `current` getter is reactive. Options support initial state, once per target,
  root, margin, and some/all/numeric thresholds. Target and option changes refresh
  observation; stale deliveries and component disposal are handled. The standalone
  entry imports no Motion animation or projection engine.
- Transition-only changes refresh layout policy without releasing/reacquiring an
  attachment, resetting authored values, or replacing active animation controls.
  The next animation uses the updated transition. Default layout controllers are
  created only when needed and reused. Global bridge callbacks remain stable.
  Automatic observation and reduced-motion policy remain reactive.
- The presence lab now demonstrates replacement modes, completion counts, and
  standalone visibility. Public-entry declarations, export expectations, guide
  recipes, and API documentation include the new APIs. The docs SSR test checks
  both Getting started examples instead of assuming exactly one.

The original review overstated projection destruction: registration reconciliation
already preserved the projection node. The confirmed defect was redundant lifecycle
work and authored-value resets. The new regression checks attachment counts, values,
active controls, and subsequent transition duration directly.

The [Motion presence](https://motion.dev/docs/react-animate-presence) and
[in-view](https://motion.dev/docs/react-use-in-view) APIs informed the feature scope;
native Svelte lifecycle and reactive getters define this adapter's authoring contract.

## Verification

Final integrated results:

| Check                                                                        | Result                                                                                                        |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `pnpm run check`                                                             | 0 errors, 0 warnings                                                                                          |
| `pnpm run check:guide`                                                       | 0 errors, 0 warnings                                                                                          |
| `pnpm run lint`                                                              | Pass                                                                                                          |
| `pnpm run test:server`                                                       | 88 tests pass                                                                                                 |
| `MOTION_BROWSER=<engine> pnpm run test:browsers`, engines run sequentially   | 277 each in Chromium, Firefox, WebKit; 831 total pass                                                         |
| `pnpm exec playwright test --config playwright.motion.config.ts --workers=1` | 105 tests pass across all three engines                                                                       |
| Browser inspection                                                           | Wait/sync completion and visibility entry/leave verified; screenshots reviewed; page and console errors empty |

The initial overlapping verification runs hit timing-sensitive assertions, a soak
timeout, and unexpected live-page reloads. Complete suites were rerun separately:
all browser cases passed with one engine at a time, then all Playwright flows passed
with one worker. No runtime assertion or timeout was relaxed in this follow-up.
The docs SSR locator was corrected to check both existing examples. CI already uses
an isolated job per browser engine.

No application build, packed consumer qualification, remote CI run, publication,
or push is part of this checkpoint.
The configured Svelte MCP tools were unavailable; compiler-backed source checks and
browser tests were used instead.

## Next bounded milestones

1. Advanced drag: elastic bounds, element-reference constraints, and explicit drag
   controls, with pointer cancellation, layout changes, and cleanup regressions.
2. Reorder built on those drag primitives, retaining keyboard focus and accessible
   non-drag controls during interrupted list updates.
3. SVG state bindings and transform customization, with explicit ownership rules and
   SSR/hydration tests.
4. Release qualification of the final package and physical Safari/iOS testing before
   upgrading this experimental adapter's support claim.

Manual presence control, a Presence popLayout mode, and retargetable cross-route
layout IDs remain outside the current API. Full Motion React parity is not claimed.
