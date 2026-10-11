# Older workstream consolidation audit — 2026-10-11

This audit compares the actual tracked modifications **and untracked files** of
older worktrees against main `90a3f1bd74432f761f788ad7ad06ec2d601da65b`.
It is a disposition record, not runtime qualification. No runtime, site, tests or
original worktree was changed by this audit. The docs overhaul and archived primary
repository are separately reviewed integration sources.

## Preservation and method

The durable archive is
`/workspace/archives/astra-consolidation-2026-10-11`. Its `RESTORE.md` describes
restoration into a new checkout using `history.bundle`, the original tip, separate
`index.patch` and `working.patch`, then `working-files.tar.gz`; optional
`evidence.tar.gz` restores historical artifacts. `inventory.json` records paths,
refs and original tips. `SHA256SUMS.json` covers payloads and every worktree's
`working-files.json` hashes its preserved file bytes. Do not restore over main.

All **325 archived working-file entries** for the ten worktrees below were independently
read from their tar archives and SHA-256 verified against their manifests. Original
files were read only. Branch tips alone were not used to infer incorporation.
Tracked and untracked candidate files were enumerated with `git ls-files -m -o
--exclude-standard`; byte-equality comparisons used the fixed baseline checkout.
Every differing source/test group was inspected as a diff against that baseline.

## Workstream decisions

