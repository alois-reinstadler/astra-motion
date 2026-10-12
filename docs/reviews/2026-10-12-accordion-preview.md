# Accordion preview investigation

The jank in `/docs/recipes#accordion-recipe` came from the preview's stretching grid. The correction is one CSS declaration: `.snippet-stage { align-content: start; }`. The native Motion binding, duration, conditional branch, and lifecycle behavior are unchanged.

## Reproduction and cause

Expected: the trigger and answer text stay at their own positions while the answer reveals and collapses. Observed in the live T3 browser: the closed trigger stretched to 180 px tall. Opening inserted another grid row, instantly reducing the trigger to 104.19 px. During the answer's height animation it shrank further to 63.11 px, then jumped to 81.80 px when the answer restored `height:auto`. Answer text moved upward about 41 px and then downward 18.69 px at settlement.

The preview combined `display:grid`, `min-height:180px`, and the default stretch alignment. Available block space was redistributed between automatic grid rows as the answer's height changed. Motion correctly changing that height exposed the unwanted sibling resizing. The canonical recipe has no such grid wrapper, so this specific defect belongs to the preview styling, not the animation engine or native transition contract.

Changing only `align-content` to `start` in the live DOM removed the redistribution. Across 100 natural frames covering open, close, reopen, and interrupted opening, trigger height remained exactly 44.390625 px, its top remained 353.703125 px, and answer top remained 414.09375 px. Answer height moved from 0 to 44.78125 px and back, and removal completed. This control did not change the runtime, animation clock, or transition settings.

## Regression checks

`src/lib/motion-lab/accordion-preview.svelte.spec.ts` renders the actual preview. Two cases at 360 px and 240 px widths check every sampled frame for unchanged trigger and text positions, intermediate opening/closing heights, auto-height restoration, focus, ARIA state, and removal after exit. A third case interrupts an active exit, checks that the retained answer is not replaced or reset to height zero, verifies intermediate reopening, and closes again to confirm cleanup.

All three cases pass in Chromium, Firefox, and WebKit. Replacing only the preview CSS with the original committed version makes all three fail in Chromium on trigger geometry. The original CSS was restored only for that negative-control run; the fixed preview is committed. Focused ESLint, formatting, diff checks, and Svelte autofixer pass.

Evidence is stored outside worktrees at `/workspace/releases/astra-motion/layout-runtime-feedback-2026-10-12/accordion/`: `original-open.json`, `align-content-control.json`, `original-and-control.mp4`, three browser logs, and `original-negative-control.log`. The recording spans the original reproduction and temporary DOM control; intervening development reloads are not animation evidence. These checks qualify this focused change, not a new release archive.
