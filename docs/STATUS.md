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
