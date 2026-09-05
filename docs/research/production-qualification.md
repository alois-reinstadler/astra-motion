# Production qualification — 2026-09-05

**Recommendation: continue as a beta with explicit limits.** The actual packed
library works in an independent production SvelteKit app. This qualification also
found a strict upstream declaration error and a substantial slow-CPU performance
limit. Neither is hidden behind the passing functional checks.

## What was completed

| Area                        | Evidence                                                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production site             | Full Vite/adapter-static build and strict publint pass; prerender configuration and the client-only delayed route fixture were corrected                                                       |
| Packed installation         | 41,671-byte tarball, 58 files, ten public entry points; independent pnpm installation without source aliases or React                                                                          |
| Artifact identity           | Archive and copied-tarball SHA verified; every installed package file compared byte-for-byte; 65 client assets and 93 server files hashed; served identity and requested asset bodies verified |
| Production consumer         | 21/21 cases across Chromium, Firefox and WebKit: exports, SSR, hydration, initial styles, native component identity/focus, reversal, layout, values and JavaScript-disabled rendering          |
| Production site regressions | All 105 cases covered successfully: 102 passed the full run, then three corrected production-compatible cleanup cases passed their focused rerun                                               |
| Lifecycle                   | 13/13: actual Chromium BFCache twice, component HMR, real SSR streaming and three late-content capture contracts across three engines                                                          |
| Dependency contracts        | Static pin/export/shape gate and 12/12 standalone browser reproduction/contract cases across three engines                                                                                     |
| Performance correctness     | 54/54 matrix trials, 150 measured mount/destroy lifetimes and two 120-change sustained trials passed final state and cleanup assertions                                                        |
| Source quality              | Root Svelte checking: zero errors/warnings; scoped ESLint, formatting and official Svelte autofixer checks pass                                                                                |

The three original production-site failures came from one test dynamically
importing `/src/lib/motion/ownership.ts`, a development-only URL. Its production
version now verifies active playback, zero animations on retained detached nodes,
and successful fresh playback after Back without importing source internals.
Internal ownership assertions remain in the component-level soak/scroll tests.
No motion runtime change was needed for this qualification.

Manual production screenshots were inspected for the desktop homepage, mobile
layout guide, lifecycle fixture and 500-cell grid. Browser error lists were empty.
These complement automated checks; they do not establish physical-device coverage.

Repository-wide `pnpm run lint` is not green: Prettier reports existing formatting
across generated UI files and other older files. Running ESLint independently
finds two existing errors outside this change: the generic button's unresolved
`href` warning and an unused `_payload` in the chart tooltip. Qualification files
pass their scoped formatting/ESLint checks; unrelated widgets were not rewritten
to disguise the repository-wide result.

## Actual production costs

Cold requested JS and CSS, per-file gzip, including SvelteKit and each example:

| Feature            |    Total | Increase over plain Kit |
| ------------------ | -------: | ----------------------: |
| Plain Kit          | 39,375 B |                       — |
| Wait/fade presence | 41,440 B |                 2,065 B |
| Routes             | 41,623 B |                 2,248 B |
| Lite state         | 70,064 B |                30,689 B |
| Layout             | 77,736 B |                38,361 B |
| Full state         | 85,807 B |                46,432 B |

These increments include example code, additional Svelte helpers and compression
boundaries; they are not isolated library costs and cannot be added together.
See [package evidence](production-package.md) for all features and raw/gzip/Brotli
asset records.

## Remaining release limits

1. **Strict declaration compatibility fails upstream.** With TypeScript 6.0.3,
   `skipLibCheck: false`, and all ten public entries imported, the only diagnostic
   is Motion's vanilla `framer-motion/dist/dom.d.ts` reference to the undefined
   `HTMLWebViewElement`. The independent app works with the standard
   `skipLibCheck: true` configuration. The explicit `check:declarations` command
   remains a failing gate; no ambient shim or dependency patch was added.
2. **500 participants are not smooth on a slow CPU.** At 4× CPU throttling,
   median trial p95 RAF intervals are 183 ms automatic / 100 ms explicit; at 6×,
   300 ms / 150 ms. At 100 participants and 6×, explicit remains approximately
   16.7 ms while automatic reaches 49.9 ms. The 120-change 500-node stress run
   takes 31.24 s automatic / 16.37 s explicit for a requested 9.60 s sequence.
   Final correctness under backpressure is not responsive interaction.
3. **Physical Safari/iOS and physical low-end hardware are untested.** This
   environment has no Apple device or remote Safari session. WebKit automation,
   CPU throttling and SwiftShader rendering cannot substitute for those devices.
4. **Late route identity has a snapshot boundary.** An element first mounted
   after deferred content resolves cannot join the earlier navigation capture.
   Reserve the shared host's geometry/identity, or await essential shared content.
   All three contracts were tested against actual streamed route data.
5. **Motion remains pinned.** Projection uses undocumented framework-independent
   root exports and two isolated private compatibility accesses. The expanded
   upgrade gates detect known boundaries; they do not make those APIs stable.

## Next engineering work

Prioritize automatic commit/readback scheduling: at 500 cells, automatic mode
performs roughly twice as many computed-style calls and browser layouts as the
explicit path. Observer callback filtering took only 54.5 ms in the diagnostic
trace and is not the principal measured difference. Any change needs the existing
shared-source, scroll, interruption and lifecycle regressions plus this same
production matrix. Avoid a speculative scheduler rewrite during qualification.

Keep large-grid participant counts bounded and use explicit transactions for
owned dense updates. This reduces measured cost but does not solve smooth
500-node motion on a slow CPU. Resolve or obtain an upstream fix for the strict
declaration error before claiming compatibility with declaration checking enabled.
Then repeat browser/interaction measurements on physical devices.

## Reproducible evidence

- [Build, archive, SSR, hydration, exports and actual bundles](production-package.md)
- [BFCache, HMR, streaming and late shared elements](production-lifecycle.md)
- [Performance matrix, sustained backpressure, traces and memory](production-performance.md)
- [Dependency upgrade gate and minimal upstream reproductions](dependency-hardening.md)

The archive SHA-256 is
`10db85792911a9a5b49af9b0eee0ff797c806351dd730a66d6ba3f95c3e12745`;
the qualified consumer build ID is
`c9858335ceb15d1b1a929ddd8eb9ce3e913d630bec47086f9b7fb783d478beac`.
The reports identify the tested artifact, not every subsequent documentation edit
or regenerated archive. All work is local; nothing was published or posted upstream.
