# Layout-feedback handoff — 12 October 2026

Main is consolidated and ready for owner review. **The complete final three-engine
source matrix is not claimed clean.** The owner questioned excessive repeated
testing and requested the preview; further full runs were stopped. The last
correction changes only a test's natural reversal trigger. Focused checks cover it.
No push, publication or release has occurred.

## Actual package

`/workspace/releases/astra-motion/layout-runtime-feedback-2026-10-12/astra-motion-0.1.0-rc.3.tgz`

SHA-256: `eb65795058f3d92c51c6ece44fdd100b6aa5bf965a3053c3893db5d5d87ea571` (417,399 bytes).
This supersedes the previous reviewed archive with SHA-256
`719b4424df6d4c047d20b76a9429636378f600f9e9abec665ae96e364992542e`;
previous artifacts remain unchanged. The external `handoff-package-equivalence.json`
binds the final committed tree to these actual consumer-tested bytes. Motion remains
13.4.4. Public exports and Svelte lifecycle ownership are unchanged.

## Verified scope

| Gate                                       | Result                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Final WebKit source                        | 144 files / 1,211 passed at `a69fad2194ff239a59b5d29b2f2d28fa90a91b3e`                                                 |
| Chromium source                            | 1,211 passed at d7b445b; final full run interrupted; final accordion 4/4                                               |
| Firefox source                             | Latest full run: 1,210 passed / one staggered-exit timing failure; isolated unchanged case passed; final accordion 4/4 |
| Server                                     | 61 files / 283 passed                                                                                                  |
| Production-page E2E                        | 253 passed; two existing touch-emulation skips                                                                         |
| Actual packed consumers                    | 27 plain-Svelte + 45 SvelteKit passed across three engines                                                             |
| Pinned upstream                            | 12 passed across three engines                                                                                         |
| Svelte, formatting, ESLint, guide/snippets | Passed; zero Svelte errors/warnings                                                                                    |
| Build, prepack, strict publint             | Passed; final committed repack proof is external                                                                       |

The consumer installs cover declarations, SSR/hydration, runtime identity,
navigation, cleanup and bundle isolation. Source/runtime inputs for those gates
remain unchanged by the later test-only corrections. Natural playback and
intermediate geometry remain alongside controlled-phase assertions. No geometry
bounds were relaxed and no new test skips were introduced.

## Review and failed attempts

The [independent review](../reviews/2026-10-12-layout-feedback-review.md) identified
one first-draft runtime blocker and two test-oracle gaps; their fixes were verified.
No confirmed runtime or public-package blocker remains. Incomplete final source
qualification remains explicit, rather than being converted into a success claim.

The concurrent d7b445b run passed Chromium but failed one Firefox and three WebKit
cases. CPU pressure was high; exact causes are not all established. Independent
review proved that the natural accordion test could demand an empty reentry
interval. It now reverses below half height with every original assertion retained.
Final WebKit passes completely. The prior Firefox failing case passed unchanged in
isolation, but that partial run is not a full qualification result. All failed,
interrupted, diagnostic and negative-control logs remain at:
`/workspace/releases/astra-motion/layout-runtime-feedback-2026-10-12/`.

Two existing `derived_inert` warnings remain. Arbitrary unstaged parity is unproven.
Firefox/WebKit native touch is not qualified by Chromium-only emulation. The
WebKit native-button oracle retains 0.5px and 150 frames; deliberate scaleX(1.15)
distortion still fails. Historical research results do not qualify this runtime.

## Preservation and owner review

See the [feedback ledger](2026-10-12-feedback-ledger.md) and original
[consolidation ledger](2026-10-11-consolidation.md). Original tips, binary patches,
untracked payloads, hashes and tested restoration instructions remain at
`/workspace/archives/astra-consolidation-2026-10-11/` and
`/workspace/archives/astra-layout-feedback-2026-10-12/RESTORE.md`.

Owner review should inspect protected SessionCards collapse, rapid Notes selection,
and narrow accordion reversal on the private preview, then inspect main and the
actual archive. Completing the final Chromium/Firefox source suites remains a
release-qualification item if the original full-matrix requirement is retained.
