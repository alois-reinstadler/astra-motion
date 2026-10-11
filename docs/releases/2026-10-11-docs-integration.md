# Documentation consolidation — 11 October 2026

This implementation record is not final release qualification. The release baseline
must rerun its complete matrix after all integrations.

## Decisions

- **Integrated:** the uncommitted `t3code/improve-motion-documentation` worktree
  (`t3code-16d45be6`) learning path, Quick start/Presence/Recipes/Coming from React,
  canonical example catalog and aliases, source-backed demos, reduced-motion notice,
  explanatory hints, interaction improvements, and their focused tests.
- **Reconciled:** current main's stable `safeToRemove` contract and manual child
  example survive the three-way application. The new Presence learning page also
  states that setup-time capture is safe and application-owned asynchronous work
  must be cancelled when interrupted. No library runtime is changed here.
- **Superseded selectively:** `t3code/18cf2510` is an earlier editorial iteration.
  Its different navigation still leaves the new start file disconnected; the later
  workstream supplies ordered Learn pages and wired routes. Its SSR/client-dependent
  preview placeholder is replaced by consistent markup plus a noscript explanation.
  Its prose-first examples and duplicate legacy catalog entries are superseded by
  canonical interactions. Technical layout caveats remain in later notes, and the
  original files remain in the durable archive. The earlier unformatted start draft
  incorrectly promises scoped CSS on motion component roots; the later correction
  is retained. Identical ExamplePreview/Variants changes need no duplicate merge.
- **Rejected:** both old documentation versions' generation-captured public
  `safeToRemove` claims. They conflict with the qualified RC3 runtime contract.
- **Corrected during integration:** Quick start describes the supported Svelte 5
  and Kit 2 major ranges and both Kit-only adapters. Installation shows the supplied
  candidate archive, rather than a speculative registry-install command.
- **Archived historical evidence:** original October 7 review and session-card draft
  remain under `/workspace/archives/astra-consolidation-2026-10-11`; their historical
  performance/qualification claims are not copied into final release evidence.

## Focused validation

On the integrated documentation tree: `pnpm check` and `pnpm check:guide` report
zero errors/warnings. Site and selected docs server suites pass 42 tests in six
files. Chromium source regressions for core, gestures/layout, values and editorial
examples pass 33 tests in four files, including intermediate layout scaling,
reversal, focus identity and scroll reversal. Svelte MCP autofixer reports no issues
or suggestions for all 23 changed/new components. Prettier has formatted the changed
files. These focused results do not claim the final three-engine release matrix.
