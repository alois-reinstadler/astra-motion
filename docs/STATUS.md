# Runtime layout feedback — 2026-10-12

The retained-paragraph containing-block correction and Notes highlight layering
fix are integrated. Focused regressions and independent runtime review found and
resolved additional between-frame and WebKit RTL cases. Final source/package
qualification and the newly reported accordion preview correction are in progress.
Earlier qualification below applies to its recorded source/archive, not these changes.
See [runtime investigation](reviews/2026-10-12-pop-containing-block.md).

# Owner layout feedback — 2026-10-11

The session-card comparison and minimal LayoutGroup demo now respond promptly.
Cards collapse during the exit fade, keep stable responsive columns and share
layout timing with protected text. The group snippet uses a shared 240ms layout
transition and position-only text boundaries. Library runtime and published
package inputs are unchanged. Scoped follow-up verification passes in all three
engines; this does not claim a repeat of the entire earlier release matrix.
See the [feedback verification](reviews/2026-10-11-layout-feedback.md).

# Main consolidation qualification — 2026-10-11

The selected documentation, site-loading, Unicode, sticky-scroll and native-pop
work is integrated on `main` in `t3code-fbadf1d5`. Original worktrees and worker
tips are durably preserved, with restoration tested. Obsolete linked worktrees
and non-main local branches are retired; the primary repository remains intact.

Fresh qualification passes all 1,193 source browser tests in each of Chromium,
Firefox and WebKit, all 283 server tests, and 253 production E2E cases with two
existing Chromium-only touch-emulation skips. The actual packed archive passes
nine plain-Svelte fixtures and 15 SvelteKit scenarios per engine. Svelte check,
formatting, ESLint, snippets, build, prepack and strict publint pass. See the
[final qualification record](releases/2026-10-11-final-qualification.md).

The independent final review is complete: three nonimplementing reviewers, one
confirmed documentation blocker corrected and verified, no open confirmed blockers.
The replacement archive passes all 72 fresh packed-consumer checks. See the
[final review overview](reviews/2026-10-11-final-review.md). Owner human review of
main and the concrete archive is next. Earlier failed or interrupted runs are
preserved and excluded from successful qualification. The delayed-outro timeout
was traced to polling a thenable animation; the corrected boolean cleanup oracle
passes the complete matrix and rejects deliberately retained animation references.
See the [consolidation ledger](releases/2026-10-11-consolidation.md). No push,
publication or release has occurred.

The following stabilization record describes the prior RC3 baseline only. It does
not qualify the final consolidated tree.

# Release stabilization — 2026-10-11

The release baseline is now `main`, integrating qualified RC3 commit `87e4a76`
with the existing research history. Library source, public exports, package metadata
and release tests are identical to that qualified commit. The staged-state public
prototype and its source fixtures are withdrawn; historical code remains in Git.

The prior `main` working tree had substantial uncommitted work. It is preserved
on `archive/main-in-progress-2026-10-11`, without altering its working files.
The documentation worktrees remain separate pending integration and qualification.
This pass keeps Motion 13.4.4 as the animation/projection engine and Svelte 5 as
lifecycle owner. No compatibility API, staged-state API, compiler instrumentation,
DOM interception or eager subscriptions are being introduced. `updateLayout`
remains an existing optional explicit transaction; ordinary reactive correctness
must not depend on it.

## Incorporated fixes

- Seed the cached projected origin before late presence publication can overwrite
  it with reflowed DOM geometry. Ordinary and interrupted combined keyed updates
  now pass six direct-state regression checks (unchanged runtime fails two).
- Preserve first-owned presence boxes for the lifetime of a synchronous transaction;
  drain managed pop writes inside it, release ownership on errors, reject mutation
  during snapshot capture and prevent stale queued work replay.
- Keep normalized ancestor transforms until Motion consumes its deferred measurement.
  Release on skipped updates and unmount; preserve newer authored declarations.
