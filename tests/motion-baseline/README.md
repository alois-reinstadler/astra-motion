# Motion behavior baseline

The complete follow-up audit and implementation checklist is [Upstream additions](UPSTREAM-ADDITIONS.md). Its [machine-readable inventory](upstream-inventory.json) accounts for all 1,990 declarations in the pinned source, including covered cases and reasoned exclusions. The selected first-pass baseline and its verification record below remain historical context.

## Complete expansion verification

All **179 groups / 628 upstream declarations** are mapped to implemented tests: **26 browser specs (442 cases)** and **4 SSR specs (11 cases)**, plus retained first-pass coverage. All independent assertion-review findings are closed. Existing Svelte lifecycle, binding, cleanup, SSR, packaging and adapter regressions remain; five observer regressions strengthen fractional sizing and WebKit transform-origin coverage.

Exposed runtime defects were repaired in paused playback, derived values and SVG updates, variant ancestry and managed/shared exits, layout dependencies/transforms/resize observation, drag release/reorder compensation, and scroll crossing ranges. The concurrent polish thread's observer signature, view and viewport changes were integrated before the affected checks.

- Full server suite: **49 files / 215 tests passed**. Separately integrated polish server/docs checks passed in that thread; this is not reported as a second full server run.
- Full Chromium/Firefox/WebKit matrix ran once: **3,099 passed / 30 failed** across **360 browser-file runs**. Repairs were checked only in affected suites; all known failures now have passing evidence. The full matrix was not repeated.
- Affected evidence includes the 22-spec integration gate, then **162/162** layout/component/phone/observer checks; final drag/reorder/layout/observer gate **413 passed / 1 failed**, followed by the complete repaired drag spec **123/123**. The last failure was a test that waited after a quick flick until velocity could decay; release now follows the public drag callback, retaining momentum/catch assertions.
- Types, owned-file lint/format and upgrade gate pass; the latest upgrade gate checks **447 source files / 136 type imports**. All 179 group mappings validate. No source drift occurred during browser gates.
- Shared headed Chrome checked controls, trusted drag/reorder, scroll, presence re-entry and layout interruption. After final runtime integration, fresh layout/reorder checks passed again with clean console/network checks and inspected screenshots. Resize/observer repairs have separate automated cross-browser evidence. All owned tabs, temporary previews and implementation worktrees were closed.
- Final packed-consumer generation/publint, installed declarations and production builds pass. Runtime qualification passes **21 plain-Svelte fixture checks + 42 SvelteKit cases** across all three engines. Retained engine compatibility probes pass **12/12**, with no skipped/flaky cases. Final archive SHA-256: `705b6f717a511dcd713ecd57f346827c32018c8380fe9b9b2c740f61cb333e48`. Nonfatal declaration warnings concern unpublished fixtures; both installed-consumer declaration checks pass.

Reproducible commands and exact failures/hashes are retained in `/tmp/astra-upstream-expansion/` (`final-browsers-report.md`, `affected-final-report.md`, `second-affected-report.md`, `runtime-final-report.md`, `final-package-report.md`, `final-qualification-report.md`, `headed-repair-final-report.md`, and static reports). Source/version and both MIT notices are preserved above the historical record and in the complete inventory.

Intentional exclusions remain **1,093 declarations**: unchanged upstream internals, duplicate scenarios, and unsupported or React-only APIs. Native View Transition coverage follows browser capability. Separate standalone E2E and performance benchmark suites remain enabled and have not been rerun in this expansion. Everything below describes the earlier, smaller first pass.

## Historical first-pass audit and coverage plan

Audit before implementation: 129 specs under `src/lib/motion*`, including 89 browser specs. Existing coverage is broad but not mapped to upstream scenarios. `tests/upstream-motion` contains Astra-authored engine defect/compatibility probes, not imported upstream tests.

| Area                  | Retain                                                                                     | Fill using upstream scenarios                                                 |
| --------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Controls/interruption | `scoped-animate`, `timeline-settlement`, native intro/rebind regressions                   | Component controls set/stop/restart and interruption                          |
| Presence/re-entry     | Native outro retention, manual removal generations, wait/propagation, keyed input identity | `initial=false` re-entry and a completed fast exit retained by a slow sibling |
| Variants              | Lexical/SSR inheritance, live custom data, parent/child sequencing                         | Label precedence, transitionEnd, child overrides or late children             |
| Gestures              | Trusted pointer capture, keyboard/focus, cancellation, bounds, SVG, cleanup                | Hover/drag arbitration through public interactions                            |
| Layout                | Svelte observation, transforms, shared IDs, scroll geometry, cleanup/performance           | Public intermediate/final geometry for layout modes                           |
| Scroll                | Axes/range/resize, reduced motion, detach/rebind, SSR                                      | Target-relative offsets and clamping                                          |

