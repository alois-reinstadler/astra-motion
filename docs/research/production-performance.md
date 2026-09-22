# Production layout performance qualification

This qualification uses a separately installed package tarball and the consumer's
production SvelteKit build. The fixture imports `astra-motion/layout` and
`astra-motion/presence`, with no workspace aliases, source imports, React, or
unpublished Motion internals. The harness refuses a development build and records
the tarball hash and served production resource URLs.

## Results: correct cleanup, a real large-grid performance limit

The production matrix completed **54/54 trials**, covering three repetitions of
100/500 cells × automatic/explicit/instant × 1×/4×/6× CPU. All final DOM orders,
unique IDs, visible cell counts, opacity, in-flow status and identity transforms
passed. Active projection and native-animation counts were zero at every fixed
settlement deadline. No browser errors occurred. Every mounted 700 ms idle sample
recorded zero geometry/style reads and zero active/native animations.

This does **not** qualify universal smooth 500-element animation. Automatic mode
already misses some refresh opportunities with 500 cells at 1×. At 4× and 6×,
both animated variants exceed a 16.7 ms frame budget; automatic mode is
substantially more expensive. The instant control also has occasional long
frames at the largest throttled settings, but much lower total cost.

Measured environment: AMD Ryzen 7 7800X3D, 16 logical CPUs, WSL2 Linux, Chromium
151.0.7922.34, 1280×1040 viewport, **SwiftShader software rendering**. These figures
are neither a physical mobile-device result nor native Windows Chrome/GPU
qualification. CPU throttling starts after initial loading. The package tarball
SHA-256 is `10db85792911a9a5b49af9b0eee0ff797c806351dd730a66d6ba3f95c3e12745`.

### Warmed interaction matrix

Each row below uses the median of three trial-level metrics, except “Worst RAF”,
which is the worst interval across all three trials. p95 is the median of three
individual p95 values, not a pooled percentile. Script/layout/style durations
cover all 18 changes and the fixed 1400 ms settlement window. Max input lag is
the median trial maximum: it exposes when the requested 80 ms cadence cannot be
maintained. Raw per-operation times and every trial remain in
[production-performance.json](./production-performance.json).

| Cells | CPU | Mode      | p95 RAF ms | Worst RAF ms | Script ms | Layout ms | Style ms | Max input lag ms |
| ----- | --- | --------- | ---------- | ------------ | --------- | --------- | -------- | ---------------- |
| 100   | 1×  | automatic | 16.7       | 16.8         | 121       | 29        | 78       | 0.2              |
| 100   | 1×  | explicit  | 16.7       | 16.8         | 55        | 14        | 60       | 0.1              |
| 100   | 1×  | instant   | 16.7       | 16.8         | 4         | 10        | 2        | 0.2              |
| 100   | 4×  | automatic | 16.8       | 33.5         | 453       | 111       | 298      | 3.2              |
| 100   | 4×  | explicit  | 16.7       | 16.8         | 193       | 55        | 224      | 1.4              |
| 100   | 4×  | instant   | 16.8       | 16.8         | 9         | 35        | 6        | 0.9              |
| 100   | 6×  | automatic | 49.9       | 83.4         | 635       | 184       | 423      | 10.8             |
| 100   | 6×  | explicit  | 16.7       | 16.8         | 279       | 83        | 361      | 6.1              |
| 100   | 6×  | instant   | 16.7       | 16.8         | 10        | 56        | 7        | 1.4              |
| 500   | 1×  | automatic | 33.2       | 33.4         | 492       | 132       | 369      | 3.6              |
| 500   | 1×  | explicit  | 16.7       | 16.8         | 219       | 63        | 283      | 2.2              |
| 500   | 1×  | instant   | 16.7       | 16.8         | 4         | 24        | 7        | 0.2              |
| 500   | 4×  | automatic | 183.3      | 266.7        | 1247      | 568       | 1016     | 1501.0           |
| 500   | 4×  | explicit  | 100.0      | 116.7        | 524       | 277       | 657      | 233.8            |
| 500   | 4×  | instant   | 16.8       | 50.0         | 7         | 91        | 22       | 0.5              |
| 500   | 6×  | automatic | 300.0      | 400.0        | 1852      | 879       | 1518     | 3047.5           |
| 500   | 6×  | explicit  | 150.0      | 216.7        | 722       | 437       | 933      | 1089.3           |
| 500   | 6×  | instant   | 16.8       | 100.0        | 13        | 172       | 39       | 22.5             |

