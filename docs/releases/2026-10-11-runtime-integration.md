# Runtime and text consolidation review — 2026-10-11

Scope: selected uncommitted work from the primary archive worktree and
`agent/astra-word-qualification`, reconciled against `main` at `90a3f1b`.
Originals were read only. The consolidation archive is outside these worktrees at
`/workspace/archives/astra-consolidation-2026-10-11`; consult its inventory and
restoration instructions for original tips, patches and untracked files.
This is focused integration evidence, not qualification of the final package.

## Decision ledger

| Work                                                                                     | Disposition                           | Reason                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Primary and word-qualification Unicode segmentation, unit/browser tests, text guide      | Integrate once                        | Word punctuation now shares the word animation and stagger slot. Grapheme mode still splits punctuation and unmatched openings correctly. Whitespace and whole-string fallback remain unchanged.                                                                                           |
| Primary native `popLayout` capture and prepared sibling mutation batching                | Integrate selectively                 | Avoid measuring all present native nodes on every transaction; capture outgoing siblings before any sibling flow write. Preserve ordering barriers, validate containing blocks and roll back failed sibling batches.                                                                       |
| Primary native event transaction coalescing                                              | Integrate selectively                 | Svelte transition events delivered in separate tasks share the frame flow transaction. Shared-stack promotion/relegation remains immediate. Managed before-paint behavior is unchanged.                                                                                                    |
| Primary sticky boundary read-cache correction and unit tests                             | Integrate selectively                 | Correct a sticky scroll record only once per Motion animation ID/phase, retaining fractional offsets and authored priority. Reuse the participant's already-read position.                                                                                                                 |
| Word-qualification layout-display diagnostic and regression                              | Already incorporated                  | Main has the same diagnostic and call sites; no duplicate implementation.                                                                                                                                                                                                                  |
| Primary resize-content test edits                                                        | Archived with associated route change | Those edits assume position-only outer grid tiles. Current route uses size projection; changing only the test would misstate the exercised behavior. Site owner did not select that route experiment. Existing glyph assertions remain intact.                                             |
| Primary older runtime snapshot/export surface                                            | Superseded                            | Never copied whole older runtime files. Retain RC3 first-owned presence snapshots, stale-closer/error cleanup, mutation drain, origin seeding, deferred ancestor restoration, disposed-participant checks and always-throwing callback types. Withdrawn createLayoutState is not restored. |
| Primary site performance, research/probes and word-qualification site/guide/config edits | Outside this owned runtime slice      | Evaluated by site integration and the consolidation ledger; original artifacts remain archived. Historical benchmark results do not qualify these changes.                                                                                                                                 |

## Browser-specific relational CSS evidence

The archived rollback fixture expected a `:has([style*="absolute"])` selector to
change parent positioning synchronously when the native pop writes inline CSS.
Chromium and Firefox do this. In WebKit, after a prior layout read, the selector
matches but computed parent positioning stays `relative` and the child still has
the same offset parent. A whitespace-independent selector did not change that
result. The test now probes this browser behavior and asserts the actual
containing-block contract: changed blocks roll back; valid blocks retain the pop.
It has no browser-name skip or relaxed geometry tolerance.

A separate unconditional browser regression queues a sibling write that sets the
real parent's position to `static` after pop styles apply. Every engine must throw,
roll back styles including `!important`, and successfully pop/reverse again. This
keeps rollback and ownership recovery independently covered in WebKit.

## Existing derived ownership warning

The focused shared-layout suite produces two `derived_inert` warnings in its
dependency fixture. The initial integration review attributed them to queued
`refresh(options())`; that was a hypothesis, not a captured stack. The
[independent final runtime review](../reviews/2026-10-11-final-runtime-review.md)
supersedes that attribution: reproduced Firefox stacks pass through Svelte's
deferred native transition, `createBinding.transition`, `options()` and the
outgoing fixture's derived style getter. Svelte returns the cached value while
its retained parent is inert.

Twelve mount/unmount cycles with four keyed replacements each passed in all three
engines. Astra registrations, value subscriptions, projection participants/shared
stacks and transition listeners were released, with no late completions during
the probe's observation window. This is an advisory diagnostic with bounded
cleanup evidence, not a warning-free-console or universal leak-freedom claim.
Silencing the warning alone would not prove a lifecycle fix. Original diagnostic
evidence remains unchanged.

## Focused verification

- `pnpm check`: zero errors and warnings (repeated after the added recovery test).
- Focused Prettier and ESLint: clean for every changed source/test file.
- Svelte MCP autofixer: `NativePopBatch.svelte`, no issues or suggestions.
- `pnpm exec vitest run --project server` with `presence.spec.ts`, `commit.spec.ts`,
  `projection-boundaries.spec.ts`, `text-segments.spec.ts` and
  `motion-lab/presence-lifecycle.spec.ts`: **36/36**.
- Negative control temporarily restored baseline runtime files while retaining the
  new tests: **18 failed, 13 passed** in the three new/expanded unit suites.
  Original candidate files were restored in `finally`. Evidence:
  `/workspace/archives/astra-consolidation-2026-10-11/runtime-integration/negative-control.log`.
- Focused Chromium shared-layout/scroll/native-pop/presence run: **53/53**;
  shared-layout dependency fixture emitted the two existing warnings above.
- Final three-engine component gate: native-pop batch, text motion, upstream
  layout scroll, presence snapshots and ordinary release layout. **105/105 passed** (15 file/engine combinations). Uses `vitest.motion.config.ts` with no browser filter.
- The first matrix launch lacked WebKit library paths and ran no tests. Subsequent
  matrix runs used the existing extracted library bundle via `LD_LIBRARY_PATH`,
  `__EGL_VENDOR_LIBRARY_FILENAMES`, `LIBGL_ALWAYS_SOFTWARE=1` and
  `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`; actual browser execution was
  retained. The original relational-CSS fixture failed, was investigated as
  above, and its deterministic rollback replacement was verified in every engine.

The full final source matrix and packed consumer qualification remain the parent
consolidation task's gates. This report does not promote earlier benchmark or RC3
artifacts to qualification of the final consolidated tree.
