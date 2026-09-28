# Focused Activity, View, CSP and geometry verification

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

## Geometry candidate follow-up

Additional independent probes targeted the new static 3D geometry candidate after
`9a28ce7` and `cc3037e`, before final release gates. The regression-only commit
`3f97336` was integrated as `cd4c6d0`. Its four Chromium cases reproduced two
further defects:

1. **A transformed wrapper lost its CSS perspective during parent projection.**
   A plain wrapper with both `rotateY(...)` and `perspective: 650px`, containing a
   second rotated plane, sits inside a registered resizing parent. An unregistered
   clone supplies independent browser geometry before, at animation start, at
   40% progress, and after completion. The animated wrapper's computed perspective
   changed from `650px` to `none` during projection. At 40%, its descendant width
   was `92.308px` instead of the reference `104.450px`, a `12.142px` discrepancy;
   its y position was `192.301px` instead of `184.541px`. Before and after geometry
   matched exactly, isolating the distortion to active projection.
2. **Pointer correction ignored grouping properties that force flattening.**
   Three cases use `opacity: 0.75`, `overflow: hidden`, and `filter: opacity(1)` on
   an ancestor whose computed `transform-style` remains `preserve-3d`. Actual
   browser marker positions showed the forced flat plane. Correcting a known
   `90px` local x displacement instead returned `73.931px`, a `16.069px` error in
   each case.

Runtime commit `c7e1450` restores the authored perspective declaration before
rendering the compensated wrapper transform, while still suppressing perspective
for measurement. Its pointer-plane composition also accounts for grouping
properties' used flattening instead of inspecting `transform-style` alone.
The independent rerun passed **12/12 executions**: all four original cases in
Chromium, Firefox and WebKit. Every geometry assertion retains the original
**1.5px tolerance**; the reference trees, marker positions and assertions were
unchanged. No runtime files were edited by the verification worker.

## Assertions added

| File                                               | Cases | Evidence                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `parity-next-verification-activity.svelte.spec.ts` |     5 | An ordinary `Tab` with real motion descendants, ordered staggered completion, exit-before-hide, retained component state/input/DOM identity, activity-aware cleanup and clock suspension, nested local visibility, preserved and popped sibling geometry, two nested pop owners, padded ordinary wrapper roots, reversal, focus and style ownership cleanup. |
| `parity-next-verification-view.svelte.spec.ts`     |     2 | Managed Presence + Activity + named View hide/reveal/remove; native exit/enter/exit classification; retained input and authored important view names; a live reduced-motion change during a gated native capture releases names/styles while the pending update still applies exactly once.                                                                  |
| `parity-next-verification-csp.svelte.spec.ts`      |     2 | A real same-origin iframe with an enforced CSP meta policy rejects an unauthorized stylesheet and emits `securitypolicyviolation`; authorized pop rules actually change sibling geometry and clean up; authorized native View reset rules are present in the active CSSOM and are released after the update.                                                 |
| `parity-next-verification-geometry.svelte.spec.ts` |     4 | Independent before/start/middle/end browser-reference geometry for a transformed perspective wrapper under parent resizing; actual marker coordinates for opacity, overflow and filter grouping that force a flat pointer plane.                                                                                                                             |

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
pnpm exec vitest run --config vitest.motion.config.ts src/lib/motion-lab/parity-next-verification-geometry.svelte.spec.ts
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

The geometry matrix used the same isolated browser environment and passed twelve
executions on 2026-09-28 at 19:35 UTC in 3.78 seconds. Only the new geometry file was
run for this follow-up; no broader suite was run by the worker.

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
- `verification-geometry-baseline.log`: all four additional geometry cases fail
  on the pre-fix geometry candidate, with full measured reference values.
- `verification-geometry-fixed-matrix.log`: all twelve unchanged geometry
  executions pass after `c7e1450`, across Chromium, Firefox and WebKit.

The three new Svelte fixtures were checked with the Svelte MCP autofixer, with zero
issues or suggestions. Full candidate gates, packaged-consumer verification, CI,
deployment and cleanup remain the parent release workflow's responsibility.
Focused ESLint and Prettier checks also pass for all added source files.

## Limits

This establishes the retained Svelte Activity contract above, not React's hidden
rendering priority, selective hydration, or transparent teardown of arbitrary
application effects. It does not establish touch hardware coverage, mobile browser
coverage, or private Motion+ implementation equivalence. The fixed-plane geometry
cases do not qualify arbitrary animated 3D transforms or general projective scene
graphs. This verification also does not replace the separate public View
type-alignment regressions.