Keep Svelte-specific lifecycle, SSR, bindings, cleanup, and installed-package qualification (`tests/production`) unchanged. Keep internal assertions when they guard adapter ownership, shim contracts, measurement cost, or allocation leaks. Do not port unchanged upstream interpolation, projection math, or scheduler unit tests.

Small assertion cleanup: remove the redundant parser AST-type check before compilation in `authoring.spec.ts`; remove the internal MotionValue echo of an already-asserted DOM transform in `motion-state.svelte.spec.ts`; replace private reduced-motion/animation flags in `parity-core-contracts.svelte.spec.ts` with a position endpoint and paint intermediate/final values. Broader private-store assertions (38 files) require case-by-case treatment, not blanket deletion. Repeated-looking presence tests protect distinct native, managed, and manual lifecycles.

## Source and adaptation policy

Baseline: [Motion v13.4.4](https://github.com/motiondivision/motion/tree/33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343), commit `33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343`. This matches Astra's exact `motion`, `framer-motion`, and `motion-dom` version pins. The tag commit identifies test source; published npm `gitHead` metadata need not equal that release-tag commit. Adapted files identify their originating test paths/titles. Both the [repository MIT license](LICENSE.motion) and [Framer Motion package MIT license](LICENSE.framer-motion) are preserved in full.

Tests run against Astra public exports, using Svelte components and Vitest browser mode in place of React/Jest or upstream Playwright pages. Svelte `flushSync`/mount/unmount replace React `act`/rerender; DOM geometry, public values and callbacks replace private context/engine assertions. Poll semantic states; do not copy upstream arbitrary sleeps or global instant-animation switches. Native Svelte presence, managed `AnimatePresence` item/snippet APIs, and scoped playback settlement retain their existing Astra-specific contracts.

## Adapted scenarios

Paths below are relative to the pinned source. `FM` means `packages/framer-motion`; `MD` means `packages/motion-dom`. Astra files are under `src/lib/motion-lab`.

| Astra spec/scenario                                      | Upstream source and test title                                                                                                                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `upstream-controls`: broadcast/custom set                | `FM/src/animation/__tests__/index.test.tsx`: `.set sets values of bound components`; `.set accepts state depending on custom attribute`                                                  |
| Controls stop                                            | `MD/src/animation/__tests__/JSAnimation.test.ts`: `Correctly stops an animation`; adapted to two Astra subscribers                                                                       |
| Controls label arrays                                    | `FM/src/animation/__tests__/index.test.tsx`: `accepts array of variants`; strengthened from no-throw to rendered targets                                                                 |
| `upstream-presence-variants`: child override; late child | `FM/src/motion/__tests__/variant.test.tsx`: `doesn't propagate to a component with its own animate prop`; `new child items animate from initial to animate`                              |
| Stale transitionEnd                                      | Same variants file: `transitionEnd from instant animation does not override subsequent variant`                                                                                          |
| Rapid re-entry                                           | `FM/src/components/AnimatePresence/__tests__/reentry-during-exit.test.tsx`: `first child of initial={false} doesn't get stuck at initial when its previous exit resolved after re-entry` |
| Completed fast child re-entry                            | Same re-entry file: `first child of initial={false} replays its enter when re-entering after its exit completed`                                                                         |
| `upstream-gestures`: hover/drag arbitration              | `FM/src/gestures/__tests__/hover.test.tsx`: `whileHover applied`; `whileHover is unapplied after drag ends when pointer left element during drag`                                        |
| `upstream-layout-scroll`: position/size                  | `FM/cypress/integration/layout.ts`: `It correctly fires layout="position" animations`; `It correctly fires layout="size" animations`; layout callback scenario                           |
| Target offsets                                           | `FM/src/render/dom/scroll/__tests__/index.test.ts`: `Fires onScroll on scroll with different container with child target.`                                                               |

Extensions are identified rather than presented as upstream imports: interrupted controls assert latest-target behavior across Astra subscribers; start/set array overlap checks the legacy controls distinction (start: last label wins; set: first wins, as implemented in `FM/src/animation/hooks/animation-controls.ts`). Cancelled legacy controls promises are not given Astra scoped playback's settlement contract.

Gesture input uses synthetic PointerEvents to establish actual drag state instead of mutating upstream drag globals; existing trusted-pointer tests remain. Layout uses upstream midpoint geometry but an easing function that eventually reaches 1, adding final-rectangle assertions. Scroll uses Astra `useScroll` with real DOM geometry instead of mocked `scrollInfo`; crossing offsets extend the entry case with `['start end', 'end start']` (also exercised by `FM/src/value/__tests__/use-scroll.test.tsx`, `does not set accelerate when target has non-preset string offset`). No acceleration metadata assertions are copied.

## Historical first-pass verification scope

After integration, independent agents inspect assertions and run targeted browser tests plus server/type/static checks. Fix reproducible failures and rerun only affected files. Once stable, run `pnpm run test:server` and the complete `pnpm run test:browsers` Chromium/Firefox/WebKit matrix once, plus final type checks. Use the shared headed Chrome for an interactive smoke check with console/network inspection. Existing packaging and E2E gates remain enabled; no runtime or package layout changes are planned. Record actual results and remaining gaps below.

Focused command: `pnpm exec vitest run --config vitest.motion.config.ts src/lib/motion-lab/upstream-`. The `--config` option selects the existing three-browser component matrix; the final argument filters to the four adapted specs. No separate runner, download at test time, or new dependency is required.

Remaining adaptation gaps: independent scroll subscription disposal, scroll delay/stagger and document-target mapping, additional layout axes/portals, and broader upstream control/presence permutations. Existing regressions remain the authority for Astra's Svelte-specific behavior. This is a selected behavioral baseline, not the complete upstream test suite.

## Historical first-pass results — 2026-09-29

Integrated on `4c7609539abc02b59d77558440e8ead70981caff` (including the separately merged phone-containment work). Implementation used two isolated worktrees; separate agents reviewed assertions/types, ran suites, and checked headed Chrome.

- Server: `pnpm run test:server` — 44 files, 203 tests passed. Qualification/module-specifier script tests: 4 passed. Upgrade contract gate: 445 source files and 135 type imports checked, passed.
- New/changed targeted matrix: Chromium and WebKit 33/33 each; Firefox exposed two exact-scroll-coordinate assertions. Fixed with explicit <1 CSS-pixel position tolerance and fixed progress expectations within 0.005. Affected two-spec rerun: 27/27 across all engines.
- Full configured browser matrix ran once: 275 files passed, one failed; 1,744 tests passed, two failed. Both were existing Firefox Activity re-entry cases whose awaited click let the finite exit finish. Replaced that wait with synchronous native focus and explicit exiting/no-completion preconditions, preserving later focus/identity/geometry/cleanup checks. Only the affected spec reran: 15/15 across all engines. No unresolved test failures; the entire matrix was not repeated after this isolated test repair.
- `pnpm run check`: zero errors/warnings. Changed-file ESLint/Prettier passed, including the final Activity repair. All four new Svelte fixtures passed the Svelte autofixer.
- Shared headed Chrome: presence re-entry, layout interruption/rectangles, and scroll reversal passed on existing docs demos; no console warnings/errors or failed requests. Screenshot inspected. The owned tab and temporary preview were closed.

Workspace logs/reports: `/tmp/astra-test-suite/` (`final-server.log`, `final-browsers.log`, `affected-browser.log`, `final-activity-recheck.log`, `assertion-report.md`, `browser-report.md`, `headed-report.md`). Full-matrix command was `pnpm run test:browsers`; the affected repair used the focused `vitest.motion.config.ts` command with `src/lib/motion-lab/parity-next-verification-activity.svelte.spec.ts`.

Container-only qualification: WebKit used isolated launch wrappers under `/tmp/astra-test-suite/browsers`, libraries from `/tmp/astra-motion-browser-deps/root/usr/lib/x86_64-linux-gnu`, and that bundle's `50_mesa.json` EGL vendor file. `PLAYWRIGHT_BROWSERS_PATH`, `LD_LIBRARY_PATH`, and `__EGL_VENDOR_LIBRARY_FILENAMES` selected them. The actual loader successfully opened `libGLESv2.so.2`; Playwright's cache-only host preflight still rejected it, so `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` bypassed that preflight. No tests were skipped and no shared browser installation or repository configuration was patched. Normal CI installs browser system dependencies.

Packed-consumer runtime qualification and the separate E2E/engine-probe suites were retained but not rerun: this change affects tests and documentation only. The existing browser configuration still excludes the separate performance benchmark.