| Workstream / archive subdirectory under `worktrees/`             | Decision and concrete evidence                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agent/astra-rc` / `08-astra-rc`                                 | **Incorporated.** Clean at `4f60939`, an ancestor of main; no unique working files.                                                                                                                                                                                                                                |
| `agent/astra-rc-apis` / `09-astra-rc-apis`                       | **Incorporated / superseded.** 53 of 74 dirty/untracked paths are byte-identical to main; all 74 exist. Remaining API changes precede removal of compatibility behavior and RC3 corrections. Details below.                                                                                                        |
| `agent/astra-rc-presence` / `10-astra-rc-presence`               | **Incorporated / superseded.** 35 of 60 candidate paths are byte-identical; all exist. Native presence, Reorder, remaining APIs, archive provenance scripts and review reports are incorporated. Remaining differences are later package/ownership fixes and revised documentation.                                |
| `agent/astra-rc-refinement-one` / `11-astra-rc-refinement-one`   | **Incorporated / superseded.** Six of nine paths identical. Main improves JSON version import, inline host example and glyph oracle; no missing feature.                                                                                                                                                           |
| `agent/astra-rc-refinement-two` / `12-astra-rc-refinement-two`   | **Incorporated / superseded.** Ten of 14 paths identical. Main adds retained-host diagnostics and RC3 snapshot ownership, correction of inline example, and stronger glyph/cleanup checks.                                                                                                                         |
| `agent/astra-rc-vgpu` / `13-astra-rc-vgpu`                       | **Incorporated / superseded.** 92 of 105 paths identical, including all Threlte/vGPU experiment sources, assets, licenses, historical evidence and research. Remaining thirteen paths predate runtime/API cleanup and improved assertions; no vGPU production integration is required.                             |
| `agent/astra-word-qualification` / `14-astra-word-qualification` | **Integrate selectively / superseded / archived.** 18 of 25 paths identical. Word punctuation grouping is useful new work, referred to the runtime integration worker. Other runtime/test differences are older versions of main; the one missing file is a machine-local WebKit launcher override, archived only. |
| `t3code/10ab3c8f` / `02-t3code-10ab3c8f`                         | **Runtime incorporated; historical research archived.** Four runtime files identical; remaining runtime differences are RC3 fixes and withdrawn staged-state export. Original ownership experiments, review/probes and performance snapshots are distinct evidence, explicitly retained in the archive.            |
| `t3code/05596d3d` / `01-t3code-05596d3d`                         | **History incorporated; measurements/screenshots archived.** Tip `e1e6455` is incorporated. Only dirty runtime-adjacent content is an October dev-mode performance rerun plus two viewport screenshots; neither modifies runtime or qualifies the final tree.                                                      |
| `t3code/svelte-motion-lifecycles` / `06-t3code-d57d1898`         | **Incorporated.** Clean at prior main `14ae1cb`; no dirty/untracked work.                                                                                                                                                                                                                                          |
| `agent/astra-layout-state-tests`                                 | **Patch-equivalent; withdrawn API remains historical.** Both commits have identical stable patch IDs to prior-main commits; do not restore the removed staged-state fixtures.                                                                                                                                      |
| `agent/astra-presence-tests`                                     | **Patch-equivalent.** Batched exit/removal/revival test commit is already incorporated through a different commit ID.                                                                                                                                                                                              |

All archived branch tips remain restorable from `history.bundle` and
`refs-before.txt`; the ledger does not depend on retaining their local branches.

## API, presence and vGPU overlap

The byte-identical API work includes `animate-view.ts`, `will-change.svelte.ts`,
`ReorderGroup.svelte`, `component-motion.ts`, `component-props.ts`,
`elements/index.ts`, `helper-hooks.svelte.ts`, `values.ts`, `value-hooks.svelte.ts`,
`view-animation.ts`, `view-registry.ts`, and `view-transitions.ts`.
`astra-rc-apis` also matches main's animation controls, sequence path, useAnimate,
view entry, diagnostics tests and remaining-API/native-contract fixtures.
`astra-rc-presence` matches the package provenance implementation/test and
`verify-rc-package.mjs`. The September API/adoption/presence/preview review reports
are already byte-identical in main.

The differing groups are **superseded**, not rejected useful fixes:

- `native-motion.ts`, `motion-core.svelte.ts`, `presence-state.ts`, `index.ts`:
  older compatibility `createMotion`, modern/legacy branching, finite-only native
  transition restrictions and default-policy differences were intentionally removed.
  Main uses one native binding contract, current animation types, positional
  reduced-motion handling and finite repeated/intrinsic native exits. Importing
  these files wholesale would restore withdrawn behavior.
- `AnimatePresence.svelte`, `presence-model.ts`: main contains batched completion,
  revival-safe record identity and indexed key lookup. Older snapshots remove
  these improvements. They are not alternative implementations to merge.
- `diagnostics.ts` and the presence snapshot's `diagnostics.spec.ts`: main adds
  transformable-display diagnostics, property-effective transition resolution,
  recursive pair tracking for cyclic values and production traversal guards.
- The vGPU snapshot of `use-animate.svelte.ts` lacks main's channel-specific
  replacement ownership, playback-driver resolution, guarded replay, retained
  unaffected channels and completion/poll cancellation. Main's implementation
  incorporates the API work and fixes the old partial replacement behavior.
- Native intrinsic specs in API/vGPU snapshots require the intentionally removed
  legacy restriction. Retain main's unified-contract tests. Main's intro/phone/RC
  presence tests add controlled intermediate sampling and ownership cleanup;
  vGPU's notification test predates waiting for native positional completion.
  Type-only changes supply `AsyncMotionValueAnimation<number>` explicitly.
- vGPU's `motion-values--follow-value.svelte` lacks main's explicit reduced-motion
  selection for a directly bound MotionValue. `tests/motion/parity-docs.spec.ts`
  lacks main's first-hydration-cause reporting; the components test's old 1-second
  initial module-loading deadline is superseded without removing its later
  hydrated interaction assertions.
- Presence package checks predate optional text/tilt SSR fixtures and exports;
  main's packed-runtime script exercises those entries. `view-entry.ts` exposes
  the added `ViewKeyframes` type. Vite's `motion-utils` optimize dependency is
  already present in main.
- Older README, authoring, migration, contracts, matrix, try-it and site content
  refer to rc.1, legacy bindings or generation-captured public `safeToRemove`.
  They must not overwrite corrected stable-current-exit semantics. Main contains
  dynamic release metadata, text/tilt guidance and cancellation-aware manual exits;
  the separate docs worker owns subsequent editorial reconciliation.

All vGPU/Threlte experiment files (including their pinned rc.1 archive) are already
in main unchanged. They remain isolated historical experiments. Their passing
historical browser logs are not evidence for the final runtime or archive.

## Refinement and word work

The site refinement content is already incorporated: `DocArticle`, `SiteHeader`,
SEO, about/examples/status routes, release metadata, guides and home layout example.
Residual differences have specific successors:

- `release.ts`: main uses a default JSON import with a JSON import attribute,
  replacing the first refinement's named JSON export import.
- Home source snippet: main gives the projected `strong` an explicit block box.
- `layout.ts`: main factors display diagnostics, checks retained registrations,
  uses membership traversal, owns/drains transactions, skips disposed dirty
  participants, seeds late presence origins and accepts throwing callbacks.
- `layout-display.svelte.spec.ts`: main tests an initially measurement-only inline
  host that later starts animating, without replacing the retained visual element.
- `content-proportions.spec.ts`: main retains 150 frames and 0.5px tolerance, adds
  full close/detail cleanup, preserves adjacent glyph shaping and compares native
  buttons against native button references. Older span-only references and the
  first snapshot's shorter 75-frame run are not restored.

**Genuinely new text work:** `astra-word-qualification` changes
`src/lib/motion/text-segments.ts` so attached punctuation shares a word's fragment
and stagger slot, while grapheme mode splits unmatched opening punctuation. It
adds Unicode cases in `text-segments.spec.ts`, a wrapping/stagger browser assertion
in `text-motion.svelte.spec.ts`, and the contract in `docs/text-motion.md`.
This overlaps the archived primary repository and was explicitly referred for one
focused integration, not double-applied. Final acceptance belongs to that focused
commit's regression checks and the consolidated qualification record.

`.astra-webkit-verification.config.ts` is **archived, not integrated**: it points
at `/tmp/astra-webkit-run.sh`, a machine-local executable, and has no portable
release behavior. Final qualification must use the checked-in browser matrix.

## Ownership implementation and historical review

In `10ab3c8f`, `AnimateActivity.svelte`, `AnimatePresenceItem.svelte`,
`presence-measure.ts` and `presence-pop.ts` are byte-identical to main.
Its `commit.ts` differs only by main's accepted never-returning callback typing.
Its `layout.ts` lacks late-presence seeding and the disposed-participant guard and
still exports withdrawn `createLayoutState`. Main's `presence-snapshot` spec adds
cross-root ownership coverage and removes the throwing callback annotation
workaround. These runtime changes are **incorporated with focused corrections**.

The original research and review are **archived as historical**, not silently
omitted or presented as qualification:

| Original archive-relative path in `02-t3code-10ab3c8f/working-files.tar.gz` | SHA-256                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/research/presence-snapshot-ownership.md`                              | `8f9ba80bce5447756ec8125c2a7daa1ba0a73541ad65e29fe38afe106cfb1802` |
| `docs/reviews/2026-10-07-adversarial-engine-review.md`                      | `769e141321f2772f5462aa558dc11d2211c68111096d2ddf66d3c6199cfdbd6b` |

