# Main release consolidation — 11 October 2026

This record tracks consolidation from `90a3f1bd74432f761f788ad7ad06ec2d601da65b`.
The final qualification and independent review records will identify the accepted
commit and exact package. Earlier RC2/RC3 measurements qualify their own revisions.
No publication, push, remote branch deletion or release is authorized or performed.

## Preservation before changes

The session actually opened in `t3code-fbadf1d5` on an additional old-base branch,
`t3code/consolidate-astra-main-baseline`, at `e1e6455`. Main was clean at `90a3f1b`
in `t3code-d450d647`. T3 reported no other working Astra thread; process inspection
found old idle agent sessions and preview servers, not another source writer.
Main was detached in the previous checkout and checked out in this session.

Durable original archive: `/workspace/archives/astra-consolidation-2026-10-11/`.
It contains all original refs, a verified self-contained Git bundle, and for each
of the 15 original worktrees: status, full binary index/working/combined patches,
modified and untracked file payloads with SHA-256 hashes, and ignored release/test
evidence. Dependencies and disposable generated caches were excluded. Existing
vendored experiment fixture archives are retained with their original source.

`RESTORE.md` gives restoration instructions. `SHA256SUMS.json` verifies immutable
archive files; each `working-files.json` verifies its payload. A scratch clone of
the bundle restored **all 15 original worktrees with exact Git status and file
hashes**, recorded in `restoration-verification.json`. This verifies restoration,
not merely successful archive creation. Original historical artifacts are unchanged.

## Decision ledger

| Workstream                                                              | Disposition                                                                                                                                                                                  |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` and current T3 workspace                                         | Sole release baseline; preserve previous main and RC3 history.                                                                                                                               |
| `t3code/improve-motion-documentation`                                   | Integrate learning path, canonical examples, navigation and source-backed documentation; retain corrected RC3 manual presence semantics.                                                     |
| `t3code/18cf2510`                                                       | Selectively compared; superseded disconnected onboarding, duplicate examples and older prose. Reject obsolete public completion semantics. Originals archived.                               |
| `archive/main-in-progress-2026-10-11`: site                             | Integrate server-prepared highlighting, selective article data, lazy demos and searchable metadata after reconciling the docs overhaul.                                                      |
| `archive/main-in-progress-2026-10-11`: runtime/text                     | Selectively review native mutation batching, sticky measurement caching and Unicode punctuation against RC3 ownership; qualification required.                                               |
| Archived primary: research/benchmarks                                   | Preserve lifecycle proposal, scheduler/site measurements, React benchmark source and results, and maintenance review as historical evidence. No old performance number qualifies this tree.  |
| `t3code/10ab3c8f`                                                       | Runtime fixes incorporated or corrected in RC3; distinct ownership research and original review/probes archived with provenance. Do not restore staged-state experiments into active source. |
| `t3code/05596d3d`                                                       | Incorporated history; unique performance JSON and viewport screenshots archived.                                                                                                             |
| `t3code/svelte-motion-lifecycles`, `agent/astra-rc`                     | Incorporated clean history.                                                                                                                                                                  |
| `agent/astra-rc-apis`, `agent/astra-rc-presence`, `agent/astra-rc-vgpu` | Incorporated or superseded by later API, ownership and package corrections; isolated vGPU/Threlte experiments remain historical.                                                             |
| `agent/astra-rc-refinement-one`, `agent/astra-rc-refinement-two`        | Site refinements incorporated; later diagnostics and stronger glyph tests supersede older variants.                                                                                          |
| `agent/astra-word-qualification`                                        | Integrate Unicode punctuation once from archived primary; remaining patches superseded, machine-local WebKit override archived.                                                              |
| `agent/astra-layout-state-tests`, `agent/astra-presence-tests`          | Stable patch IDs verify equivalence to main history; do not restore withdrawn staged-state fixtures.                                                                                         |
| `t3code/consolidate-astra-main-baseline`                                | Empty old-base session branch; tip preserved, no unique files.                                                                                                                               |
| Consolidation worker branches                                           | Integrate reviewed commits; preserve final worker tips before retirement.                                                                                                                    |

Detailed source decisions and validation are in the
[documentation integration](2026-10-11-docs-integration.md) and
[older-workstream audit](2026-10-11-older-workstream-audit.md).
The original worktree inventory remains in the external archive; final retirement
will verify preserved contents and record every removed local ref.

## Explicitly deferred or rejected historical proposals

The primary's lifecycle proposal recommends an optional declared-exit controller
and transaction-owned geometry mode. That public API is **not integrated**: it is
an unimplemented research proposal and is outside the agreed ordinary-Svelte
release contract. Native sibling batching can be assessed independently. Compiler
instrumentation, eager subscriptions and DOM interception remain excluded.

The October 3 maintenance review's release hygiene, current release claims and
complete Node tooling-test coverage apply here. Unreachable UI scaffold pruning,
eager/lazy option refactoring, moving a private WAAPI access and a navigation-owner
misuse diagnostic are **archived maintenance recommendations**, not reproduced
supported-use blockers. They do not justify expanding consolidation into an API
or architecture rewrite. The full review and embedded diagnostic scripts remain
restorable in the primary archive.

The React 18.3.1/Motion 13.4.4 production microbenchmark harness and its original
baseline/noise/diagnostic records are retained together in that archive. They use
historical dirty-source hashes and do not establish current performance or React
19 parity. Final release comparisons use fresh pinned-engine checks and source
regressions; no historical timing ratio is claimed as a new optimization result.