### Read counts and long frames

For 500 cells, every 18-change automatic trial made 18,600 bounding-box and 18,900
computed-style calls; explicit trials made 17,400 and 9,000. Counts scaled exactly
5× from the 100-cell cases. The instant control made zero counted reads.
At 500 cells/4×, median browser layout counts were 101 automatic, 43 explicit,
and 18 instant. This is evidence of additional layout work, not a claim that
every bounding-box call forces a layout.

At 500 cells/6×, automatic/explicit/instant median Long Task counts were 36/36/1;
Long Animation Frame counts were 18/18/3. Available long-frame forced
style/layout attribution totaled 1180/445/0 ms respectively. Zero attribution in
the instant control does not mean its browser layout cost was zero: that field
only covers script attribution inside qualifying long frames.

### Sustained interruption

A separate single trial per animated mode repeated 120 changes at 500 cells/6×.
Both retained the correct 500 visible cells, order, opacity, in-flow status and
identity transforms, with zero active/native animations at the settlement
deadline and no errors. There was **no maintained 80 ms input cadence**:

| Mode      | Requested interaction | Actual interaction | p95 RAF  | Worst RAF | Maximum input lag |
| --------- | --------------------- | ------------------ | -------- | --------- | ----------------- |
| automatic | 9.60 s                | 31.24 s            | 316.7 ms | 366.7 ms  | 21.48 s           |
| explicit  | 9.60 s                | 16.37 s            | 183.3 ms | 233.3 ms  | 6.73 s            |

This is correctness under main-thread backpressure, not responsive interaction
at that scale. It is one sustained run per mode, not a statistical comparison.
The final-state assertions cannot prove that every intermediate visual frame
was free of discontinuities.
[Full sustained results](./production-performance-sustained.json).

### Diagnostic attribution and next work

Separate 500-cell/4× traces observed a sampled peak of 500 active projections in
both animated modes, versus zero for the instant control. The attribution run
measured 100 browser layouts / 623 ms and 123 style recalculations / 1054 ms in
automatic mode, versus 43 / 291 ms and 73 / 660 ms in explicit mode. These are
diagnostic trace figures with extra sampling, not replacements for the primary
table. Inclusive trace categories overlap.

Automatic mode's observer handled 37,830 mutation records in 46 callbacks,
taking 54.5 ms in total. Explicit and instant modes had no observer callbacks.
The wrapper times callback bodies; it does not isolate browser mutation-record
allocation/delivery cost or work the callback schedules later. Even so, merely
speeding up record filtering cannot account for the much larger measured
scripting/style/layout difference.

Prioritized next work:

1. Profile automatic commit and readback scheduling against the explicit path.
   Investigate why the automatic path performs roughly twice as many
   computed-style reads and browser layouts for this workload. Preserve cached
   geometry, removed shared sources and interruption semantics while reducing
   redundant work. The evidence identifies a target; it does not prove a safe
   scheduler change.
2. Measure a visible-participant budget or virtualization strategy on real
   low-end hardware. For owned dense-grid updates, use explicit transactions
   and disable automatic observation when all relevant commits are covered.
   This is a measured reduction in cost, **not a fix for smooth 500-node motion
   on a slow CPU**. Avoid animating an entire large data set unnecessarily.
3. Repeat on physical Chrome/mobile hardware with a real GPU, and add image-heavy
   and nested content. The current software renderer and synthetic dense cells
   cannot establish those budgets.

No runtime optimization was made during this qualification. The architecture
passes the tested correctness and cleanup checks; the **500-node slow-CPU
smoothness target fails**. This should remain a visible qualification limit.
[Attribution results](./production-performance-attribution.json) include trace
paths, SHA-256 hashes, event counts and timing summaries. Raw Chrome traces are
large temporary artifacts under `/tmp/astra-production-traces-attribution` and
can be regenerated with the command below.

