# Phone containment follow-up

Follow-up to `1a5fc5c`, 2026-09-29 UTC. The user retested on an iPhone 15 Pro
using Safari (versions unknown): list/grid animation briefly showed a horizontal
scrollbar, and the note's outgoing text escaped the card. Shared View was accepted.

## Findings and corrections

| Finding                                     | Reproduction                                                                                                                                                                                                                                                                                                                                 | Correction                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2: transient horizontal scroll range       | The actual canonical example at 393 × 852 reaches a 141px horizontal range during grid-to-list in shared Chrome. Independent component Chromium reaches a 143px range (458px scroll width, 315px client width). The visible card boxes alone do not reveal this scrollable overflow.                                                         | `overflow-x: clip` on the inner Reorder group prevents projected content from expanding the outer scroll range. The group's vertical overflow stays visible and the outer viewport retains vertical scrolling. Item size animation and inner scale correction remain enabled. |
| P2: fading note text jumps outside the card | The card's width changes before the popped paragraph is measured. Its computed width has already changed from 262px to 182px and height from 57.563px to 95.938px. The independent test finds a 73.805px paragraph jump at projection time zero, and 105 character centers outside the card remain hit-testable during nonzero exit opacity. | Capture both painted boxes through public DOM refs and hold them until `onExitComplete`. Preserve the paragraph’s position, intrinsic wrapping and inherited scale during the 180ms fade; then release the held geometry and collapse. Reopening reverses the exit.           |

Closing during expansion holds the card's currently painted width and height,
rather than continuing toward its expanded destination. Holding only the card
proved insufficient: the paragraph rewrapped and moved 39.637px down, leaving
only 55 of its 105 visible character centers inside the clipped card. The final
correction also captures the paragraph's intrinsic size, relative painted position
and inherited scale. An absolute exit style preserves that box during the fade.
The heading/control column retains the same intrinsic width too: allowing it to
rewrap under a narrower held card moved the button beneath the retained paragraph.
The production pointer probe reproduced ten blocked button-center samples during
an early exit. Holding the column width corrects that overlap. Reopening clears
both snapshots; completion cannot collapse a reopened card.
The card retains a clip boundary, but the strict early-close regression requires
paragraph continuity and retention of every initially visible character, so merely
clipping away the text cannot pass.

The second finding corrects the earlier claim in [phone feedback](PHONE-FEEDBACK.md)
that `popLayout` froze the paragraph at its original expanded width. The earlier
tests checked the card's path and final removal but did not check the paragraph's
intermediate geometry or painted containment. This follow-up adds those checks.

## Remaining contract limitation

Automatic `popLayout` capture is not qualified when the same Svelte update resizes
an ancestor before the presence boundary processes the outgoing record. The
captured box may already reflect reflow. This example now uses explicit exit
sequencing; it does not establish a general runtime correction for that case.
The public layout guide documents the limitation and the sequencing pattern.
This is an outstanding parity gap, not a browser-specific limitation.

The source runtime, public types and dependencies are unchanged. No new public
API is necessary for these example corrections. Previous bundle and performance
measurements remain applicable to the unchanged package; they are not new device
measurements. Physical iPhone Safari, high refresh rates, native touch/scroll
interruption and thermal behavior still need device verification.

## Verification

The first sequencing candidate `e0c976b` passed the new containment tests but
failed the untouched interrupted-expansion regression in all three engines:
width continued from 282.764–290.932px toward 310.536–310.630px after close.
Holding the currently painted dimensions corrects that behavior. No assertions
or tolerances were relaxed.

Independent regressions are in
`src/lib/motion-lab/phone-layout-verification.svelte.spec.ts`, final test blob
`375c1f5bbfe62954d44d87959d8cbca5e2b19985`. Test commits `db612c2`, `5225972`,
`655960c` and `0dca789` add three cases and pointer coverage; the two original
test bodies remain unchanged.

All five focused cases are qualified in Chromium, Firefox and desktop WebKit:
the two unchanged Reorder cases passed after its CSS correction, and the three
note cases passed after text-preservation correction `71499da`, then passed
again with pointer coverage after content-width correction `367444d`
(Chromium 3/3, Firefox 3/3, WebKit 3/3).
The later paragraph-ref type annotation does not change runtime behavior.
The new early-close case establishes a settled open/close cycle first, then
requires a live opening projection and nonterminal enter opacity before closing.
It does not claim to measure input during first-mount resize suppression.

- Horizontal reachable scroll is zero at sampled projection times in both
  directions and reversal. Vertical scroll, keyboard reorder/focus, text
  proportions and intermediate item widths remain asserted.
- Full close retains paragraph start geometry and visible decreasing opacity;
  card collapse still passes through intermediate widths. Reopening during an
  active exit retains the same paragraph and clears held dimensions correctly.
- Early close preserves both card and paragraph start boxes within 1.5px;
  largest observed error is 0.905px in WebKit. All 105 initially visible
  character centers remain visible inside at every fade sample, with zero
  outside hits. Card bounds, scroll position, final geometry and focus remain
  asserted. The three final note runs contain no console warnings or errors.
- The pointer addition checks the button's actual center hit target during each
  early-fade sample and reopens the retained paragraph with a trusted provider
  click. It reproduces the overlap before content-width correction `367444d`.

The style derivation is owned outside the retained snippet. An intermediate
inline expression caused Svelte `derived_inert` warnings when completion cleared
its inputs after the child was destroyed; the final owner-lifetime correction
removes those warnings without suppressing them.

The required local gate run passed source/guide checks, whole-tree formatting
and lint, pinned engine/generated elements, 203 server tests in 44 files, four
tooling tests, production build, strict publint, bundle measurement and both
installed Svelte/Kit consumer builds. After strengthening early-close behavior,
affected source/guide/lint/build checks passed again; unrelated server/package
suites are not repeated locally. The package archive remains byte-identical to
`93f06a3`, SHA-256
`2d064554821e139f9c704cd0aaad5bab117ac7efef0817e41554fc559d447d47`.
The unchanged remote matrices qualify the exact merged revision.

Manual production checks use shared Chrome at 393 × 852. Reorder traverses
148.5–305px item widths with a 41.296867–41.296883px label, zero reachable
horizontal range in both directions and reversal, and working vertical scroll,
trusted drag and Earlier/Later controls. Final note sampling finds zero escaping
character centers and zero blocked toggle centers across normal close, early
close and reopen. A trusted click reopens a paused early exit with the same
paragraph, full opacity, restored 310px width and focused toggle. Screenshots
were inspected; the pages report no console warnings/errors. These checks
qualify the production examples in desktop Chrome emulation, not a physical phone.
