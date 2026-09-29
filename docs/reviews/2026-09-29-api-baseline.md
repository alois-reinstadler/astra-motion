# API release baseline

Inspected 29 September 2026 at HEAD `4c76095` plus preserved uncommitted work (snapshot `c2f1795`). This is source inspection unless explicitly stated. No earlier artifact qualifies these new changes.

| Finding                                                           | Disposition                | Source evidence / executed evidence                                                                                            |
| ----------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| bind:group docs mismatch                                          | Already resolved           | Migration and authoring guidance place native group bindings on native markup. Preserve editorial correction.                  |
| Nested proxy targets and component SSR ancestry from older review | Already resolved in source | Core tracks consumed options; component context and lexical inheritance tests exist. Final candidate execution still required. |
| Reorder.Group binding                                             | Confirmed problem          | values was not bindable; onReorder required.                                                                                   |
| Primary single-value presence                                     | Confirmed problem          | AnimatePresence accepted only present or items/key.                                                                            |
| Native/component defaults and transform rules differ              | Confirmed problem          | createMotion is legacy; createComponentMotion opts into component engine contract and never policy.                            |
| useAnimate cancellation observation                               | Confirmed problem          | Existing createAnimate has settled; useAnimate lacked it.                                                                      |
| Attachments alone provide SSR styles/outro retention              | Unsupported claim          | Svelte attachments run in effects; SSR needs the style spread and native retention needs transition directive.                 |
| Context inferred from a provider in the same template             | Intentional limitation     | Svelte context belongs to component setup ancestry, not later native DOM placement.                                            |
| All upstream tests already covered                                | Unsupported claim          | Inventory accounts for 1,990 declarations with explicit exclusions; historical verification is scoped.                         |
| GPU branding establishes acceleration                             | Unsupported claim          | Isolated experiment must measure actual behavior and browser capability.                                                       |

Existing work ownership: coverage thread `71ea34a4` supplied the expanded baseline and runtime repairs; polish thread `279024d2` supplied editorial and bounded runtime optimization; PopResize thread `61c05436` supplied capture qualification. Snippet-preview thread `b9591228` was active during intake and was contacted before integration. Sources were snapshotted through a separate Git index; the shared checkout and index were not changed.

Historical executed verification: expanded matrix 3,099 passed / 30 failed followed by passing affected repairs, without a second complete matrix; prior installed artifact SHA-256 `705b6f717a511dcd713ecd57f346827c32018c8380fe9b9b2c740f61cb333e48`. See tests/motion-baseline/README.md and docs/reviews/2026-09-29-library-polish.md. These are provenance, not a claim that the new RC passes.
