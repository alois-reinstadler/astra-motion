# Projection boundary review

This September 24, 2026 review covers static 2D DOM ancestors and nested sticky,
scrolling and clipping contexts on the [Motion 13.4 engine](motion-upgrade-13.4.md).
Motion continues to own interpolation, projection deltas and descendant scale
correction. Astra supplies the DOM measurement and lifecycle integration.

## Implementation

- Unregistered DOM ancestors participate as non-animating measurement nodes.
  Reconciliation relinks the tree after reparenting or late registration and
  removes unused boundary chains.
- Static affine transforms are normalized for measurement. Under projected parent
  scaling, the wrapper matrix is conjugated into Motion's measurement space so
  rotation and nonuniform scale compose correctly. Authored inline declarations,
  including independent transforms and `!important`, are restored afterward.
- Sticky displacement is read from browser layout with insets temporarily disabled.
  Descendant scroll measurements and registered sticky elements' own layout boxes
  exclude that displacement, including the containing block's end constraint.
  Fixed registered ancestors retain viewport coordinates on scrolled pages.
- A newly registered parent has no previous measured origin. Boundary offset
  correction waits for a comparable origin instead of treating its first
  measurement as wrapper movement.

## Regression coverage

The boundary suite checks start, interrupted and settled browser geometry for
scaled, reflected, rotated and skewed wrappers, custom origins, nested independent
transforms, and layout displacement of transformed wrappers. A registered parent
resizes nonuniformly through a rotated wrapper; its child is checked against an
independent unregistered reference at intermediate positions, reversal and rest.

Sticky cases cross entry, exit and the containing block's end while a child
animation is interrupted inside nested scrolling and clipping containers. The
same cases run with both registered and unregistered sticky elements, including
an outer rotated and nonuniformly scaled wrapper. Additional cases cover late
registration on a scrolled page, reparenting, projection-tree cleanup, and restoring
compensated wrapper declarations on completion, teardown and reattachment.

## Recorded verification

- The focused matrix passed 213 cases across Chromium, Firefox and WebKit: all
  15 boundary cases per browser, layout review, paused projection, automatic
  layout, observation scope/cost, scoped animation and timeline settlement.
- The server suite passed 110 tests. Svelte check reported zero errors and
  warnings; changed-file formatting/ESLint and the Motion upgrade gate passed.
- The boundary laboratory was exercised in shared Chrome, including interrupted
  parent resizing and crossing the sticky threshold. Console and network checks
  were clean, and the settled layout was captured for visual review.

WebKit used locally extracted Linux dependencies. Full release packaging and
production deployment checks belong to the final integration run; these focused
results are not a substitute for that run.

## Limits

The affine basis must remain static during projection. Animated wrapper transforms,
shared handoffs between different affine bases, zero-scale/singular transforms,
perspective and CSS 3D matrices are unqualified. Unsupported matrices are left
authored rather than inverted; this preserves their CSS but does not promise
correct projected geometry. Pop-layout exits through arbitrary transformed
ancestors remain outside this qualification. These browser regressions do not
replace physical Safari/iOS or low-end-device testing.
