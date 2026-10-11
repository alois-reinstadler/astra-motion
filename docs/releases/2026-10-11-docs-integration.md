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

## Separate site-loading integration

The archived primary worktree's unfinished performance work is reconciled on top of
the editorial commit. Documentation and example loaders are now server-only; page
payloads contain their own prose, sources and compact highlight tokens. Navigation
ships metadata, full-text search loads on demand, and preview components resolve
through a lazy module map with loading/error/retry UI. The homepage defers its full
source presentation while retaining no-JavaScript access. No animation runtime or
public library API changes are included.

The reconciliation retains Quick start, new learning/composition registries, all
example redirects and the reduced-motion notice. Search includes learning summaries,
points, collapsed notes and link descriptions in addition to the old headings,
prose, source and tables. Four historical Getting started troubleshooting fragments
remain valid after the route reorganization. The archived lab position-only tile
change is excluded here because it belongs with its geometry oracle review.

The old loading tests exposed compilation-time timeouts when each dynamic import
compiled a large cold fixture graph inside a runtime assertion. Test-only eager
imports now compile that graph during suite setup; the resolver assertion compares
the exact resulting module identity. Runtime assertions and timeout thresholds were
not relaxed. Existing values SSR assertions likewise remain unchanged in substance.

CI now checks initial site modulepreload budgets and every existing
`scripts/*.test.mjs` tooling test (including forwarding/provenance).

Focused validation after reconciliation: 48 server tests in seven files pass;
Svelte check reports zero errors/warnings; ESLint passes for the changed site,
server, routes, types and tooling. Svelte MCP autofixer reports no issues or
suggestions for all ten changed components. Build, prepack and strict publint pass.
The existing lab-only NativeInput declaration and Vite `import.meta.env` packaging
advisories remain; they are not new public-package failures.

The new initial modulepreload measurements (uncompressed bytes; gzip computed per
file, not a hosting claim) are: home 331,128 / gzip 126,765; Quick start 206,968 /
gzip 72,487; examples catalog 128,446 / gzip 47,567. All pass the explicit
400,000 / 400,000 / 200,000 budgets. These are site measurements from the integrated
implementation build, not qualification of the final release package.

All 25 focused Chromium production-page scenarios pass, including the complete
37-document and 40-example sweeps, no-JavaScript aliases, copied sources, reduced
motion, native/fallback View transitions, drafts, identity, reset and navigation
cleanup. A separate T3 collaborative-browser check exercised Quick start search
for text in a collapsed layout note, client navigation to that result, and expansion
of both session cards (240 to 380 pixels). The page loaded without console errors;
a screenshot was inspected. The full release matrix remains the consolidator's gate.