## Workload and controls

- 100 and 500 numbered cells, initially in 20 CSS Grid columns, changing to 16
  columns and a narrower container. A 1280×1040 viewport keeps the complete dense
  grid visible at both widths. Visibility is checked from actual geometry.
- Position-only projection preserves text dimensions. This qualifies dense list
  and grid motion; it does not represent image-heavy cards, nested projections,
  full-page route snapshots, physical touch scrolling, or arbitrary transformed
  ancestors.
- Each measured sequence repeats reverse, resize, remove every fifth item, undo,
  rotate by 17 places, and resize. The default is 18 changes on an 80 ms requested
  cadence, followed by a fixed 1400 ms settlement window. Actual transaction time,
  interaction duration and scheduling delay are recorded: a slow run cannot
  silently claim the requested input rate.
- Motion variants use native 160 ms Svelte presence and `popLayout`; the instant
  control applies the same data/CSS changes without projection or retained
  outros. Differences include both projection and presence work. They are not
  an isolated measure of Motion's projection math.
- Automatic mode uses ordinary `flushSync` state updates. Explicit mode uses
  `layout.update` and disables automatic observation. Only one group is mounted,
  so another automatic group cannot contaminate that comparison.
- Each configuration gets a fresh browser, two six-change warmup cycles, then
  three measured repetitions. Mode order rotates between configurations. These
  are warmed interaction results, not cold startup or network benchmarks.

## Measurement boundaries

Primary timings use one RAF sampler, two lightweight read counters, Long Task /
Long Animation Frame observers where supported, and Chromium's CDP Performance
metrics. All variants get the same instrumentation. Frame intervals describe main
thread RAF opportunities; the derived missed-60-Hz estimate is **not** an exact
count of compositor dropped frames. Long Animation Frames and RAF intervals are
different signals and are reported separately.

`getBoundingClientRect` and `getComputedStyle` counts measure API calls, not forced
layouts. Offset/scroll property reads are not counted by those wrappers.
`LayoutCount`, `RecalcStyleCount`, their durations, and available long-frame forced
style/layout attribution are additional evidence. CDP duration fields in JSON are
seconds; report tables convert them to milliseconds. Sampling geometry to verify
final order/transforms happens after the timed window, with counters disabled.

Active projection count and native-animation count are recorded at the fixed
settlement deadline. A separate, bounded correctness wait then verifies unique
IDs, DOM order, zero remaining projection, and identity transforms. This keeps a
late animation from being silently called an on-time completion.

Separate diagnostic traces add 100 ms active-participant sampling and Mutation
Observer callback timing. Their results are not pooled into primary timing
statistics. Trace event durations are inclusive and can overlap; do not sum
script, style, layout, frame and compositor categories into one cost.