The ownership experiment differs substantively from current historical experiment
source: it builds two real-Motion bundles, disabling only the owner accessor in
its negative control; acquires/releases ownership in the probe bridge; replaces
the `WeakMap.prototype.set` diagnostic; and checks a fresh second publication.
It also adds fixture reset and updates eager-tick expectations. Preserve the six
`experiments/unstaged-rendering/` files and `WRITE-PROBES.md` together via the
archive. They still import the withdrawn staged-state prototype and require their
historical baseline. Replacing today's experiment tree would neither qualify the
shipping runtime nor make the staged API supported. The archive preserves this
better causality experiment for historical reproduction without reviving that API.

The October 7 review was read alongside the October 11 architecture follow-up.
Important dispositions:

- F1 (initialization-captured completion wedge), F3 (late automatic pop origin) and
  F5 (throw-only callback typing) have focused RC3 corrections and regressions.
  The original failing controls are valuable provenance, not tests to retain as
  expected shipping failures.
- F2's 75px transformed-startup failure was real, but the original percentage
  resolution explanation is superseded by the follow-up's deferred measurement
  normalization lifetime evidence. Do not apply the old suggested arithmetic fix.
- The original claim of lifetime-stable React completion identity was corrected in
  the follow-up. The current Svelte callback contract is intentionally capturable;
  application-owned async work must cancel, and internal completions remain guarded.
- Boundary `$effect.pre` capture was subsequently falsified as a universal boundary.
  Symbol-to-object ownership changes do not establish root isolation. Neither
  speculative rewrite is an integration candidate.
- F4's broad-suite timing failures are a requirement to rerun the complete final
  matrix, not permission for blanket retries. F6's package/HMR observations must
  be reassessed on the actual final package. F7's optional observation-budget
  diagnostic is advisory, not a demonstrated leak or confirmed release blocker.

The archived `review-probes/` directory contains nine fixtures and seven specs
(14 assertions). Its stale-callback and combined-update negative controls assert
old defects. Ambient handoff checks only settled rectangles; one unstaged survivor
case collects an intermediate sample but never asserts it, and another accepts a
changed final position as evidence of movement. Those weaker oracles should not
replace current trajectory checks. Transaction error/reentry and reversal checks
overlap current focused tests. The observer-disconnect and late-reflow probes are
useful independent review ideas, preserved verbatim for reuse; the former directly
tracks the document MutationObserver after final unmount. None of this historical
probe run is credited toward final qualification.

`performance-chromium.json` in both October worktrees is a distinct dev-mode rerun,
not disposable data and not a production benchmark. Both are archived with their
original timestamps (October 7, 02:15 and 02:20 UTC), workload and measurements;
main's September measurement is not overwritten. The two mobile viewport PNGs
per worktree are preserved as historical screenshots. Old `docs/STATUS.md` is
archived rather than replacing the release status with stale conclusions.

## Standalone commit equivalence

`git cherry main <branch>` reports `-` for every distinct commit. Independent
`git patch-id --stable` calculation confirms the exact equivalences below:

| Retired candidate commit                   | Incorporated main commit | Stable patch ID                            |
| ------------------------------------------ | ------------------------ | ------------------------------------------ |
| `c6ffd6fd73dc3e7aca12d1e3eb8f3415d617edc9` | `a32f542`                | `a907f99c89d5f5815b6f65ef85ebda46a151008a` |
| `0c5790c037647347a3be65a1c02489cb81994763` | `4615fd2`                | `4c3f2bf80995f5badf4477aad85c259a6cf9db1e` |
| `b9947dee6fa529031f41b6e70b5fcad47a56092c` | `6231a1f`                | `fa9b3a48491a557012ddb76c03077f9d8a75c1f2` |

The first two introduce staged-layout lifecycle/hydration fixtures; RC3 deliberately
removed those from active source after withdrawing `createLayoutState`. Their
history is preserved and another merge must not restore them. The third introduces
batched presence removal/revival coverage retained and corrected in current tests.

## Verification boundary

This audit verified file comparisons, archived byte hashes and commit equivalence.
It did not rerun historical claims or classify the final package as qualified.
The final consolidation record must supply the final commit/package identity,
complete qualification and independent review after all selected integrations.
