# The 500-participant rendering cliff

Measured on 2026-09-05, Chromium 151.0.7922.34, Linux headless, development-mode Vitest, 1280×720 visible iframe. The original `performance-chromium.json` remains unchanged. These results diagnose this environment and workload; they are not production/mobile performance guarantees.

## Finding and intervention

The original 216.6 ms frame interval is reproducible in a fresh browser. It is predominantly a Chromium compositor commit stall, rather than 216 ms of projection JavaScript or synchronous geometry measurement.

A detailed Chromium trace records `LayerTreeHost::WaitForCommitCompletion` lasting **205.578 ms**, within a **213.134 ms** `ProxyMain::BeginMainFrame`. Another commit wait lasts 175.958 ms with only 0.019 ms of thread CPU. During the first reversal, the compositor spends 388.602 ms inclusively in `TileManager::AssignGpuMemoryToTiles`. The renderer executes 32.952 ms of RAF callbacks over the entire one-second observation window. Inclusive categories overlap and must not be added together. The trace itself adds overhead.

Motion's projection builder emits `translate3d(x, y, 0px)`. A diagnostic `transformTemplate`, installed through the exported VisualElement API, changed only that generated zero-depth translation to `translate(x, y)`, retaining all subsequent generated scale/rotation. The fresh-browser comparison was:

| 500-cell reversal                  | Default 3D translation | 2D translation |
| ---------------------------------- | ---------------------: | -------------: |
| First, cold maximum frame interval |               216.7 ms |        33.4 ms |
| Second maximum frame interval      |                33.2 ms |        16.8 ms |
| Third maximum frame interval       |                33.3 ms |        16.8 ms |
| Peak drawn layers, cold            |                    510 |            207 |
| Peak drawn layers, third reversal  |                    510 |            109 |

An independent run without LayerTree instrumentation also produced 33.4 / 16.8 / 16.8 ms for the 2D variant. Chromium still promotes some overlapping content; 2D is not equivalent to disabling compositing. Summed layer rectangle area is not a GPU-memory measurement, and grows when the browser groups paint into larger layers.

**Implemented:** the adapter now applies an anchored transform template for generated leading zero-depth projection translations, preserving nonzero-Z and all remaining transforms. Keep Motion's projection math, interruption, scheduling and scale correction. The final nested, scroll, shared, transform and interruption suite passes 207 cases across three engines. The profiling variant is a diagnosis, not by itself sufficient coverage of transform semantics.

## Rejected shortcuts and benchmark artifacts

- Fresh-browser `will-change: transform` on all participants still produced a **200 ms** cold frame. Blanket pre-promotion does not solve this cliff.
- `contain: layout paint` on the grid still produced **216.6 ms** cold. Earlier apparently smooth containment runs followed a warmed baseline in the same process, so were order-confounded.
- Per-cell containment was worse in the initial warm exploratory sequence; it is not recommended as a blanket adapter behavior.
- Cold default reversal is about 13–19 ms synchronously in these runs, and warm reversals typically about 8–14 ms. Cold and warm should be reported separately and repeated; a single count sweep conflates count with process/renderer warmup.
- The benchmark has no seek, paused clock, Svelte outro, or dummy WAAPI animation. Native animation count at settle is zero; Motion projection uses its JavaScript scheduler here.
- The iframe is visible, 1280×720; the grid is 600×1396. Motion's resize-blocked flag is false at sampling. This is not a hidden-fixture or resize-suppression result.
- Removing the per-frame active-animation sampler does not eliminate the cold stall. CDP LayerTree events materially add scripting overhead; compare layer-count runs separately from low-instrumentation timing runs.
- Exact original bounds counts are 2N per reversal (1,000 at 500), not per-frame layout reads. Chromium LayoutCount remains much smaller than bounds-read count because reads are batched.
- The original zero Long Animation Frame entries do not establish zero frame stalls. RAF and renderer trace show them directly; observer availability/attribution and frame interval are different measurements.
- Container CPU ancestors have unlimited quotas and zero throttled periods; cgroup throttling does not explain the observed waits.

## Automatic observation

A separate `ProfileGrid.svelte` fixture preserves the original Benchmark. Its automatic variant uses ordinary `flushSync` state updates; its explicit variant uses `layout.update`. Initial measurement shows **1,000 bounds reads per reversal for both modes**, including the full animation window: no automatic read loop on every transform write. All three automatic reversals settle with zero active participants.

