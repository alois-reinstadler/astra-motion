# Layout feedback consolidation ledger

The complete earlier workstream ledger remains
[the 11 October consolidation record](2026-10-11-consolidation.md). Its archives
and release evidence are unchanged. This ledger records the subsequent owner
feedback; no remote refs were changed and no package was published.

| Workstream                   | Disposition                                                                                                                            | Evidence                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| SessionCards outgoing text   | Integrated runtime correction in `7d9ff70`; snapshot dimensions, containing-block rebasing, between-frame refresh and RTL used margins | [Runtime investigation](../reviews/2026-10-12-pop-containing-block.md) |
| Notes/Drafts/Saved highlight | Integrated `10b77f7` as `2dbd3c6`; canonical excerpt reconciled in `7d9ff70`                                                           | [Notes investigation](../reviews/2026-10-12-notes-highlight.md)        |
| Accordion preview            | Integrated `3281c117` as `e34d4ac`; one CSS alignment declaration and actual-preview regressions                                       | [Accordion investigation](../reviews/2026-10-12-accordion-preview.md)  |
| Qualification evidence path  | Integrated `2f943c9`; separate output preserves previous performance artifacts                                                         | Fresh evidence directory below                                         |
| Packed page-scroll oracle    | Integrated `d8b9a81`; document coordinates account for browser scroll clamping, unchanged 2px tolerance                                | [Independent review](../reviews/2026-10-12-layout-feedback-review.md)  |

Worker originals, binary working/index patches, untracked-file inventories, hashes
and restoration instructions are outside removable worktrees at
`/workspace/archives/astra-layout-feedback-2026-10-12/RESTORE.md`.
Both implementation workers were clean before retirement. Their complete-history
bundles verify, and the accordion bundle was restored into a separate bare repository
to verify its original commit. No unique worker work was rejected or dropped.

Fresh logs, original failed controls, live frame measurements, recordings and the
concrete package are in
`/workspace/releases/astra-motion/layout-runtime-feedback-2026-10-12/`.
The original `/workspace/archives/astra-consolidation-2026-10-11/` archive remains
available with its original restoration records. Qualification-only checkouts
contain the same committed tree and are retired after preserving their evidence.
