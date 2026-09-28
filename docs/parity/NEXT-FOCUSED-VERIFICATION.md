# Focused Activity, View and CSP verification

This independent verification started at `b899bcb` on 2026-09-28. The agreed
Activity contract was reviewed before delegation: ordinary
`<AnimateActivity mode={...}><Tab /></AnimateActivity>` composition retains its
mounted Svelte subtree, coordinates motion descendants automatically, and waits
for their exits before applying `display: none`. Application-owned effects use
`useActivityEffect`; arbitrary Svelte effects are not transparently suspended.

The supplied [Motion Activity example](https://motion.dev/docs/react-animate-activity)
places `delayChildren` directly inside the hidden variant. The pinned
`motion-dom@13.4.4` implementation in
`dist/es/animation/interfaces/visual-element-variant.mjs` first resolves
`transition` from the variant and then reads `delayChildren` from that transition.
The verified fixture therefore uses
`hidden: { transition: { delayChildren: stagger(0.09) } }`. It preserves ordinary
component composition without adding an Astra-only variant syntax.

## Reproduced defects and resolutions

1. **Nested Activity discarded descendant exits.** With an outer Activity whose
   only visible child was another Activity, hiding the outer boundary immediately
   changed its phase to `hidden`. The inner motion list never got its staggered
   exit opportunity. The same failure bypassed nested pop layout. The baseline
   Chromium run had two failing Activity cases and two passing ordinary-child
   cases. Commit `4b7d544` connects retained boundaries to parent presence and waits
   for their descendants; local hidden modes remain independent on reveal.
2. **Managed Presence did not propagate removal through Activity.** The combined
   Presence–Activity–named View fixture remained in Activity phase `visible` after
   managed removal. The expected retained exit phase did not occur. This is fixed
   by the same parent-presence coordination in `4b7d544`.
3. **Nested pop ownership restored a dead owner.** After the first fix, hiding and
   reversing two nested `layoutMode="pop"` boundaries restored the geometry but
   left a stale `data-astra-presence-pop` attribute on the shared root. Commit
   `a18f722` tracks live owners and releases their styles and attributes in either
   completion order. The previously failing nested reversal case passes.

The ordinary child-component, stagger, effect lifetime and nonnested pop behavior
already passed on the baseline. These tests do not report those existing behaviors
as new fixes.

## Assertions added

| File                                               | Cases | Evidence                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `parity-next-verification-activity.svelte.spec.ts` |     5 | An ordinary `Tab` with real motion descendants, ordered staggered completion, exit-before-hide, retained component state/input/DOM identity, activity-aware cleanup and clock suspension, nested local visibility, preserved and popped sibling geometry, two nested pop owners, padded ordinary wrapper roots, reversal, focus and style ownership cleanup. |
| `parity-next-verification-view.svelte.spec.ts`     |     2 | Managed Presence + Activity + named View hide/reveal/remove; native exit/enter/exit classification; retained input and authored important view names; a live reduced-motion change during a gated native capture releases names/styles while the pending update still applies exactly once.                                                                  |
| `parity-next-verification-csp.svelte.spec.ts`      |     2 | A real same-origin iframe with an enforced CSP meta policy rejects an unauthorized stylesheet and emits `securitypolicyviolation`; authorized pop rules actually change sibling geometry and clean up; authorized native View reset rules are present in the active CSSOM and are released after the update.                                                 |

The fixtures do not call `usePresence`, manually register motion children, mock
native View capture, or manually complete exit animations. Pop checks measure real
DOM rectangles. The CSP negative control verifies actual browser enforcement,
rather than checking only that an injected element has a nonce attribute. The View
reset assertions inspect parsed longhand values and priorities, since CSS shorthand
serialization legitimately differs between browser versions.

## Verification evidence

Only these focused files and individual failing cases were run by the verification
worker; no broad local suite was repeated. All new tests participate in the normal
browser matrix and none are marked skipped. These dedicated native View checks
require the browser API explicitly; they cannot pass through an unsupported-browser
fallback. The pinned local Chromium, Firefox and WebKit runs exercise native capture.

Relevant commands, from the repository root:

```sh
MOTION_BROWSER=chromium pnpm exec vitest run --config vitest.motion.config.ts src/lib/motion-lab/parity-next-verification-activity.svelte.spec.ts src/lib/motion-lab/parity-next-verification-view.svelte.spec.ts src/lib/motion-lab/parity-next-verification-csp.svelte.spec.ts
MOTION_BROWSER=firefox pnpm exec vitest run --config vitest.motion.config.ts src/lib/motion-lab/parity-next-verification-activity.svelte.spec.ts
MOTION_BROWSER=firefox pnpm exec vitest run --config vitest.motion.config.ts src/lib/motion-lab/parity-next-verification-view.svelte.spec.ts src/lib/motion-lab/parity-next-verification-csp.svelte.spec.ts
pnpm exec vitest run --config vitest.motion.config.ts src/lib/motion-lab/parity-next-verification-view.svelte.spec.ts src/lib/motion-lab/parity-next-verification-csp.svelte.spec.ts
```

The `--config` option selects the existing three-engine browser configuration;
`MOTION_BROWSER` selects one engine. The two Firefox commands passed five and four
cases respectively. The full focused Chromium and WebKit runs each passed nine
cases across three files. The final four-case View/CSP command, without an engine
filter, passed twelve executions with explicit native-API preconditions across
Chromium, Firefox and WebKit. WebKit used task-isolated launcher wrappers and extracted GTK/GStreamer
libraries; its host dependency preflight was bypassed, while the actual browser
and every test assertion ran. No shared browser launcher or repository dependency
was changed.

Raw logs are retained outside the repository in `/tmp/astra-parity-next/`:

- `verification-activity-baseline.log`: baseline nested failures, ordinary cases pass.
- `verification-view-csp-baseline.log`: baseline managed-removal defect; a test
  serialization assumption was corrected to semantic CSSOM assertions.
- `verification-activity-after-parent.log`: nested exit fix passes; stale pop owner reproduced.
- `verification-nested-pop-fixed.log`: the failing nested pop case passes after `a18f722`.
- `verification-wrapped-pop.log`: padded ordinary wrapper case passes.
- `verification-view-csp-after-parent.log`: four Chromium View/CSP cases pass.
- `verification-activity-firefox.log` and `verification-view-csp-firefox.log`: all nine Firefox cases pass.
- `verification-focused-webkit.log`: all nine WebKit cases pass.
- `verification-focused-chromium.log`: all nine Chromium cases pass.
- `verification-native-view-csp-matrix.log`: all twelve View/CSP executions pass
  with native-API preconditions across the three engines.

The three new Svelte fixtures were checked with the Svelte MCP autofixer, with zero
issues or suggestions. Full candidate gates, packaged-consumer verification, CI,
deployment and cleanup remain the parent release workflow's responsibility.
Focused ESLint and Prettier checks also pass for all added source files.

## Limits

This establishes the retained Svelte Activity contract above, not React's hidden
rendering priority, selective hydration, or transparent teardown of arbitrary
application effects. It does not establish touch hardware coverage, mobile browser
coverage, or private Motion+ implementation equivalence. It also does not replace
the separate public View type-alignment and difficult-layout-geometry regressions.