- Make initialization-captured `safeToRemove` complete the current exit. Internal
  animation completions retain generation guards. Manual work cancels on re-entry
  and destruction. Field selectors prevent custom-only updates restarting exits.
- Batch independently completed exits, reconcile pending revival before removal,
  discard old record completions and release destroyed boundaries. These four
  regressions fail against the older runtime and pass with the existing internal
  batching change; no staged API is included.
- Skip obsolete affected participants after reconciliation, avoiding destroyed
  policy getters during queued shared-layout work (12 warnings before, zero after).
- Allow always-throwing synchronous transaction callbacks in the TypeScript API.

## Qualification

Completed preliminary gates: direct-state regression 6/6; presence/docs 25/25;
server 251/251; Svelte diagnostics 0 errors and 0 warnings. Presence negative
control fails four of five new cases. Exact-baseline measurement-lifetime negative
control fails premature transform restoration.

The preliminary complete Chromium run passes 136 files / 1,173 tests. The later
batching/disposal changes pass the affected 105-test gate. Focused release cases
pass 22/22 in Firefox and WebKit. The exact final RC3 archive passes nine
plain-Svelte SSR/hydration fixtures plus 15 SvelteKit cases in each of three
engines; pinned upstream contracts pass 12/12. Original full Firefox / WebKit
runs report four / seven timing and deadline failures; all eight corrected test
files now pass 66 distinct cases per engine. Entire source suites were not rerun
after those test-only corrections. Full production E2E reports 248 passes, two
existing touch-input skips and two WebKit glyph-reference failures, reproduced
on unanimated native buttons. The corrected reference keeps the 0.5px tolerance;
the complete corrected glyph file passes 42/42 across three engines, with
6/6 independent reorder rechecks and deliberate scale distortion rejected. The
full production suite was not rerun after that test-only correction.
Details, retained failures and scope limits are in the
[qualification report](releases/2026-10-11-rc3-qualification.md). This is not a
universal unstaged-parity claim and has not been published.

The earlier causal explanation of the shared-layout dependency fixture's two
`derived_inert` warnings was superseded by the
[independent final runtime review](reviews/2026-10-11-final-runtime-review.md).
Captured stacks identify Svelte's deferred native transition reading the outgoing
derived style while its retained parent is inert, not the previously hypothesized
queued initial refresh. Repeated replacement/unmount probes in all three engines
released Astra registrations, subscriptions, projection participants/shared stacks
and transition listeners without late completion callbacks. The diagnostic
remains an advisory; this is neither a warning-free-console nor a universal
leak-freedom claim.

## Consolidation and previous attempts

[Branch and worktree inventory](releases/2026-10-11-worktree-inventory.json) records
45 local branch refs before this pass: their committed changes were already in `main` or patch
equivalent to changes in `main`. Uncommitted work in the documentation, lifecycle,
RC and main worktrees is distinct and preserved. The three disposable worktrees
created for this stabilization pass were removed after their selected changes
and diagnostic evidence were retained. No preexisting worktree was removed.
Twenty-nine unattached local branches whose tips are ancestors of `main` were
retired; fourteen attached branches and two branches with distinct history remain.
[Saved names and tips](releases/2026-10-11-retired-local-branches.json) allow restoration.
Remote refs were not changed.
Do not merge parked branches wholesale: several introduce staged APIs or older
runtime experiments that conflict with this candidate's public contract.

The [verified attempted-approaches ledger](reviews/2026-10-11-parity-architecture-followup.md#attempted-approaches-ledger-updated-before-choosing-fixes)
explains the release choice. Cache-promotion delay alone failed; seed-before-presence
passed. Synchronous commit proved the ancestor timing cause but is not the chosen
production fix. Public `$effect.pre` failed parent/sibling/deep-mutation ordering
assumptions. A symbol-to-object owner conversion does not change transaction scope
or fix an observed root defect. Those approaches are not being retried for release.
