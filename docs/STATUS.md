# Lifecycle work status

Implemented and verified 2026-10-06. No Svelte source patch or new dependencies.

- `createLayoutState` supplies an explicit state publication boundary using the
  existing layout transaction. Parent styles and membership must read `current`.
- Managed exit completions batch; reentry rejects stale removals; pop writes commit
  inside the original snapshot; independent callback failures do not discard work.
- Initialization matches SSR/hydration; mount/effect writes defer safely.
- Verification: 216 Chromium component tests across 22 files; 250-test server sweep
  plus final 5-test SSR/commit checks; zero Svelte diagnostics; packaging passes
  with lab/site declaration and import.meta.env warnings documented in the report.
- Final 500-cell remove 100 medians: staged 531ms, ordinary managed 499ms, React 332ms.
  Before this work managed removal took 10–15 seconds. Shared-host timing is noisy.

[Full report](research/staged-layout-lifecycle.md) and
[raw verification](../experiments/staged-rendering/results/production-verification.json).

Remaining qualification boundaries: arbitrary unstaged reactive parents, mutable
aliases, async template commits, frame-by-frame equivalence and Firefox/WebKit.
The retained unowned-parent negative control fails as expected; no universal 1:1
React lifecycle guarantee is claimed. No remote push or publication performed.

## Reviewed unstaged experiments

The [batch and compiler probes](research/unstaged-interception-probes.md) provide an
isolated research baseline. Neither hook is enabled in the library. Both reduce the
managed ordinary-update first-pop error from 60.39px to 0.016px. The batch hook retains
a 302px mixed-publication failure and misses await insertion. Both miss native outro
removal and add broad measurement work to unrelated updates.

Independent review found that first-pop geometry alone hid a compiler regression:
the hook can capture after an uninstrumented child reorders and suppress its animation.
The revised checks distinguish a real interrupted animation from this static result,
and preserve the late snapshot as a negative control. Survivor diagnostics also show
large displacement in the compiler's combined update. The compiler prototype is not
suitable for production, including ordinary reorder-only updates.

Run `PROBE_RESULTS=/tmp/astra-probes.json node experiments/unstaged-rendering/run.mjs`
to check the current checkout while preserving committed evidence. A passing research
suite includes asserted limitations; it does not mean all animation scenarios pass.

The local integration baseline, including the preexisting uncommitted native-presence
and site work, passes 223 browser tests, 282 server tests, and Svelte check with zero
errors or warnings. The first unrestricted server sweep timed out one SSR example
during concurrent compilation; the unchanged full suite passed with `--maxWorkers 2`.
This limits worker concurrency without increasing test timeouts.

Next qualification gates: uninstrumented parents and precompiled components, dev/HMR
runtime identity, native removal and async cancellation, then selective measurement
cost. Keep the explicit state API as the supported publication boundary while those
gates remain open.