Automatic signature filtering has measurable scripting cost to investigate separately. Initial non-LayerTree automatic scripting totals were 50.8 / 107.0 / 90.7 ms, compared with 41.8 / 47.3 / 49.7 ms for the explicit fixture in separate fresh-browser runs. These are whole-window totals, not isolated observer time and not randomized trials. They must not be attributed entirely to signature parsing. A dedicated observer callback timing variant is provided to distinguish callback cost from general scheduling/rendering variation.

Direct observer callback timing then isolated **4.2 / 13.5 / 12.6 ms** over the cold/warm 950 ms windows (8 / 26 / 25 callbacks) before the 2D integration. After integration, automatic observation measured **13.2 / 13.8 / 13.3 ms**, approximately **0.5 ms per delivered callback** at 500 participants, with 24,998–26,998 mutation records per window. Every reversal still had exactly 1,000 bounds reads. Matched explicit runs delivered no observer callbacks. Instrumented 2D automatic maximum frame intervals were 50.1 / 33.3 / 50.0 ms, explicit 50.0 / 16.8 / 16.8 ms; these later runs overlapped other development/testing activity, so use them as an overhead signal, not a controlled FPS comparison. Filtering owns measurable work but does not account for all whole-window scripting differences.

A concrete next optimization is to reduce temporary arrays/string work in the non-owned-style signature (`Array.from` → `filter` → `sort` → `map` each participant callback). Preserve semantic style-change detection and the measured no-extra-geometry invariant. This is lower priority than the proven compositing fix and needs its own before/after measurement. No observer implementation was changed by this profiling subtask.

## Final integrated measurement

The final ordinary, unpatched Motion dependency plus adapter correction passed all 207
local browser cases. The warmed 1/10/100/500 explicit sweep recorded 16.8 ms maximum
frames and 2N bounds reads; the 500-node transaction took 13.8 ms. This warmed sweep
is in `performance-chromium-final.json` and does not replace the cold controlled test.

A fresh automatic run recorded 50.0 / 33.4 / 33.3 ms maximum frames, 1,000 bounds reads
per reversal, zero active animations at settle, and 10.8 / 11.5 / 11.1 ms total observer
callback time over each 950 ms window. See
`performance-profile-500-automatic-observer-final.json`. The current automatic adapter
is not a claim of unbroken 60fps at 500 participants. Observation trades convenience
for additional scripting and invalidation work; explicit mode remains available.

## Reproduction and artifacts

```sh
# One fresh browser per variant; optional LayerTree inspection adds overhead.
# baseline now means the adapter default (2D); upstream-3d removes its template.
VITE_PROFILE_VARIANT=upstream-3d VITE_PERFORMANCE_SUFFIX=-rerun pnpm exec vitest run --config scripts/vitest.profile.config.ts
VITE_PROFILE_VARIANT=explicit pnpm exec vitest run --config scripts/vitest.profile.config.ts
VITE_PROFILE_VARIANT=automatic pnpm exec vitest run --config scripts/vitest.profile.config.ts
VITE_PROFILE_VARIANT=translate-2d VITE_PROFILE_LAYERS=1 pnpm exec vitest run --config scripts/vitest.profile.config.ts

# Captures detailed renderer/compositor trace; larger artifact is intentionally temporary.
MOTION_PROFILE_TRACE=1 pnpm exec vitest run --config scripts/vitest.profile.config.ts
node scripts/summarize-layout-trace.mjs docs/research/.profile-layout-baseline-trace.json /tmp/layout-summary.json
```

The compact `performance-trace-baseline-summary.json` retains exact event names, counts and maximum waits. The captured raw trace was moved to `/tmp/astra-profile-layout-baseline-trace.json` to avoid committing tens of megabytes. Re-run the script to regenerate it. `performance-profile-500*.json` preserves intervention results; the initial all-variant artifact is explicitly exploratory and order-confounded. New runs use suffixed artifacts so the original baseline remains intact.

Chromium's own architecture documentation cautions that excessive compositing layers can make rendering slower, consistent with this trace and intervention: [Inside look at modern web browser, part 3](https://developer.chrome.com/blog/inside-browser-part3). This supports measuring layer promotion rather than adding `will-change` globally.
