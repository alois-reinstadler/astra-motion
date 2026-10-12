# Notes selection highlight investigation

The `/docs/layout#shared-elements` control had a confirmed example paint-order defect at `0b2355a`. This investigation did not identify a shared-layout runtime defect in this control. It is separate from the outgoing SessionCards text investigation.

## Reproduction and cause

Select Saved from Notes and watch Notes and Drafts during travel. Expected: the moving selection background remains behind every label. Observed: the background covers Notes and then Drafts while its rectangle moves continuously toward Saved.

A natural-playback recording in the T3 browser and frame-by-frame `elementsFromPoint` measurements reproduced the defect. At highlight x positions 544–570, the highlight painted above Notes; at x positions 606–652 it painted above Drafts. The projection itself advanced continuously from the Notes origin toward Saved. The example gave the absolute highlight and every positioned label `z-index:auto`, so DOM order made a later button's moving background paint over earlier labels. The same unspecified stacking also allowed later button backgrounds to paint above an earlier button's moving highlight.

This is an authored CSS layering problem: the engine cannot choose a consumer's foreground/background semantics. The correction gives the group an isolated stacking context, the highlight z-index 1, and all labels z-index 2. The highlight ignores pointer events and is hidden from the accessibility tree; buttons explicitly use `type="button"`. It preserves the existing Motion transition, shared identity, ordinary Svelte state, and button layout.

## Regression and verification

`src/lib/motion-lab/notes-highlight.svelte.spec.ts` renders the actual preview and checks:

- Natural forward and reverse travel with multiple intermediate positions, bounded geometry, unchanged button identity, focus, and label paint order on every sampled frame.
- Five interrupted/reversed selections retaining the visual origin, correct pointer targets, final settlement, one remaining highlight, and isolation from a second mounted instance.

For the paint-order oracle only, the decorative layer is briefly included in hit testing and restored before interactions. This lets the test check actual browser stacking rather than merely asserting the authored z-index values. Animation clocks remain natural.

Both tests pass in Chromium, Firefox, and WebKit (6 checks). Replacing only the preview with its original committed version makes both tests fail in Chromium: label paint index 1 is incorrectly behind highlight index 0. The fixed preview was restored after this negative control. Svelte autofixer returns no issues or suggestions; focused formatting and ESLint checks pass.

Evidence is preserved outside the worktree at `/workspace/releases/astra-motion/layout-runtime-feedback-2026-10-12/notes/`: `original-live-forward.mp4`, `original-live-forward.json`, the three engine logs, and `original-negative-control.log`. These are focused regression results, not a new release qualification. The canonical complete documentation source must carry the same layering when this change is integrated.
