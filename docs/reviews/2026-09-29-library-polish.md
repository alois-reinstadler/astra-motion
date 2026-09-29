# Library polish and performance pass

Date: 29 September 2026. This pass was developed in isolated worktrees while the upstream coverage thread continued. Its existing runtime fixes, tests and qualification records remain separately owned. This report describes the bounded polish changes; it does not replace release qualification.

## Changes

- **Automatic layout observation:** style signatures now enumerate CSS declarations by index, retain one array of non-owned property names, sort it, and serialize directly. Property order, values, priorities, custom properties and the existing ownership exclusions are preserved. No new cache or geometry policy was introduced. The coverage thread's separate resize-cache changes are preserved.
- **View Transition setup:** native pseudo-element animations are enumerated and indexed once per changed boundary group instead of once per root. The regression checks one enumeration and preserves native layout timing, custom layer creation, unrelated/finished-layer filtering, cancellation and callbacks. This is a demonstrated operation-count reduction, not a wall-clock benchmark.
- **Empty snapshot targets:** a target containing only undefined values keeps the native crossfade. Previously it cancelled that fade without creating a replacement.
- **Viewport lifecycle:** `viewport.once` latches its first entry even if the observer delivers a leave later in the same batch. Disposal during activation or a viewport callback stops further notifications. Repeated enter/leave behavior with `once: false` is preserved.

Public API signatures and dependency pins are unchanged. The review also covered gesture-session cleanup, press ownership, Activity context, animation ownership, managed hooks, view registration, resource waits and transition cancellation. No further refactor was justified by a concrete defect in those modules.

## Observer measurements

The [raw signature measurements](2026-09-29-observer-signature.json) retain the browser identity and samples. `scripts/benchmark-observer-signature.mjs` emits a self-contained function for an owned shared-Chrome tab; it neither starts a browser nor changes the application.

Each sample performs 50,000 calls on 500 detached real CSSStyleDeclaration objects. Both implementations receive equal warmup, alternating execution order and 12 measured samples. Outputs are compared for equality.

| Workload                                      | Previous median | New median | Reduction |
| --------------------------------------------- | --------------: | ---------: | --------: |
| Owned-only declarations                       |       137.75 ms |   39.80 ms |     71.1% |
| Mixed owned/layout/custom declarations        |       266.15 ms |  164.50 ms |     38.2% |
| Layout and custom-property-heavy declarations |       774.65 ms |  553.50 ms |     28.5% |

These are isolated signature costs under shared host load. They do not measure MutationObserver delivery, layout, rendering, allocations, mobile performance or application FPS. The recorded large-layout limitation remains in place.

## Package and documentation review

The package audit checked all 19 public entries, reviewed upstream imports and generated elements. It found no demonstrated packaging defect. The six existing bundle-guide figures match their dated installed-package evidence; this pass does not replace those measurements or claim a smaller package.

The initial documentation update corrects the engine pin in the authoring guide, names both Kit-only adapters (`routes` and `view-navigation`), and aligns the README's Hooks label and content map with the documentation navigation. A separate final [content review](2026-09-29-content-polish.md) records page-purpose and terminology decisions.

## Verification

Initial integrated runtime verification passed:

- Six server files, 23 tests: new View Transition and viewport regressions plus existing view coordination, resources, navigation and SSR checks.
- Three Chromium component files, 17 tests: observer signature regressions, native View Transition behavior and expanded viewport behavior.
- Baseline Svelte check: zero errors and warnings; baseline documentation/SEO/package-contract checks: 13 tests passed.

The new regression files are `src/lib/motion/view-animation-polish.spec.ts`, `src/lib/motion/viewport-polish.spec.ts` and `src/lib/motion-lab/observer-polish.svelte.spec.ts`. The observer spec participates in the existing three-browser motion matrix. Final combined results follow below.

## Combined candidate verification

The final editorial candidate built successfully with `pnpm run build`, including package assembly and strict publint. All **222 server tests across 51 files** passed. Changed-file Prettier/ESLint checks and the upstream export/pin gate passed. Svelte checking and the source-consumer guide check each returned zero errors and warnings.

The build still reports declaration-generation warnings for non-published lab/site modules and the existing `import.meta.env` packaging advisory. Those source areas were not changed by this pass; successful package lint does not erase these warnings. This pass does not publish an archive or claim fresh installed-consumer/device qualification.

The observer's six cases pass in each of Chromium, Firefox and WebKit, including a final 18-case rerun combining the signature optimization with the coverage thread's WebKit transform-origin-longhand repair. The native view/viewport checks pass in Chromium and Firefox; the eight view cases also pass in WebKit. An existing WebKit viewport-remount test read opacity immediately after the entry callback. Twelve repetitions reproduced the race on both original and polished gesture code; polling the rendered opacity preserved the assertion and passed all twelve. The coverage thread applied that correction; all three expanded viewport cases then passed in WebKit with the polished runtime.

Headed Chrome exercised the native AnimateView example opening and returning: focus restored correctly, animations and owned reset styles returned to zero. The editorial reviewer checked all 83 public routes' server content and explicitly exercised navigation, filters, search/reset and the homepage layout control. After integration, the shared preview's Motion values filter returned all seven expected examples, with loaded fonts and no console warnings or errors. See the content review for scope and page-by-page decisions.

All 29 files in this pass's explicit manifest are integrated into the shared checkout. Transfers used baseline hash guards and coordinated safe windows. The final observer change was applied as a signature-only hunk after the WebKit repair; the resulting file exactly matches the combined candidate verified across all three engines. The coverage thread's runtime fixes, existing tests and broader qualification remain separately owned. Its affected matrix still requires further test synchronization work; the passing checks above are scoped evidence, not a claim that the entire project matrix is green.