CPU rates 1×, 4× and 6× use CDP's relative throttling setting. This is Linux
headless Chromium on the recorded host, **not physical mobile hardware**. GPU,
CPU, OS, viewport, browser version and host load are recorded. Chrome explicitly
notes that desktop CPU throttling cannot reproduce a mobile CPU's architecture.
[Chrome CPU throttling reference](https://developer.chrome.com/docs/devtools/performance/reference#throttle-the-cpu-while-recording),
[CDP slowdown-factor contract](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate).

## Memory and cleanup evidence

Memory uses separate unthrottled pages. After three warmup lifetimes, repeated
mount/reverse/remove/destroy cycles deliberately destroy parents while child
motion is active. Checkpoints after forced GC record V8 heap usage and Chrome's
DOM node/document/listener counts. The fixture retains only numeric disposed
statistics, not arrays of detached elements or old component objects.

Public participant counts, native animations, detached-node diagnostics where
available, and idle geometry reads accompany heap data. A stable post-GC plateau
is bounded evidence for this workload; it is not proof that no leak can exist.
A higher warmed baseline can represent retained framework/engine caches rather
than a per-cycle leak. Browser-wide counters do not attribute ownership to Astra.
The experimental detached-node query is diagnostic and runs after the memory
checkpoints to avoid making its own node bookkeeping part of the trend.
[Chrome memory investigation guidance](https://developer.chrome.com/docs/devtools/memory-problems),
[CDP DOM counters](https://chromedevtools.github.io/devtools-protocol/tot/Memory/#method-getDOMCounters),
[experimental detached-node diagnostic](https://chromedevtools.github.io/devtools-protocol/tot/DOM/#method-getDetachedDomNodes).

### Observed memory trend

Each mode completed 50 measured lifetimes of 500 cells after three warmup
lifetimes. Values below are **post-GC used JS heap, KiB**. All checkpoints had
110 DOM nodes and two documents; listeners remained 26 in animated modes and
25 in the instant control. The remaining listener difference is browser-wide
retention, not proof of an Astra-owned listener leak.

| Mode      | Warmed baseline | 10 cycles | 20     | 30     | 40     | 50     |
| --------- | --------------- | --------- | ------ | ------ | ------ | ------ |
| automatic | 2858.9          | 2992.6    | 2993.1 | 3009.2 | 3027.9 | 3029.7 |
| explicit  | 2819.3          | 2928.0    | 2971.5 | 2967.2 | 2993.0 | 2997.4 |
| instant   | 2210.6          | 2304.1    | 2317.5 | 2313.4 | 2321.2 | 2323.2 |

All modes ended with zero cells, registered participants, active projections,
native animations, detached roots and retained detached-node IDs. Each final
700 ms idle sample recorded zero bounding-box/computed-style calls. The heap
increased by about 171/178/113 KiB respectively from the warmed baseline, with
most growth early and 2/4/2 KiB in the last ten cycles. That bounded trend and
stable DOM/listener counts do not show accumulated participant retention; they
do not prove the absence of every leak or establish an infinite-duration heap
plateau. GC and detached-node diagnostics are Chromium-specific; compositor,
image and process memory were not fully attributed.

## Reproduce

First build/install the standalone consumer using
`scripts/prepare-motion-consumer.mjs` as described in
[production qualification](./production-package.md), then serve its production
build. The runtime fixture is at `/performance?count=500&mode=automatic`.
`explicit` and `instant` use the same query contract. Its controls allow manual
reverse, resize, remove/undo and destroy/remount checks.

```sh
node scripts/qualify-motion-performance.mjs \
  --url "$PRODUCTION_LOCAL_URL" --memory-cycles 50 --traces \
  --package-tarball /path/to/astra-motion-0.0.1.tgz \
  --output docs/research/production-performance.json

node scripts/qualify-motion-performance.mjs \
  --url "$PRODUCTION_LOCAL_URL" --traces --traces-only \
  --trace-dir /tmp/astra-production-traces-attribution \
  --package-tarball /path/to/astra-motion-0.0.1.tgz \
  --output docs/research/production-performance-attribution.json

node scripts/qualify-motion-performance.mjs \
  --url "$PRODUCTION_LOCAL_URL" --counts 500 --rates 6 \
  --modes automatic,explicit --repeats 1 --steps 120 --memory-cycles 0 \
  --package-tarball /path/to/astra-motion-0.0.1.tgz \
  --output docs/research/production-performance-sustained.json
```

`PRODUCTION_LOCAL_URL` must be the actual root HTTP(S) origin of the running consumer, allocated by `dev-preview` locally. There is no default port. This script launches Chromium but never a server; run it only where browser launches are permitted.

Run captures in isolation from builds, other browser suites and source reloads.
The initial matrix's trace summaries omit observer callback timing because the
probe collected but did not serialize that field. The diagnostic-only rerun
fixed serialization; primary matrix and memory numbers were preserved without
replacement. Geometry/style read wrappers add overhead, which was not separately
calibrated here. Three repetitions expose variation but do not establish
confidence intervals or a cross-device service-level guarantee.

The production fixture was also checked in an isolated agent-browser session:
reverse → resize → remove → undo left all 500 numbered cells visible with zero
residual transforms, and destroy/remount returned to zero/500 participants as
expected. The settled screenshot `/tmp/astra-production-500-grid.png` was visually
inspected; console and browser error lists were empty. This complements the
timed runs and does not replace intermediate-frame or physical-device testing.
