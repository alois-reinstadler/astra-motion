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

## Motion-only follow-up experiments

The [DOM-write and synchronous-subscription report](../experiments/unstaged-rendering/WRITE-PROBES.md)
extends the isolated harness. All new animation paths use Motion projection and
managed presence. No Svelte/CSS animation substitute or production hook was added.

- Native-write interception preserves the tested combined update, interruption,
  mixed publication, and promise-driven sibling reflow. Explicit negatives retain
  uncovered setters, outside-scope mutations, and adversarial callback reentry.
- Private eager subscriptions preserve ordinary/interrupted motion, but miss await
  reflow and retain a 302px mixed-publication error, including with a tick closer.
- A cache-write diagnostic identifies a concrete cause of that mixed error:
  later measurements overwrite the saved presence boxes during the open transaction.
  Preserving the original boxes reduces the error to 0.016px while a retained cell
  continues moving. The test's global cache wrapper is diagnostic only.
- Synchronous deep observation has a separate cost: reversing 500 proxied items
  causes 500 getter calls and 250,000 item reads; array replacement needs one call
  and 500 reads. Snapshot coalescing does not remove that work.

The expanded verification has 66 Chromium checks (including retained failures),
real React Motion reference traces, a dependency-read assertion script, and zero
Svelte diagnostics. Source/bundle/version fingerprints are in the experiment results.
The prior library integration baseline above is unchanged; these checks qualify
research evidence, not universal lifecycle or frame-by-frame React parity.

The next implementation candidate is explicit ownership of presence snapshots:
observational caches must not replace a transaction's captured origin. Qualify that
with cancellation and nested ownership before combining it with a broader lifecycle
adapter. Keep both experimental interception mechanisms disabled in production.
