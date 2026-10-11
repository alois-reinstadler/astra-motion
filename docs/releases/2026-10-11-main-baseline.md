# Main baseline — 2026-10-11

`main` integrates the qualified RC3 commit `87e4a76` with the previous main
history at `14ae1cb`. Library source, release tests, root package metadata and
lockfile are identical to the qualified RC3. No staged-state API is exported.

The previous main working tree at `/home/node/repos/astra-motion` is preserved
on `archive/main-in-progress-2026-10-11`. Its working patch, index patch,
status and all 50 untracked files were backed up locally and verified unchanged
after the branch switch. The archive is unfinished work, not a qualified release.
This T3 session now uses `main` as its baseline. The integrated RC3 branch ref is
retired after its commit becomes reachable from main; no work is lost.

## What was integrated

- RC3 correctness changes and qualification records.
- Main's prior research history and isolated staged/unstaged experiments.
- Previously incorporated internal exit batching and mutation drainage.

The earlier `createLayoutState` export, implementation and four source fixtures
are excluded from the active library/test tree. Their original code remains in
Git history and the archived worktree. Staged experiment reproduction requires
historical library commit `14ae1cb`; it is not a current release capability.

## Remaining branch refs and disposition

| Branch                                | State and merge decision                                                                                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`                                | Sole release baseline.                                                                                                                                                 |
| `archive/main-in-progress-2026-10-11` | Preserved unique site-performance, Unicode text and native-pop work. Review selectively and qualify separately.                                                        |
| `t3code/improve-motion-documentation` | **Next integration:** real uncommitted editorial, navigation and example work. Reconcile against main and preserve corrected presence semantics.                       |
| `t3code/18cf2510`                     | Earlier docs iteration. Three paths match the overhaul, eleven differ, and the overhaul removes its legacy examples. Compare selectively; do not merge both wholesale. |
| `t3code/10ab3c8f`                     | Ownership fixes selected into RC3; remaining research/probes are uncommitted. Preserve as evidence; no wholesale runtime merge.                                        |
| `t3code/svelte-motion-lifecycles`     | Clean prior-main history, now incorporated. No merge needed.                                                                                                           |
| `t3code/05596d3d`                     | Older incorporated base with performance evidence/screenshots. No runtime merge needed.                                                                                |
| `agent/astra-rc`                      | Clean older RC history already incorporated. No merge needed.                                                                                                          |
| `agent/astra-rc-apis`                 | Older incorporated HEAD plus dirty overlapping API work. Review only demonstrably new patches.                                                                         |
| `agent/astra-rc-presence`             | Older incorporated HEAD plus dirty overlapping presence/package work. No wholesale merge.                                                                              |
| `agent/astra-rc-refinement-one`       | Dirty older site refinement. Compare against current site and docs overhaul.                                                                                           |
| `agent/astra-rc-refinement-two`       | Dirty older site/layout refinement. Compare selectively; preserve current runtime.                                                                                     |
| `agent/astra-rc-vgpu`                 | Dirty older runtime and preview experiments. Historical work, no release dependency.                                                                                   |
| `agent/astra-word-qualification`      | Dirty older text/site work; overlaps archived main. Review once, not through both branches.                                                                            |
| `agent/astra-layout-state-tests`      | Distinct history but patch-equivalent test commits already in prior main. No merge needed.                                                                             |
| `agent/astra-presence-tests`          | Patch-equivalent presence test commit already in prior main. No merge needed.                                                                                          |

All dirty worktrees remain in place. A branch merge cannot include uncommitted
files: those must first be reviewed and captured as focused changes. Do not treat
these sixteen refs as sixteen release candidates.

## Verification after integration

- All `src`, `tests`, root package and lockfile paths match `87e4a76` exactly.
- Svelte check: zero errors and warnings; server: 251/251.
- Whole-repository lint and package prepack/strict publint pass.
- All 1,222 non-manifest files of the qualified RC3 archive remain byte-identical
  after rebuilding the package. No animation behavior changed during this merge.
- Immutable historical measurement JSON is excluded from formatting, preserving
  the original experimental records. Research source still passes ESLint.

Browser/package qualification and its limitations remain in the
[RC3 qualification report](2026-10-11-rc3-qualification.md). No remote ref or
registry publication was changed.
